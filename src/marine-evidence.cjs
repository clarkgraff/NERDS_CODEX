'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{Geodesic}=require('geographiclib-geodesic');
let cached;
function load(directory=path.resolve(__dirname,'../assets/marine/gebco-kattegat')){
 if(cached?.directory===directory)return cached;
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'))),bytes=fs.readFileSync(path.join(directory,manifest.file));
 if(path.basename(manifest.file)!==manifest.file||bytes.length!==manifest.width*manifest.height*4||crypto.createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw Error('Bathymetry integrity failure');
 return cached={directory,manifest,bytes};
}
function sample(p,data){const m=data.manifest,[west,south,east,north]=m.bounds;if(p.lon<west||p.lon>=east||p.lat<=south||p.lat>north)return null;const x=Math.floor((p.lon-west)/m.resolutionDegrees[0]),y=Math.floor((north-p.lat)/m.resolutionDegrees[1]);if(x<0||y<0||x>=m.width||y>=m.height)return null;const value=data.bytes.readFloatLE((y*m.width+x)*4);return !Number.isFinite(value)||value===m.nodata?null:value;}
function assess(points,vessel={},options={}){
 const result={status:'UNKNOWN',blocksRouting:false,policy:'ADVISORY_ONLY',draftM:require('./vessel.cjs').metres(vessel,'draftWater'),airDraftM:require('./vessel.cjs').metres(vessel,'draftAir'),airClearanceStatus:'UNKNOWN',geometrySHA256:crypto.createHash('sha256').update(JSON.stringify(points)).digest('hex'),samples:0,missingSamples:0,minimumModelledDepthM:null,verifiedClearance:false};
 try{const data=load(options.directory);result.source={name:data.manifest.sourceName,sha256:data.manifest.sha256,resolutionDegrees:data.manifest.resolutionDegrees,verticalDatum:data.manifest.verticalDatum};result.limitations=data.manifest.limitations;
  let min=Infinity;const inspect=p=>{const value=sample(p,data);result.samples++;if(value===null){result.missingSamples++;return;}min=Math.min(min,-value);};
  if(points.length)inspect(points[0]);for(let i=1;i<points.length;i++){const line=Geodesic.WGS84.InverseLine(points[i-1].lat,points[i-1].lon,points[i].lat,points[i].lon),n=Math.max(1,Math.ceil(line.s13/200));if(result.samples+n>100000){result.limitations=[...result.limitations,'Sampling budget reached'];result.missingSamples++;break;}for(let j=1;j<=n;j++){const p=line.Position(line.s13*j/n);inspect({lat:p.lat2,lon:p.lon2});}}
  result.minimumModelledDepthM=Number.isFinite(min)?min:null;result.status=min<result.draftM?'MODELLED_SHALLOW_WATER_ADVISORY':result.missingSamples?'INCOMPLETE_COVERAGE':Number.isFinite(min)?'MODELLED_DEPTH_ONLY':'UNKNOWN';
 }catch(e){result.error=e.message;}return result;
}
module.exports={load,sample,assess};

