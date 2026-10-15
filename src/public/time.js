(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.NerdsTime=api;})(globalThis,()=>{
 function zone(value){try{new Intl.DateTimeFormat('en',{timeZone:value}).format();return value;}catch{throw Error('Choose a valid IANA time zone.');}}
 function parts(iso,tz){const date=new Date(iso);if(!Number.isFinite(+date))throw Error('Invalid timestamp.');return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone(tz),year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));}
 function local(iso,tz){const p=parts(iso,tz);return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
 function offset(iso,tz){const p=parts(iso,tz),ms=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);return Math.round((ms-Math.floor(+new Date(iso)/1000)*1000)/60000);}
 function display(iso,tz){if(!iso)return 'Not scheduled';const n=offset(iso,tz),abs=Math.abs(n);return local(iso,tz).replace('T',' ')+` ${tz} (UTC${n<0?'-':'+'}${String(Math.floor(abs/60)).padStart(2,'0')}:${String(abs%60).padStart(2,'0')})`;}
 function fromLocal(value,tz,choice='reject'){
  zone(tz);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Use a date and 24-hour HH:mm time.');const naive=Date.parse(value+'Z');if(!Number.isFinite(naive)||new Date(naive).toISOString().slice(0,16)!==value)throw Error('Invalid calendar date or time.');
  const offsets=new Set();for(let h=-36;h<=36;h+=3)offsets.add(offset(new Date(naive+h*3600000).toISOString(),tz));
  const matches=[...offsets].map(n=>new Date(naive-n*60000).toISOString()).filter(t=>local(t,tz)===value).sort();
  if(!matches.length)throw Error('This local time does not exist because the clocks change. Choose another time.');
  if(matches.length>1&&choice==='reject')throw Error('This time occurs twice when clocks change. Choose earlier or later occurrence.');return choice==='later'?matches.at(-1):matches[0];
 }
 return {zone,local,display,fromLocal,offset};
});
