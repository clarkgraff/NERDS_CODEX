const {_electron}=require('playwright-core');
const fs=require('fs'),os=require('os'),path=require('path'),a=require('assert/strict');
(async()=>{
 const env={...process.env,NERDS_DATA_DIR:fs.mkdtempSync(path.join(os.tmpdir(),'nerds047-imagery-'))};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:require('electron'),args:[process.cwd()],env}),results=[];
 try{
  const p=await app.firstWindow();await p.waitForFunction(()=>window.LocalDisplay);
  await p.evaluate(()=>window.nerds.displayOnline(false));
  await p.waitForFunction(()=>document.querySelector('#local-display-package').options.length===10);
  await p.evaluate(async()=>{state.mapPresentation.imageryMode='SATELLITE + CARTOGRAPHIC OVERLAYS';await LocalDisplay.apply();});
  for(const row of JSON.parse(fs.readFileSync('assets/display/catalogue.json')).filter(r=>!process.env.HARBOUR||r.id===process.env.HARBOUR)){
   await p.evaluate(async row=>{state.mapPresentation.localDisplayPackage=row.id;await LocalDisplay.loadPackage();},row);
   const count=await p.evaluate(()=>LocalDisplay.local?.displayCount);a.equal(count,row.features);
   const zoom=[];
   for(const height of [4000,800]){
    await p.evaluate(({row,height})=>{viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees((row.bounds[0]+row.bounds[2])/2,(row.bounds[1]+row.bounds[3])/2,height)});viewer.scene.requestRender();},{row,height});
    await p.waitForTimeout(500);let settled=true;
    try{await p.waitForFunction(()=>viewer.scene.globe.tilesLoaded,null,{timeout:30000});}catch{settled=false;}
    await p.waitForTimeout(500);await p.screenshot({path:'work/v047-'+row.id+'-'+height+'.png'});
    zoom.push({height,allTilesSettled:settled,status:settled?'PASS':'UNRESOLVED',screenshot:'work/v047-'+row.id+'-'+height+'.png'});
   }
   results.push({id:row.id,localFeatures:count,packageStatus:'PASS',zoom});
  }
  const camera=await p.evaluate(()=>JSON.stringify(viewer.camera.position));
  await p.evaluate(async()=>{state.mapPresentation.imageryMode='SATELLITE';await LocalDisplay.apply();});
  a.equal(await p.evaluate(()=>!!LocalDisplay.satellite),true);
  a.equal(await p.evaluate(()=>LocalDisplay.local.show),false);
  await p.evaluate(async()=>{state.mapPresentation.imageryMode='SATELLITE + CARTOGRAPHIC OVERLAYS';await LocalDisplay.apply();await save();});
  a.equal(await p.evaluate(()=>LocalDisplay.local.show),true);
  a.equal(await p.evaluate(()=>JSON.stringify(viewer.camera.position)),camera);
  results.push({modeSwitchAndCamera:'PASS',providerStatus:await p.locator('#imagery-status').textContent()});
 }finally{fs.writeFileSync('work/v047-harbour-display-results.json',JSON.stringify(results,null,2));await app.close();}
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
