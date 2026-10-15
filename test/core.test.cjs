const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {lookup,cleanWaypoint,cleanState,openStore,localEndpoint}=require('../src/core.cjs');
test('offline lookup supports names and diacritics, rejects unknown cities',()=>{
 assert.ok(lookup('Gdansk').some(p=>p.name==='Gdańsk'));assert.ok(lookup('amster').some(p=>p.name==='Amsterdam'));assert.deepEqual(lookup('unknownplace'),[]);
});
test('waypoints reject missing, nonfinite and out-of-range coordinates',()=>{
 for(const lat of ['',null,NaN,Infinity,91,-91])assert.throws(()=>cleanWaypoint({name:'test',lat,lon:1}));
 assert.throws(()=>cleanWaypoint({name:'',lat:0,lon:0}));assert.throws(()=>cleanWaypoint({name:'test',lat:0,lon:181}));
 assert.equal(cleanWaypoint({name:'Origin',lat:0,lon:0}).lat,0);
});
test('database survives restart, empty itinerary stays empty, research references persist',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nerds-core-'));let store;
 try{store=openStore(dir);assert.equal(store.read().waypoints.length,0);const s=store.read();s.waypoints.push(cleanWaypoint({name:'Hamburg',lat:53.55,lon:10,notes:'Harbour research'}));s.speed='BEST-SAILING';store.save(s);
 store.addMedia({id:'photo',source_path:'C:\\BRONTO-STOR\\original.jpg',name:'original.jpg',lat:0,lon:0,waypoint_id:s.waypoints[0].id,metadata:{camera:'Test'},imported_at:new Date().toISOString()});
 store.close();store=openStore(dir);assert.equal(store.read().waypoints[0].notes,'Harbour research');assert.equal(store.media()[0].metadata.camera,'Test');assert.equal(store.media()[0].lat,0);
 store.save({...store.read(),waypoints:[]});store.close();store=openStore(dir);assert.equal(store.read().waypoints.length,0);
 }finally{store?.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('invalid saves cannot overwrite the last good expedition',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nerds-validation-'));const store=openStore(dir);
 try{const s=store.read();assert.throws(()=>store.save({...s,speed:'FAKE'}));const w=cleanWaypoint({name:'A',lat:0,lon:0});assert.throws(()=>cleanState({...s,waypoints:[w,w]}));assert.equal(store.read().speed,'BEST-TIME');}finally{store.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('inference adapter only accepts local HTTP APIs',()=>{
 assert.equal(localEndpoint('http://127.0.0.1:1234/v1/'),'http://127.0.0.1:1234/v1');
 for(const url of ['https://example.com/v1','file:///C:/secrets','http://localhost.evil/v1','http://user:pass@localhost/v1'])assert.throws(()=>localEndpoint(url));
});
