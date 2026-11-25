(function(root){
'use strict';
const SOURCE='4nR-CRONKITE',PENDING='AWAITING APPROVAL';
function text(v,key,max,required=false){if(v===undefined&&!required)return undefined;if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error('Invalid '+key);return v;}
function validate(d){
 if(!d||d.schemaVersion!==1||d.sourceApplication!==SOURCE)throw Error('Unsupported discovery source/schema');
 if(JSON.stringify(d).length>65536)throw Error('Discovery exceeds 64KiB limit');
 for(const [k,min,max] of [['latitude',-90,90],['longitude',-180,180]])if(typeof d[k]!=='number'||!Number.isFinite(d[k])||d[k]<min||d[k]>max)throw Error('Invalid '+k);
 const v={schemaVersion:1,sourceApplication:SOURCE,discoveryId:text(d.discoveryId,'discoveryId',200,true),name:text(d.name,'name',200,true),latitude:d.latitude,longitude:d.longitude};
 for(const [k,n] of [['category',1000],['dateTime',200],['description',20000]]){const x=text(d[k],k,n);if(x!==undefined)v[k]=x;}
 if(d.sourceReferences!==undefined){if(!Array.isArray(d.sourceReferences))throw Error('Invalid sourceReferences');v.sourceReferences=JSON.parse(JSON.stringify(d.sourceReferences));}
 return v;
}
function clean(input){
 const box=input||{},records=(box.records||[]).map(r=>{const data=validate(r.data);if(typeof r.id!=='string'||!r.id||r.id.length>80)throw Error('Invalid discovery waypoint ID');if(![PENDING,'APPROVED'].includes(r.status))throw Error('Invalid discovery approval');return {id:r.id,data,status:r.status,routeParticipation:false};});
 if(records.length>1000||new Set(records.map(r=>r.id)).size!==records.length||new Set(records.map(r=>r.data.discoveryId)).size!==records.length)throw Error('Invalid discovery collection');
 const seen=Array.isArray(box.seen)?[...new Set(box.seen)]:[];if(seen.length>10000||seen.some(x=>typeof x!=='string'||x.length>200))throw Error('Invalid discovery receipts');
 for(const r of records)if(!seen.includes(r.data.discoveryId))seen.push(r.data.discoveryId);
 const displayOrder=Array.isArray(box.displayOrder)?[...new Set(box.displayOrder.filter(x=>typeof x==='string'&&x.length<=80))].slice(0,2000):[];
 return {records,seen,displayOrder};
}
function receive(state,input,id){const data=validate(input),box=clean(state.discoveryInbox);if(box.seen.includes(data.discoveryId)||state.waypoints.some(w=>w.source===SOURCE&&w.sourceId===data.discoveryId))return {status:'DUPLICATE',discoveryId:data.discoveryId};
 if(state.waypoints.some(w=>w.id===id)||box.records.some(r=>r.id===id))throw Error('Discovery waypoint ID collision');
 box.records.unshift({id,data,status:PENDING,routeParticipation:false});box.seen.push(data.discoveryId);box.displayOrder=[id,...box.displayOrder.filter(x=>x!==id),...state.waypoints.map(w=>w.id).filter(x=>!box.displayOrder.includes(x))];state.discoveryInbox=clean(box);return {status:'ACCEPTED',id,discoveryId:data.discoveryId};}
function decide(state,id,approve){const box=clean(state.discoveryInbox),r=box.records.find(r=>r.id===id);if(!r||r.status!==PENDING)throw Error('Pending discovery not found');if(approve)r.status='APPROVED';else{box.records=box.records.filter(r=>r.id!==id);box.displayOrder=box.displayOrder.filter(x=>x!==id);}state.discoveryInbox=box;}
function reorder(state,id,target,after=false){const box=clean(state.discoveryInbox);if(!box.records.some(r=>r.id===id))throw Error('Discovery not found');const valid=[...state.waypoints.map(w=>w.id),...box.records.map(r=>r.id)],order=[...box.displayOrder.filter(x=>valid.includes(x)),...valid.filter(x=>!box.displayOrder.includes(x))].filter(x=>x!==id);const index=order.indexOf(target);if(index<0)throw Error('Drop target not found');order.splice(index+(after?1:0),0,id);box.displayOrder=order;state.discoveryInbox=box;}
function promote(state){const box=clean(state.discoveryInbox),approved=box.records.filter(r=>r.status==='APPROVED');if(!approved.length)return false;
 const order=box.displayOrder,points=[...state.waypoints];for(const r of approved){const at=order.indexOf(r.id),next=order.slice(at+1).find(id=>points.some(w=>w.id===id)),index=next?points.findIndex(w=>w.id===next):points.length;points.splice(index,0,{id:r.id,name:r.data.name,lat:r.data.latitude,lon:r.data.longitude,source:SOURCE,sourceId:r.data.discoveryId,approvalStatus:'APPROVED',sourceMetadata:r.data,coordinateOverride:true});}
 if(points.length>1000)throw Error('Waypoint limit exceeded');state.waypoints=points;box.records=box.records.filter(r=>r.status===PENDING);state.discoveryInbox=box;return true;}
const api={SOURCE,PENDING,validate,clean,receive,decide,reorder,promote};if(typeof module!=='undefined')module.exports=api;else root.CronkiteDiscovery=api;
})(globalThis);
