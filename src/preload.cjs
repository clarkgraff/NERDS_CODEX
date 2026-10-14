const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('nerds',{
 load:()=>ipcRenderer.invoke('load'),save:s=>ipcRenderer.invoke('save',s),lookup:q=>ipcRenderer.invoke('lookup',q),
 importPhotos:id=>ipcRenderer.invoke('import',id),choosePath:kind=>ipcRenderer.invoke('choose-path',kind),
 testAI:endpoint=>ipcRenderer.invoke('ai-test',endpoint),askAI:request=>ipcRenderer.invoke('ai-chat',request),
 archive:request=>ipcRenderer.invoke('archive',request),export:()=>ipcRenderer.invoke('export')
});
