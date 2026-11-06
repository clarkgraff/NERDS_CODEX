// User-approved discoveries live in the USER database, independently of projects.
function createCache(db){
 db.exec(`CREATE TABLE IF NOT EXISTS discovery_features(id INTEGER PRIMARY KEY,source_id TEXT UNIQUE NOT NULL,json TEXT NOT NULL);
 CREATE VIRTUAL TABLE IF NOT EXISTS discovery_names USING fts5(name,aliases,country,region);`);
 function accept(feature){
  if(!feature||typeof feature.name!=='string'||!feature.name.trim()||feature.name.length>200)throw Error('Invalid discovery name');
  if(typeof feature.sourceId!=='string'||!feature.sourceId||feature.sourceId.length>200)throw Error('Discovery needs a stable source identity');
  if(!Number.isFinite(feature.lat)||Math.abs(feature.lat)>90||!Number.isFinite(feature.lon)||Math.abs(feature.lon)>180)throw Error('Invalid discovery coordinates');
  const source=new URL(feature.source);if(source.protocol!=='https:')throw Error('Discovery needs an HTTPS source reference');
  const record={name:feature.name,lat:feature.lat,lon:feature.lon,source:source.href,sourceId:feature.sourceId,
   aliases:Array.isArray(feature.aliases)?feature.aliases.map(x=>String(x).slice(0,200)).slice(0,500):[],
   country:String(feature.country||'').slice(0,200),region:String(feature.region||'').slice(0,200),
   kind:String(feature.featureKind||feature.kind||'geographic feature').slice(0,200),
   featureClass:String(feature.featureClass||'').slice(0,30),featureCode:String(feature.featureCode||'').slice(0,30),
   zone:String(feature.zone||'UTC'),locationLabel:String(feature.locationLabel||'Source geographic feature').slice(0,200),
   coordinatePrecision:String(feature.coordinatePrecision||'Source coordinates; accuracy not certified').slice(0,200),
   sourceModified:String(feature.sourceModified||'').slice(0,100),acceptedAt:new Date().toISOString(),
   verificationStatus:'USER-selected source match; not independently surveyed',resolutionMethod:'offline-user-discovery-cache'};
  db.exec('SAVEPOINT discovery_accept');
  try{
   db.prepare('INSERT INTO discovery_features(source_id,json) VALUES(?,?) ON CONFLICT(source_id) DO UPDATE SET json=excluded.json').run(record.sourceId,JSON.stringify(record));
   const {id}=db.prepare('SELECT id FROM discovery_features WHERE source_id=?').get(record.sourceId);
   db.prepare('DELETE FROM discovery_names WHERE rowid=?').run(id);
   db.prepare('INSERT INTO discovery_names(rowid,name,aliases,country,region) VALUES(?,?,?,?,?)').run(id,record.name,record.aliases.join(' '),record.country,record.region);
   db.exec('RELEASE discovery_accept');return record;
  }catch(e){db.exec('ROLLBACK TO discovery_accept; RELEASE discovery_accept');throw e;}
 }
 function lookup(query){
  const words=String(query).match(/[\p{L}\p{N}]+/gu)||[];if(!words.length)return [];
  const match=words.slice(0,12).map(w=>'"'+w+'"*').join(' AND ');
  return db.prepare('SELECT f.json FROM discovery_names n JOIN discovery_features f ON f.id=n.rowid WHERE discovery_names MATCH ? ORDER BY rank LIMIT 100').all(match).map(r=>JSON.parse(r.json));
 }
 return {accept,lookup};
}
module.exports={createCache};
