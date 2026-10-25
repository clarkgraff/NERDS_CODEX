'use strict';
const {coverage}=require('./geographic-data.cjs'),preparation=require('./geographic-preparation.cjs');
function resolution(record,bytes,{maxCells=250000}={}){
 if(!Number.isInteger(maxCells)||maxCells<100||maxCells>2000000)throw Error('Invalid cell budget');
 const doc=JSON.parse(bytes),features=doc.elements||[],vertices=features.reduce((n,e)=>n+(e.geometry?.length||0)+(e.members||[]).reduce((n,m)=>n+(m.geometry?.length||0),0),0);
 const coast=features.some(e=>e.tags?.natural==='coastline'),water=features.some(e=>e.tags?.natural==='water'||e.tags?.waterway);
 const desired=coast||vertices>2000?.002:water?.005:.05,t=record.tile,area=(t.east-t.west+.04)*(t.north-t.south+.04),step=Math.max(desired,Math.sqrt(area/maxCells)*1.01);
 return {degrees:step,desiredDegrees:desired,budgetLimited:step>desired,vertices,coast,reason:coast?'COASTLINE':water?'MAPPED_WATER':'OPEN_OR_MISSING_EVIDENCE'};
}
function neighbors(tiles){const result=new Map();for(const t of tiles){const d=t.east-t.west;for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){const south=t.south+y*d;if(south< -90||south+d>90)continue;let west=t.west+x*d;if(west< -180)west+=360;if(west>=180)west-=360;const xx=Math.round((west+180)/d),yy=Math.round((south+90)/d),id=`d${d}-x${xx}-y${yy}`;result.set(id,{id,west,south,east:west+d,north:south+d,resolutionDegrees:d});}}return [...result.values()].sort((a,b)=>a.id.localeCompare(b.id));}
async function evaluate(directories,points){const T=require('./water-area-route.cjs');T.configure(directories);const legs=[];for(let i=1;i<points.length;i++){try{const r=T.leg(points[i-1],points[i]);if(!T.valid(r))throw Error('Unverified geographic evidence');legs.push({status:'CONNECTED',...r});}catch(e){legs.push({status:'UNRESOLVED',reason:e.message});}}return {connected:legs.length>0&&legs.every(l=>l.status==='CONNECTED'),legs};}
async function expand(manager,points,{provider,online=false,signal,prepareOptions={},degrees=.25,maxTiles=36,maxDownloads=12,maxRounds=2,maxMs=120000,maxBytes=8000000,assess=evaluate,prepare=preparation.prepare}={}){
 for(const [value,limit]of [[maxTiles,256],[maxDownloads,64],[maxRounds,8],[maxMs,600000],[maxBytes,64000000]])if(!Number.isInteger(value)||value<1||value>limit)throw Error('Invalid expansion budget');
 const callerSignal=signal;signal=AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(maxMs)]);
 const start=performance.now(),visited=new Map(),events=[];let frontier=coverage(points,{degrees,maxTiles}),downloads=0,result={connected:false},stop='ROUND_LIMIT';
 try{for(let round=0;round<maxRounds;round++){
  signal?.throwIfAborted();
  for(const tile of frontier){if(visited.has(tile.id))continue;if(visited.size>=maxTiles){stop='TILE_LIMIT';break;}if(performance.now()-start>=maxMs){stop='TIME_LIMIT';break;}
   const cached=manager.inventory([tile],provider.id)[0].status==='SOURCE_READY';if(!cached&&downloads>=maxDownloads){stop='DOWNLOAD_LIMIT';break;}
   visited.set(tile.id,tile);signal?.throwIfAborted();if(!cached&&online)downloads++;
   try{const record=await manager.acquire(tile,provider,{online,signal,attempts:1,maxBytes,timeoutMs:Math.max(1,Math.min(55000,maxMs-(performance.now()-start)))}),detail=resolution(record,manager.read(record)),ready=await prepare(manager,record,{...prepareOptions,resolution:detail.degrees,signal});events.push({tile:tile.id,round,cacheHit:record.cacheHit,preparedCacheHit:ready.cacheHit,detail,directory:ready.directory,status:'PREPARED'});}
   catch(e){events.push({tile:tile.id,round,status:'UNRESOLVED',reason:e.message});if(signal?.aborted)throw e;if(/HTTP (406|429|403)/.test(e.message)){stop='PROVIDER_UNAVAILABLE';break;}}
  }
  result=await assess(preparation.prepared(manager),points);if(result.connected){stop='CONNECTED';break;}if(stop!=='ROUND_LIMIT')break;
  frontier=neighbors([...visited.values()]).filter(t=>!visited.has(t.id));if(!frontier.length){stop='NO_MORE_COVERAGE';break;}
 }}catch(e){if(!signal?.aborted)throw e;stop=callerSignal?.aborted?'CANCELLED':'TIME_LIMIT';}
 return {status:stop==='CONNECTED'?'CONNECTED':'UNRESOLVED',stop,events,result,downloads,tiles:visited.size,elapsedMs:performance.now()-start,rssBytes:process.memoryUsage().rss};
}
module.exports={resolution,neighbors,expand};
