'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {distanceNM,estimateNM}=require('./navigation.cjs'),water=require('./water-route.cjs'),{bundled}=require('./waterway-network.cjs'),{supportedSegment,simplifyLeg}=require('./course-geometry.cjs');
const originalManifest=require('../assets/water-areas/manifest.json'),manifest=structuredClone(originalManifest);
let configured='',runtimeNetwork;
function sourceNetwork(){return runtimeNetwork||bundled('refinement');}
function configure(directories=[]){const key=JSON.stringify(directories);if(key===configured)return;const next=structuredClone(originalManifest.regions);const hashes=[originalManifest.sha256],lines=new Map(require('./waterway-network.cjs').document('refinement').lines.map(l=>[l.id,l]));for(const directory of directories){require('./geographic-preparation.cjs').verify(directory);const data=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'));hashes.push(data.sha256);const extra=JSON.parse(fs.readFileSync(path.join(directory,'waterways.json'),'utf8'));for(const line of extra.lines){const old=lines.get(line.id);if(old&&JSON.stringify(old.coordinates)!==JSON.stringify(line.coordinates))throw Error('Conflicting source waterway versions: '+line.id);lines.set(line.id,line);}for(const r of data.regions){if(next.some(a=>a.id===r.id))throw Error('Conflicting geographic tile versions');next.push({...r,runtimeDirectory:directory});}}const doc={...require('./waterway-network.cjs').document('refinement'),lines:[...lines.values()]};doc.sha256=crypto.createHash('sha256').update(JSON.stringify(doc.lines)).digest('hex');runtimeNetwork=directories.length?new (require('./waterway-network.cjs').WaterwayNetwork)(doc):undefined;manifest.regions=next;configured=key;manifest.sha256=directories.length?crypto.createHash('sha256').update(JSON.stringify(hashes)).digest('hex'):originalManifest.sha256;cached=undefined;graph=undefined;}
const near=(a,b)=>a&&b&&distanceNM(a,b)<1e-7;
class Area {
 constructor(record,bytes){this.record=record;this.id=record.id;this.resolution=record.resolutionDegrees;this.extent=record.extent;this.dimensions=record.dimensions;this.mask=bytes;const [w,h]=this.dimensions;if(bytes.length!==w*h)throw Error('Water-area mask dimensions mismatch');}
 cell(p){const center=(this.extent.west+this.extent.east)/2,lon=p.lon+360*Math.round((center-p.lon)/360);const [w,h]=this.dimensions,x=Math.floor((lon-this.extent.west)/this.resolution),y=Math.floor((p.lat-this.extent.south)/this.resolution);return x>=0&&x<w&&y>=0&&y<h?y*w+x:-1;}
 point(id){const [w]=this.dimensions;let lon=this.extent.west+(id%w+.5)*this.resolution;while(lon>180)lon-=360;while(lon< -180)lon+=360;return {lat:this.extent.south+(Math.floor(id/w)+.5)*this.resolution,lon};}
 inspect(p){const cell=this.cell(p);return {cell,classification:cell<0?'OUTSIDE':this.mask[cell]?'BLOCKED':'WATER'};}
 neighbors(id){const [w,h]=this.dimensions,x=id%w,y=Math.floor(id/w),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(!dx&&!dy||nx<0||nx>=w||ny<0||ny>=h)continue;const next=ny*w+nx;if(this.mask[next]||dx&&dy&&(this.mask[y*w+nx]||this.mask[ny*w+x]))continue;out.push(next);}return out;}
 components(){if(this.labels)return;this.labels=new Int32Array(this.mask.length);let label=0;for(let i=0;i<this.mask.length;i++){if(this.mask[i]||this.labels[i])continue;this.labels[i]=++label;const queue=[i];for(let j=0;j<queue.length;j++)for(const n of this.neighbors(queue[j]))if(!this.labels[n]){this.labels[n]=label;queue.push(n);}}}
 candidates(p,explicit=false){
  const own=this.cell(p);if(own>=0&&!this.mask[own])return [{cell:own,access:{lat:p.lat,lon:p.lon},connectorNM:0}];if(explicit)return [];
  const [w,h]=this.dimensions,r=this.resolution,cx=Math.floor((p.lon-this.extent.west)/r),cy=Math.floor((p.lat-this.extent.south)/r),dy=Math.ceil(3/(60*r)),dx=Math.ceil(dy/Math.max(.05,Math.cos(p.lat*Math.PI/180)));
  if(cx+dx<0||cx-dx>=w||cy+dy<0||cy-dy>=h)return [];this.components();const best=new Map();
  for(let y=Math.max(0,cy-dy);y<=Math.min(h-1,cy+dy);y++)for(let x=Math.max(0,cx-dx);x<=Math.min(w-1,cx+dx);x++){const cell=y*w+x;if(this.mask[cell])continue;const access=this.point(cell),d=distanceNM(p,access),key=this.labels[cell];if(d<=3&&(!best.has(key)||best.get(key).connectorNM>d))best.set(key,{cell,access,connectorNM:d});}return [...best.values()];
 }
}
function exclusionClear(a,b,regions=areas()){
 return regions.every(region=>{
  const e=region.extent;const reach=distanceNM(a,b)/59;/* A conservative latitude bound also covers geodesic bowing and dateline edges. */if(a.lat+reach<e.south||a.lat-reach>e.north)return true;
  return supportedSegment(a,b,{resolution:region.resolution,extent:e,inspect:p=>{const c=region.cell(p);return {classification:c>=0&&region.excluded?.[c]?'BLOCKED':'WATER'};}});
 });
}
let cached;
function areas(){if(!cached)cached=manifest.regions.map(record=>{const bytes=zlib.gunzipSync(fs.readFileSync(path.join(record.runtimeDirectory||path.join(__dirname,'../assets/water-areas'),record.id+'.bin.gz')));if(crypto.createHash('sha256').update(bytes).digest('hex')!==record.maskSHA256)throw Error('Water-area mask integrity failure');const a=new Area(record,bytes);a.excluded=zlib.gunzipSync(fs.readFileSync(path.join(record.runtimeDirectory||path.join(__dirname,'../assets/water-areas'),record.id+'-exclusions.bin.gz')));if(crypto.createHash('sha256').update(a.excluded).digest('hex')!==record.exclusionSHA256)throw Error('Water-area exclusion integrity failure');return a;});return cached;}
class Heap{constructor(){this.q=[];}push(id,cost){let i=this.q.length;this.q.push({id,cost});while(i){const p=(i-1)>>1;if(this.q[p].cost<=cost)break;this.q[i]=this.q[p];i=p;}this.q[i]={id,cost};}pop(){const first=this.q[0],last=this.q.pop();if(this.q.length){let i=0;while(i*2+1<this.q.length){let j=i*2+1;if(j+1<this.q.length&&this.q[j+1].cost<this.q[j].cost)j++;if(this.q[j].cost>=last.cost)break;this.q[i]=this.q[j];i=j;}this.q[i]=last;}return first;}}
let graph;
function getGraph(){
 if(graph)return graph;const net=sourceNetwork(),regions=areas();let offset=net.nodes.length;
 for(const a of regions){a.offset=offset;offset+=a.mask.length;a.sourceNodes=new Map();const {west,east,south,north}=a.extent;
  for(let x=Math.floor(west);x<=Math.floor(east);x++)for(let y=Math.floor(south);y<=Math.floor(north);y++)for(const id of net.buckets.get(((x+180)%360+360)%360-180+','+y)||[]){const p=net.nodes[id],cell=a.cell(p);if(cell>=0&&!a.mask[cell]&&supportedSegment(p,a.point(cell),a)){if(!a.sourceNodes.has(cell))a.sourceNodes.set(cell,[]);a.sourceNodes.get(cell).push(id);}}
 }
 const region=id=>regions.find(a=>id>=a.offset&&id<a.offset+a.mask.length);
 const point=id=>id<net.nodes.length?{lat:net.nodes[id].lat,lon:net.nodes[id].lon}:region(id).point(id-region(id).offset);
 function neighbors(id){
  if(id<net.nodes.length){const p=net.nodes[id],out=p.edges.filter(e=>exclusionClear(p,net.nodes[e.to])).map(e=>({to:e.to,proof:{kind:'SOURCE',sourceId:e.sourceId}}));for(const a of regions){const cell=a.cell(p);if(cell>=0&&a.sourceNodes.get(cell)?.includes(id))out.push({to:a.offset+cell,proof:{kind:'AREA',area:a.id}});}return out;}
  const a=region(id),cell=id-a.offset;const cross=[];const p=a.point(cell);for(const b of regions){if(b===a)continue;const target=b.cell(p);if(target>=0&&!b.mask[target]){const q=b.point(target);if(supportedSegment(p,q,a)&&supportedSegment(p,q,b))cross.push({to:b.offset+target,proof:{kind:'AREAS',areas:[a.id,b.id]}});}}return [...cross,...a.neighbors(cell).map(c=>({to:a.offset+c,proof:{kind:'AREA',area:a.id}})),...(a.sourceNodes.get(cell)||[]).map(to=>({to,proof:{kind:'AREA',area:a.id}}))];
 }
 function attachments(w){const p=w.access||w,items=net.candidates(p,w.access ? .01 : 3).map(c=>({id:c.id,access:c.point,connectorNM:c.distance}));for(const a of regions)for(const c of a.candidates(p,!!w.access))if(supportedSegment(c.access,a.point(c.cell),a))items.push({...c,id:a.offset+c.cell,area:a.id});return items;}
 graph={net,regions,point,neighbors,attachments};return graph;
}
function search(a,b,grid){
 const g=getGraph(),starts=g.attachments(a),ends=b?g.attachments(b):[],targets=new Map(ends.map(c=>[c.id,c]));if(!starts.length||b&&!ends.length)return null;
 const cost=new Map(),parents=new Map(),origins=new Map(),done=new Set(),heap=new Heap();const heuristic=id=>b?Math.max(0,estimateNM(g.point(id),b.access||b)-3):0;
 for(const c of starts)if(!cost.has(c.id)||c.connectorNM<cost.get(c.id)){cost.set(c.id,c.connectorNM);origins.set(c.id,c);heap.push(c.id,c.connectorNM+heuristic(c.id));}
 while(heap.q.length){const {id}=heap.pop();if(done.has(id))continue;done.add(id);if(done.size>250000)throw Error('WATER_AREA_SEARCH_LIMIT: supported topology search budget exhausted');
  if(targets.has(id)||!b&&grid.inspect(g.point(id)).classification==='WATER'){
   const ids=[id],proof=[];let at=id;while(parents.has(at)){const p=parents.get(at);proof.unshift(p.proof);at=p.id;ids.unshift(at);}const start=origins.get(at),end=targets.get(id),points=ids.map(g.point);
   if(!near(start.access,points[0])){points.unshift(start.access);proof.unshift({kind:'AREA',area:start.area});}
   const accessEnd=end?.access||points.at(-1);if(!near(accessEnd,points.at(-1))){points.push(accessEnd);proof.push({kind:'AREA',area:end.area});}
   if(points.length<2&&b&&distanceNM(a,b)>.001)return null;
   return {points,accesses:[start.access,accessEnd],evidence:{grid:'water-area-topology',waypointIds:[a.id,b?.id],anchors:[{lat:a.lat,lon:a.lon},b?{lat:b.lat,lon:b.lon}:accessEnd],source:'https://www.openstreetmap.org/copyright',sourceChecksum:g.net.doc.sha256,areaChecksum:manifest.sha256,edgeEvidence:proof,visitedCells:done.size,termination:'CONNECTED_SOURCE_AND_WATER_AREA',automaticConnectorLimitNM:3,sourceAccessEvidence:[...new Set(proof.filter(p=>p.kind==='SOURCE').map(p=>p.sourceId))].map(id=>({id,source:g.net.lines.get(id).source,tags:g.net.lines.get(id).tags||{}}))}};
  }
  for(const edge of g.neighbors(id)){if(done.has(edge.to))continue;const next=cost.get(id)+estimateNM(g.point(id),g.point(edge.to));if(next<(cost.get(edge.to)??Infinity)){cost.set(edge.to,next);parents.set(edge.to,{id,proof:edge.proof});heap.push(edge.to,next+heuristic(edge.to));}}
 }
 return null;
}
function valid(result){
 const e=result?.evidence,p=result?.points;if(!e||!p?.length||!p.every(q=>Number.isFinite(q.lat)&&Number.isFinite(q.lon)&&Math.abs(q.lat)<=90&&Math.abs(q.lon)<=180))return false;
 if(e.grid==='water-area-ocean'){
  const [a,m,b]=e.sections||[];if(e.areaChecksum!==manifest.sha256||!a||!m||!b||!['world-0.1','europe-0.025'].includes(m.evidence?.grid)||!valid(a)||!valid(b)||!near(a.points.at(-1),m.points[0])||!near(m.points.at(-1),b.points.at(-1)))return false;
  const grid=m.evidence.grid==='europe-0.025'?water.europe:water.world;if(!m.points.every(q=>grid.inspect(q).classification==='WATER')||!m.points.slice(1).every((q,i)=>supportedSegment(m.points[i],q,grid)&&exclusionClear(m.points[i],q)))return false;
  const assembled=[...a.points,...m.points.slice(1),...[...b.points].reverse().slice(1)];return assembled.length===p.length&&assembled.every((q,i)=>near(q,p[i]));
 }
 if(e.grid!=='water-area-topology'||e.areaChecksum!==manifest.sha256||e.sourceChecksum!==sourceNetwork().doc.sha256||e.edgeEvidence?.length!==p.length-1)return false;
 return e.edgeEvidence.every((edge,i)=>{
  if(edge.kind==='AREAS')return edge.areas?.length===2&&edge.areas.every(id=>{const a=areas().find(a=>a.id===id);return a&&supportedSegment(p[i],p[i+1],a);});
  if(edge.kind==='AREA'){const a=areas().find(a=>a.id===edge.area);return a&&supportedSegment(p[i],p[i+1],a);}
  if(edge.kind==='SOURCE'){const n=sourceNetwork(),u=n.index.get([p[i].lon,p[i].lat].join(',')),v=n.index.get([p[i+1].lon,p[i+1].lat].join(','));return u!==undefined&&v!==undefined&&exclusionClear(p[i],p[i+1])&&n.nodes[u].edges.some(e=>e.to===v&&e.sourceId===edge.sourceId);}
  return false;
 });
}
function leg(a,b,options={}){
 // Use one orientation for graph tie-breaking and reverse only the final evidence.
 if(a.lon>b.lon||a.lon===b.lon&&a.lat>b.lat){const r=leg(b,a,options);r.points.reverse();r.accesses.reverse();const e=r.evidence;if(e.edgeEvidence)e.edgeEvidence.reverse();if(e.sections){const [u,m,v]=e.sections;m.points.reverse();if(m.accesses)m.accesses.reverse();for(const key of ['rawPoints','anchors','waypointIds','accessCandidates'])if(Array.isArray(m.evidence[key]))m.evidence[key].reverse();e.sections=[v,m,u];}e.anchors=[{lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon}];e.waypointIds=[a.id,b.id];return r;}
 let direct;try{direct=search(a,b);}catch(error){if(!error.message.startsWith('WATER_AREA_SEARCH_LIMIT'))throw error;}if(direct&&valid(direct))return direct;
 const selected=water.selectNetwork(a.access||a,b.access||b),grid=selected.network;
 function endpoint(w){const result=search(w,null,grid);if(result&&valid(result))return result;
  const access=water.automaticAccess(w,grid);if(grid.inspect(access).classification!=='WATER'||!w.access&&distanceNM(w,access)>15)throw Error('WATER_AREA_ACCESS_UNRESOLVED');
  return {points:[{lat:access.lat,lon:access.lon}],accesses:[access,access],evidence:{grid:'water-area-topology',sourceChecksum:sourceNetwork().doc.sha256,areaChecksum:manifest.sha256,edgeEvidence:[]}};
 }
 const from=endpoint(a),to=endpoint(b),middle=simplifyLeg(water.leg({...a,access:from.points.at(-1)},{...b,access:to.points.at(-1)},options));
 const result={points:[...from.points,...middle.points.slice(1),...[...to.points].reverse().slice(1)],accesses:[from.accesses[0],to.accesses[0]],evidence:{grid:'water-area-ocean',anchors:[{lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon}],waypointIds:[a.id,b.id],sections:[from,middle,to],areaChecksum:manifest.sha256,sourceAccessEvidence:[...(from.evidence.sourceAccessEvidence||[]),...(to.evidence.sourceAccessEvidence||[])],termination:'VERIFIED_WATER_AREA_OCEAN_OVERLAP'}};
 if(!valid(result))throw Error('WATER_AREA_TRANSITION_UNRESOLVED');return result;
}
module.exports={Area,areas,leg,valid,manifest,exclusionClear,configure};
