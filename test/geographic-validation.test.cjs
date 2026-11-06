const {test}=require('node:test'),a=require('node:assert/strict');const {plan}=require('../src/passage.cjs');const {stateFor}=require('./geographic-cases.cjs');const {validate}=require('./geographic-validation.cjs');
test('independent geodesic validator checks actual boundary crossings near Black Sea coast',()=>{
 const {grid}=require('./geographic-validation.cjs');
 const points=[{lat:45.3125,lon:32.5125},{lat:45.6875,lon:32.1125}];
 a.equal(grid(points,'europe-0.025',true),true);
 a.equal(grid([...points].reverse(),'europe-0.025',true),true);
 // Endpoints remain at sea but the direct chord crosses continental Europe.
 a.equal(grid([{lat:54,lon:4},{lat:43,lon:5}],'europe-0.025',true),false);
});
test('geographic acceptance rejects fabricated source edges, waypoint order, distance and ETA',()=>{const s=stateFor(['Hamburg','Kiel']),route=plan(s);a.equal(validate(s,route).result,'PASS');for(const mutate of [r=>r.legs[0].points[1].lon+=1,r=>r.legs[0].fromId='wrong',r=>r.legs[0].distanceNM+=10,r=>r.legs[0].calculatedETA=s.departureUTC,r=>r.legs[0].evidence.sourceEdgeIds[0]='invented']){const r=structuredClone(route);mutate(r);a.equal(validate(s,r).result,'FAIL');}});
