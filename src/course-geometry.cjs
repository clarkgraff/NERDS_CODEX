const {Geodesic}=require('geographiclib-geodesic');
const water=require('./water-route.cjs');
const gridById=id=>id==='world-0.1'?water.world:id==='europe-0.025'?water.europe:null;
function supportedSegment(a,b,grid){
 if(!grid||grid.inspect(a).classification!=='WATER'||grid.inspect(b).classification!=='WATER')return false;
 const line=Geodesic.WGS84.InverseLine(a.lat,a.lon,b.lat,b.lon);
 const step=grid.resolution*111000*Math.max(.05,Math.cos(Math.max(Math.abs(a.lat),Math.abs(b.lat))*Math.PI/180))/8;
 const count=Math.max(1,Math.ceil(line.s13/step));if(count>100000)return false;
 let previous=a;
 for(let i=1;i<=count;i++){
  const point=i===count?b:line.Position(line.s13*i/count),current=i===count?b:{lat:point.lat2,lon:point.lon2};
  let lon=current.lon;while(lon-previous.lon>180)lon-=360;while(lon-previous.lon< -180)lon+=360;
  // Conservative supercover: include the whole sample-interval bounding box,
  // plus a small margin. This may reject a valid coast-hugging shortcut; it
  // never licenses diagonal corner cutting merely because samples are water.
  const epsilon=1e-5,{west,south}=grid.extent,r=grid.resolution;
  const x0=Math.floor((Math.min(previous.lon,lon)-west-epsilon)/r),x1=Math.floor((Math.max(previous.lon,lon)-west+epsilon)/r);
  const y0=Math.floor((Math.min(previous.lat,current.lat)-south-epsilon)/r),y1=Math.floor((Math.max(previous.lat,current.lat)-south+epsilon)/r);
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
   let longitude=west+(x+.5)*r;while(longitude>180)longitude-=360;while(longitude< -180)longitude+=360;
   if(grid.inspect({lat:south+(y+.5)*r,lon:longitude}).classification!=='WATER')return false;
  }
  previous=current;
 }
 return true;
}
function simplify(points,grid){
 if(points.length<3)return points;
 // Resolve direction-dependent greedy choices in one canonical orientation.
 // Reversing an itinerary must reverse the same course, not select new bends.
 const first=points[0],last=points.at(-1);
 if(first.lon>last.lon||first.lon===last.lon&&first.lat>last.lat)return simplify([...points].reverse(),grid).reverse();
 const result=[points[0]];let i=0;
 while(i<points.length-1){
  let accepted=i+1;
  // Try the actual end first: exponential strides can retain needless bends
  // when a short candidate touches a coast cell but the whole geodesic is clear.
  if(supportedSegment(points[i],points.at(-1),grid)){result.push(points.at(-1));break;}
  // Exponential look-ahead bounds work on long raster paths. A failed test
  // retains existing edges, rather than turning an unsupported shortcut valid.
  for(let stride=2;stride<=points.length*2;stride*=2){
   const next=Math.min(points.length-1,i+stride);
   if(!supportedSegment(points[i],points[next],grid))break;
   accepted=next;if(next===points.length-1)break;
  }
  result.push(points[accepted]);i=accepted;
 }
 return result;
}
function simplifyLeg(result){
 const e=result.evidence;
 if(e.grid==='source-waterway-network'||e.grid?.startsWith('water-area-'))return result;
 if(e.grid==='hybrid-waterway-ocean'){
  const [a,m,b]=e.sections,rawPoints=m.points;
  const points=simplify(rawPoints,gridById(m.grid));
  return {...result,points:[...a.points,...points.slice(1),...[...b.points].reverse().slice(1)],evidence:{...e,sections:[a,{...m,points,rawPoints,segmentValidation:'CONSERVATIVE_GEODESIC_GRID_SUPERCOVER'},b]}};
 }
 const rawPoints=result.points,points=simplify(rawPoints,gridById(e.grid));
 return {...result,points,evidence:{...e,rawPoints,segmentValidation:'CONSERVATIVE_GEODESIC_GRID_SUPERCOVER',rawVertexCount:rawPoints.length,courseVertexCount:points.length}};
}
module.exports={supportedSegment,simplify,simplifyLeg,gridById};
