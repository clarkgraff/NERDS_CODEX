const fs=require('node:fs');
const {places}=require('../test/geographic-cases.cjs'),{bundled}=require('../src/waterway-network.cjs'),{selectNetwork}=require('../src/water-route.cjs');
const results=JSON.parse(fs.readFileSync('docs/stage2-0.3.1/geographic-results.json'));
const cases=results.filter(c=>c.name.includes('full forward')&&c.result!=='PASS').map(c=>({name:c.name,result:c.result,legs:c.legs.filter(l=>l.status!=='CALCULATED'||l.transitionBefore).map(l=>{
 const from=Object.values(places).find(p=>p.id===l.fromId),to=Object.values(places).find(p=>p.id===l.waypointId);
 const datasets=['osm','rivers'].map(name=>{const n=bundled(name),a=from?n.candidates(from):[],b=to?n.candidates(to):[];return {name,sourceChecksum:n.doc.sha256,fromCandidates:a,toCandidates:b,sharedComponent:a.some(x=>b.some(y=>x.component===y.component))};});
 const grid=from&&to?selectNetwork(from,to):null;
 return {id:l.id,reason:l.reason,transition:l.transitionBefore,datasets,grid:grid?{id:grid.id,from:grid.network.inspect(from),to:grid.network.inspect(to)}:null};
})}));
const report={generatedAt:new Date().toISOString(),interpretation:'Candidate components diagnose mapped topology only. Nearby source endpoints are not a verified land-to-water access route. Missing connectivity is not a vessel-access prohibition. No geometry is repaired by this diagnostic.',cases};
fs.writeFileSync('docs/stage2-0.3.1/connectivity-diagnostics.json',JSON.stringify(report,null,2));console.log(cases.length+' unresolved forward itineraries diagnosed');
