'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function load(directory){
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'));
 if(manifest.schemaVersion!==1||manifest.format!=='S-57'||manifest.file!=='features.geojson')throw Error('Unsupported chart package');
 const bytes=fs.readFileSync(path.join(directory,manifest.file));
 if(bytes.length!==manifest.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw Error('Chart integrity failure');
 const data=JSON.parse(bytes);if(data.type!=='FeatureCollection'||!Array.isArray(data.features))throw Error('Invalid chart feature collection');
 return {manifest,features:data.features};
}
function inspect(directory){
 const {manifest,features}=load(directory),counts={};
 for(const f of features){const layer=f.properties?.sourceLayer||'UNKNOWN';counts[layer]=(counts[layer]||0)+1;}
 return {cell:manifest.cell,sourceFiles:manifest.sourceFiles,geometrySHA256:manifest.sha256,chartMetadata:manifest.chartMetadata,featureCount:features.length,layers:counts,status:'PREPARED_CHART_EVIDENCE',verifiedClearance:false,limitations:manifest.limitations};
}
module.exports={load,inspect};
