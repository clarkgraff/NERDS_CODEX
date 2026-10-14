const {app,BrowserWindow,ipcMain,session,dialog,Menu}=require('electron');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID,createHash}=require('node:crypto');
const exifr=require('exifr');
const {openStore,lookup,missions,localEndpoint}=require('./core.cjs');
const root=path.resolve(__dirname,'..');
let win,store,config,configFile,httpServer,appBase,appURL;
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
    store.addMedia(item);results.push({name:item.name,gps:hasGPS});
  }catch(error){results.push({name:path.basename(file),error:error.message});}}
  return {results,media:store.media()};
}
app.whenReady().then(async()=>{
  const home=app.getPath('userData');fs.mkdirSync(home,{recursive:true});
  configFile=path.join(home,'config.json');
  config=fs.existsSync(configFile)?JSON.parse(fs.readFileSync(configFile,'utf8')):{};
  config.dataDir=process.env.NERDS_DATA_DIR||config.dataDir||path.join(home,'data');
  config.cacheDir=config.cacheDir||path.join(config.dataDir,'cache');config.archiveDir=config.archiveDir||path.join(config.dataDir,'archive');
  store=openStore(config.dataDir);
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
  Menu.setApplicationMenu(null);
  win=new BrowserWindow({width:1500,height:980,minWidth:1120,minHeight:760,title:'NERDS · Faire Wind & Song',icon:path.join(root,'assets','nerds.ico'),backgroundColor:'#0b141c',show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  handle('load',()=>({state:store.read(),cities:lookup(''),missions,media:store.media(),config,version:app.getVersion(),ai:store.get('ai',{endpoint:'http://127.0.0.1:1234/v1',model:''})}));
  handle('save',state=>store.save(state));
  handle('lookup',q=>lookup(String(q).slice(0,200)));
  handle('import',async id=>{const result=await dialog.showOpenDialog(win,{title:'Index photographs (originals stay in place)',properties:['openFile','multiSelections'],filters:[{name:'Photographs',extensions:['jpg','jpeg','tif','tiff','png','webp']}]});return result.canceled?{results:[],media:store.media()}:importPaths(result.filePaths,id);});
  handle('choose-path',async kind=>{
    if(!['dataDir','cacheDir','archiveDir'].includes(kind))throw Error('Unknown storage path.');
    const result=await dialog.showOpenDialog(win,{title:kind==='dataDir'?'Choose database folder (takes effect next launch; does not move existing data)':'Choose storage folder',properties:['openDirectory','createDirectory']});
    if(!result.canceled){config[kind]=result.filePaths[0];saveConfig();}
    return {...config,restartRequired:kind==='dataDir'&&!result.canceled};
  });
  handle('ai-test',async endpoint=>{const base=localEndpoint(endpoint);const result=await apiRequest(base,'/models');if(!Array.isArray(result.data))throw Error('Expected an OpenAI-compatible /models response.');const models=result.data.map(m=>String(m.id));store.put('ai',{endpoint:base,model:models[0]||''});return models;});
  handle('ai-chat',async({endpoint,model,prompt})=>{
    if(typeof model!=='string'||!model||typeof prompt!=='string'||!prompt.trim()||prompt.length>8000)throw Error('Select a model and enter a prompt of at most 8,000 characters.');
    const result=await apiRequest(endpoint,'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'system',content:'You are 4nR-AI, a research assistant for Faire Wind & Song. You do not calculate navigable routes. Distinguish uncertain information from verified facts.'},{role:'user',content:prompt}],max_tokens:512,stream:false})});
    const answer=result.choices?.[0]?.message?.content;if(typeof answer!=='string')throw Error('No text response from the model.');store.put('ai',{endpoint:localEndpoint(endpoint),model});return answer;
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
    return {path:dest,sha256};
  });
  handle('export',async()=>{const result=await dialog.showSaveDialog(win,{defaultPath:'NERDS-expedition.json',filters:[{name:'JSON',extensions:['json']}]});if(!result.canceled)await fs.promises.writeFile(result.filePath,JSON.stringify({version:app.getVersion(),state:store.read(),media:store.media()},null,2));return !result.canceled;});
  await win.loadURL(appURL);win.show();
}).catch(error=>{dialog.showErrorBox('NERDS startup failed',error.stack||error.message);app.quit();});
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>{httpServer?.close();store?.close();});
module.exports={importPaths};
