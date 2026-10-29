'use strict';
const fields=['organisation','person','role','category','address','city','region','country','postcode','phone','email','website','coordinates','hours','notes'];
function clean(input={}){
 const contacts=Array.isArray(input.contacts)?input.contacts:[],schedules=input.schedules||{};
 if(contacts.length>10000||Object.keys(schedules).length>10000)throw Error('Location records exceed project limit');
 const seen=new Set();const records=contacts.map(c=>{if(typeof c.id!=='string'||!c.id||seen.has(c.id))throw Error('Invalid contact identity');seen.add(c.id);return {id:c.id,...Object.fromEntries(fields.map(k=>[k,String(c[k]||'').slice(0,20000)])),waypointIds:[...new Set((c.waypointIds||[]).map(String))]};});
 const schedule={};for(const [id,s]of Object.entries(schedules)){const zone=s.zone||'UTC';new Intl.DateTimeFormat('en',{timeZone:zone});const item={zone,appointments:String(s.appointments||'').slice(0,20000)};for(const k of ['plannedArrival','confirmedArrival','plannedDeparture','confirmedDeparture']){const v=s[k]||null;if(v&&(!/Z$|[+-]\d\d:\d\d$/.test(v)||!Number.isFinite(Date.parse(v))))throw Error('Use a timestamp with an explicit UTC offset');item[k]=v?new Date(v).toISOString():null;}schedule[id]=item;}
 return {contacts:records,schedules:schedule};
}
module.exports={clean,fields};
