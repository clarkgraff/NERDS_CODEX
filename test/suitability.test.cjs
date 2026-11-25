const {test}=require('node:test'),assert=require('node:assert/strict');
const {plan}=require('../src/passage.cjs');
const {stateFor}=require('./geographic-cases.cjs');
const {cleanState}=require('../src/core.cjs');
test('BETA suitability never changes connected geometry, distance, duration or ETA',()=>{
 const s=stateFor(['Barcelona','Ibiza']);const initial=plan(s);
 s.waypoints.forEach((w,i)=>w.access={...initial.legs[0].accesses[i],depth:1,airClearance:1,maxLOA:1,maxBeam:1,source:'User supplied test limits'});
 Object.assign(s.vessel,{draftWater:3,draftAir:15,loa:12,beam:4,lengthUnit:'m'});
 const bypass=plan(s);assert.equal(bypass.complete,false);assert.equal(bypass.legs[0].suitability.status,'BYPASSED');
 s.route=bypass;const on=plan(s,{vesselSuitability:'ON'});assert.equal(on.complete,false);assert.equal(on.legs[0].reused,true);
 assert.equal(on.legs[0].suitability.restrictions.length,8);assert.ok(on.legs[0].suitability.unknowns.length);
 for(const k of ['totalNM','calculatedHours','calculatedETA'])assert.equal(on[k],bypass[k]);
 assert.deepEqual(on.legs[0].points,bypass.legs[0].points);assert.equal(on.legs[0].geographicStatus,'CALCULATED');
 s.route=on;assert.deepEqual(cleanState(s).route.suitability,on.suitability);
 const off=plan(s);assert.equal(off.legs[0].suitability.status,'BYPASSED');assert.deepEqual(off.legs[0].suitability.restrictions,[]);
});
test('BYPASS and advisory ON cannot permit access on land or invent inland connectivity',()=>{
 for(const mode of ['ON','BYPASS']){
  const s=stateFor(['Barcelona','Ibiza']);s.waypoints[1].access={lat:48.8,lon:2.3};const r=plan(s,{vesselSuitability:mode});
  assert.equal(r.complete,false);assert.match(r.legs[0].reason,/ACCESS_NOT_WATER/);assert.equal(r.totalNM,null);
  const missing=stateFor(['Barcelona','Ibiza']);missing.waypoints[1]={...missing.waypoints[1],lat:25,lon:15,access:null};assert.equal(plan(missing,{vesselSuitability:mode}).complete,false);
 }
});
