const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Mapped land exclusion is checked when both endpoints are outside the detailed region',()=>{
 const points=[{lat:0,lon:-2},{lat:0,lon:2}],region={record:{runtimeDirectory:'fixture'},extent:{west:-1,east:1,south:-1,north:1},runtimeDirectory:'fixture'};let checked=0;
 const areas={configure(){},manifest:{regions:[region]},areas:()=>[region],exclusionClear:()=>{checked++;return false;},leg(){throw Error('No supported detailed connection');},valid:()=>false};
 const water={selectNetwork:()=>({network:{inspect:()=>({classification:'WATER'})}}),leg:()=>({points,accesses:points,evidence:{}})};
 const module={exports:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../src/geographic-route.cjs'),'utf8'),{module,exports:module.exports,__dirname:__dirname,require:id=>id==='./water-route.cjs'?water:id==='./waterway-network.cjs'?{}:id==='./water-area-route.cjs'?areas:id==='./navigation.cjs'?{distanceNM:()=>1}:require(id)});
 assert.throws(()=>module.exports.leg(points[0],points[1],{preparedGeography:['fixture']}),/GEOMETRY_CONFLICT/);assert.ok(checked>0);
});
