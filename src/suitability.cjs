'use strict';
const {metres}=require('./vessel.cjs');
// Suitability consumes evidence after routing. It never edits geometry or route status.
function assessSuitability(endpoints,vessel,mode='BYPASS',transport='BY-SEA') {
 const result={mode:mode==='ON'?'ON':'BYPASS',policy:'ADVISORY_ONLY_BETA',blocksRouting:false,status:'BYPASSED',restrictions:[],unknowns:[],checks:[]};
 if(result.mode==='BYPASS')return result;
 if(!['BY-SEA','BY-RIB'].includes(transport)){result.status='NOT_APPLICABLE';return result;}
 for(const endpoint of endpoints){
  for(const [dimension,limit] of [['draftWater','depth'],['draftAir','airClearance'],['loa','maxLOA'],['beam','maxBeam']]){
   const supplied=endpoint?.access?.[limit],measurement=metres(vessel,dimension);
   const allowance=dimension==='draftWater'?(vessel.underKeel||0)+(vessel.draftAllowance||0):dimension==='draftAir'?(vessel.airAllowance||0):0;
   const check={waypointId:endpoint?.id,type:limit,requiredMetres:measurement==null?null:measurement+allowance,availableMetres:Number.isFinite(supplied)?supplied:null,source:endpoint?.access?.source||null,evidenceScope:'supplied endpoint only'};
   check.status=check.requiredMetres===null||check.availableMetres===null?'UNKNOWN':check.requiredMetres>check.availableMetres?'RESTRICTION':'WITHIN_SUPPLIED_LIMIT';
   result.checks.push(check);if(check.status==='UNKNOWN')result.unknowns.push(check);if(check.status==='RESTRICTION')result.restrictions.push(check);
  }
 }
 result.unknowns.push({type:'route-wide-access',status:'UNKNOWN',reason:'Continuous depth, bridge, lock, legal access, tide and seasonal evidence is not available.'});
 result.status=result.restrictions.length?'RESTRICTIONS_REPORTED':'UNKNOWN';
 return result;
}
module.exports={assessSuitability};
