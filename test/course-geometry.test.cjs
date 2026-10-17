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
