'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Geodesic}=require('geographiclib-geodesic');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const safe=s=>{if(typeof s!=='string'||!/^[a-zA-Z0-9_.-]{1,160}$/.test(s)||s==='.'||s==='..')throw Error('Invalid geographic key');return s;};
function coverage(points,{degrees=1,maxTiles=4096}={}){
 if(![.25,.5,1,2,5].includes(degrees)||!Number.isInteger(maxTiles)||maxTiles<1||maxTiles>20000||!Array.isArray(points)||points.length>1000)throw Error('Invalid coverage budget');
 const tiles=new Map(),nx=360/degrees,ny=180/degrees;
 function add(p){if(!Number.isFinite(p.lat)||Math.abs(p.lat)>90||!Number.isFinite(p.lon)||Math.abs(p.lon)>180)throw Error('Invalid coverage coordinate');const x=Math.min(nx-1,Math.floor((p.lon+180)/degrees)),y=Math.min(ny-1,Math.floor((p.lat+90)/degrees));for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const yy=y+dy,xx=(x+dx+nx)%nx;if(yy<0||yy>=ny)continue;const id=`d${degrees}-x${xx}-y${yy}`;tiles.set(id,{id,west:-180+xx*degrees,south:-90+yy*degrees,east:-180+(xx+1)*degrees,north:-90+(yy+1)*degrees,resolutionDegrees:degrees});if(tiles.size>maxTiles)throw Error('Coverage budget exceeded; request smaller corridors or coarser tiles');}}
 points.forEach(add);for(let i=1;i<points.length;i++){const line=Geodesic.WGS84.InverseLine(points[i-1].lat,points[i-1].lon,points[i].lat,points[i].lon);const count=Math.ceil(line.s13/(degrees*111000/4));for(let j=1;j<count;j++){const p=line.Position(line.s13*j/count);add({lat:p.lat2,lon:p.lon2});}}
 return [...tiles.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
function atomic(file,bytes){const temp=file+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temp,bytes,{flag:'wx'});const fd=fs.openSync(temp,'r+');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,file);}
class GeographicDataManager{
 constructor(root){this.root=path.resolve(root);for(const d of ['blobs','versions','jobs'])fs.mkdirSync(path.join(this.root,d),{recursive:true});this.busy=false;}
 file(name){return path.join(this.root,name);}
 index(){const file=this.file('current.json');if(!fs.existsSync(file))return {schemaVersion:1,datasets:{}};const ref=JSON.parse(fs.readFileSync(file));const bytes=fs.readFileSync(this.file('versions/'+safe(ref.hash)+'.json'));if(hash(bytes)!==ref.hash)throw Error('Coverage inventory integrity failure');return JSON.parse(bytes);}
 publish(index){const bytes=Buffer.from(JSON.stringify(index)),id=hash(bytes);const file=this.file('versions/'+id+'.json');if(!fs.existsSync(file))atomic(file,bytes);atomic(this.file('current.json'),JSON.stringify({hash:id}));return id;}
 rollback(id){const bytes=fs.readFileSync(this.file('versions/'+safe(id)+'.json'));if(hash(bytes)!==id)throw Error('Rollback integrity failure');const doc=JSON.parse(bytes);for(const r of Object.values(doc.datasets))this.read(r);atomic(this.file('current.json'),JSON.stringify({hash:id}));}
 read(record){const b=fs.readFileSync(this.file('blobs/'+safe(record.sha256)));if(hash(b)!==record.sha256)throw Error('Geographic blob integrity failure');return b;}
 inventory(tiles,provider='osm-hydrography'){const index=this.index();return tiles.map(tile=>{const r=index.datasets[provider+':'+tile.id];if(!r)return {tile,status:'MISSING'};try{this.read(r);return {tile,status:r.status,record:r};}catch(e){return {tile,status:'CORRUPT',error:e.message};}});}
 jobs(){return fs.readdirSync(this.file('jobs')).filter(x=>x.endsWith('.json')).map(x=>JSON.parse(fs.readFileSync(this.file('jobs/'+x))));}
 async acquire(tile,provider,{online=false,refresh=false,attempts=2,timeoutMs=55000,maxBytes=64000000,signal}={}){
  safe(tile.id);safe(provider.id);if(!provider.license||!provider.source)throw Error('Source provenance and licence required');
  if(!Number.isInteger(attempts)||attempts<1||attempts>3||!Number.isFinite(timeoutMs)||!Number.isFinite(maxBytes)||timeoutMs<1||timeoutMs>120000||maxBytes<1||maxBytes>256000000)throw Error('Invalid acquisition budget');
  if(this.busy)throw Error('Geographic acquisition already running');this.busy=true;
  let lock;try{lock=fs.openSync(this.file('writer.lock'),'wx');fs.writeSync(lock,String(process.pid));}catch(e){this.busy=false;throw Error('Geographic cache has another writer; inspect writer.lock after interrupted process');}
  const key=provider.id+':'+tile.id,job={id:crypto.randomUUID(),key,status:'ACQUIRING',startedAt:new Date().toISOString(),attempts:[]},jobFile=this.file('jobs/'+job.id+'.json');
  try{
   const index=this.index(),existing=index.datasets[key];if(existing&&!refresh){this.read(existing);return {...existing,cacheHit:true};}if(!online)throw Error('OFFLINE_MISSING: no validated cached dataset');
   atomic(jobFile,JSON.stringify(job));let bytes,source;
   for(let attempt=1;attempt<=attempts;attempt++){
    signal?.throwIfAborted();const controller=new AbortController(),cancel=()=>controller.abort(signal.reason),timer=setTimeout(()=>controller.abort(Error('Acquisition timeout')),timeoutMs);signal?.addEventListener('abort',cancel,{once:true});
    try{const response=await provider.request(tile,{signal:controller.signal});if(!response.ok)throw Error('Provider HTTP '+response.status);const reader=response.body.getReader(),chunks=[];let count=0;while(true){const item=await reader.read();if(item.done)break;count+=item.value.length;if(count>maxBytes){await reader.cancel();throw Error('Acquisition byte budget exceeded');}chunks.push(Buffer.from(item.value));}bytes=Buffer.concat(chunks);source=provider.validate(bytes,tile);job.attempts.push({attempt,status:'VALIDATED',bytes:count});break;
    }catch(e){job.attempts.push({attempt,status:'FAILED',error:e.message});if(attempt===attempts||signal?.aborted)throw e;}finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);atomic(jobFile,JSON.stringify(job));}
    await new Promise(resolve=>setTimeout(resolve,1000*attempt));
   }
   const sha256=hash(bytes),blob=this.file('blobs/'+sha256);if(!fs.existsSync(blob))atomic(blob,bytes);
   const record={key,tile,provider:provider.id,source:provider.source,license:provider.license,sha256,bytes:bytes.length,acquiredAt:new Date().toISOString(),sourceVersion:source.version||null,status:'SOURCE_READY',routeReady:false,limitations:source.limitations||[],previousSHA256:existing?.sha256||null};index.datasets[key]=record;const version=this.publish(index);Object.assign(job,{status:'ADOPTED',version,sha256});atomic(jobFile,JSON.stringify(job));return {...record,cacheHit:false,inventoryVersion:version};
  }catch(e){Object.assign(job,{status:'FAILED',error:e.message});atomic(jobFile,JSON.stringify(job));throw e;}finally{fs.closeSync(lock);fs.unlinkSync(this.file('writer.lock'));this.busy=false;}
 }
 recover(){if(fs.existsSync(this.file('writer.lock'))){const pid=Number(fs.readFileSync(this.file('writer.lock'),'utf8'));if(!Number.isInteger(pid)||pid<=0)throw Error('Invalid writer lock; manual inspection required');try{process.kill(pid,0);throw Error('Writer is still running');}catch(e){if(e.code!=='ESRCH')throw e;}fs.unlinkSync(this.file('writer.lock'));}const interrupted=this.jobs().filter(j=>j.status==='ACQUIRING');for(const job of interrupted){job.status='INTERRUPTED';atomic(this.file('jobs/'+job.id+'.json'),JSON.stringify(job));}return interrupted;}
}
module.exports={coverage,GeographicDataManager};

