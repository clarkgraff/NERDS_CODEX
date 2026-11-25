'use strict';
const {distanceNM}=require('./navigation.cjs');
const valid=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;
function inspect(leg){
 const points=leg.points||[],anchors=leg.evidence?.anchors,accesses=leg.accesses;
 if(leg.status==='UNRESOLVED'||points.length<2||!points.every(valid))return {connected:false,reason:'INVALID_OR_MISSING_GEOMETRY',gapsNM:[]};
 if(!anchors||anchors.length!==2||!anchors.every(valid))return {connected:false,reason:'MISSING_ENDPOINT_EVIDENCE',gapsNM:[]};
 const ends=[points[0],points.at(-1)],gapsNM=ends.map((p,i)=>distanceNM(anchors[i],p));
 if(accesses&&(!accesses.every(valid)||accesses.length!==2||ends.some((p,i)=>distanceNM(p,accesses[i])>.001)))return {connected:false,reason:'ACCESS_GEOMETRY_MISMATCH',gapsNM};
 return {connected:gapsNM.every(n=>n<=.001),reason:gapsNM.some(n=>n>.001)?'UNRESOLVED_ACCESS_TRANSFER':null,gapsNM};
}
module.exports={inspect};
