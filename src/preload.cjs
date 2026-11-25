const {contextBridge,ipcRenderer}=require('electron');
let operationId=0;const observers=new Set();const names={'lookup':'Searching geographic database','lookup-online':'Searching online geography','calculate':'Calculating route / waterway connectivity','geographic-expand':'Acquiring / preparing geographic coverage','geographic-acquire':'Acquiring geographic sources','geographic-surfaces':'Loading mapped water boundaries','path-coarse':'Calculating coarse geodesic'};
async function invoke(name,...args){if(!names[name])return ipcRenderer.invoke(name,...args);const id=++operationId,emit=status=>{for(const fn of observers)fn({id,name:names[name],status});};emit('ACTIVE');try{const result=await ipcRenderer.invoke(name,...args);emit(result?.status==='UNRESOLVED'?'UNRESOLVED':'COMPLETE');return result;}catch(error){emit(/cancel/i.test(error.message)?'CANCELLED':'FAILED');throw error;}}
contextBridge.exposeInMainWorld('nerds',{
 onRouteUpdate:fn=>ipcRenderer.on('route-update',(_,v)=>fn(v)),onStatusEvent:fn=>ipcRenderer.on('operation-event',(_,v)=>fn(v)),operationEvents:()=>invoke('operation-events'),recordEvent:e=>invoke('operation-record',e),routePriority:r=>invoke('route-priority',r),cancelLeg:id=>invoke('route-cancel',id),retryLeg:id=>invoke('route-retry',id),
 importCronkite:()=>invoke('import-cronkite'),
 copyProjects:()=>invoke('copy-projects'),
 roadSettings:request=>invoke('road-settings',request),roadStop:()=>invoke('road-stop'),
 precisionSync:request=>invoke('precision-sync',request),
 onRouteProgress:fn=>ipcRenderer.on('route-progress',(_,value)=>fn(value)),
 onOperation:fn=>{observers.add(fn);return ()=>observers.delete(fn);},
 geographicSurfaces:()=>invoke('geographic-surfaces'),
 geographicExpand:request=>invoke('geographic-expand',request),geographicCoverage:options=>invoke('geographic-coverage',options),geographicAcquire:request=>invoke('geographic-acquire',request),pathCoarse:options=>invoke('path-coarse',options),
 load:()=>invoke('load'),save:s=>invoke('save',s),lookup:q=>invoke('lookup',q),
 importPhotos:id=>invoke('import',id),choosePath:kind=>invoke('choose-path',kind),
 testAI:endpoint=>invoke('ai-test',endpoint),askAI:request=>invoke('ai-chat',request),
 archive:request=>invoke('archive',request),export:format=>invoke('export',format),
 displayOnline:online=>invoke('display-online',online),displayStatus:()=>invoke('display-status'),
 project:action=>invoke('project',action),onCommand:fn=>ipcRenderer.on('command',(_,action)=>fn(action)),
 saveVesselProfile:v=>invoke('vessel-profile',v),hullSpeed:v=>invoke('hull-speed',v),
 image:kind=>invoke('image',kind),website:()=>invoke('website'),
 acceptDiscovery:p=>invoke('accept-discovery',p),lookupOnline:q=>invoke('lookup-online',q),importLayers:()=>invoke('import-layers'),commitVessel:v=>invoke('commit-vessel',v),saveConfig:c=>invoke('save-config',c),saveAI:v=>invoke('save-ai',v),closeReady:()=>invoke('close-ready'),
 suggestAccess:id=>invoke('suggest-access',id),calculate:options=>invoke('calculate',options)
});
