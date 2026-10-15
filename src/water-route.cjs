// Coarse ocean research routing, not hydrographic or navigational clearance data.
const fs=require('node:fs');
const path=require('node:path');
const {distanceNM}=require('./navigation.cjs');
function engine(W,H,STEP,west,south,file,wrap){
let mask;
function grid(){return mask||(mask=fs.readFileSync(path.join(__dirname,'../assets/'+file)));}
const point=id=>({lon:west+(id%W+.5)*STEP,lat:south+(Math.floor(id/W)+.5)*STEP});
function cell(p){const x=Math.min(W-1,Math.max(0,Math.floor((p.lon-west)/STEP))),y=Math.min(H-1,Math.max(0,Math.floor((p.lat-south)/STEP)));return y*W+x;}
function suggest(p){const base=cell(p),bx=base%W,by=Math.floor(base/W);let best=null,bestD=Infinity;
 for(let dy=-Math.ceil(2/STEP);dy<=Math.ceil(2/STEP);dy++)for(let dx=-Math.ceil(3/STEP);dx<=Math.ceil(3/STEP);dx++){const y=by+dy;if(y<10||y>=H-10)continue;if(!wrap&&(bx+dx<0||bx+dx>=W))continue;const id=y*W+(bx+dx+W)%W;if(grid()[id])continue;const q=point(id),d=distanceNM(p,q);if(d<bestD){bestD=d;best=q;}}
 if(!best){for(let id=0;id<W*H;id++){if(grid()[id])continue;const q=point(id),d=distanceNM(p,q);if(d<bestD){bestD=d;best=q;}}}if(!best)throw Error('No offshore connector could be resolved in this dataset.');
 return {...best,name:'Unverified offshore candidate',source:'Natural Earth 1:10 million land mask; NOT a harbour or vessel-suitability assessment',depth:null,airClearance:null,maxLOA:null,maxBeam:null};
}
class Heap {constructor(){this.a=[];}push(id,f){const a=this.a;let i=a.length;a.push({id,f});while(i){const p=(i-1)>>1;if(a[p].f<=f)break;a[i]=a[p];i=p;}a[i]={id,f};}pop(){const a=this.a,r=a[0],v=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let j=i*2+1;if(j+1<a.length&&a[j+1].f<a[j].f)j++;if(a[j].f>=v.f)break;a[i]=a[j];i=j;}a[i]=v;}return r;}get length(){return this.a.length;}}
let clearance;
function coastDistances(){if(clearance)return clearance;const m=grid();clearance=new Uint16Array(m.length);for(let i=0;i<m.length;i++)clearance[i]=m[i]?0:60000;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(x)clearance[i]=Math.min(clearance[i],clearance[i-1]+1);if(y)clearance[i]=Math.min(clearance[i],clearance[i-W]+1);}for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;if(x<W-1)clearance[i]=Math.min(clearance[i],clearance[i+1]+1);if(y<H-1)clearance[i]=Math.min(clearance[i],clearance[i+W]+1);}return clearance;}
function route(a,b,options={}){
 const start=cell(a),end=cell(b),blocked=grid();
 if(blocked[start]||blocked[end])throw Error('A water-access point lies in a blocked coastal grid cell. Choose offshore water access; narrow harbours, rivers and canals are not resolved.');
 const scores=new Float64Array(W*H);scores.fill(Infinity);const parents=new Int32Array(W*H);parents.fill(-1);const closed=new Uint8Array(W*H),heap=new Heap();scores[start]=0;heap.push(start,distanceNM(point(start),point(end)));let visited=0;
 while(heap.length){const {id}=heap.pop();if(closed[id])continue;closed[id]=1;
  if(id===end){const ids=[];for(let at=end;at!==-1;at=parents[at])ids.push(at);ids.reverse();return [a,...ids.map(point),b];}
  if(++visited>1200000)throw Error('Research route search is too large or disconnected. Add intermediate offshore waypoints.');
  const x=id%W,y=Math.floor(id/W),p=point(id);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const ny=y+dy;if(ny<10||ny>=H-10)continue;if(!wrap&&(x+dx<0||x+dx>=W))continue;const nx=(x+dx+W)%W,nid=ny*W+nx;if(blocked[nid]||closed[nid])continue;
   if(dx&&dy&&(blocked[y*W+nx]||blocked[ny*W+x]))continue;
   const q=point(nid),near=options.separationNM?coastDistances()[nid]*STEP*60*Math.max(.05,Math.cos(q.lat*Math.PI/180)):0,penalty=options.separationNM?1+2*Math.max(0,1-near/options.separationNM):1,g=scores[id]+distanceNM(p,q)*penalty;if(g<scores[nid]){scores[nid]=g;parents[nid]=id;heap.push(nid,g+distanceNM(q,point(end)));}
  }
 }
 throw Error('No connected coarse water path was found. Narrow channels and canals may be absent.');
}
return {route,suggest,cell,point};
}
const world=engine(3600,1800,.1,-180,-90,'land-mask.bin',true);
const europe=engine(2400,1200,.025,-20,40,'europe-mask.bin',false);
const inside=p=>p.lon>-19&&p.lon<39&&p.lat>41&&p.lat<69;
module.exports={route:(a,b,options)=>(inside(a)&&inside(b)?europe:world).route(a,b,options),suggest:p=>(inside(p)?europe:world).suggest(p),cell:world.cell,point:world.point,europe};
