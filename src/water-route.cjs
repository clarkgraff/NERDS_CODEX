// Coarse ocean research routing, not hydrographic or navigational clearance data.
const fs=require('node:fs');
const path=require('node:path');
const {distanceNM}=require('./navigation.cjs');
function engine(W,H,STEP,west,south,file,wrap){
let mask;
function grid(){return mask||(mask=fs.readFileSync(path.join(__dirname,'../assets/'+file)));}
const point=id=>({lon:west+(id%W+.5)*STEP,lat:south+(Math.floor(id/W)+.5)*STEP});
function cell(p){const rawX=Math.floor((p.lon-west)/STEP),x=wrap?(rawX%W+W)%W:Math.min(W-1,Math.max(0,rawX)),y=Math.min(H-1,Math.max(0,Math.floor((p.lat-south)/STEP)));return y*W+x;}
function suggest(p,accept=()=>true){const base=cell(p),bx=base%W,by=Math.floor(base/W);let best=null,bestD=Infinity;
 for(let dy=-Math.ceil(2/STEP);dy<=Math.ceil(2/STEP);dy++)for(let dx=-Math.ceil(3/STEP);dx<=Math.ceil(3/STEP);dx++){const y=by+dy;if(y<10||y>=H-10)continue;if(!wrap&&(bx+dx<0||bx+dx>=W))continue;const id=y*W+(bx+dx+W)%W;if(grid()[id])continue;const q=point(id),d=distanceNM(p,q);if(d<bestD&&accept(q)){bestD=d;best=q;}}
 if(!best)throw Error('No offshore connector could be resolved in this dataset.');
 return {...best,name:'Unverified offshore candidate',source:'Natural Earth 1:10 million land mask; NOT a harbour or vessel-suitability assessment',depth:null,airClearance:null,maxLOA:null,maxBeam:null};
}
class Heap {constructor(){this.a=[];}push(id,f){const a=this.a;let i=a.length;a.push({id,f});while(i){const p=(i-1)>>1;if(a[p].f<=f)break;a[i]=a[p];i=p;}a[i]={id,f};}pop(){const a=this.a,r=a[0],v=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let j=i*2+1;if(j+1<a.length&&a[j+1].f<a[j].f)j++;if(a[j].f>=v.f)break;a[i]=a[j];i=j;}a[i]=v;}return r;}get length(){return this.a.length;}}
let clearance;
function coastDistances(){if(clearance)return clearance;const m=grid();clearance=new Uint16Array(m.length);for(let i=0;i<m.length;i++)clearance[i]=m[i]?0:60000;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(x)clearance[i]=Math.min(clearance[i],clearance[i-1]+1);if(y)clearance[i]=Math.min(clearance[i],clearance[i-W]+1);}for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;if(x<W-1)clearance[i]=Math.min(clearance[i],clearance[i+1]+1);if(y<H-1)clearance[i]=Math.min(clearance[i],clearance[i+W]+1);}return clearance;}
function route(a,b,options={}){
 const start=cell(a),end=cell(b),blocked=grid();const trace=options.trace||{};trace.visitedCells=0;trace.searchBounds={minX:start%W,maxX:start%W,minY:Math.floor(start/W),maxY:Math.floor(start/W)};
 if(blocked[start]||blocked[end])throw Error('A water-access point lies in a blocked coastal grid cell. Choose offshore water access; narrow harbours, rivers and canals are not resolved.');
 const scores=new Float64Array(W*H);scores.fill(Infinity);const parents=new Int32Array(W*H);parents.fill(-1);const closed=new Uint8Array(W*H),heap=new Heap();scores[start]=0;heap.push(start,distanceNM(point(start),point(end)));let visited=0;
 while(heap.length){const {id}=heap.pop();if(closed[id])continue;closed[id]=1;
  trace.visitedCells++;const bounds=trace.searchBounds;bounds.minX=Math.min(bounds.minX,id%W);bounds.maxX=Math.max(bounds.maxX,id%W);bounds.minY=Math.min(bounds.minY,Math.floor(id/W));bounds.maxY=Math.max(bounds.maxY,Math.floor(id/W));
  if(id===end){const ids=[];for(let at=end;at!==-1;at=parents[at])ids.push(at);ids.reverse();return [a,...ids.map(point),b];}
  if(++visited>(options.maxVisited??1200000))throw Error('Research route search is too large or disconnected. Add intermediate offshore waypoints.');
  const x=id%W,y=Math.floor(id/W),p=point(id);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const ny=y+dy;if(ny<10||ny>=H-10)continue;if(!wrap&&(x+dx<0||x+dx>=W))continue;const nx=(x+dx+W)%W,nid=ny*W+nx;if(blocked[nid]||closed[nid])continue;
   if(dx&&dy&&(blocked[y*W+nx]||blocked[ny*W+x]))continue;
   const q=point(nid),near=options.separationNM?coastDistances()[nid]*STEP*60*Math.max(.05,Math.cos(q.lat*Math.PI/180)):0,penalty=options.separationNM?1+2*Math.max(0,1-near/options.separationNM):1,g=scores[id]+distanceNM(p,q)*penalty;if(g<scores[nid]){scores[nid]=g;parents[nid]=id;heap.push(nid,g+distanceNM(q,point(end)));}
  }
 }
 throw Error('No connected coarse water path was found. Narrow channels and canals may be absent.');
}
// Component labels use exactly the search's eight-neighbour/no-corner-cut topology.
let labels,sizes;
function components(){if(labels)return;const m=grid();labels=new Int32Array(W*H);sizes=[0];const queue=new Int32Array(W*H);let component=0;
 for(let seed=10*W;seed<(H-10)*W;seed++){if(m[seed]||labels[seed])continue;component++;let head=0,tail=1;queue[0]=seed;labels[seed]=component;
 while(head<tail){const id=queue[head++],x=id%W,y=Math.floor(id/W);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const ny=y+dy;if(ny<10||ny>=H-10||(!wrap&&(x+dx<0||x+dx>=W)))continue;const nx=(x+dx+W)%W,nid=ny*W+nx;if(m[nid]||labels[nid]||dx&&dy&&(m[y*W+nx]||m[ny*W+x]))continue;labels[nid]=component;queue[tail++]=nid;}}
 sizes[component]=tail;}}
