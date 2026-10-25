'use strict';
const {distanceNM}=require('./navigation.cjs');
const {bundled}=require('./waterway-network.cjs');
const {simplifyLeg,supportedSegment,gridById}=require('./course-geometry.cjs');
const near=(a,b)=>a&&b&&distanceNM(a,b)<1e-7;
const length=points=>points.slice(1).reduce((n,p,i)=>n+distanceNM(points[i],p),0);
function sourceValid(points,e){
 if(!e.dataset)return points.length===1&&!e.sourceEdgeIds?.length;
 const net=bundled(e.dataset),ids=points.map(p=>net.index.get([p.lon,p.lat].join(',')));
 return e.sourceChecksum===net.doc.sha256&&e.sourceEdgeIds?.length===points.length-1&&ids.every(i=>i!==undefined)&&ids.slice(1).every((id,i)=>net.nodes[ids[i]].edges.some(edge=>edge.to===id&&edge.sourceId===e.sourceEdgeIds[i]));
}
function supported(result){
 const e=result.evidence,p=result.points;
 if(e.grid?.startsWith('water-area-'))return require('./water-area-route.cjs').valid(result);
 if(!p.length||p.some(p=>!Number.isFinite(p.lat)||Math.abs(p.lat)>90||!Number.isFinite(p.lon)||Math.abs(p.lon)>180))return false;
 if(e.grid==='source-waterway-network')return sourceValid(p,e);
 const raster=(points,id)=>points.length>0&&points.every(p=>gridById(id)?.inspect(p).classification==='WATER')&&points.slice(1).every((p,i)=>supportedSegment(points[i],p,gridById(id)));
 if(e.grid!=='hybrid-waterway-ocean')return raster(p,e.grid);
 const [a,m,b]=e.sections||[];if(!a||!m||!b||!sourceValid(a.points,a)||!sourceValid(b.points,b)||!raster(m.points,m.grid))return false;
 if(!near(a.points.at(-1),m.points[0])||!near(b.points.at(-1),m.points.at(-1)))return false;
 const combined=[...a.points,...m.points.slice(1),...[...b.points].reverse().slice(1)];return combined.length===p.length&&combined.every((q,i)=>near(q,p[i]));
}
function reverse(result,a,b){
 const r=structuredClone(result);r.points.reverse();r.accesses.reverse();const e=r.evidence;
 if(e.sourceEdgeIds)e.sourceEdgeIds.reverse();
 if(e.sections){const [start,middle,end]=e.sections;e.sections=[end,{...middle,points:[...middle.points].reverse(),...(middle.rawPoints?{rawPoints:[...middle.rawPoints].reverse()}:{} )},start];}
 if(e.rawPoints)e.rawPoints.reverse();if(e.accessCandidates){e.accessCandidates.reverse();e.accessCandidates.forEach((c,i)=>c.waypointId=[a.id,b.id][i]);}
 e.anchors=[{lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon}];e.waypointIds=[a.id,b.id];return r;
}
function candidate(a,b,options){
 const inverted=a.lon>b.lon||a.lon===b.lon&&a.lat>b.lat;
 let result;try{result=simplifyLeg(require('./geographic-route.cjs').leg(inverted?b:a,inverted?a:b,{...options,datasets:['refinement'],preferSource:true}));}catch(error){if(options.topology===false)throw error;return require('./water-area-route.cjs').leg(a,b,options);}
 return inverted?reverse(result,a,b):result;
}
function refine(s,coarse,options={}){
 if(options.preparedGeography)require('./water-area-route.cjs').configure(options.preparedGeography);
 const r=structuredClone(coarse),manifest=require('../assets/waterways/refinement-manifest.json');
 r.coarseCourse=structuredClone(coarse);delete r.coarseCourse.coarseCourse;
 const areaManifest=require('./water-area-route.cjs').manifest;
 r.refinement={waterAreas:options.topology===false?null:{source:areaManifest.source,license:areaManifest.license,sha256:areaManifest.sha256,regions:areaManifest.regions.map(r=>({id:r.id,extent:r.extent,resolutionDegrees:r.resolutionDegrees,maskSHA256:r.maskSHA256,exclusionSHA256:r.exclusionSHA256}))},requested:true,method:'EXACT_SOURCE_TOPOLOGY_WITH_VALIDATED_GRID_TRANSITIONS',dataset:manifest,status:'NO_SUPPORTED_IMPROVEMENT',legs:[]};
 r.legs=r.legs.map((old,i)=>{
  const a=s.waypoints[i],b=s.waypoints[i+1],note={id:old.id,status:'UNCHANGED',reason:null};r.refinement.legs.push(note);
  if(old.transport!=='BY-SEA'){note.reason='No detailed dataset for this transport mode';return old;}
  if(require('./course-model.cjs').constraintsFor(s.coursePlan,a.id,b.id).length){note.status='UNRESOLVED';note.reason='Manual constraints preserved; constraint routing remains pending';return old;}
  try{
   const detailed=candidate(a,b,options);
   const hasEvidence=detailed.evidence.grid?.startsWith('water-area-')||detailed.evidence.dataset==='refinement'||detailed.evidence.sections?.some(section=>section.dataset==='refinement'&&section.sourceEdgeIds?.length);
   if(!hasEvidence)throw Error('No improved source geometry available for this leg');
   if(!supported(detailed))throw Error('Detailed geometry or source-to-grid transition is unsupported');
   // Existing successful attachments are immutable: a more detailed line may
   // not silently move the start/end or introduce an unverified connecting jump.
   if(old.status==='CALCULATED'&&(!near(old.points[0],detailed.points[0])||!near(old.points.at(-1),detailed.points.at(-1))))throw Error('Detailed source requires different attachments; no verified transfer');
   if(old.points.length===detailed.points.length&&old.points.every((p,j)=>near(p,detailed.points[j]))){note.reason='Existing course already uses the available detailed geometry';return old;}
   // Refinement is not permission to select a substantially different passage.
   // Keep a supported coarse leg when source topology requires a large detour.
   if(old.status==='CALCULATED'&&length(detailed.points)>old.distanceNM*1.5+1)throw Error('Mapped path exceeds refinement detour guard (1.5 x coarse NM + 1 NM); original course retained');
   note.status='REFINED';note.reason='Connected mapped source geometry replaces coarse or unresolved geometry';note.beforeNM=old.distanceNM;note.afterNM=length(detailed.points);note.beforeVertices=old.points.length;note.afterVertices=detailed.points.length;
   return {...old,...detailed,status:'CALCULATED',geographicStatus:'CALCULATED',reason:null,distanceNM:note.afterNM,provisionalDistanceNM:0,reused:false,transitionBefore:null};
  }catch(error){note.status=old.status==='UNRESOLVED'?'UNRESOLVED':'UNCHANGED';note.reason=error.message;return old;}
 });
 // Roll back a replacement that breaks an already successful shared attachment.
 for(let i=1;i<r.legs.length;i++){
  const left=r.legs[i-1],right=r.legs[i];
  if(left.accesses&&right.accesses&&!near(left.accesses[1],right.accesses[0])){
   for(const j of [i-1,i])if(r.refinement.legs[j].status==='REFINED'&&coarse.legs[j].status==='CALCULATED'){r.legs[j]=structuredClone(coarse.legs[j]);Object.assign(r.refinement.legs[j],{status:'UNCHANGED',reason:'Preserved successful coarse leg: incompatible adjacent attachment'});}
  }
 }
 for(const leg of r.legs)leg.transitionBefore=null;
 for(let i=1;i<r.legs.length;i++){const a=r.legs[i-1],b=r.legs[i];if(a.accesses&&b.accesses&&!near(a.accesses[1],b.accesses[0]))b.transitionBefore={status:'UNRESOLVED',waypointId:b.fromId,from:a.accesses[1],to:b.accesses[0],reason:'Detailed/coarse attachment transfer is unresolved'};}
 for(const l of r.legs)l.suitability=require('./suitability.cjs').assessSuitability([s.waypoints.find(w=>w.id===l.fromId),s.waypoints.find(w=>w.id===l.waypointId)],s.vessel,options.vesselSuitability,l.transport,l.evidence.sourceAccessEvidence);
 Object.assign(r,require('./passage.cjs').timeResult(s,r.legs));
 r.connectors=r.legs.flatMap(l=>l.accesses?l.accesses.map((access,j)=>({id:l.id+':'+j,waypointId:j?l.waypointId:l.fromId,anchor:l.evidence.anchors[j],access,distanceNM:distanceNM(l.evidence.anchors[j],access),includedInPassage:false})):[]);
 const count=r.refinement.legs.filter(l=>l.status==='REFINED').length;r.refinement.status=count?'PARTIALLY_REFINED':'NO_SUPPORTED_IMPROVEMENT';r.refinement.refinedLegs=count;
 r.status=(r.complete?'PRELIMINARY ROUTE':'PARTIAL / UNRESOLVED ROUTE')+' — '+count+' LEGS REFINED';
 r.alternatives=[{id:r.id,preference:r.preference,legs:r.legs,...require('./passage.cjs').timeResult(s,r.legs)}];
 return require('./course-model.cjs').annotate(r);
}
module.exports={refine,candidate,supported,length};
