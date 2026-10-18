// Additive dataset: never writes the accepted osm/rivers/mask files.
const fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const base=JSON.parse(zlib.gunzipSync(fs.readFileSync('assets/waterways/osm.json.gz')));
const lines=new Map(base.lines.map(l=>[l.id,l])),sources=[{dataset:'osm',sha256:base.sha256,role:'Preserved mapped waterways'}];
for(const file of fs.readdirSync('work/refinement').filter(f=>f.endsWith('.json')).sort()){
 const bytes=fs.readFileSync('work/refinement/'+file),doc=JSON.parse(bytes);if(doc.remark||!Array.isArray(doc.elements))throw Error('Incomplete response '+file);
 const bounds=[Infinity,Infinity,-Infinity,-Infinity];let accepted=0;
 for(const w of doc.elements){if(w.type!=='way'||!w.geometry||!['river','canal','fairway','flowline'].includes(w.tags?.waterway))continue;
  if(w.geometry.some(p=>!Number.isFinite(p.lat)||!Number.isFinite(p.lon)))throw Error('Invalid source geometry');
  for(const p of w.geometry){bounds[0]=Math.min(bounds[0],p.lon);bounds[1]=Math.min(bounds[1],p.lat);bounds[2]=Math.max(bounds[2],p.lon);bounds[3]=Math.max(bounds[3],p.lat);}
  accepted++;lines.set('osm:way:'+w.id,{id:'osm:way:'+w.id,name:w.tags.name||'Unnamed mapped waterway',classification:w.tags.waterway,tags:w.tags,source:'https://www.openstreetmap.org/way/'+w.id,coordinates:w.geometry.map(p=>[p.lon,p.lat])});
 }
 sources.push({file,sha256:hash(bytes),timestamp:doc.osm3s?.timestamp_osm_base,bounds,acceptedWays:accepted,query:fs.readFileSync('work/refinement/'+file.replace('.json','-query.txt'),'utf8')});
}
const doc={schema:1,source:'https://www.openstreetmap.org/copyright',license:'ODbL 1.0; OpenStreetMap contributors',acquisition:'https://overpass-api.de/api/interpreter',sources,resolution:'Irregular source vertices, WGS84 coordinates; positional accuracy not guaranteed. No fixed raster resolution.',coverage:'Existing mapped waterways plus bounded regional queries listed in sources; not worldwide complete.',geometryStatus:'Mapped river/canal/fairway/flowline topology; not hydrographic clearance or legal access',limitations:['Only exactly shared source vertices connect; no proximity joins','Coarse ocean mask still governs source-to-ocean transitions','Waterway mapping is not proof of depth, bridge clearance or vessel suitability'],lines:[...lines.values()].sort((a,b)=>a.id.localeCompare(b.id))};
doc.sha256=hash(JSON.stringify(doc.lines));
fs.writeFileSync('assets/waterways/refinement.json.gz',zlib.gzipSync(JSON.stringify(doc)));
fs.writeFileSync('assets/waterways/refinement-manifest.json',JSON.stringify({...doc,lines:undefined,lineCount:doc.lines.length},null,2));
console.log(doc.lines.length,'ways',doc.sha256);
