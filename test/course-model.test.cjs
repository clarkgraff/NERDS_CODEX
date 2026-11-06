const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {cleanPlan,constraintsFor}=require('../src/course-model.cjs'),{emptyState,openStore}=require('../src/core.cjs'),projects=require('../src/projects.cjs');
test('legacy projects migrate to an empty course plan and preserve independent itinerary identities',()=>{
 for(const schemaVersion of [1,2]){const state=emptyState();delete state.coursePlan;const doc=projects.validate({format:'NERDS',schemaVersion,state,media:[],research:[],acquisitions:[]});a.deepEqual(doc.state.coursePlan,cleanPlan());a.deepEqual(doc.state.waypoints,[]);}
});
test('manual constraints survive SQLite restart and project roundtrip independently of itinerary edits',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nerds-course-'));let store=openStore(dir);
 try{const s=emptyState();s.waypoints=[{id:'a',name:'A',lat:1,lon:1},{id:'b',name:'B',lat:2,lon:2}];s.coursePlan=cleanPlan({manualConstraints:[{id:'manual',fromId:'a',toId:'b',lat:1.5,lon:1.5}]});store.save(s);
 const file=path.join(dir,'course.nerds');projects.write(file,projects.snapshot(store));a.equal(projects.read(file).schemaVersion,3);store.db.close();store=openStore(dir);a.deepEqual(store.read().coursePlan,s.coursePlan);
 const changed=store.read();changed.waypoints.reverse();store.save(changed);a.equal(constraintsFor(store.read().coursePlan,'b','a').length,0);a.equal(store.read().coursePlan.manualConstraints.length,1);
 projects.replace(store,projects.read(file));a.equal(store.read().waypoints[0].id,'a');a.equal(store.read().coursePlan.manualConstraints[0].id,'manual');
 }finally{store.db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('constraints cannot be confused with automatic points, and invalid input is rejected',()=>{
 const c={id:'c',fromId:'a',toId:'b',lat:1,lon:2};a.equal(cleanPlan({manualConstraints:[{...c,kind:'AUTOMATIC'}]}).manualConstraints[0].kind,'MANUAL');
 a.throws(()=>cleanPlan({manualConstraints:[c,c]}));a.throws(()=>cleanPlan({manualConstraints:[{...c,lat:91}]}));a.throws(()=>cleanPlan({segmentType:'RHUMB'}));
});
