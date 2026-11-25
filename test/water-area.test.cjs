const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto');
const topology=require('../src/water-area-route.cjs'),{Area}=topology,{supportedSegment}=require('../src/course-geometry.cjs');
const {plan}=require('../src/passage.cjs'),{stateFor}=require('./geographic-cases.cjs'),{validate}=require('./geographic-validation.cjs');
function fixture(mask){return new Area({id:'fixture',resolutionDegrees:.01,extent:{west:0,south:0,east:.03,north:.03},dimensions:[3,3]},Buffer.from(mask));}
test('water-area topology excludes holes, diagonal corner cuts and disconnected components',()=>{
 const g=fixture([0,1,0,1,0,1,0,1,0]);a.deepEqual(g.neighbors(0),[]);g.components();a.notEqual(g.labels[0],g.labels[4]);a.equal(supportedSegment(g.point(0),g.point(8),g),false);a.deepEqual(g.candidates({lat:0.015,lon:.015},true).map(x=>x.cell),[4]);a.deepEqual(g.candidates({lat:.015,lon:.005},true),[]);
 const island=fixture([0,0,0,0,1,0,0,0,0]);island.excluded=Buffer.from([0,0,0,0,1,0,0,0,0]);a.equal(topology.exclusionClear(island.point(3),island.point(5),[island]),false);
});
test('adopted masks, exclusions, exact geometry and available acquisitions match SHA-256 provenance',()=>{
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');for(const r of topology.manifest.regions){for(const [suffix,key] of [['.bin.gz','maskSHA256'],['-exclusions.bin.gz','exclusionSHA256'],['.geojson.gz','geometrySHA256']])a.equal(hash(zlib.gunzipSync(fs.readFileSync('assets/water-areas/'+r.id+suffix))),r[key]);const raw='work/topology/'+r.id+'-areas.json';if(fs.existsSync(raw))a.equal(hash(fs.readFileSync(raw)),r.acquisitionSHA256);a.ok(r.osmTimestamp);a.ok(r.query.includes('out geom'));}
});
test('real Alter water area resolves both directions without replacing coarse evidence or waypoint IDs',()=>{
 const s=stateFor(['Santarém','Alter do Chão']),coarse=plan(s),r=require('../src/course-refinement.cjs').refine(s,coarse),back=plan({...s,waypoints:[...s.waypoints].reverse()},{refine:true});
 a.equal(coarse.complete,false);a.equal(coarse.legs[0].evidence.recovery.method,'CONNECTED_MAPPED_WATER_AFTER_GRID_ACCESS_FAILURE');a.equal(validate(s,r).result,'UNRESOLVED');a.deepEqual(r.coarseCourse,coarse);a.equal(r.legs[0].evidence.grid,'water-area-topology');a.deepEqual(r.legs[0].points,[...back.legs[0].points].reverse());a.ok(Math.abs(r.calculatedDistanceNM-back.calculatedDistanceNM)<1e-8);a.equal(r.legs[0].fromId,s.waypoints[0].id);
 const bad=structuredClone(r.legs[0]);bad.evidence.edgeEvidence[0]={kind:'SOURCE',sourceId:'invented'};a.equal(topology.valid(bad),false);bad.points[0].lat=91;a.equal(topology.valid(bad),false);
});
test('partial itinerary preserves resolved water-area leg and suppresses unsupported downstream ETA',()=>{
 const s=stateFor(['Santarém','Alter do Chão','Toronto']),r=plan(s,{refine:true});a.equal(r.legs[0].status,'CALCULATED');a.equal(r.legs[1].status,'UNRESOLVED');a.equal(r.calculatedETA,null);a.equal(r.totalNM,null);a.equal(validate(s,r).result,'UNRESOLVED');
});

test('Lake Ontario interior geometry works without claiming the Toronto fixture or St Lawrence outlet',()=>{
 const area=topology.areas().find(x=>x.id==='ontario'),points=[{lat:43.62,lon:-79.35},{lat:44.1,lon:-76.5}].map((p,i)=>({...area.point(area.cell(p)),id:'lake-'+i,access:area.point(area.cell(p))}));
 const r=topology.leg(...points),back=topology.leg(...[...points].reverse());a.equal(topology.valid(r),true);a.deepEqual(r.points,[...back.points].reverse());const bad=structuredClone(r);bad.evidence.edgeEvidence[0].area='missing';a.equal(topology.valid(bad),false);
});

test('source-to-ocean transitions preserve portals and reject inconsistent or unsupported assemblies',()=>{
 const r=topology.leg(...stateFor(['Brest','Bordeaux']).waypoints),back=topology.leg(...stateFor(['Bordeaux','Brest']).waypoints);a.equal(r.evidence.grid,'water-area-ocean');a.equal(topology.valid(r),true);a.equal(topology.valid(back),true);a.deepEqual(r.points,[...back.points].reverse());
 for(const mutate of [r=>r.evidence.sections[1].points[0].lat+=1,r=>r.evidence.sections[1].evidence.grid='invented',r=>r.evidence.areaChecksum='outdated',r=>r.points[1].lon+=1]){const bad=structuredClone(r);mutate(bad);a.equal(topology.valid(bad),false);}
});
