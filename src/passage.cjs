const {randomUUID,createHash}=require('node:crypto');
const {distanceNM}=require('./navigation.cjs');
const water=require('./water-route.cjs');
const {assessSuitability}=require('./suitability.cjs');
const ENGINE_VERSION='1.0.1-marine-1';
function selectedMode(s,w){if(s.transport!=='BY-SEA')return s.transport;const modes=s.vessel.propulsionModes;const requested=w.operatingMode;if(requested&&requested!=='AUTO'){if(!modes.includes(requested))throw Error('Waypoint operating mode is not enabled on this vessel.');return requested;}return modes.find(m=>m==='SAIL')||modes.find(m=>m==='POWER-DIESEL')||modes.find(m=>m==='POWER-ELECTRIC')||'SAIL';}
function speed(s,mode){return s.vessel[{'BY-LAND':'landKnots','BY-AIR':'airKnots','SAIL':'sailKnots','POWER-DIESEL':'dieselKnots','POWER-ELECTRIC':'electricKnots'}[mode]];}
function timeResult(s,legs){
 let calculatedDistanceNM=0,standardSubtotal=0,operatingSubtotal=0,knownPrefix=true,unresolvedLegs=0;
 const eta=hours=>new Date(Date.parse(s.departureUTC)+hours*3600000).toISOString();
 for(const leg of legs){
  leg.standardSpeed=s.vessel.referenceKnots;leg.calculatedSpeed=speed(s,leg.operatingMode)||null;
  const resolved=leg.status!=='UNRESOLVED'&&Number.isFinite(leg.distanceNM)&&leg.calculatedSpeed>0;
  const integrity=require('./route-integrity.cjs').inspect(leg);leg.endpointIntegrity=integrity;
  if(leg.transitionBefore||!integrity.connected)knownPrefix=false;
  if(resolved){leg.standardHours=leg.distanceNM/leg.standardSpeed;leg.calculatedHours=leg.distanceNM/leg.calculatedSpeed;calculatedDistanceNM+=leg.distanceNM;standardSubtotal+=leg.standardHours;operatingSubtotal+=leg.calculatedHours;}
  else{leg.standardHours=null;leg.calculatedHours=null;knownPrefix=false;unresolvedLegs++;}
  Object.assign(leg,{calculatedCumulativeNM:calculatedDistanceNM,totalNM:knownPrefix?calculatedDistanceNM:null,totalStandardHours:knownPrefix?standardSubtotal:null,totalCalculatedHours:knownPrefix?operatingSubtotal:null,standardETA:knownPrefix?eta(standardSubtotal):null,calculatedETA:knownPrefix?eta(operatingSubtotal):null,etaStatus:knownPrefix?'NOMINAL':'UNRESOLVED: preceding duration or grid transition is unknown',differenceHours:resolved?leg.standardHours-leg.calculatedHours:null});
 }
 const complete=knownPrefix&&unresolvedLegs===0,any=legs.some(l=>l.status!=='UNRESOLVED'&&Number.isFinite(l.distanceNM));
 return {complete,unresolvedLegs,calculatedDistanceNM:any?calculatedDistanceNM:null,provisionalDistanceNM:complete?0:null,totalEstimatedDistanceNM:complete?calculatedDistanceNM:null,calculatedStandardHours:any?standardSubtotal:null,calculatedOperatingHours:any?operatingSubtotal:null,provisionalStandardHours:complete?0:null,provisionalOperatingHours:complete?0:null,totalNM:complete?calculatedDistanceNM:null,standardHours:complete?standardSubtotal:null,calculatedHours:complete?operatingSubtotal:null,effectiveSOG:complete&&operatingSubtotal>0?calculatedDistanceNM/operatingSubtotal:null,standardETA:complete?eta(standardSubtotal):null,calculatedETA:complete?eta(operatingSubtotal):null,differenceHours:complete?standardSubtotal-operatingSubtotal:null};
}
function geometryKey(s,a,b,options){return createHash('sha256').update(JSON.stringify({engine:ENGINE_VERSION,transport:s.transport,manualConstraints:require('./course-model.cjs').constraintsFor(s.coursePlan,a.id,b.id),waterwayData:require('../assets/waterways/osm-manifest.json').sha256,from:{id:a.id,lat:a.lat,lon:a.lon,access:a.access?{lat:a.access.lat,lon:a.access.lon}:null},to:{id:b.id,lat:b.lat,lon:b.lon,access:b.access?{lat:b.access.lat,lon:b.access.lon}:null},options})).digest('hex');}
function planInternal(s,options={}){
 if(options.refine===true){
  const saved=s.route?.coarseCourse||s.route,bypass=options.bypass!==false,routing={...(options.recoverTopology===false?{recoverTopology:false}:{}),...(options.geographyRevision?{geographyRevision:options.geographyRevision}:{}),bypass,separationNM:!bypass&&['OFFSHORE PREFERRED','CUSTOM OFFSHORE DISTANCE'].includes(s.routePreference)?s.coastalSeparationNM:0};
  const current=(()=>{try{return saved?.engineVersion===ENGINE_VERSION&&saved.legs.length===s.waypoints.length-1&&saved.legs.every((l,i)=>l.inputKey===geometryKey(s,s.waypoints[i],s.waypoints[i+1],routing)&&l.operatingMode===selectedMode(s,s.waypoints[i+1]));}catch{return false;}})();
  const timed=current?timeResult(s,structuredClone(saved.legs)):null;
  const sameTimes=timed&&['calculatedETA','standardETA','calculatedOperatingHours','calculatedStandardHours'].every(k=>timed[k]===saved[k]);
  const coarse=current&&sameTimes?structuredClone(saved):plan({...s,route:saved},{...options,refine:false});
  return require('./course-refinement.cjs').refine(s,coarse,options);
 }
 if(s.waypoints.length<2)throw Error('Add at least two waypoints.');
 // Baseline testing bypasses optional penalties unless an isolated diagnostic explicitly opts in.
 const bypass=options.bypass!==false,sea=s.transport==='BY-SEA',id=randomUUID();
 const routing={...(options.recoverTopology===false?{recoverTopology:false}:{}),...(options.geographyRevision?{geographyRevision:options.geographyRevision}:{}),bypass,separationNM:!bypass&&['OFFSHORE PREFERRED','CUSTOM OFFSHORE DISTANCE'].includes(s.routePreference)?s.coastalSeparationNM:0};
 const priorCoarse=s.route?.coarseCourse||s.route;
 const previous=[...(priorCoarse?.engineVersion===ENGINE_VERSION?priorCoarse.legs:[]),...(s.courseVariants||[]).slice().reverse().flatMap(v=>{const r=v.result?.coarseCourse||v.result;return r?.engineVersion===ENGINE_VERSION?r.legs:[];})];
 const legs=s.waypoints.slice(1).map((w,i)=>{
  options.progress?.({stage:'FINDING WATER ACCESS / CONNECTING WATERWAYS',leg:i+1,total:s.waypoints.length-1});
  const a=s.waypoints[i],inputKey=geometryKey(s,a,w,routing),start=performance.now();
  const base={id:a.id+'->'+w.id,fromId:a.id,waypointId:w.id,transport:s.transport,inputKey,points:[],distanceNM:null,provisionalDistanceNM:null,status:'UNRESOLVED',evidence:{waypointIds:[a.id,w.id],anchors:[{lat:a.lat,lon:a.lon},{lat:w.lat,lon:w.lon}],grid:null,accessCandidates:[],searchBounds:null,visitedCells:0,optionalPreferences:bypass?'BYPASS':'ENABLED'}};
  if(options.suppliedLegs){const supplied=options.suppliedLegs[base.id];return supplied?{...structuredClone(supplied),transitionBefore:null}:{...base,operatingMode:selectedMode(s,w),reason:'PENDING: independent leg calculation',jobStatus:'PENDING'};}
  try{
   base.operatingMode=selectedMode(s,w);
   if(require('./course-model.cjs').constraintsFor(s.coursePlan,a.id,w.id).length)throw Error('MANUAL_CONSTRAINT_ROUTING_PENDING: constraints preserved; geographic calculation is not yet implemented.');
   const cached=previous.find(l=>l.status==='CALCULATED'&&l.inputKey===inputKey);
   if(cached&&s.transport!=='BY-LAND')return {...structuredClone(cached),operatingMode:base.operatingMode,transitionBefore:null,reused:true,evidence:{...cached.evidence,reused:true}};
   if(s.transport==='BY-LAND'){const road=options.roadLegs?.[base.id];if(!road||road.error)throw Error(road?.error||'ROAD_NETWORK_UNAVAILABLE: no local road service or regional graph available');base.points=road.points;base.evidence={...base.evidence,...road.evidence};}
   if(sea){const raw=require('./geographic-route.cjs').leg(a,w,{...routing,preparedGeography:options.preparedGeography,maxVisited:options.maxVisited});const result=require('./course-geometry.cjs').simplifyLeg(raw);base.points=result.points;base.accesses=result.accesses;base.evidence=result.evidence;}
   else if(s.transport==='BY-AIR'){base.points=[{lat:a.lat,lon:a.lon},{lat:w.lat,lon:w.lon}];base.evidence.termination='GEODESIC_AIR_ESTIMATE';}
   else if(s.transport!=='BY-LAND')throw Error('TRANSPORT_NETWORK_UNAVAILABLE');
   base.distanceNM=base.points.slice(1).reduce((n,p,j)=>n+distanceNM(base.points[j],p),0);base.provisionalDistanceNM=0;base.status='CALCULATED';base.reason=null;
  }catch(e){base.reason=e.message;base.evidence=e.evidence||base.evidence;base.evidence.termination=e.message;}
  base.evidence.elapsedMs=performance.now()-start;return base;
 });
 // Different grids may legitimately resolve a shared city to different access points.
 // Do not imply zero-time travel between those cells or issue an unconditional onward ETA.
 for(let i=1;i<legs.length;i++){const previousLeg=legs[i-1],current=legs[i];if(previousLeg.accesses&&current.accesses&&distanceNM(previousLeg.accesses[1],current.accesses[0])>.001){current.transitionBefore={status:'UNRESOLVED',waypointId:current.fromId,from:previousLeg.accesses[1],to:current.accesses[0],reason:'Access differs between adjacent leg networks; transfer geometry and duration unresolved.'};}}
 for(const leg of legs){leg.geographicStatus=leg.status;if(sea&&!leg.marineEvidence)leg.marineEvidence=require('./marine-evidence.cjs').assess(leg.points,s.vessel);leg.suitability=assessSuitability([s.waypoints.find(w=>w.id===leg.fromId),s.waypoints.find(w=>w.id===leg.waypointId)],s.vessel,options.vesselSuitability,leg.transport,leg.evidence.sourceAccessEvidence);}
 // Legacy direct-engine fixtures may reuse a place ID on a return visit.
 // Saved USER PATHs enforce distinct waypoint IDs; do not invent identities here.
 const inputPath=new Set(s.waypoints.map(w=>w.id)).size===s.waypoints.length?require('./user-path.cjs').reconcile(s.userPath,s.waypoints):null;
 const totals=timeResult(s,legs),primary={pathId:inputPath?.id,pathRevision:inputPath?.revision,id,preference:bypass?'BYPASS':s.routePreference,legs,...totals};
 const connectors=legs.flatMap(l=>l.accesses?l.accesses.map((access,j)=>({id:l.id+':'+j,waypointId:j?l.waypointId:l.fromId,anchor:l.evidence.anchors[j],access,distanceNM:distanceNM(l.evidence.anchors[j],access),includedInPassage:false,status:distanceNM(l.evidence.anchors[j],access)>.001?'PROVISIONAL_TRANSFER':'COINCIDENT',transport:'UNSPECIFIED_TRANSFER',durationHours:null})):[]);
 return require('./course-model.cjs').annotate({...primary,userCoarseCourse:inputPath?require('./user-path.cjs').coarse(inputPath,{knots:s.vessel.referenceKnots,departureUTC:s.departureUTC,byWay:s.transport}):null,suitability:{mode:options.vesselSuitability==='ON'?'ON':'BYPASS',policy:'ADVISORY_ONLY_BETA',blocksRouting:false},engineVersion:ENGINE_VERSION,selectedId:id,alternatives:[primary],requestedPreferences:{routePreference:s.routePreference,coastalSeparationNM:s.coastalSeparationNM,objective:s.speed},effectivePreferences:routing,kind:sea?'water-outline':s.transport==='BY-LAND'?'road-network':'air-estimate',status:totals.complete?'PRELIMINARY ROUTE — ALL LEGS CALCULATED':legs.some(l=>l.status==='CALCULATED')?'PARTIAL ROUTE — UNRESOLVED LEGS OR TRANSFERS':'UNRESOLVED ROUTE',createdAt:new Date().toISOString(),connectors,provenance:sea?'Natural Earth coarse ocean grids and mapped waterways; OpenStreetMap contributors (ODbL). Per-leg geometry, source references and checksums retained.':s.transport==='BY-LAND'?'Local Valhalla regional road graph; OpenStreetMap contributors. Regional graphs are not stitched.':'Air geodesic estimates only.',warning:'Optional routing penalties remain BYPASS during baseline validation. Calculated subtotals exclude unresolved legs and anchor connectors. Unknown durations prevent downstream ETAs. No hydrographic clearance or forecast validation.',confidence:'Coarse planning only; city/shore connectors unverified',constraints:['depth-under-keel','air-draft-bridge','canal-lock','traffic-restriction','passage-exclusion','reef-shoal'].map(type=>({type,status:'unresolved',source:null})),validation:{landMask:sea?'screened at selected grid resolution':'not applicable',depth:'unresolved',bridges:'unresolved',restrictions:'unresolved',forecast:'nominal speeds only'}});
}
function plan(s,options={}){if(s.waypoints.some(w=>w.source==='4nR-CRONKITE'&&w.approvalStatus!=='APPROVED'))throw Error('Unapproved discovery cannot enter route calculation');return require('./route-accounting.cjs').annotate(planInternal(s,options));}
module.exports={plan,timeResult,selectedMode,ENGINE_VERSION};
