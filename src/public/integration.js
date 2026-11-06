function setupProgress(){
 const box=document.createElement('div');box.id='globe-progress';box.hidden=true;box.setAttribute('role','status');const text=document.createElement('span'),bar=document.createElement('progress');box.append(text,bar);document.querySelector('.geography').append(box);const active=new Map();let timer,clear;
 function event(e){if(e.status==='ACTIVE'){active.set(e.id,e);clearTimeout(clear);if(!timer)timer=setTimeout(()=>{timer=null;if(active.size){box.hidden=false;text.textContent=[...active.values()].at(-1).name;bar.hidden=false;}},500);}else{active.delete(e.id);if(active.size){text.textContent=[...active.values()].at(-1).name;return;}clearTimeout(timer);timer=null;if(!box.hidden){text.textContent=e.name+' · '+e.status.toLowerCase();bar.hidden=true;clear=setTimeout(()=>box.hidden=true,1800);}}}
 window.nerds.onOperation(event);window.NerdsProgress={event};
}
function setupCitySelection(){
 let selected=null,busy=false;const command=button('Add Selected Place',async()=>{if(busy||!selected)return;busy=true;command.disabled=true;const place=selected;selected=null;try{await insertPlace(place,{automatic:false});$('context').hidden=true;status('Added '+place.name+'. Select PLOT ROUTE when ready.');}finally{busy=false;}});command.id='add-selected-place';command.hidden=true;$('context').append(command);
 $('globe-view').addEventListener('contextmenu',e=>{const rect=viewer.canvas.getBoundingClientRect(),xy=new Cesium.Cartesian2(e.clientX-rect.left,e.clientY-rect.top),entity=viewer.scene.pick(xy)?.id;selected=Number.isInteger(entity?.searchResultIndex)?window.NerdsSelectedSearch?.(entity):entity?.cityRecord&&entity.show?entity.cityRecord:null;command.hidden=!selected;command.disabled=!selected;if(selected){$('context').hidden=false;}});
}
async function insertPlace(p,{automatic=true}={}){
 if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon))throw Error('Select a geographic record');if(p.resolutionMethod==='online-nominatim')await window.nerds.acceptDiscovery(p);
 await saveQueue;const previous=await window.nerds.save(state);const w={...p,featureKind:p.featureKind||p.kind,id:crypto.randomUUID(),notes:'',access:null,operatingMode:'AUTO',kind:'place'};
 if(!automatic){clearTimeout(replotTimer);autoRoute=false;calculation=null;calculationKey=null;}
 state=await window.nerds.save({...previous,waypoints:[...previous.waypoints,w],route:null});refresh();selectWaypoint(w.id,false);await save();return w;
}
