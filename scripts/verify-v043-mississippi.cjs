'use strict';
// One bounded live retrieval; isolated NERDS cache, no installed/user data writes.
const fs=require('node:fs'),path=require('node:path'),{Worker}=require('node:worker_threads');
const {GeographicDataManager}=require('../src/geographic-data.cjs');
const prep=require('../src/geographic-preparation.cjs');
const output=path.resolve('docs/v0.4.3/priority2/mississippi-targeted.json');
const report={date:new Date().toISOString(),waypoints:[{id:'new-orleans',name:'New Orleans',lat:29.9511,lon:-90.0715},{id:'baton-rouge',name:'Baton Rouge',lat:30.4515,lon:-91.1871}],retrieval:'FAIL',acquisitionAndCaching:'FAIL',automaticRouting:'FAIL',requests:0};
const save=()=>fs.writeFileSync(output,JSON.stringify(report,null,2));
(async()=>{
 const manager=new GeographicDataManager(path.resolve('work/v043-priority2-geography'));
 const provider=require('../src/geographic-providers.cjs').osmHydrography(async(url,options)=>{
  report.requests++;report.request={url,method:options.method,query:options.body.get('data'),headers:{Accept:'application/json','User-Agent':'NERDS/0.4.3 geographic-connectivity-test'}};save();
  const response=await fetch(url,{...options,headers:report.request.headers,redirect:'error'});
  report.response={status:response.status,headers:Object.fromEntries(response.headers)};
  if(!response.ok)report.response.body=(await response.clone().text()).slice(0,2000);
  return response;
 });
 provider.source='https://overpass.private.coffee/api/interpreter';
 const tile={id:'mississippi-new-orleans-baton-rouge',west:-91.5,south:29.8,east:-89.9,north:30.6};
 let directories=[];
 const started=performance.now();
 try{
  const record=await manager.acquire(tile,provider,{online:true,attempts:1,timeoutMs:60000,maxBytes:64000000});
  report.retrieval='PASS';report.record=record;
  const offline=await new GeographicDataManager(manager.root).acquire(tile,provider,{online:false});
  report.offlineReuse=offline.cacheHit&&offline.sha256===record.sha256;
  report.acquisitionAndCaching=report.offlineReuse?'PASS':'FAIL';save();
  const detail=require('../src/adaptive-geography.cjs').resolution(record,manager.read(record));
  const ready=await prep.prepare(manager,record,{resolution:detail.degrees});
  directories=prep.prepared(manager);report.preparation={...ready,detail};
 }catch(e){report.acquisitionError=e.message;report.cause=e.cause?.message;}
 report.retrievalMs=performance.now()-started;save();
 const state=require('../src/core.cjs').emptyState();state.waypoints=report.waypoints;
 const options={bypass:true,refine:true,preparedGeography:directories};
 const routeStart=performance.now();
 const result=await new Promise(resolve=>{
  const worker=new Worker(path.resolve('src/route-worker.cjs'),{workerData:{state,options}});
  const timer=setTimeout(()=>{worker.terminate();resolve({error:'ROUTING_SEARCH_TIMEOUT_90_SECONDS'});},90000);
  worker.once('message',r=>{clearTimeout(timer);resolve(r);});
  worker.once('error',e=>{clearTimeout(timer);resolve({error:e.message});});
 });
 report.routingMs=performance.now()-routeStart;
 fs.writeFileSync(path.resolve('docs/v0.4.3/priority2/mississippi-route.json'),JSON.stringify(result,null,2));
 report.route={error:result.error,complete:result.complete,totalNM:result.totalNM,knownDistanceNM:result.knownDistanceNM,legs:result.legs?.map(l=>({status:l.status,reason:l.reason,error:l.error,distanceNM:l.distanceNM,vertices:l.points?.length,evidence:l.evidence})),connectors:result.connectors};
 report.waterGeometryValidated=result.legs?.length===1&&require('../test/geographic-validation.cjs').geometry(result.legs[0]);
 report.automaticRouting=result.complete===true&&report.waterGeometryValidated&&result.legs[0].status==='CALCULATED'&&(result.connectors||[]).every(c=>c.status==='COINCIDENT')?'PASS':'FAIL';
 report.routingCriterion='Only the two destination waypoints; connected source-supported course, no unresolved legs or transfers. Imagery is not routing evidence.';
 save();console.log(JSON.stringify(report,null,2));
})().catch(e=>{report.fatal=e.message;save();console.error(e);process.exitCode=1;});
