'use strict';
// Reproducible conversion: source geometry is retained, never straight-line joined.
const fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto'),path=require('node:path');
const input=process.argv[2]||'work/stage2/rivers.geojson',bytes=fs.readFileSync(input),geo=JSON.parse(bytes);
const lines=geo.features.flatMap((f,i)=>(f.geometry.type==='MultiLineString'?f.geometry.coordinates:[f.geometry.coordinates]).map((coordinates,j)=>({id:`ne-river:${i}:${j}`,name:f.properties.name||'Unnamed waterway',classification:f.properties.featurecla,coordinates})));
const doc={schema:1,source:'https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/',acquisition:'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson',license:'Public domain',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),acquiredAt:'2026-10-16',geometryStatus:'Mapped geographic centerlines; not navigability or vessel clearance',lines};
fs.mkdirSync('assets/waterways',{recursive:true});fs.writeFileSync('assets/waterways/rivers.json.gz',zlib.gzipSync(JSON.stringify(doc)));fs.writeFileSync('assets/waterways/manifest.json',JSON.stringify({...doc,lines:undefined,lineCount:lines.length},null,2));console.log(lines.length+' source lines');
