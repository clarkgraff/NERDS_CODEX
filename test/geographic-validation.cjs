'use strict';
const {distanceNM}=require('../src/navigation.cjs');
const water=require('../src/water-route.cjs');
const {bundled}=require('../src/waterway-network.cjs');
const near=(a,b)=>a&&b&&distanceNM(a,b)<1e-7;
function source(points,e){
 if(!e.dataset)return points.length===1&&!(e.sourceEdgeIds||[]).length;
 const net=bundled(e.dataset),ids=points.map(p=>net.index.get([p.lon,p.lat].join(',')));
 return !!e.source&&e.sourceChecksum===net.doc.sha256&&e.sourceEdgeIds?.length===points.length-1&&ids.every(i=>i!==undefined)&&ids.slice(1).every((id,i)=>net.nodes[ids[i]].edges.some(edge=>edge.to===id&&edge.sourceId===e.sourceEdgeIds[i]));
}
function grid(points,id,geodesic=false){
 const net=id==='world-0.1'?water.world:id==='europe-0.025'?water.europe:null;if(!net||!points.length)return false;
 if(!points.every(p=>net.inspect(p).classification==='WATER'))return false;
 if(geodesic){const dense=[points[0]];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],count=Math.max(1,Math.ceil(distanceNM(a,b)/(net.resolution*60*Math.max(.05,Math.cos(Math.max(Math.abs(a.lat),Math.abs(b.lat))*Math.PI/180))/12)));for(let j=1;j<=count;j++)dense.push(require('../src/navigation.cjs').interpolate(a,b,j/count));}if(!dense.every(p=>net.inspect(p).classification==='WATER'))return false;
 // Independently traverse sample-chord boundary crossings. A diagonal change
 // between samples is not itself proof that both side cells were crossed.
 for(let k=1;k<dense.length;k++){
  const a=dense[k-1],b={...dense[k]};while(b.lon-a.lon>180)b.lon-=360;while(b.lon-a.lon< -180)b.lon+=360;
  const times=[0,1],r=net.resolution;
  for(const [axis,origin] of [['lon',net.extent.west],['lat',net.extent.south]]){
   const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-14)continue;
   const low=Math.ceil((Math.min(a[axis],b[axis])-origin)/r),high=Math.floor((Math.max(a[axis],b[axis])-origin)/r);
   for(let n=low;n<=high;n++){const t=(origin+n*r-a[axis])/delta;if(t>0&&t<1)times.push(t);}
  }
  times.sort((a,b)=>a-b);
  const at=t=>({lat:a.lat+(b.lat-a.lat)*t,lon:((a.lon+(b.lon-a.lon)*t+540)%360)-180});
  for(let j=1;j<times.length;j++)if(net.inspect(at((times[j]+times[j-1])/2)).classification!=='WATER')return false;
  for(const t of times.slice(1,-1)){const p=at(t);for(const dx of [-1e-9,1e-9])for(const dy of [-1e-9,1e-9])if(net.inspect({lat:p.lat+dy,lon:p.lon+dx}).classification!=='WATER')return false;}
 }
 return true;}
 const [width]=net.dimensions;
 return points.slice(1).every((p,i)=>{const u=net.cell(points[i]),v=net.cell(p),dx=Math.abs(u%width-v%width),dy=Math.abs(Math.floor(u/width)-Math.floor(v/width));if(!(dx<=1||id==='world-0.1'&&dx===width-1)||dy>1)return false;if(dx&&dy)return [Math.floor(u/width)*width+v%width,Math.floor(v/width)*width+u%width].every(c=>net.inspect(net.point(c)).classification==='WATER');return true;});
}
function geometry(leg){
 const e=leg.evidence;if(e.grid==='source-waterway-network')return source(leg.points,e);
 if(e.grid==='hybrid-waterway-ocean'){
  const [a,m,b]=e.sections||[];if(!a||!m||!b||!source(a.points,a)||!source(b.points,b)||!grid(m.points,m.grid,!!m.segmentValidation)||m.rawPoints&&!grid(m.rawPoints,m.grid))return false;
  if(!near(a.points.at(-1),m.points[0])||!near(m.points.at(-1),b.points.at(-1)))return false;
  const assembled=[...a.points,...m.points.slice(1),...[...b.points].reverse().slice(1)];return assembled.length===leg.points.length&&assembled.every((p,i)=>near(p,leg.points[i]));
 }
 return grid(leg.points,e.grid,!!e.segmentValidation)&&(!e.rawPoints||grid(e.rawPoints,e.grid));
}
function validate(s,r){
 const errors=[],unresolved=[];let distance=0,hours=0,standardHours=0,gap=false;
 const check=(value,message)=>{if(!value)errors.push(message);};
 check(r.legs.length===s.waypoints.length-1,'Mandatory waypoint/leg count changed');
 for(const [i,l] of r.legs.entries()){
  check(l.fromId===s.waypoints[i]?.id&&l.waypointId===s.waypoints[i+1]?.id,'Mandatory waypoint order changed');
  if(l.status==='UNRESOLVED'){gap=true;unresolved.push(l.reason||'Unresolved leg');check(l.distanceNM===null&&l.calculatedHours===null,'Unknown leg represented as completed distance/time');}
  else {
   check(s.transport==='BY-AIR'||geometry(l),'Returned geometry lacks valid connected source/grid edges');
   const sum=l.points.slice(1).reduce((n,p,j)=>n+distanceNM(l.points[j],p),0);check(Math.abs(sum-l.distanceNM)<1e-6,'Leg distance does not match geometry');
   check(Math.abs(l.calculatedHours-l.distanceNM/l.calculatedSpeed)<1e-8,'Operating duration mismatch');check(Math.abs(l.standardHours-l.distanceNM/l.standardSpeed)<1e-8,'Reference duration mismatch');
   distance+=l.distanceNM;hours+=l.calculatedHours;standardHours+=l.standardHours;
   if(l.accesses){check(near(l.points[0],l.accesses[0])&&near(l.points.at(-1),l.accesses[1]),'Route endpoints differ from recorded attachments');}
  }
  if(l.transitionBefore){gap=true;unresolved.push(l.transitionBefore.reason);}
  const previous=r.legs[i-1];if(previous?.status==='CALCULATED'&&l.status==='CALCULATED'&&!near(previous.points.at(-1),l.points[0])){gap=true;unresolved.push('Discontinuous attachment at '+s.waypoints[i].name);check(!!l.transitionBefore,'Undeclared waypoint attachment jump');}
  check(Math.abs(l.calculatedCumulativeNM-distance)<1e-6,'Cumulative distance mismatch');
  if(gap)check(l.calculatedETA===null&&l.standardETA===null,'ETA fabricated after unknown duration/transfer');
  else {check(Math.abs(Date.parse(l.calculatedETA)-Date.parse(s.departureUTC)-hours*3600000)<=1,'Operating ETA mismatch');check(Math.abs(Date.parse(l.standardETA)-Date.parse(s.departureUTC)-standardHours*3600000)<=1,'Reference ETA mismatch');}
 }
 if(r.legs.some(l=>l.status==='CALCULATED'))check(Math.abs(r.calculatedDistanceNM-distance)<1e-6,'Calculated subtotal mismatch');
 if(gap)check(!r.complete&&r.totalNM===null&&r.calculatedETA===null,'Incomplete journey has complete totals');
 else {check(r.complete&&Math.abs(r.totalNM-distance)<1e-6,'Whole-voyage total mismatch');check(Math.abs(r.calculatedHours-hours)<1e-8,'Whole-voyage duration mismatch');}
 return {result:errors.length?'FAIL':unresolved.length?'UNRESOLVED':'PASS',errors,unresolved};
}
module.exports={validate,geometry,source,grid,near};
