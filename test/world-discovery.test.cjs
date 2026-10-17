const {test}=require('node:test'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {openIndex}=require('../src/world-discovery.cjs');
test('all-feature discovery matches accented aliases and regional disambiguation without population eligibility',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nerds-discovery-')),file=path.join(dir,'world.sqlite');
 const db=new DatabaseSync(file);
 db.exec(`CREATE TABLE places(id INTEGER PRIMARY KEY,name,aliases,lat,lon,country,region,kind,featureClass,featureCode,zone,modified);
 CREATE VIRTUAL TABLE names USING fts5(name,aliases,country,region,content='places',content_rowid='id',tokenize='unicode61 remove_diacritics 2');
 CREATE TABLE metadata(key PRIMARY KEY,value);`);
 db.prepare('INSERT INTO metadata VALUES(?,?)').run('manifest',JSON.stringify({coverage:'synthetic-test-only',populationFilter:null}));
 const insert=db.prepare('INSERT INTO places VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
 insert.run(1,'Research station','Estación de investigación,TEST-CAMP',-62,-58,'Antarctica','','scientific research base','S','STNB','UTC','2026-01-01');
 insert.run(2,'Twin Harbors','',33,-118,'United States','California','harbor','H','HBR','UTC','2026-01-01');
 insert.run(3,'Twin Harbors','',47,-91,'United States','Minnesota','populated place','P','PPL','UTC','2026-01-01');
 db.exec("INSERT INTO names(names) VALUES('rebuild')");db.close();
 const index=openIndex(file);
 try{
  assert.equal(index.lookup('estacion investigacion Antarctica')[0].sourceId,'geonames:1');
  assert.equal(index.lookup('TEST-CAMP')[0].featureCode,'STNB');
  const results=index.lookup('Twin Harbors California');assert.equal(results.length,1);assert.equal(results[0].region,'California');
  assert.equal(results[0].source,'https://www.geonames.org/2');
  assert.equal(index.lookup('Twin Harbors').length,2);
  assert.equal(index.lookup('" OR *').length,0);
  assert.deepEqual(index.lookup(''),[]);
 }finally{index.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('absent expanded index remains optional',()=>assert.equal(openIndex(path.join(os.tmpdir(),'nerds-no-index-'+Date.now())),null));
