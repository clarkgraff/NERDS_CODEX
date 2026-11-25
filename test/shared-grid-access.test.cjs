const {test}=require('node:test'),a=require('node:assert/strict');
const water=require('../src/water-route.cjs'),{plan}=require('../src/passage.cjs'),{distanceNM}=require('../src/navigation.cjs');
const {stateFor,places}=require('./geographic-cases.cjs'),{validate}=require('./geographic-validation.cjs');
test('mixed European/world itinerary retains shared water attachments and valid accounting both directions',()=>{
 const names=['Marseille','Barcelona','Ibiza','Algiers','Marseille'];
 const forward=stateFor(names),reverse=stateFor([...names].reverse()),f=plan(forward),r=plan(reverse);
 for(const [s,route] of [[forward,f],[reverse,r]]){a.equal(route.complete,false);a.equal(validate(s,route).result,'UNRESOLVED');a.ok(route.legs.every(l=>!l.transitionBefore));a.equal(route.calculatedETA,null);}
 a.ok(Math.abs(f.calculatedDistanceNM-r.calculatedDistanceNM)<.1);
 const anchor=water.automaticAccess(places.Barcelona,water.europe);
 a.deepEqual(anchor,water.automaticAccess(places.Barcelona,water.world));
 for(const grid of [water.europe,water.world])a.equal(grid.inspect(anchor).classification,'WATER');
 a.ok(distanceNM(places.Barcelona,anchor)<=15);
});
test('explicit access remains unchanged; shared selection never increases the guard',()=>{
 const access={lat:41.2,lon:2.5},w={...places.Barcelona,access};a.equal(water.automaticAccess(w,water.world),access);
 a.equal(water.MAX_AUTOMATIC_CONNECTOR_NM,15);
 const inland={lat:48.85,lon:2.35,id:'inland'};a.throws(()=>water.leg(inland,places.Barcelona),/ACCESS_UNRESOLVED|ACCESS_TOO_DISTANT/);
});