function contains(p){return Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&p.lat>=south+10*STEP&&p.lat<south+(H-10)*STEP&&p.lon>=west&&(p.lon<west+W*STEP||wrap&&p.lon===west+W*STEP);}
function inspect(p){if(!contains(p))return {classification:'OUTSIDE',cell:null,component:null};const id=cell(p);if(grid()[id])return {classification:'BLOCKED',cell:id,component:null};components();return {classification:'WATER',cell:id,component:labels[id],componentCells:sizes[labels[id]]};}
return {route,suggest,cell,point,inspect,contains,resolution:STEP,dimensions:[W,H],extent:{west,south,east:west+W*STEP,north:south+H*STEP}};
}
const world=engine(3600,1800,.1,-180,-90,'land-mask.bin',true);
const europe=engine(2400,1200,.025,-20,40,'europe-mask.bin',false);
const inside=p=>p.lon>-19&&p.lon<39&&p.lat>41&&p.lat<69;
const MAX_AUTOMATIC_CONNECTOR_NM=15;
const sharedAccessCache=new Map();
function automaticAccess(w,n){
 if(w.access)return w.access;
 // A common fine-grid water point can anchor either leg grid. Do not widen the
 // existing 15 NM local guard or accept a point blocked in either mask.
 if(inside(w)){
  const key=w.lat+','+w.lon;
  if(!sharedAccessCache.has(key)){
   let point=null;
   if(europe.inspect(w).classification==='WATER'&&world.inspect(w).classification==='WATER')point={lat:w.lat,lon:w.lon};
   else try{const candidate=europe.suggest(w,p=>world.inspect(p).classification==='WATER');if(distanceNM(w,candidate)<=MAX_AUTOMATIC_CONNECTOR_NM)point=candidate;}catch{}
   sharedAccessCache.set(key,point);
  }
  if(sharedAccessCache.get(key))return sharedAccessCache.get(key);
 }
 return n.inspect(w).classification==='WATER'?{lat:w.lat,lon:w.lon}:n.suggest(w);
}
function selectNetwork(a,b){return inside(a)&&inside(b)?{id:'europe-0.025',network:europe}:{id:'world-0.1',network:world};}
function leg(a,b,options={}){
 const start=performance.now(),selected=selectNetwork(a.access||a,b.access||b),n=selected.network,connectorLimitNM=Math.max(MAX_AUTOMATIC_CONNECTOR_NM,4*n.resolution*60);
 const evidence={waypointIds:[a.id,b.id],anchors:[{lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon}],grid:selected.id,resolutionDegrees:n.resolution,gridExtent:n.extent,accessCandidates:[],accessSearchBounds:{latitudeRadiusDegrees:2,longitudeRadiusDegrees:3,globalFallback:false},visitedCells:0,searchBounds:null,optionalPreferences:options.bypass===false?'ENABLED':'BYPASS',effectiveSeparationNM:options.bypass===false?(options.separationNM||0):0,automaticConnectorLimitNM:connectorLimitNM};
 try{
  const endpoints=[a,b].map(w=>{const source=w.access||w,classification=n.inspect(source);let candidate;
   try{candidate=automaticAccess(w,n);}catch(e){evidence.accessCandidates.push({waypointId:w.id,source:{lat:source.lat,lon:source.lon},sourceCell:classification,error:e.message});return {error:e.message};}
   const access=n.inspect(candidate),distance=distanceNM(w,candidate);evidence.accessCandidates.push({waypointId:w.id,source:{lat:source.lat,lon:source.lon},sourceCell:classification,candidate,cell:access,distanceNM:distance,explicit:!!w.access});return {candidate,access,distance,explicit:!!w.access};});
  if(endpoints.some(p=>p.error))throw Error('ACCESS_UNRESOLVED: '+endpoints.filter(p=>p.error).map(p=>p.error).join(' / '));
  if(endpoints.some(p=>p.access.classification!=='WATER'))throw Error('ACCESS_NOT_WATER: explicit access is outside or blocked in the selected leg grid.');
  if(endpoints.some(p=>!p.explicit&&p.distance>connectorLimitNM))throw Error('ACCESS_TOO_DISTANT: no local water connection within the grid-scaled diagnostic guard; waterway/harbour geometry is missing.');
  if(endpoints[0].access.component!==endpoints[1].access.component)throw Error('DISCONNECTED_COMPONENTS: selected access cells are not connected on this grid.');
  if(endpoints[0].access.cell===endpoints[1].access.cell&&distanceNM(a,b)>.001&&(endpoints[0].distance>.001||endpoints[1].distance>.001))throw Error('COLLAPSED_ACCESS: distinct anchors resolve to one cell; zero passage distance would be misleading.');
  const [from,to]=endpoints.map(e=>e.candidate);let points;
  if(endpoints[0].access.cell===endpoints[1].access.cell){points=[from,to];evidence.searchBounds={startCell:endpoints[0].access.cell,endCell:endpoints[1].access.cell};}
  else points=n.route(from,to,{separationNM:evidence.effectiveSeparationNM,trace:evidence,maxVisited:options.maxVisited});
  evidence.termination='PATH_FOUND';evidence.elapsedMs=performance.now()-start;
  return {points:points.map(p=>({lat:p.lat,lon:p.lon})),accesses:endpoints.map(e=>e.candidate),evidence};
 }catch(error){evidence.termination=error.message;evidence.elapsedMs=performance.now()-start;error.evidence=evidence;throw error;}
}
module.exports={automaticAccess,route:(a,b,options)=>selectNetwork(a,b).network.route(a,b,options),suggest:p=>(inside(p)?europe:world).suggest(p),cell:world.cell,point:world.point,europe,world,selectNetwork,leg,MAX_AUTOMATIC_CONNECTOR_NM};
