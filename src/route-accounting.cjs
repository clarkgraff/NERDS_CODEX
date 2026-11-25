'use strict';
const totals=['totalNM','totalEstimatedDistanceNM','standardHours','calculatedHours','standardETA','calculatedETA','effectiveSOG','differenceHours'];
function annotate(route){
 const pending=(route.connectors||[]).filter(c=>!Number.isFinite(c.distanceNM)||c.distanceNM>.001);
 let prefix=true;
 for(const leg of route.legs||[]){
  leg.endpointIntegrity=require('./route-integrity.cjs').inspect(leg);
  if(!leg.endpointIntegrity.connected||leg.transitionBefore)prefix=false;
  if(!prefix){for(const key of ['totalNM','totalStandardHours','totalCalculatedHours','standardETA','calculatedETA'])leg[key]=null;leg.etaStatus='UNRESOLVED: endpoint, access transfer or preceding duration unknown';}
 }
 if(pending.length||!prefix){route.complete=false;for(const key of totals)route[key]=null;route.provisionalDistanceNM=null;route.provisionalStandardHours=null;route.provisionalOperatingHours=null;route.status='PARTIAL ROUTE — UNRESOLVED LEGS OR ACCESS TRANSFERS';}
 const sum=pending.every(c=>Number.isFinite(c.distanceNM))?pending.reduce((n,c)=>n+c.distanceNM,0):null;
 route.distanceComponents={vesselPassageNM:route.calculatedDistanceNM,unverifiedConnectorGeometryNM:sum,connectorsIncludedInVesselDistance:false,completeExpeditionNM:route.complete?route.totalNM:null};
 route.endpointStatus=pending.length||!prefix?'UNRESOLVED_ACCESS_TRANSFER':'COINCIDENT_WITH_CALCULATED_ACCESS';
 for(const alternative of route.alternatives||[])if(alternative!==route)annotate(alternative);
 return route;
}
module.exports={annotate};
