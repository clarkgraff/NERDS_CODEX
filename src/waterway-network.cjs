'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {distanceNM,estimateNM}=require('./navigation.cjs');
// No tolerance snapping: only identical source vertices share graph connectivity.
// Nearby but disconnected lines remain disconnected until source evidence connects them.
class WaterwayNetwork {
 constructor(doc){
  this.doc=doc;this.lines=new Map(doc.lines.map(l=>[l.id,l]));this.nodes=[];this.index=new Map();this.buckets=new Map();
  const vertex=coordinate=>{const key=coordinate.slice(0,2).join(',');if(this.index.has(key))return this.index.get(key);const id=this.nodes.length,p={lon:coordinate[0],lat:coordinate[1],edges:[]};this.index.set(key,id);this.nodes.push(p);const bucket=`${Math.floor(p.lon)},${Math.floor(p.lat)}`;if(!this.buckets.has(bucket))this.buckets.set(bucket,[]);this.buckets.get(bucket).push(id);return id;};
  for(const line of doc.lines){for(let i=1;i<line.coordinates.length;i++){const a=vertex(line.coordinates[i-1]),b=vertex(line.coordinates[i]);if(a===b)continue;const distance=estimateNM(this.nodes[a],this.nodes[b]);this.nodes[a].edges.push({to:b,distance,sourceId:line.id,name:line.name});this.nodes[b].edges.push({to:a,distance,sourceId:line.id,name:line.name});}}
 }
 candidates(p,limit=3){
  if(!this.components){this.components=new Int32Array(this.nodes.length);let label=0;for(let i=0;i<this.nodes.length;i++){if(this.components[i])continue;label++;const stack=[i];this.components[i]=label;while(stack.length){const id=stack.pop();for(const edge of this.nodes[id].edges)if(!this.components[edge.to]){this.components[edge.to]=label;stack.push(edge.to);}}}}
  const best=new Map(),radius=Math.ceil(limit/(60*Math.max(.05,Math.cos(p.lat*Math.PI/180))));for(let x=Math.floor(p.lon)-radius;x<=Math.floor(p.lon)+radius;x++)for(let y=Math.floor(p.lat)-1;y<=Math.floor(p.lat)+1;y++)for(const id of this.buckets.get(`${x},${y}`)||[]){const distance=distanceNM(p,this.nodes[id]),component=this.components[id];if(distance<=limit&&(!best.has(component)||distance<best.get(component).distance))best.set(component,{id,component,distance,point:{lat:this.nodes[id].lat,lon:this.nodes[id].lon}});}return [...best.values()].sort((a,b)=>a.distance-b.distance);
 }
 nearest(p,limit=3){let best=null;const radius=Math.ceil(limit/(60*Math.max(.05,Math.cos(p.lat*Math.PI/180))));for(let x=Math.floor(p.lon)-radius;x<=Math.floor(p.lon)+radius;x++)for(let y=Math.floor(p.lat)-1;y<=Math.floor(p.lat)+1;y++)for(const id of this.buckets.get(`${x},${y}`)||[]){const distance=distanceNM(p,this.nodes[id]);if(distance<=limit&&(!best||distance<best.distance))best={id,distance,point:{lat:this.nodes[id].lat,lon:this.nodes[id].lon}};}return best;}
 find(from,to,goal){
  const scores=new Map([[from,0]]),previous=new Map(),done=new Set(),heap=[];
  const push=(id,cost)=>{let i=heap.length;heap.push({id,cost});while(i){const p=(i-1)>>1;if(heap[p].cost<=cost)break;heap[i]=heap[p];i=p;}heap[i]={id,cost};};
  const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].cost<heap[j].cost)j++;if(heap[j].cost>=last.cost)break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;};
  push(from,0);while(heap.length){const {id,cost}=pop();if(done.has(id))continue;done.add(id);if(id===to||goal?.(id,cost)){const ids=[id],edges=[];let current=id;while(previous.has(current)){const item=previous.get(current);edges.unshift(item.edge);current=item.id;ids.unshift(current);}return {ids,edges,distanceNM:cost,visited:done.size};}for(const edge of this.nodes[id].edges){const costNext=cost+edge.distance;if(costNext<(scores.get(edge.to)??Infinity)){scores.set(edge.to,costNext);previous.set(edge.to,{id,edge});push(edge.to,costNext);}}}return null;
 }
 leg(a,b){const starts=this.candidates(a.access||a,a.access ? .01 : 3),ends=this.candidates(b.access||b,b.access ? .01 : 3);const pairs=starts.flatMap(from=>ends.filter(to=>to.component===from.component).map(to=>({from,to}))).sort((x,y)=>x.from.distance+x.to.distance-y.from.distance-y.to.distance);if(!pairs.length)return null;const {from,to}=pairs[0];if(from.id===to.id&&distanceNM(a,b)>.001)return null;const route=this.find(from.id,to.id);if(!route)return null;return {points:route.ids.map(id=>({lat:this.nodes[id].lat,lon:this.nodes[id].lon})),accesses:[from.point,to.point],evidence:{grid:'source-waterway-network',anchors:[{lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon}],waypointIds:[a.id,b.id],termination:'SOURCE_CONNECTED_PATH',visitedCells:route.visited,source:this.doc.source,sourceChecksum:this.doc.sha256,sourceEdgeIds:route.edges.map(e=>e.sourceId),sourceAccessEvidence:[...new Set(route.edges.map(e=>e.sourceId))].map(id=>{const l=this.lines.get(id);return {id,source:l.source||this.doc.source,tags:l.tags||{}};}),geometryStatus:this.doc.geometryStatus,accessCandidates:[from,to].map((candidate,i)=>({waypointId:[a,b][i].id,distanceNM:candidate.distance,candidate:candidate.point,cell:{classification:'SOURCE_WATERWAY',component:null}})),automaticConnectorLimitNM:3,geographicConnectivity:'EXACT_SHARED_SOURCE_VERTICES',vesselSuitability:'SEPARATE_ADVISORY',effectiveSeparationNM:0}};}
}
const networks=new Map();
function bundled(name='rivers'){if(!networks.has(name))networks.set(name,new WaterwayNetwork(JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'../assets/waterways/'+name+'.json.gz'))))));return networks.get(name);}
function leg(a,b,datasets=['osm','rivers']){for(const name of datasets){const result=bundled(name).leg(a,b);if(result){result.evidence.dataset=name;return result;}}return null;}
function toGrid(w,grid,datasets=['osm','rivers']){
 const choices=[];
 for(const dataset of datasets){const net=bundled(dataset);for(const access of net.candidates(w.access||w,w.access ? .01 : 3)){
  const route=net.find(access.id,-1,id=>grid.inspect(net.nodes[id]).classification==='WATER');
  if(route){const points=route.ids.map(id=>({lat:net.nodes[id].lat,lon:net.nodes[id].lon}));choices.push({dataset,points,access:access.point,connectorNM:access.distance,distanceNM:route.distanceNM,sourceEdgeIds:route.edges.map(e=>e.sourceId),source:net.doc.source,sourceChecksum:net.doc.sha256,sourceAccessEvidence:[...new Set(route.edges.map(e=>e.sourceId))].map(id=>{const line=net.lines.get(id);return {id,source:line.source||net.doc.source,tags:line.tags||{}};})});}
 }}
 return choices.sort((a,b)=>(a.distanceNM+a.connectorNM)-(b.distanceNM+b.connectorNM))[0]||null;
}
module.exports={WaterwayNetwork,bundled,leg,toGrid};
