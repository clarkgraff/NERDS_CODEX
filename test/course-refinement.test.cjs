const {test}=require('node:test'),a=require('node:assert/strict');
const {plan}=require('../src/passage.cjs'),{stateFor}=require('./geographic-cases.cjs'),{validate}=require('./geographic-validation.cjs');
const {supported}=require('../src/course-refinement.cjs');
function gironde(north={lat:45.6616251,lon:-1.2171409}){const s=require('../src/core.cjs').emptyState();s.waypoints=[north,{lat:45.3802966,lon:-.8220253}].map((p,i)=>({...p,id:'gironde-'+i,name:'Mapped Gironde '+i,access:{...p}}));return s;}
test('Gironde coarse raster course refines to actual source bends with identical attachments',()=>{
 const s=gironde(),r=plan(s,{refine:true}),back=plan({...s,waypoints:[...s.waypoints].reverse()},{refine:true});
 a.equal(r.refinement.refinedLegs,1);a.equal(r.coarseCourse.legs[0].evidence.grid,'europe-0.025');a.equal(r.legs[0].evidence.grid,'source-waterway-network');
 a.equal(validate(s,r).result,'PASS');a.notDeepEqual(r.legs[0].points,r.coarseCourse.legs[0].points);a.deepEqual(r.legs[0].points,[...back.legs[0].points].reverse());
 a.equal(r.coarseCourse.legs[0].points.length,5);a.equal(r.legs[0].points.length,28);a.ok(Math.abs(r.totalNM-24.916769359203798)<1e-8);
});
test('source detours do not silently replace the supported original passage',()=>{
 const r=plan(gironde({lat:45.5977053,lon:-1.0677345}),{refine:true});a.equal(r.refinement.refinedLegs,0);a.match(r.refinement.legs[0].reason,/detour guard/);a.deepEqual(r.legs[0].points,r.coarseCourse.legs[0].points);
});
test('valid coarse snapshots are retained exactly while departure edits recalculate timing',()=>{
 const s=gironde();s.departureUTC='2026-10-15T12:00:00.000Z';s.route=plan(s);const r=plan(s,{refine:true});a.deepEqual(r.coarseCourse,s.route);const plottedAgain=plan({...s,route:r});a.deepEqual(plottedAgain.legs[0].points,s.route.legs[0].points);a.equal(plottedAgain.refinement,undefined);
 const later=plan({...s,departureUTC:'2026-10-16T12:00:00.000Z'},{refine:true});a.equal(Date.parse(later.calculatedETA)-Date.parse(r.calculatedETA),86400000);a.deepEqual(later.legs[0].points,r.legs[0].points);
});
test('additive refinement dataset matches its manifest and source acquisition digests',()=>{
 const fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const m=require('../assets/waterways/refinement-manifest.json'),d=JSON.parse(zlib.gunzipSync(fs.readFileSync('assets/waterways/refinement.json.gz')));
 a.equal(hash(JSON.stringify(d.lines)),m.sha256);a.equal(d.lines.length,m.lineCount);a.ok(m.resolution.includes('accuracy not guaranteed'));
 for(const source of m.sources.filter(x=>x.file)){if(fs.existsSync('work/refinement/'+source.file))a.equal(hash(fs.readFileSync('work/refinement/'+source.file)),source.sha256);a.match(source.sha256,/^[0-9a-f]{64}$/);a.ok(source.query.includes('out geom'));a.ok(source.timestamp);}
});
test('explicit mapped refinement resolves Bordeaux in both directions and retains original unresolved evidence',()=>{
 const s=stateFor(['Brest','Bordeaux']),coarse=plan(s),before=structuredClone(coarse);
 const r=require('../src/course-refinement.cjs').refine(s,coarse),reverse=plan({...s,waypoints:[...s.waypoints].reverse()},{refine:true});
 a.equal(coarse.complete,false);a.deepEqual(coarse,before);a.deepEqual(r.coarseCourse,coarse);a.equal(r.complete,true);a.equal(validate(s,r).result,'PASS');
 a.equal(r.refinement.refinedLegs,1);a.deepEqual(r.legs[0].points,[...reverse.legs[0].points].reverse());a.ok(Math.abs(r.totalNM-reverse.totalNM)<1e-8);
 a.equal(r.legs[0].fromId,s.waypoints[0].id);a.equal(r.legs[0].waypointId,s.waypoints[1].id);a.ok(r.refinement.dataset.sources.some(x=>x.file==='bordeaux.json'));
 const core=require('../src/core.cjs');a.deepEqual(core.cleanState({...s,route:r}).route.coarseCourse,coarse);
 const bad=structuredClone(r);bad.coarseCourse.legs[0].fromId='substitution';a.throws(()=>core.cleanState({...s,route:bad}));
});
test('refinement preserves successful legs, gaps, constraints and nominal accounting',()=>{
 const s=stateFor(['Hamburg','Kiel','Manaus']);const r=plan(s,{refine:true});a.equal(r.legs[0].status,'CALCULATED');a.deepEqual(r.legs[0].points,r.coarseCourse.legs[0].points);a.equal(r.totalNM,null);a.equal(r.calculatedETA,null);a.equal(validate(s,r).result,'UNRESOLVED');
 const t=stateFor(['Brest','Bordeaux']);t.coursePlan.manualConstraints=[{id:'manual',fromId:t.waypoints[0].id,toId:t.waypoints[1].id,lat:46,lon:-2,kind:'MANUAL'}];const constrained=plan(t,{refine:true});a.equal(constrained.legs[0].status,'UNRESOLVED');a.match(constrained.refinement.legs[0].reason,/constraints preserved/);
});
test('detailed acceptance rejects fabricated source edges and continental shortcuts',()=>{
 const r=plan(stateFor(['Brest','Bordeaux']),{refine:true}),l=structuredClone(r.legs[0]);a.equal(supported(l),true);l.evidence.sections[2].sourceEdgeIds[0]='invented';a.equal(supported(l),false);
 a.equal(supported({points:[{lat:54,lon:4},{lat:43,lon:5}],evidence:{grid:'europe-0.025'}}),false);
});
