const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
const {cleanState,emptyState}=require('./core.cjs');
function snapshot(store){return {format:'NERDS',schemaVersion:2,state:store.read(),media:store.media(),research:store.db.prepare('SELECT * FROM research').all(),acquisitions:store.db.prepare('SELECT * FROM acquisitions').all()};}
function validate(doc){
 if(doc?.format!=='NERDS'||![1,2].includes(doc.schemaVersion))throw Error('This is not a supported .nerds project.');
 const state=cleanState(doc.state),result={...doc,state};
 for(const key of ['media','research','acquisitions']){if(!Array.isArray(doc[key])||doc[key].length>100000)throw Error('Invalid project '+key);result[key]=doc[key];}
 for(const m of result.media){if(typeof m.id!=='string'||typeof m.source_path!=='string'||typeof m.name!=='string'||typeof m.imported_at!=='string'||!m.metadata||typeof m.metadata!=='object')throw Error('Invalid media reference.');if((m.lat!==null&&(!Number.isFinite(m.lat)||Math.abs(m.lat)>90))||(m.lon!==null&&(!Number.isFinite(m.lon)||Math.abs(m.lon)>180)))throw Error('Invalid media coordinates.');}
 return result;
}
function replace(store,doc){const p=validate(doc);store.db.exec('BEGIN IMMEDIATE');try{
 for(const t of ['media','research','acquisitions'])store.db.exec('DELETE FROM '+t);
 store.save(p.state);for(const m of p.media)store.addMedia(m);
 for(const r of p.research)store.db.prepare('INSERT INTO research VALUES (?,?,?,?,?,?,?)').run(r.id,r.waypoint_id,r.title,r.body,r.source_url,r.license,r.created_at);
 for(const r of p.acquisitions)store.db.prepare('INSERT INTO acquisitions VALUES (?,?,?,?,?,?,?,?)').run(r.id,r.provider,r.source_url,r.license,r.local_path,r.sha256,r.status,r.created_at);
 store.db.exec('COMMIT');
 }catch(e){store.db.exec('ROLLBACK');throw e;}}
function read(file){if(fs.statSync(file).size>250*1024*1024)throw Error('Project exceeds the 250 MB limit.');return validate(JSON.parse(fs.readFileSync(file,'utf8')));}
function write(file,doc){const temp=file+'.'+randomUUID()+'.tmp';try{const text=JSON.stringify({...doc,savedAt:new Date().toISOString()},null,2);if(Buffer.byteLength(text)>250*1024*1024)throw Error('Project exceeds 250 MB.');fs.writeFileSync(temp,text,{flag:'wx'});const fd=fs.openSync(temp,'r+');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}}
const blank=()=>({format:'NERDS',schemaVersion:2,state:emptyState(),media:[],research:[],acquisitions:[]});
module.exports={snapshot,validate,replace,read,write,blank};
