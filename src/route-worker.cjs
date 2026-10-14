const {parentPort,workerData}=require('node:worker_threads');
const {route}=require('./water-route.cjs');
const {distanceNM}=require('./navigation.cjs');
const {accessAssessment}=require('./vessel.cjs');
try{
 const s=workerData;let totalNM=0;
 if(s.waypoints.length<2||!(s.cruisingKnots>0))throw Error('Add two waypoints and enter cruising speed.');
 const legs=s.waypoints.slice(1).map((w,i)=>{
  const a=s.waypoints[i];if(!a.access||!w.access)throw Error('Assign water access to every waypoint in Edit before calculating a water outline.');
  for(const p of [a,w])if(accessAssessment(p.access,s.vessel).startsWith('UNSUITABLE'))throw Error(p.name+': '+accessAssessment(p.access,s.vessel));
  const points=route(a.access,w.access),nm=points.slice(1).reduce((sum,p,j)=>sum+distanceNM(points[j],p),0);totalNM+=nm;
  return {waypointId:w.id,points,distanceNM:nm,hours:nm/s.cruisingKnots,totalNM,totalHours:totalNM/s.cruisingKnots};
 });
 parentPort.postMessage({kind:'water-outline',legs,totalNM,hours:totalNM/s.cruisingKnots,warning:'Experimental offshore outline on a coarse land grid (0.025° in Europe, 0.1° elsewhere). Not a navigable route. Depths, tides, bridges, shipping restrictions, canals and vessel clearance are not resolved.'});
}catch(e){parentPort.postMessage({error:e.message});}
