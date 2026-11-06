const {test}=require('node:test'),a=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createCache}=require('../src/discovery-cache.cjs');
test('approved discovery persists by stable identity, retains aliases and rejects invalid replacements',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nerds-cache-')),file=path.join(dir,'user.sqlite');let db=new DatabaseSync(file);
 const feature={name:'Remote research feature',sourceId:'fixture:1',source:'https://example.org/feature/1',aliases:['Station Alpha'],country:'Antarctica',region:'Test region',kind:'research station',lat:-62,lon:-58};
 try{
  let cache=createCache(db);a.deepEqual(cache.lookup('Station Alpha'),[]);cache.accept(feature);db.close();db=new DatabaseSync(file);cache=createCache(db);
  const row=cache.lookup('Station Alpha Antarctica')[0];a.equal(row.sourceId,feature.sourceId);a.equal(row.kind,'research station');a.equal(row.lat,-62);a.ok(row.acceptedAt);
  a.throws(()=>cache.accept({...feature,lat:100}));a.equal(cache.lookup('Station Alpha')[0].lat,-62);
  cache.accept({...feature,aliases:['Station Beta']});a.equal(cache.lookup('Station Alpha').length,0);a.equal(cache.lookup('Station Beta').length,1);
  a.equal(db.prepare('SELECT count(*) n FROM discovery_features').get().n,1);
 }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('waypoint persistence retains discovery classification independently of planning role',()=>{
 const {cleanWaypoint}=require('../src/core.cjs');
 const w=cleanWaypoint({name:'Station',lat:-62,lon:-58,kind:'land-visit',featureKind:'research station',featureClass:'S',featureCode:'STNB',sourceId:'geonames:1',source:'https://www.geonames.org/1',sourceModified:'2026-01-01',verificationStatus:'source record'});
 a.equal(w.kind,'land-visit');a.equal(w.featureKind,'research station');a.equal(w.featureCode,'STNB');a.equal(w.sourceModified,'2026-01-01');a.equal(w.sourceId,'geonames:1');
});
