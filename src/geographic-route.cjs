'use strict';
const water=require('./water-route.cjs'),network=require('./waterway-network.cjs');
const {distanceNM}=require('./navigation.cjs');
const portalCache=new Map();
const length=route=>route.points.slice(1).reduce((sum,p,i)=>sum+distanceNM(route.points[i],p),0);
function baseLeg(a,b,options={}){
 if(options.maxVisited!==undefined)return water.leg(a,b,options);
 const datasets=options.datasets||['osm','rivers'];
 const selected=water.selectNetwork(a.access||a,b.access||b),grid=selected.network;
 function endpoint(w){
  if(!w.access&&grid.inspect(w).classification==='WATER')return {access:{lat:w.lat,lon:w.lon},portal:{lat:w.lat,lon:w.lon},points:[{lat:w.lat,lon:w.lon}],sourceEdgeIds:[],sourceAccessEvidence:[]};
  const key=JSON.stringify([w.lat,w.lon,w.access?.lat,w.access?.lon,selected.id,datasets]);
  if(!portalCache.has(key))portalCache.set(key,network.toGrid(w,grid,datasets));
  const source=portalCache.get(key);
  // Resolve each waypoint independently, so adjacent legs on this network share an attachment.
  if(source)return {...source,portal:source.points.at(-1)};
  const limit=Math.max(15,grid.resolution*240),candidate=water.automaticAccess(w,grid);
  if(grid.inspect(candidate).classification!=='WATER'||(!w.access&&distanceNM(w,candidate)>limit))return null;
  return {access:candidate,portal:candidate,points:[{lat:candidate.lat,lon:candidate.lon}],sourceEdgeIds:[],sourceAccessEvidence:[]};
 }
 let from,to;try{from=endpoint(a);to=endpoint(b);}catch{}
 if(!from||!to){const inland=network.leg(a,b,datasets);if(inland)return inland;return water.leg(a,b,options);}
 if(!from.dataset&&!to.dataset)return water.leg(a,b,options);
 // Use the same attachments for all candidate paths, including canal and ocean alternatives.
 const direct=network.leg({...a,access:from.access},{...b,access:to.access},datasets);
 if(options.preferSource&&direct)return direct;
 let ocean;try{ocean=water.leg({...a,access:from.portal},{...b,access:to.portal},options);}catch(error){if(direct)return direct;throw error;}
 const reverse=[...to.points].reverse(),points=[...from.points,...ocean.points.slice(1),...reverse.slice(1)];
 const hybrid={points,accesses:[from.access,to.access],evidence:{...ocean.evidence,grid:'hybrid-waterway-ocean',oceanGrid:selected.id,termination:'CONNECTED_SOURCE_AND_GRID_PATH',anchors:[{lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon}],sections:[{kind:'source',...from},{kind:'grid',grid:selected.id,points:ocean.points},{kind:'source',...to}],sourceAccessEvidence:[...from.sourceAccessEvidence,...to.sourceAccessEvidence],accessCandidates:[from,to].map((p,i)=>({waypointId:[a,b][i].id,candidate:p.access,distanceNM:distanceNM([a,b][i],p.access),cell:{classification:p.dataset?'SOURCE_WATERWAY':'WATER'}})),geographicConnectivity:'Source edges meet water grid at identical portal coordinates; no invented joins'}};
 if(direct&&length(direct)<=length(hybrid)){direct.evidence.alternativeOceanDistanceNM=length(hybrid);direct.evidence.selection='Shorter connected source path with identical attachments';direct.evidence.anchors=[{lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon}];direct.evidence.accessCandidates.forEach((candidate,i)=>{candidate.distanceNM=distanceNM([a,b][i],direct.accesses[i]);candidate.explicit=!![a,b][i].access;});return direct;}
 return hybrid;
}
function leg(a,b,options={}){
 const directory=require('node:path').resolve(__dirname,'../assets/marine/kattegat-topology');
 const prepared=[...new Set([...(options.preparedGeography||[]),...(options.bundledMarine===false?[]:require('node:fs').existsSync(directory+'/ready.json')?[directory]:[])])];
 options={...options,preparedGeography:prepared};
 if(options.preparedGeography)require('./water-area-route.cjs').configure(options.preparedGeography);
 try{const coarse=baseLeg(a,b,options);
  if(options.preparedGeography?.length&&require('./water-area-route.cjs').manifest.regions.some(r=>r.runtimeDirectory&&coarse.points.slice(1).some((p,i)=>{const q=coarse.points[i],e=r.extent;return Math.max(p.lon,q.lon)>=e.west&&Math.min(p.lon,q.lon)<=e.east&&Math.max(p.lat,q.lat)>=e.south&&Math.min(p.lat,q.lat)<=e.north;}))&&options.recoverTopology!==false&&options.maxVisited===undefined){
   const areas=require('./water-area-route.cjs'),regions=areas.areas().filter(r=>r.record.runtimeDirectory),coarseSupported=coarse.points.slice(1).every((p,i)=>areas.exclusionClear(coarse.points[i],p,regions));
   try{const candidate=areas.leg(a,b,options);
    if(areas.valid(candidate)&&(!coarseSupported||length(candidate)+candidate.accesses.reduce((n,p,i)=>n+distanceNM([a,b][i],p),0)<length(coarse)+coarse.accesses.reduce((n,p,i)=>n+distanceNM([a,b][i],p),0))){
     candidate.evidence.refinement={method:'CONNECTED_MAPPED_WATER_COMPARISON',originalDistanceNM:length(coarse),refinedDistanceNM:length(candidate),originalGeometry:coarse.points,originalEvidence:coarse.evidence};return candidate;
    }
   }catch(error){coarse.evidence.refinement={status:'UNRESOLVED',reason:error.message,originalPreserved:true};}
   if(!coarseSupported){const error=Error('GEOMETRY_CONFLICT: coarse route intersects verified mapped land');error.evidence={...coarse.evidence,originalGeometry:coarse.points};throw error;}
  }
  return coarse;
 }catch(original){
  if(options.maxVisited!==undefined||options.recoverTopology===false)throw original;
  try{const candidate=require('./water-area-route.cjs').leg(a,b,options);
   if(!require('./water-area-route.cjs').valid(candidate))throw Error('Unsupported water-area recovery');
   candidate.evidence.recovery={method:'CONNECTED_MAPPED_WATER_AFTER_GRID_ACCESS_FAILURE',originalFailure:original.message};return candidate;
  }catch(recovery){original.evidence={...original.evidence,recovery:{status:'UNRESOLVED',reason:recovery.message,coverageRequired:true}};throw original;}
 }
}
module.exports={leg};
