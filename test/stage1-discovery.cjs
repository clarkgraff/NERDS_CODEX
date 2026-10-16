const fs=require('fs');const {lookup}=require('../src/gazetteer.cjs');
const definitions=[
 {name:'Machu Picchu Antarctic Scientific Station / ECAMP',queries:['Machu Picchu Antarctic Scientific Station','ECAMP','Machu Picchu','Estación Científica Antártica Machu Picchu'],expected:'Antarctic research station, not the Peruvian settlement/archaeological destination'},
 {name:'Pitcairn Island',queries:['Pitcairn Island','Pitcairn','Adamstown'],expected:'The island as a geographic feature; Adamstown is a related settlement, not a replacement for island discovery'},
 {name:'Two Harbors, Catalina Island',queries:['Two Harbors Catalina Island','Two Harbors','Catalina Island'],expected:'Catalina Island locality/harbour in California, not Two Harbors in Minnesota'},
 {name:'Saint Peter & Saint Paul Rocks',queries:['Saint Peter and Saint Paul Rocks','Saint Peter & Saint Paul','São Pedro e São Paulo','Arquipélago de São Pedro e São Paulo'],expected:'Remote equatorial Atlantic rocks/archipelago, regardless of population'},
 {name:"Devil's Island, French Guiana",queries:["Devil's Island French Guiana","Devil's Island",'Île du Diable','Ile du Diable'],expected:'Named island in French Guiana, with English/French aliases'}
];
function qualifies(index,p){const name=(p.name+' '+(p.aliases||[]).join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const kind=String(p.kind).toLowerCase();
 if(index===0)return p.lat < -60 && /machu.?picchu|ecamp/.test(name);
 if(index===1)return /pitcairn/.test(name)&&/island|isl/.test(kind)&&p.lat < -20&&p.lat > -30&&p.lon < -125&&p.lon > -135;
 if(index===2)return /two harbors/.test(name)&&p.region==='California';
 if(index===3)return /peter.*paul|pedro.*paulo/.test(name)&&Math.abs(p.lat)<5&&p.lon>-60&&p.lon<0&&/rock|island|isl/.test(kind);
 return /devil|diable/.test(name)&&p.country==='French Guiana'&&/island|isl/.test(kind);
}
const cases=definitions.map((d,index)=>{const searches=d.queries.map(q=>({query:q,results:lookup(q).map(p=>({name:p.name,kind:p.kind,country:p.country,region:p.region,lat:p.lat,lon:p.lon,sourceId:p.sourceId,source:p.source,aliases:p.aliases}))}));const matched=searches.flatMap(s=>s.results).filter(p=>qualifies(index,p));return {...d,result:matched.length?'PASS':'FAIL',reason:matched.length?'Requested feature found with regional and identity checks.':'Requested feature not resolved by the existing offline name/alias search; no unrelated or nearby settlement is accepted as the requested feature.',scope:'Mandatory Stage 2 discovery acceptance; diagnostic only in Stage 1',searches,expectedRecovery:'User may mark an existing match unsatisfactory and request explicit extended discovery; user-approved feature with stable ID, classification, provenance and verification status must be cached for offline reuse. Population is not an eligibility rule.'};});
const report={governingRequirement:'Worldwide expedition-relevant feature discovery must not be bounded by population thresholds, remoteness or tourism significance.',acceptance:{PASS:'The specifically requested feature is returned with correct location/classification and provenance; related settlement or same-name wrong region is not a pass.',FAIL:'Executed offline searches do not resolve the requested feature.',UNRESOLVED:'Evidence insufficient to decide identity.',DEFERRED:'Not executed; never PASS.'},counts:{total:cases.length,PASS:cases.filter(c=>c.result==='PASS').length,FAIL:cases.filter(c=>c.result==='FAIL').length,UNRESOLVED:0,DEFERRED:0},onlineLookupExecuted:false,architectureChanged:false,cases};fs.writeFileSync('docs/stage1-0.3.1/discovery-results.json',JSON.stringify(report,null,2));console.log(report.counts);

if(report.counts.FAIL)process.exitCode=1;
