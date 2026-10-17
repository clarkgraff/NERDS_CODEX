const {_electron}=require('playwright-core'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),a=require('node:assert/strict');
const {stateFor}=require('./geographic-cases.cjs'),{validate}=require('./geographic-validation.cjs');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'nerds-mixed-grid-')),errors=[],checks=[];let app;
(async()=>{try{
 const env={...process.env,NERDS_DATA_DIR:dir};delete env.ELECTRON_RUN_AS_NODE;
 app=await _electron.launch({executablePath:require('electron'),args:[root],env,timeout:60000});const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>window.nerdsReady);
 const s=stateFor(['Marseille','Barcelona','Ibiza','Algiers']);
 await page.evaluate(async s=>{state=await window.nerds.save(s);refresh();},s);await page.locator('#calculate').click();await page.waitForFunction(()=>calculation?.complete&&!plotting);
 let data=await page.evaluate(()=>({state,route:calculation}));a.equal(validate(data.state,data.route).result,'PASS');a.ok(data.route.legs.every(l=>!l.transitionBefore));a.equal(await page.evaluate(()=>viewer.entities.values.filter(e=>e.id.startsWith('water-leg-')).length),3);checks.push('Mixed-grid route plots all three continuous legs with validated totals and ETA');
 await page.evaluate(async()=>{state.waypoints.reverse();refresh();await save();await plotRoute();});await page.waitForFunction(()=>calculation?.complete&&!plotting);data=await page.evaluate(()=>({state,route:calculation}));a.equal(validate(data.state,data.route).result,'PASS');a.deepEqual(data.state.waypoints.map(w=>w.name),['Algiers','Ibiza','Barcelona','Marseille']);checks.push('Reverse order updates map geometry and accounting');
 const file=path.join(dir,'Mixed-grid.nerds');await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},file);await page.locator('#project-save').click();await page.waitForFunction(()=>!project.dirty);const saved=JSON.parse(fs.readFileSync(file,'utf8'));a.equal(validate(saved.state,saved.state.route).result,'PASS');checks.push('Project persists common attachments and valid source accounting');
 a.deepEqual(errors,[]);fs.writeFileSync('docs/stage2-0.3.1/mixed-grid-desktop-results.json',JSON.stringify({generatedAt:new Date().toISOString(),checks,errors,isolatedDataDir:dir,packageBuilt:false},null,2));console.log(checks);
 }finally{await app?.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
