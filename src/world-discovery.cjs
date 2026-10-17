const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path');

// This index contains geographic features, not only populated settlements.
// Absence of the optional expanded index must not disable the existing seed.
function openIndex(file){
 if(!fs.existsSync(file))return null;
 const db=new DatabaseSync(file,{readOnly:true});
 const manifest=JSON.parse(db.prepare("SELECT value FROM metadata WHERE key='manifest'").get().value);
 function lookup(query){
  const words=String(query).trim().match(/[\p{L}\p{N}]+/gu)||[];
  if(!words.length)return [];
  const match=words.slice(0,12).map(w=>'"'+w+'"*').join(' AND ');
  return db.prepare(`SELECT p.* FROM names JOIN places p ON p.id=names.rowid
    WHERE names MATCH ? ORDER BY rank LIMIT 100`).all(match).map(p=>({
   ...p,id:'geonames:'+p.id,sourceId:'geonames:'+p.id,
   source:'https://www.geonames.org/'+p.id,
   aliases:p.aliases.split(',').filter(Boolean),
   resolutionMethod:'offline-world-gazetteer',
   locationLabel:'Named '+p.kind+' (GeoNames source coordinates)',
   coordinatePrecision:'Source coordinates; accuracy not certified',
   sourceModified:p.modified,verificationStatus:'source-record; not independently surveyed'
  }));
 }
 return {lookup,manifest,close:()=>db.close()};
}
let index,loaded=false;
function current(){
 if(!loaded){
  const packaged=process.resourcesPath&&path.join(process.resourcesPath,'data/discovery/world.sqlite');
  index=openIndex(packaged&&fs.existsSync(packaged)?packaged:path.join(__dirname,'../assets/discovery/world.sqlite'));
  loaded=true;
 }
 return index;
}
module.exports={openIndex,lookup:q=>current()?.lookup(q)||[],coverage:()=>current()?.manifest||null};
