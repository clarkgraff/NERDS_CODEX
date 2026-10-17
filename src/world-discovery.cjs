const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path');
const supplements=require('../assets/discovery/source-aliases.json').records;
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];

// This index contains geographic features, not only populated settlements.
// Absence of the optional expanded index must not disable the existing seed.
function openIndex(file){
 if(!fs.existsSync(file))return null;
 const db=new DatabaseSync(file,{readOnly:true});
 const manifest=JSON.parse(db.prepare("SELECT value FROM metadata WHERE key='manifest'").get().value);
 function lookup(query){
  const words=String(query).replace(/&/g,' and ').trim().match(/[\p{L}\p{N}]+/gu)||[];
  if(!words.length)return [];
  const match=words.slice(0,12).map(w=>'"'+w+'"*').join(' AND ');
  // Reserve results for name/alias phrases before broad cross-field matches.
  // Otherwise numerous churches can crowd a remote feature out of the limit.
  const select=db.prepare(`SELECT p.* FROM names JOIN places p ON p.id=names.rowid
    WHERE names MATCH ? ORDER BY rank LIMIT 100`);
  const phrase='{name aliases} : "'+words.slice(0,12).join(' ')+'"*';
  const rows=select.all(phrase),seen=new Set(rows.map(p=>p.id));
  for(const p of select.all(match))if(!seen.has(p.id)){rows.push(p);seen.add(p.id);}
  const terms=normalize(query);
  for(const supplement of supplements){
   if(!supplement.aliases.some(alias=>{const tokens=normalize(alias);return terms.every(t=>tokens.some(token=>token.startsWith(t)));}))continue;
   const id=Number(supplement.sourceId.split(':')[1]);
   if(!rows.some(p=>p.id===id)){const p=db.prepare('SELECT * FROM places WHERE id=?').get(id);if(p)rows.push(p);}
  }
  return rows.map(p=>{
   const supplemental=supplements.find(s=>s.sourceId==='geonames:'+p.id);
   return {
   ...p,id:'geonames:'+p.id,sourceId:'geonames:'+p.id,
   source:'https://www.geonames.org/'+p.id,
   aliases:[...new Set([...p.aliases.split(',').filter(Boolean),...(supplemental?.aliases||[])])],
   aliasProvenance:supplemental?[{source:supplemental.source,authority:supplemental.authority,aliases:supplemental.aliases,note:supplemental.note}]:[],
   resolutionMethod:'offline-world-gazetteer',
   locationLabel:'Named '+p.kind+' (GeoNames source coordinates)',
   coordinatePrecision:'Source coordinates; accuracy not certified',
   sourceModified:p.modified,verificationStatus:'source-record; not independently surveyed'
  };});
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
