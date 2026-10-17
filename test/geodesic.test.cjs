const {test}=require('node:test'),a=require('node:assert/strict');
const {distanceNM,interpolate}=require('../src/navigation.cjs');
test('WGS84 inverse distances match published GeographicLib reference vectors',()=>{
 // GeographicLib 2.2.0 MIT test vectors and documented Wellington–Salamanca example.
 for(const [lat,lon,lat2,lon2,metres] of [[35.60777,-139.44815,-11.17491,-69.95921,8935244.5604818305],[55.52454,106.05087,77.03196,-162.81766,4105086.1713924406],[-41.32,174.81,40.96,-5.50,19959679.267],[0,0,0,1,111319.49079327357],[0,0,0,180,20003931.458625447]]){
  a.ok(Math.abs(distanceNM({lat,lon},{lat:lat2,lon:lon2})*1852-metres)<.001);
 }
});
test('geodesic sampling preserves endpoints and length across the dateline and near poles',()=>{
 for(const [u,v] of [[{lat:80,lon:170},{lat:80,lon:-170}],[{lat:89,lon:-90},{lat:89,lon:90}],[{lat:0,lon:0},{lat:0,lon:0}]]){
  const midpoint=interpolate(u,v,.5);a.ok(Math.abs(distanceNM(u,midpoint)+distanceNM(midpoint,v)-distanceNM(u,v))<1e-8);a.ok(distanceNM(interpolate(u,v,0),u)<1e-8);a.ok(distanceNM(interpolate(u,v,1),v)<1e-8);
 }
});
