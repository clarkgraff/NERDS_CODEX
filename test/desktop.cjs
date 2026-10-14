// Uses the actual Electron runtime; no separate browser download is needed.
const {_electron}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const root=path.resolve(__dirname,'..');
const testDir=fs.mkdtempSync(path.join(os.tmpdir(),'nerds-desktop-'));
const artifacts=path.join(root,'test-results');fs.mkdirSync(artifacts,{recursive:true});
let desktop,server,lastPage;const errors=[];
function gpsJpeg(jpeg){
 const t=Buffer.alloc(128);t.write('II');t.writeUInt16LE(42,2);t.writeUInt32LE(8,4);t.writeUInt16LE(1,8);
 t.writeUInt16LE(0x8825,10);t.writeUInt16LE(4,12);t.writeUInt32LE(1,14);t.writeUInt32LE(26,18);t.writeUInt16LE(4,26);
 const entry=(at,tag,type,count,value)=>{t.writeUInt16LE(tag,at);t.writeUInt16LE(type,at+2);t.writeUInt32LE(count,at+4);t.writeUInt32LE(value,at+8);};
 entry(28,1,2,2,78);entry(40,2,5,3,80);entry(52,3,2,2,69);entry(64,4,5,3,104);
 [53,33,4,9,59,37].forEach((n,i)=>{t.writeUInt32LE(n,80+i*8);t.writeUInt32LE(1,84+i*8);});
 const exif=Buffer.concat([Buffer.from('Exif\0\0'),t]);const header=Buffer.alloc(4);header.writeUInt16BE(0xffe1);header.writeUInt16BE(exif.length+2,2);
 return Buffer.concat([jpeg.subarray(0,2),header,exif,jpeg.subarray(2)]);
}
async function launch(){
 const env={...process.env,NERDS_DATA_DIR:path.join(testDir,'data')};delete env.ELECTRON_RUN_AS_NODE;
 desktop=await _electron.launch({executablePath:process.env.NERDS_TEST_EXECUTABLE||require('electron'),args:process.env.NERDS_TEST_EXECUTABLE?[]:[root],env,timeout:60000});
 const page=await desktop.firstWindow();lastPage=page;page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.error('Renderer:',m.text());});
 page.on('requestfailed',r=>console.error('Request failed:',r.url(),r.failure()));
 try{await page.waitForFunction(()=>window.nerdsReady===true,{},{timeout:30000});}catch(e){console.error('Startup status:',await page.locator('body').innerText());console.error('Page errors:',errors);await page.screenshot({path:path.join(artifacts,'startup-failure.png')});throw e;}return page;
}
(async()=>{
 let page=await launch();
 assert.equal(await page.locator('.waypoint').count(),5);
 assert.equal(await page.locator('#map-status').textContent(),'Local Natural Earth basemap');
 await page.waitForFunction(()=>viewer.scene.globe.tilesLoaded && viewer.scene.globe._surface._tilesToRender.length>0);
 assert.equal(await page.evaluate(()=>viewer.scene.globe._surface._tilesToRender.length>0),true);
 await page.screenshot({path:path.join(artifacts,'globe.png')});
 await page.locator('#pin').click();await page.locator('#globe-view').click({position:{x:300,y:260}});await page.locator('#edit-name').fill('Test map pin');await page.locator('#edit-form button[type=submit]').click();await page.waitForFunction(()=>state.waypoints.length===6);await page.locator('.waypoint.selected button.remove').click();await page.waitForFunction(()=>state.waypoints.length===5);
 await page.locator('#city').fill('Rotterdam');await page.locator('#add-form button').click();await page.waitForFunction(()=>state.waypoints.length===6);
 await page.locator('.waypoint.selected').getByRole('button',{name:'Edit',exact:true}).click();await page.locator('#edit-name').fill('Rotterdam test');await page.locator('#edit-form button[type=submit]').click();
 await page.locator('#notes').fill('Persistent expedition research note.');
 await page.locator('.waypoint.selected').getByTitle('Move waypoint up').click();
 await page.locator('.waypoint.selected').getByTitle('Move waypoint down').click();
 await page.locator('#mission').selectOption('SURVEYOR – HISTORY');assert.equal(await page.locator('#mission-placeholder').isVisible(),true);await page.locator('#return-route').click();
 await page.locator('#mercator').click();assert.equal(await page.evaluate(()=>viewer.scene.mode),2);assert.equal(await page.evaluate(()=>viewer.scene.mapProjection instanceof Cesium.WebMercatorProjection),true);
 await page.screenshot({path:path.join(artifacts,'mercator.png')});
 await page.locator('#globe-view').click({button:'right',position:{x:100,y:150}});await page.locator('[data-mode="BY-AIR"]').click();assert.equal(await page.locator('#transport').textContent(),'BY-AIR');
 await page.locator('#speed').selectOption('BEST-SAILING');await page.locator('#departure').fill('2026-11-01T08:30');await page.locator('#departure').blur();
 // Renderer is denied all external fetches even while Internet is physically connected.
 assert.equal(await page.evaluate(async()=>{try{await fetch('https://example.com/');return false;}catch{return true;}}),true);
 const jpeg=Buffer.from(await desktop.evaluate(({nativeImage,app})=>Array.from(nativeImage.createFromPath(app.getAppPath()+'/assets/nerds.png').toJPEG(80))));
 assert.equal(jpeg.readUInt16BE(0),0xffd8);
 const photo=path.join(testDir,'gps-photo.jpg');fs.writeFileSync(photo,gpsJpeg(jpeg));const noGps=path.join(testDir,'plain-photo.jpg');fs.writeFileSync(noGps,jpeg);
 await desktop.evaluate(({dialog},paths)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:paths});},[photo,noGps]);
 await page.locator('#import').click();await page.waitForFunction(()=>media.length===2);
 const indexed=await page.evaluate(()=>media);assert.equal(indexed.filter(m=>m.lat!==null).length,1);assert.ok(Math.abs(indexed.find(m=>m.lat!==null).lat-53.551111)<.00001);assert.ok(fs.existsSync(photo));
 assert.equal(await page.evaluate(()=>viewer.entities.values.filter(e=>e.id.startsWith('photo-')).length),1);
 await page.getByRole('button',{name:/gps-photo.jpg/}).click();await page.locator('#media-dialog summary').click();await page.locator('#source-url').fill('https://example.invalid/synthetic-test-photo');await page.locator('#license').fill('Synthetic fixture created locally for this test.');await page.locator('#permission').check();await page.locator('#archive').click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Permitted image archived:'));
 const archived=fs.readdirSync(path.join(testDir,'data','archive'));assert.equal(archived.length,1);assert.deepEqual(fs.readFileSync(path.join(testDir,'data','archive',archived[0])),fs.readFileSync(photo));
 const exported=path.join(testDir,'expedition.json');await desktop.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},exported);await page.locator('#export').click();await page.waitForFunction(()=>document.getElementById('status').textContent==='Expedition exported.');assert.equal(JSON.parse(fs.readFileSync(exported,'utf8')).state.waypoints.length,6);
 // Exercise the replaceable inference interface against a deterministic local server.
 server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');if(req.url==='/v1/models')res.end(JSON.stringify({data:[{id:'test-model'}]}));else if(req.url==='/v1/chat/completions')res.end(JSON.stringify({choices:[{message:{content:'Local adapter test response.'}}]}));else{res.statusCode=404;res.end('{}');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 await page.locator('#ai-open').click();await page.locator('#endpoint').fill(`http://127.0.0.1:${server.address().port}/v1`);await page.locator('#ai-test').click();await page.waitForFunction(()=>document.getElementById('ai-result').textContent.startsWith('Connected.'));
 await page.locator('#ai-prompt').fill('Test research connection.');await page.locator('#ai-send').click();await page.waitForFunction(()=>document.getElementById('ai-result').textContent==='Local adapter test response.');await page.locator('[data-close="ai-dialog"]').click();
 await page.evaluate(()=>saveQueue);await desktop.close();desktop=null;
 page=await launch();assert.equal(await page.locator('.waypoint').count(),6);assert.equal(await page.locator('#speed').inputValue(),'BEST-SAILING');assert.equal(await page.locator('#departure').inputValue(),'2026-11-01T08:30');assert.equal(await page.locator('#transport').textContent(),'BY-AIR');assert.equal(await page.locator('#media-count').textContent(),'2');
 await page.getByRole('button',{name:'Rotterdam test',exact:true}).click();assert.equal(await page.locator('#notes').inputValue(),'Persistent expedition research note.');
 await page.locator('.waypoint.selected button.remove').click();await page.waitForFunction(()=>state.waypoints.length===5);await page.evaluate(()=>saveQueue);
 assert.deepEqual(errors,[]);console.log('PASS: globe and Mercator, offline network denial, waypoint add/edit/remove, missions, preferences, photo EXIF/GPS, local AI adapter, persistence across restart.');
})().catch(async e=>{console.error(e);if(lastPage&&!lastPage.isClosed()){await lastPage.screenshot({path:path.join(artifacts,'test-failure.png')});console.error(await lastPage.evaluate(()=>({status:document.getElementById('status').textContent,map:document.getElementById('map-status').textContent,tiles:viewer?.scene.globe._surface._tilesToRender.length,loaded:viewer?.scene.globe.tilesLoaded,render:viewer?.useDefaultRenderLoop,body:document.body.innerText.slice(-1800)})));}process.exitCode=1;}).finally(async()=>{if(desktop)await desktop.close();if(server)await new Promise(r=>server.close(r));fs.rmSync(testDir,{recursive:true,force:true});});
