const {app,BrowserWindow,ipcMain,session,dialog,Menu,shell,nativeImage}=require('electron');
const {Worker}=require('node:worker_threads');
const projects=require('./projects.cjs');
const formats=require('./exports.cjs');
const {cleanVessel,estimateHullSpeed}=require('./vessel.cjs');
const {calculate}=require('./navigation.cjs');
const {suggest}=require('./water-route.cjs');
const gazetteer=require('./gazetteer.cjs');
const {cleanLayers}=require('./layers.cjs');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID,createHash}=require('node:crypto');
const exifr=require('exifr');
const {openStore,lookup,missions,localEndpoint}=require('./core.cjs');
const root=path.resolve(__dirname,'..');
let win,store,config,configFile,httpServer,appBase,appURL;
let routing=false;
const markDirty=()=>store.put('project',{...store.get('project',{path:null}),dirty:true});
const projectInfo=()=>{const p=store.get('project',{path:null,dirty:false});return {...p,name:p.path?path.basename(p.path,path.extname(p.path)):'UNTITLED PROJECT'};};
async function saveProject(as=false){let file=projectInfo().path;if(as||!file){const r=await dialog.showSaveDialog(win,{defaultPath:file||'Expedition.nerds',filters:[{name:'NERDS project',extensions:['nerds']}]});if(r.canceled)return false;file=r.filePath;if(!file.toLowerCase().endsWith('.nerds'))file+='.nerds';}projects.write(file,projects.snapshot(store));store.put('project',{path:file,dirty:false});return true;}
async function mayReplace(){if(!projectInfo().dirty)return true;const r=await dialog.showMessageBox(win,{type:'question',message:'Save the current project before continuing?',buttons:['Save','Discard changes','Cancel'],defaultId:0,cancelId:2});return r.response===1||(r.response===0&&await saveProject());}
const resourcePrefix='/'+randomUUID()+'/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.wasm':'application/wasm','.gif':'image/gif'};
// Cesium's bundled codecs use generated functions and WebAssembly. Script sources
// remain local-only; renderer networking, navigation and Node access are denied.
const csp="default-src 'self'; script-src 'self' blob: 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' blob:; worker-src 'self' blob:; font-src 'self' data:; object-src 'none'; base-uri 'none'; frame-src 'none'";
function saveConfig(){fs.writeFileSync(configFile+'.tmp',JSON.stringify(config,null,2));fs.renameSync(configFile+'.tmp',configFile);}
function handle(name,fn){ipcMain.handle(name,async(event,...args)=>{if(event.sender!==win.webContents||event.senderFrame?.url!==appURL)throw Error('Untrusted caller');return fn(...args);});}
async function apiRequest(endpoint,suffix,options={}) {
  const response=await fetch(localEndpoint(endpoint)+suffix,{...options,signal:AbortSignal.timeout(15000),redirect:'error'});
  if(!response.ok)throw Error(`4nR-AI returned HTTP ${response.status}.`);
  const text=await response.text();if(text.length>2000000)throw Error('API response exceeded 2 MB.');
  return JSON.parse(text);
}
async function importPaths(paths,waypointId) {
  if(waypointId && !store.read().waypoints.some(w=>w.id===waypointId))throw Error('Select an existing waypoint.');
  const results=[];
  for(const file of paths){try{
    const stat=fs.statSync(file);if(!stat.isFile()||stat.size>100*1024*1024)throw Error('Image must be a file smaller than 100 MB.');
    const meta=await exifr.parse(file,{gps:true,exif:true,tiff:true,xmp:true,iptc:true})||{};
    const hasGPS=Number.isFinite(meta.latitude)&&Number.isFinite(meta.longitude)&&Math.abs(meta.latitude)<=90&&Math.abs(meta.longitude)<=180;
    const safe=JSON.parse(JSON.stringify(meta,(_,v)=>typeof v==='bigint'?String(v):v));
    const item={id:randomUUID(),source_path:path.resolve(file),name:path.basename(file),lat:hasGPS?meta.latitude:null,lon:hasGPS?meta.longitude:null,waypoint_id:waypointId||null,metadata:{...safe,fileSize:stat.size,fileModified:stat.mtime.toISOString()},imported_at:new Date().toISOString()};
    store.addMedia(item);markDirty();results.push({name:item.name,gps:hasGPS});
  }catch(error){results.push({name:path.basename(file),error:error.message});}}
  return {results,media:store.media()};
}
app.whenReady().then(async()=>{
  const home=process.env.NERDS_DATA_DIR?path.join(process.env.NERDS_DATA_DIR,'app-config'):app.getPath('userData');fs.mkdirSync(home,{recursive:true});
  configFile=path.join(home,'config.json');
  config=fs.existsSync(configFile)?JSON.parse(fs.readFileSync(configFile,'utf8')):{};
  config.dataDir=process.env.NERDS_DATA_DIR||config.dataDir||path.join(home,'data');
  config.cacheDir=config.cacheDir||path.join(config.dataDir,'cache');config.archiveDir=config.archiveDir||path.join(config.dataDir,'archive');
  store=openStore(config.dataDir);for(const key of ['cacheDir','archiveDir'])fs.mkdirSync(config[key],{recursive:true});
  const resourceResponse=async request=>{
    try{
      const url=new URL(request.url,appBase);if(!url.pathname.startsWith(resourcePrefix)||request.headers.host!==new URL(appBase).host||request.method!=='GET')return new Response('Not found',{status:404});
      const route='/'+decodeURIComponent(url.pathname.slice(resourcePrefix.length));
      let file;
      if(route.startsWith('/media/')){
        const item=store.media().find(m=>m.id===route.slice(7));
        if(!item||!['.jpg','.jpeg','.png','.webp','.gif'].includes(path.extname(item.source_path).toLowerCase()))return new Response('No preview',{status:404});
        file=item.source_path;
      }else{
        const base=route.startsWith('/cesium/')?path.join(root,'node_modules','cesium','Build','Cesium'):route.startsWith('/assets/')?path.join(root,'assets'):path.join(root,'src','public');
        const relative=route.replace(/^\/(cesium|assets)\//,'/');file=path.resolve(base,'.'+relative);
        if(!file.startsWith(base+path.sep))return new Response('Forbidden',{status:403});
      }
      const data=await fs.promises.readFile(file);
      return new Response(data,{headers:{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'}});
    }catch{return new Response('Not found',{status:404});}
  };
  httpServer=http.createServer(async(req,res)=>{try{const response=await resourceResponse(req);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Resource unavailable');}});
  await new Promise((resolve,reject)=>{httpServer.once('error',reject);httpServer.listen(0,'127.0.0.1',resolve);});
  appBase=`http://127.0.0.1:${httpServer.address().port}${resourcePrefix}`;appURL=appBase+'index.html';
  // The renderer cannot acquire remote content. Deliberate local inference calls run in the main process.
  session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith(appBase)&&! /^(devtools:|blob:|data:)/.test(details.url)}));
  session.defaultSession.setPermissionRequestHandler((_,__,callback)=>callback(false));
  const command=action=>win?.webContents.send('command',action);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
   {label:'File',submenu:[{label:'New project',accelerator:'CmdOrCtrl+N',click:()=>command('new')},{label:'Open project…',accelerator:'CmdOrCtrl+O',click:()=>command('open')},{label:'Save project',accelerator:'CmdOrCtrl+S',click:()=>command('save')},{label:'Save project as…',accelerator:'CmdOrCtrl+Shift+S',click:()=>command('save-as')},{type:'separator'},{label:'Export expedition…',click:()=>command('export')},{role:'quit'}]},
   {label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{type:'separator'},{label:'Preferences — Vessel…',click:()=>command('vessel')},{label:'Preferences — Storage…',click:()=>command('settings')}]},
   {label:'Help',submenu:[{label:'About NERDS',click:()=>dialog.showMessageBox(win,{title:'About NERDS',message:'NERDS '+app.getVersion(),detail:'© 2026 4nR TeK Inc. All rights reserved.\nCreated by Clark Graff.\n\nExpedition research software. Water outlines are experimental and are not navigable routes.\n\nCesiumJS: Apache-2.0. Electron: MIT and bundled Chromium notices. Natural Earth: public domain. See THIRD-PARTY-NOTICES.txt in the application resources.'})}]}
  ]));
  win=new BrowserWindow({width:1500,height:980,minWidth:1120,minHeight:760,title:'NERDS · Faire Wind & Song',icon:path.join(root,'assets','nerds.ico'),backgroundColor:'#0b141c',show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  handle('load',()=>({state:store.read(),project:projectInfo(),profiles:store.get('vesselProfiles',[]),gazetteer:require('../assets/gazetteer-manifest.json'),missions,media:store.media(),config,version:app.getVersion(),ai:store.get('ai',{endpoint:'http://127.0.0.1:1234/v1',model:''})}));
  handle('save',state=>{const valid=store.save(state);markDirty();return valid;});
  handle('project',async action=>{
   if(['save','save-as'].includes(action)){if(!await saveProject(action==='save-as'))return null;}
   else if(action==='new'){if(!await mayReplace())return null;projects.replace(store,projects.blank());store.put('project',{path:null,dirty:false});}
   else if(action==='open'){const r=await dialog.showOpenDialog(win,{filters:[{name:'NERDS project',extensions:['nerds']}],properties:['openFile']});if(r.canceled)return null;const doc=projects.read(r.filePaths[0]);if(!await mayReplace())return null;projects.replace(store,doc);store.put('project',{path:r.filePaths[0],dirty:false});}
   else throw Error('Unknown project action.');
   return {state:store.read(),media:store.media(),project:projectInfo()};
  });
  handle('vessel-profile',v=>{const clean=cleanVessel(v);if(!clean.name)throw Error('Name the vessel before saving a profile.');const profiles=store.get('vesselProfiles',[]).filter(p=>p.name!==clean.name);profiles.push(clean);store.put('vesselProfiles',profiles);return profiles;});
  handle('hull-speed',v=>estimateHullSpeed(v));
  handle('commit-vessel',v=>{const clean=cleanVessel(v);const next={...store.read(),vessel:clean,route:null};store.db.exec('BEGIN');try{const result=store.save(next);const profiles=store.get('vesselProfiles',[]).filter(p=>p.name!==clean.name);if(clean.name)profiles.push(clean);store.put('vesselProfiles',profiles);markDirty();store.db.exec('COMMIT');return {state:result,profiles};}catch(e){store.db.exec('ROLLBACK');throw e;}});
  handle('save-config',draft=>{const next={...config};for(const key of ['dataDir','cacheDir','archiveDir']){if(typeof draft[key]!=='string'||!fs.statSync(draft[key]).isDirectory())throw Error('Select an existing directory.');next[key]=draft[key];}next.logo=cleanVessel({imageData:draft.logo}).imageData;const url=new URL(draft.geocoderUrl||'https://nominatim.openstreetmap.org/search');if(url.protocol!=='https:'||url.username||url.password)throw Error('Use an HTTPS geocoder URL without credentials.');next.geocoderUrl=url.href;config=next;saveConfig();return config;});
  handle('save-ai',value=>{const ai={endpoint:localEndpoint(value.endpoint),model:String(value.model||'').slice(0,200)};store.put('ai',ai);return ai;});
  handle('close-ready',()=>{win.destroy();app.quit();});
  win.on('close',event=>{event.preventDefault();win.webContents.send('command','close');});
  handle('image',async kind=>{if(!['logo','vessel'].includes(kind))throw Error('Unknown image type.');const r=await dialog.showOpenDialog(win,{filters:[{name:'Image',extensions:['png','jpg','jpeg']}],properties:['openFile']});if(r.canceled)return null;if(fs.statSync(r.filePaths[0]).size>20*1024*1024)throw Error('Choose an image below 20 MB.');let img=nativeImage.createFromPath(r.filePaths[0]);if(img.isEmpty())throw Error('Image could not be read.');const size=img.getSize();if(size.width>512||size.height>512)img=img.resize(size.width>=size.height?{width:512}:{height:512});const data=img.toDataURL();return data;});
  handle('website',()=>shell.openExternal('https://www.4nr.com'));
  handle('suggest-access',id=>{const w=store.read().waypoints.find(w=>w.id===id);if(!w)throw Error('Save this waypoint first.');return suggest(w);});
  handle('calculate',async()=>{const s=store.read();if(routing)throw Error('A calculation is already running.');routing=true;try{return await new Promise((resolve,reject)=>{const worker=new Worker(path.join(__dirname,'route-worker.cjs'),{workerData:s});const timer=setTimeout(()=>{worker.terminate();reject(Error('Route search timed out. Add intermediate offshore waypoints.'));},90000);worker.once('message',r=>{clearTimeout(timer);r.error?reject(Error(r.error)):resolve(r);});worker.once('error',e=>{clearTimeout(timer);reject(e);});worker.once('exit',code=>{clearTimeout(timer);if(code)reject(Error('Route worker stopped.'));});});}finally{routing=false;}});
  handle('lookup',q=>lookup(String(q).slice(0,200)));
  handle('lookup-online',async q=>{const cache=store.get('onlineLookupCache',{});if(Object.hasOwn(cache,q))return cache[q];const results=await gazetteer.online(q,fetch,config.geocoderUrl||'https://nominatim.openstreetmap.org/search');cache[q]=results;store.put('onlineLookupCache',Object.fromEntries(Object.entries(cache).slice(-500)));return results;});
  handle('import-layers',async()=>{const r=await dialog.showOpenDialog(win,{title:'Import optional external map layers',filters:[{name:'NERDS layer exchange',extensions:['json']}],properties:['openFile']});if(r.canceled)return null;if(fs.statSync(r.filePaths[0]).size>20*1024*1024)throw Error('Layer file exceeds 20 MB.');const bytes=fs.readFileSync(r.filePaths[0]);const doc=JSON.parse(bytes.toString('utf8'));const sha256=createHash('sha256').update(bytes).digest('hex');return cleanLayers((doc.layers||[doc]).map(l=>({...l,sha256,importedAt:new Date().toISOString()})));});
  handle('import',async id=>{const result=await dialog.showOpenDialog(win,{title:'Index photographs (originals stay in place)',properties:['openFile','multiSelections'],filters:[{name:'Photographs',extensions:['jpg','jpeg','tif','tiff','png','webp']}]});return result.canceled?{results:[],media:store.media()}:importPaths(result.filePaths,id);});
  handle('choose-path',async kind=>{
    if(!['dataDir','cacheDir','archiveDir'].includes(kind))throw Error('Unknown storage path.');
    const result=await dialog.showOpenDialog(win,{title:kind==='dataDir'?'Choose database folder (takes effect next launch; does not move existing data)':'Choose storage folder',properties:['openDirectory','createDirectory']});
    return result.canceled?null:{kind,path:result.filePaths[0]};
  });
  handle('ai-test',async endpoint=>{const base=localEndpoint(endpoint);const result=await apiRequest(base,'/models');if(!Array.isArray(result.data))throw Error('Expected an OpenAI-compatible /models response.');const models=result.data.map(m=>String(m.id));return models;});
  handle('ai-chat',async({endpoint,model,prompt})=>{
    if(typeof model!=='string'||!model||typeof prompt!=='string'||!prompt.trim()||prompt.length>8000)throw Error('Select a model and enter a prompt of at most 8,000 characters.');
    const result=await apiRequest(endpoint,'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'system',content:'You are 4nR-AI, a research assistant for Faire Wind & Song. You do not calculate navigable routes. Distinguish uncertain information from verified facts.'},{role:'user',content:prompt}],max_tokens:512,stream:false})});
    const answer=result.choices?.[0]?.message?.content;if(typeof answer!=='string')throw Error('No text response from the model.');return answer;
  });
  handle('archive',async({mediaId,sourceUrl,license})=>{
    const item=store.media().find(m=>m.id===mediaId);
    if(!item||typeof license!=='string'||!license.trim()||license.length>2000)throw Error('Select an indexed image and record its reuse permission.');
    const url=new URL(sourceUrl);if(!['https:','http:'].includes(url.protocol))throw Error('Enter the original source URL.');
    fs.mkdirSync(config.archiveDir,{recursive:true});
    const bytes=await fs.promises.readFile(item.source_path);const sha256=createHash('sha256').update(bytes).digest('hex');
    const dest=path.join(config.archiveDir,sha256+path.extname(item.source_path).toLowerCase());
    if(!fs.existsSync(dest))await fs.promises.writeFile(dest,bytes,{flag:'wx'});
    store.db.prepare('INSERT INTO acquisitions VALUES (?,?,?,?,?,?,?,?)').run(randomUUID(),'manual-permitted-image',url.href,license.trim(),dest,sha256,'verified',new Date().toISOString());
    markDirty();
    return {path:dest,sha256};
  });
  handle('export',async(format='json')=>{if(!['json','kml','kmz','gpx'].includes(format))throw Error('Unknown export format.');const result=await dialog.showSaveDialog(win,{defaultPath:projectInfo().name+'.'+format,filters:[{name:format.toUpperCase(),extensions:[format]}]});if(result.canceled)return false;const s=store.read(),name=projectInfo().name;const data=format==='json'?JSON.stringify(projects.snapshot(store),null,2):format==='gpx'?formats.gpx(s,name):format==='kmz'?formats.kmz(formats.kml(s,name)):formats.kml(s,name);await fs.promises.writeFile(result.filePath,data);return true;});
  await win.loadURL(appURL);win.show();
}).catch(error=>{dialog.showErrorBox('NERDS startup failed',error.stack||error.message);app.quit();});
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>{httpServer?.close();store?.close();});
module.exports={importPaths};
