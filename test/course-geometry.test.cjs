const {test}=require('node:test'),a=require('node:assert/strict');
const {supportedSegment,simplify}=require('../src/course-geometry.cjs');
const fixture=blocked=>({resolution:.1,extent:{west:-2,south:-2},inspect:p=>({classification:blocked(p)?'BLOCKED':'WATER'})});
test('open water staircase becomes a direct geodesic without mutating source geometry',()=>{
 const points=[{lat:.05,lon:.05},{lat:.05,lon:.15},{lat:.15,lon:.15},{lat:.15,lon:.25},{lat:.25,lon:.25}],before=structuredClone(points);
 a.deepEqual(simplify(points,fixture(()=>false)),[points[0],points.at(-1)]);a.deepEqual(points,before);
});
test('geodesic shortcuts cannot cross blocked cells or diagonal land corners',()=>{
 const grid=fixture(p=>p.lon>.1&&p.lon<.2&&p.lat>0&&p.lat<.2);
 a.equal(supportedSegment({lat:.05,lon:.05},{lat:.05,lon:.25},grid),false);
 a.equal(supportedSegment({lat:.05,lon:.05},{lat:.25,lon:.25},grid),false);
 const path=[{lat:.05,lon:.05},{lat:.25,lon:.05},{lat:.25,lon:.25}];a.deepEqual(simplify(path,grid),path);
});
test('course simplification retains exact source-waterway bends',()=>{
 const {simplifyLeg}=require('../src/course-geometry.cjs');const r={points:[{lat:0,lon:0},{lat:1,lon:0},{lat:1,lon:1}],evidence:{grid:'source-waterway-network'}};a.equal(simplifyLeg(r),r);
});
test('reversing a constrained raster path reverses the same simplified geometry',()=>{
 const grid=fixture(p=>p.lon>.1&&p.lon<.2&&p.lat<.2);
 const points=[{lat:.05,lon:.05},{lat:.15,lon:.05},{lat:.25,lon:.05},{lat:.25,lon:.15},{lat:.25,lon:.25},{lat:.15,lon:.25},{lat:.05,lon:.25}];
 const forward=simplify(points,grid),reverse=simplify([...points].reverse(),grid);
 a.deepEqual(reverse,[...forward].reverse());a.ok(forward.length>2);
 for(let i=1;i<forward.length;i++)a.equal(supportedSegment(forward[i-1],forward[i],grid),true);
});
