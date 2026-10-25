'use strict';
// Development entry point: explicit online opt-in, bounded sequential acquisition.
const fs=require('node:fs');
const {coverage,GeographicDataManager}=require('../src/geographic-data.cjs');
const {prepare,prepared}=require('../src/geographic-preparation.cjs');
async function run(request){
 const manager=new GeographicDataManager(request.cacheDirectory),tiles=coverage(request.points,request.coverage),provider=require('../src/geographic-providers.cjs').osmHydrography();
 if(request.recover)manager.recover();
 const outcomes=[];
 for(const tile of tiles){
  try{const record=await manager.acquire(tile,provider,{online:request.online===true});const result=request.prepare?await prepare(manager,record,{python:request.python,resolution:request.resolution}):null;outcomes.push({tile:tile.id,source:'VALIDATED',download:record.cacheHit?'CACHE_REUSED':'DOWNLOADED',preparation:result?'PREPARED':'NOT_PREPARED',connectivity:'UNRESOLVED',...result});}
  catch(e){outcomes.push({tile:tile.id,status:'UNRESOLVED',error:e.message});}
 }
 const directories=prepared(manager);require('../src/water-area-route.cjs').configure(directories);
 return {outcomes,indexed:directories,connectivity:'Requires route-specific verification; indexing does not establish connectivity'};
}
if(require.main===module)run(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={run};
