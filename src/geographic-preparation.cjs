'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function prepare(manager,record,{python,resolution=.005}={}){
 if(!python)throw Error('A configured development Python with Shapely is required for preparation');
 if(!Number.isFinite(resolution)||resolution<.0001||resolution>.1)throw Error('Invalid preparation resolution');
 const identity=sha(Buffer.from('v2:'+record.sha256+':'+resolution)),dest=manager.file('prepared/'+identity),ready=path.join(dest,'ready.json');
 if(fs.existsSync(ready)){verify(dest);return {directory:dest,cacheHit:true};}
 const work=manager.file('preparation/'+crypto.randomUUID());fs.mkdirSync(work,{recursive:true});const name=record.tile.id;
 if(!/^[a-zA-Z0-9.-]+$/.test(name))throw Error('Invalid tile ID');
 fs.writeFileSync(path.join(work,name+'-areas.json'),manager.read(record));fs.writeFileSync(path.join(work,name+'-query.txt'),JSON.stringify({source:record.source,tile:record.tile,sha256:record.sha256}));
 const t=record.tile;fs.writeFileSync(path.join(work,'regions.json'),JSON.stringify({[name]:[Math.max(-180,t.west-.02),Math.max(-90,t.south-.02),Math.min(180,t.east+.02),Math.min(90,t.north+.02),resolution]}));
 const output=path.join(work,'output');await promisify(execFile)(python,[path.resolve(__dirname,'../scripts/prepare-water-areas.py'),'--regions',path.join(work,'regions.json'),'--input-root',work,'--output-root',output],{cwd:path.resolve(__dirname,'..'),windowsHide:true,timeout:120000,maxBuffer:1048576});
 const doc=JSON.parse(manager.read(record));const lines=doc.elements.filter(e=>e.type==='way'&&/^(river|canal|fairway|flowline)$/.test(e.tags?.waterway||'')).map(e=>{if(!Array.isArray(e.geometry)||e.geometry.length<2)throw Error('Incomplete mapped waterway geometry');return {id:'osm/way/'+e.id,coordinates:e.geometry.map(p=>[p.lon,p.lat]),tags:e.tags,source:'https://www.openstreetmap.org/way/'+e.id};});fs.writeFileSync(path.join(output,'waterways.json'),JSON.stringify({lines}));
 const files=Object.fromEntries(fs.readdirSync(output).map(name=>[name,sha(fs.readFileSync(path.join(output,name)))]));fs.writeFileSync(path.join(output,'ready.json'),JSON.stringify({source:record,resolution,files,geographicOnly:true,preparedAt:new Date().toISOString()}));
 fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.renameSync(output,dest);verify(dest);return {directory:dest,cacheHit:false};
}
function verify(dir){const info=JSON.parse(fs.readFileSync(path.join(dir,'ready.json')));if(!info.files?.['manifest.json'])throw Error('Missing prepared manifest');for(const [name,digest]of Object.entries(info.files)){if(path.basename(name)!==name||sha(fs.readFileSync(path.join(dir,name)))!==digest)throw Error('Prepared geography integrity failure');}return info;}
function prepared(manager){const root=manager.file('prepared');if(!fs.existsSync(root))return [];const active=new Set(Object.values(manager.index().datasets).map(r=>r.sha256)),selected=new Map();for(const name of fs.readdirSync(root).filter(x=>/^[0-9a-f]{64}$/.test(x))){const dir=path.join(root,name),info=JSON.parse(fs.readFileSync(path.join(dir,'ready.json')));if(!active.has(info.source.sha256))continue;verify(dir);const key=info.source.key,old=selected.get(key);if(!old||info.resolution<old.resolution)selected.set(key,{directory:dir,resolution:info.resolution});}return [...selected.values()].map(x=>x.directory).sort();}
module.exports={prepare,verify,prepared};
