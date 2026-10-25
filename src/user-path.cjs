'use strict';
const {createHash,randomUUID}=require('node:crypto');
const {distanceNM}=require('./navigation.cjs');
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function vertices(rows){if(!Array.isArray(rows)||rows.length>1000)throw Error('Invalid USER PATH');const ids=new Set();return rows.map(w=>{if(typeof w.id!=='string'||ids.has(w.id)||!Number.isFinite(w.lat)||Math.abs(w.lat)>90||!Number.isFinite(w.lon)||Math.abs(w.lon)>180)throw Error('Invalid USER PATH vertex');ids.add(w.id);return {id:w.id,name:String(w.name||''),lat:w.lat,lon:w.lon};});}
function reconcile(previous,waypoints){
 const points=vertices(waypoints),revision=digest(points);
 if(previous){if(previous.schemaVersion!==1||typeof previous.id!=='string'||previous.revision!==digest(vertices(previous.vertices)))throw Error('Invalid USER PATH revision');if(!Array.isArray(previous.history||[])||(previous.history||[]).length>1000||(previous.history||[]).some(h=>h.revision!==digest(vertices(h.vertices))))throw Error('Invalid USER PATH history');if(previous.revision===revision)return structuredClone(previous);}
 const history=structuredClone(previous?.history||[]);if(history.length>=1000)throw Error('USER PATH revision budget exceeded');if(previous)history.push({revision:previous.revision,vertices:structuredClone(previous.vertices)});return {schemaVersion:1,id:previous?.id||randomUUID(),revision,parentRevision:previous?.revision||null,vertices:points,history};
}
function coarse(userPath,{knots=6,departureUTC=null,byWay='BY-SEA'}={}){
 if(!Number.isFinite(knots)||knots<=0||knots>2000||!['BY-SEA','BY-LAND','BY-AIR'].includes(byWay))throw Error('Invalid coarse planning settings');
 if(departureUTC!==null&&!Number.isFinite(Date.parse(departureUTC)))throw Error('Invalid departure');
 reconcile(userPath,userPath.vertices);const p=vertices(userPath.vertices);let totalNM=0;const legs=p.slice(1).map((q,i)=>{const distance=distanceNM(p[i],q);totalNM+=distance;return {fromId:p[i].id,toId:q.id,points:[p[i],q],distanceNM:distance,hours:distance/knots,cumulativeNM:totalNM,eta:departureUTC?new Date(Date.parse(departureUTC)+totalNM/knots*3600000).toISOString():null};});
 return {id:randomUUID(),pathId:userPath.id,pathRevision:userPath.revision,stage:'COARSE',byWay,operationalMode:'BYPASS',knots,geometryDefinition:'WGS84_ELLIPSOID_GEODESIC',status:'INTENT_ONLY_NOT_GEOGRAPHIC_CONNECTIVITY',legs,totalNM,hours:totalNM/knots};
}
function variant(userPath,stage,result,settings={}){if(!['COARSE','BY-WAY','NAVIGABLE','WEATHER'].includes(stage))throw Error('Invalid course stage');return {id:randomUUID(),pathId:userPath.id,pathRevision:userPath.revision,inputPath:structuredClone(userPath),stage,settings:structuredClone(settings),result:structuredClone(result)};}
function compatible(v,p){return v.pathId===p.id&&v.pathRevision===p.revision;}
module.exports={reconcile,coarse,variant,compatible};
