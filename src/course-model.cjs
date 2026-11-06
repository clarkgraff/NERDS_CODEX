const {randomUUID}=require('node:crypto');
function cleanPlan(value={}){
 if(value==null)value={};
 if(value.segmentType&&value.segmentType!=='GEODESIC')throw Error('Unsupported authoritative course definition');
 const input=value.manualConstraints??[];
 if(!Array.isArray(input)||input.length>2000)throw Error('Invalid manual routing constraints');
 const ids=new Set();
 const manualConstraints=input.map(c=>{
  if(!c||typeof c.fromId!=='string'||typeof c.toId!=='string'||!c.fromId||!c.toId||c.fromId===c.toId||c.fromId.length>80||c.toId.length>80)throw Error('Invalid constraint leg identity');
  if(!Number.isFinite(c.lat)||Math.abs(c.lat)>90||!Number.isFinite(c.lon)||Math.abs(c.lon)>180)throw Error('Invalid constraint coordinates');
  const id=c.id??randomUUID();if(typeof id!=='string'||!id||id.length>100||ids.has(id))throw Error('Invalid or duplicate routing constraint identity');ids.add(id);
  return {id,fromId:c.fromId,toId:c.toId,lat:c.lat,lon:c.lon,kind:'MANUAL'};
 });
 return {schemaVersion:1,segmentType:'GEODESIC',manualConstraints};
}
const constraintsFor=(plan,fromId,toId)=>(plan?.manualConstraints||[]).filter(c=>c.fromId===fromId&&c.toId===toId);
function annotate(route){
 route.geometryDefinition={authoritative:'legs[].points',segmentType:'GEODESIC',coordinateDatum:'WGS84',distanceModel:'WGS84_ELLIPSOID',searchCostModel:'Spherical estimate for economical graph search; authoritative distances are ellipsoidal',presentation:'Derived renderer-only geometry; never used for calculation or export'};
 for(const candidate of [route,...(route.alternatives||[])])for(const leg of candidate.legs||[]){
  leg.courseVertices=leg.points.map((p,i)=>({id:leg.id+':auto:'+i,pointIndex:i,kind:'AUTOMATIC'}));
 }
 return route;
}
module.exports={cleanPlan,constraintsFor,annotate};
