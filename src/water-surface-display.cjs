'use strict';
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function catalogue(manager){
 const roots=[path.resolve(__dirname,'../assets/water-areas'),...require('./geographic-preparation.cjs').prepared(manager)],records=[];
 for(const root of roots){const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));for(const region of manifest.regions){const file=path.join(root,region.id+'.geojson.gz');if(!fs.existsSync(file)||!region.geometrySHA256)continue;records.push({id:hash(Buffer.from(file+region.geometrySHA256)),file,sha256:region.geometrySHA256,extent:region.extent,resolutionDegrees:region.resolutionDegrees,source:manifest.source,license:manifest.license,observedAt:region.osmTimestamp||null,limitations:['Mapped water surface, not vessel clearance','Outside source coverage remains unknown']});}}
 return records;
}
function read(record){const bytes=z.gunzipSync(fs.readFileSync(record.file));if(hash(bytes)!==record.sha256)throw Error('Water surface integrity failure');const geometry=JSON.parse(bytes);if(!['Polygon','MultiPolygon'].includes(geometry.type))throw Error('Unsupported water surface geometry');return bytes;}
module.exports={catalogue,read};
