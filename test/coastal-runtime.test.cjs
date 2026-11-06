const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {GeographicDataManager}=require('../src/geographic-data.cjs'),{osmHydrography}=require('../src/geographic-providers.cjs'),P=require('../src/geographic-preparation.cjs');
async function fixture(geometry,id='coast',extent={},extra=[]){const m=new GeographicDataManager(fs.mkdtempSync(path.join(os.tmpdir(),'nerds-coast-'))),tile={id,west:20,south:20,east:20.2,north:20.2,...extent},p=osmHydrography(async()=>new Response(JSON.stringify({osm3s:{timestamp_osm_base:'2026-10-25T00:00:00Z'},elements:[...extra,...geometry.map((coords,i)=>({type:'way',id:i+1,tags:{natural:'coastline'},geometry:coords.map(([lon,lat])=>({lon,lat}))}))]})));const r=await m.acquire(tile,p,{online:true});const start=performance.now(),result=await P.prepare(m,r,{resolution:.005});const manifest=JSON.parse(fs.readFileSync(path.join(result.directory,'manifest.json')));return {m,r,result,region:manifest.regions[0],elapsedMs:performance.now()-start};}
test('bundled runtime classifies directed coastal faces and keeps land excluded',async()=>{const x=await fixture([[[20.1,19.9],[20.1,20.3]]]);a.equal(x.region.coastline.status,'DIRECTED_SOURCE_CLASSIFIED');const T=require('../src/water-area-route.cjs');T.configure([x.result.directory]);const area=T.areas().find(a=>a.id==='coast');a.equal(area.inspect({lon:20.15,lat:20.1}).classification,'WATER');a.equal(area.inspect({lon:20.05,lat:20.1}).classification,'BLOCKED');a.equal(T.exclusionClear({lon:20.01,lat:20.1},{lon:20.09,lat:20.1}),false);T.configure([]);console.log(JSON.stringify({preparationMs:x.elapsedMs,rssBytes:process.memoryUsage().rss}));});
test('island interior remains land; incomplete and conflicting coastlines remain unresolved',async()=>{const ring=[[20.07,20.07],[20.13,20.07],[20.13,20.13],[20.07,20.13],[20.07,20.07]];const x=await fixture([ring],'island');a.equal(x.region.coastline.landFaces,1);a.equal(x.region.coastline.waterFaces,1);const bad=await fixture([[[20.1,20.1],[20.1,20.3]]],'open');a.equal(bad.region.coastline.status,'UNRESOLVED');a.equal(bad.region.waterCells,0);const crossing=await fixture([[[20.1,19.9],[20.1,20.3]],[[19.9,20.1],[20.3,20.1]]],'crossing');a.equal(crossing.region.coastline.status,'UNRESOLVED');});
module.exports={fixture};

test('explicit estuary water connects to coastal sea without erasing surrounding land',async()=>{
 const geometry=[[20.02,20.08],[20.15,20.08],[20.15,20.12],[20.02,20.12],[20.02,20.08]].map(([lon,lat])=>({lon,lat}));
 const x=await fixture([[[20.1,19.9],[20.1,20.3]]],'estuary',{},[{type:'way',id:100,tags:{natural:'water'},geometry}]);
 const T=require('../src/water-area-route.cjs');T.configure([x.result.directory]);
 const p={id:'river',lat:20.1,lon:20.04,access:{lat:20.1,lon:20.04}},q={id:'sea',lat:20.1,lon:20.17,access:{lat:20.1,lon:20.17}},r=T.leg(p,q);
 a.ok(T.valid(r));a.ok(T.exclusionClear(p,q));a.equal(T.exclusionClear({lat:20.15,lon:20.02},{lat:20.15,lon:20.09}),false);T.configure([]);
});

test('adjacent prepared coastal tiles connect through verified overlap in both directions',async()=>{
 const line=[[[20.1,19.9],[20.1,20.5]]],first=await fixture(line,'south'),second=await fixture(line,'north',{south:20.2,north:20.4});
 const T=require('../src/water-area-route.cjs');T.configure([first.result.directory,second.result.directory]);
 const start={id:'south',lat:20.1,lon:20.15,access:{lat:20.1,lon:20.15}},end={id:'north',lat:20.3,lon:20.15,access:{lat:20.3,lon:20.15}};
 const time=performance.now(),r=T.leg(start,end),back=T.leg(end,start);a.ok(T.valid(r));a.deepEqual(r.points,[...back.points].reverse());a.ok(r.evidence.edgeEvidence.some(e=>e.kind==='AREAS'));console.log(JSON.stringify({bidirectionalRouteMs:performance.now()-time,rssBytes:process.memoryUsage().rss}));T.configure([]);
});

test('standalone executable works outside repository with no Python environment and matches reference masks',async()=>{
 const ring=(lo,hi)=>[[lo,lo],[hi,lo],[hi,hi],[lo,hi],[lo,lo]].map(([lon,lat])=>({lon,lat}));
 const extra=[{type:'relation',id:77,tags:{natural:'water',type:'multipolygon'},members:[{type:'way',ref:78,role:'outer',geometry:ring(20.01,20.19)},{type:'way',ref:79,role:'inner',geometry:ring(20.08,20.12)}]}];
 const x=await fixture([],'multipolygon',{},extra),dir=fs.mkdtempSync(path.join(os.tmpdir(),'nerds-standalone-')),out=path.join(dir,'standalone'),reference=path.join(dir,'reference');
 fs.writeFileSync(path.join(dir,'multipolygon-areas.json'),x.m.read(x.r));fs.writeFileSync(path.join(dir,'multipolygon-query.txt'),'controlled comparison');fs.writeFileSync(path.join(dir,'regions.json'),JSON.stringify({multipolygon:[19.98,19.98,20.22,20.22,.005]}));
 const {execFileSync}=require('node:child_process'),exe=path.resolve('work/preparation-runtime/nerds-geography/nerds-geography.exe'),args=['--regions',path.join(dir,'regions.json'),'--input-root',dir,'--output-root'];
 execFileSync(exe,[...args,out],{cwd:dir,env:{SystemRoot:process.env.SystemRoot,TEMP:dir,TMP:dir,PATH:process.env.SystemRoot+'\\System32'},windowsHide:true,timeout:30000});
 const python=process.env.NERDS_PREPARATION_PYTHON;a.ok(python,'Reference comparison needs configured development Python');execFileSync(python,[path.resolve('scripts/prepare-water-areas.py'),...args,reference],{windowsHide:true,timeout:30000});
 for(const name of ['multipolygon.bin.gz','multipolygon-exclusions.bin.gz','multipolygon.geojson.gz'])a.deepEqual(fs.readFileSync(path.join(out,name)),fs.readFileSync(path.join(reference,name)));
 const m=JSON.parse(fs.readFileSync(path.join(out,'manifest.json')));a.equal(m.regions[0].accepted.length,1);a.ok(m.regions[0].waterCells>0);
});

