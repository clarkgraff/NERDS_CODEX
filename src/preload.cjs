const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('nerds',{
 load:()=>ipcRenderer.invoke('load'),save:s=>ipcRenderer.invoke('save',s),lookup:q=>ipcRenderer.invoke('lookup',q),
 importPhotos:id=>ipcRenderer.invoke('import',id),choosePath:kind=>ipcRenderer.invoke('choose-path',kind),
 testAI:endpoint=>ipcRenderer.invoke('ai-test',endpoint),askAI:request=>ipcRenderer.invoke('ai-chat',request),
 archive:request=>ipcRenderer.invoke('archive',request),export:format=>ipcRenderer.invoke('export',format),
 project:action=>ipcRenderer.invoke('project',action),onCommand:fn=>ipcRenderer.on('command',(_,action)=>fn(action)),
 saveVesselProfile:v=>ipcRenderer.invoke('vessel-profile',v),hullSpeed:v=>ipcRenderer.invoke('hull-speed',v),
 image:kind=>ipcRenderer.invoke('image',kind),website:()=>ipcRenderer.invoke('website'),
 lookupOnline:q=>ipcRenderer.invoke('lookup-online',q),importLayers:()=>ipcRenderer.invoke('import-layers'),commitVessel:v=>ipcRenderer.invoke('commit-vessel',v),saveConfig:c=>ipcRenderer.invoke('save-config',c),saveAI:v=>ipcRenderer.invoke('save-ai',v),closeReady:()=>ipcRenderer.invoke('close-ready'),
 suggestAccess:id=>ipcRenderer.invoke('suggest-access',id),calculate:()=>ipcRenderer.invoke('calculate')
});
