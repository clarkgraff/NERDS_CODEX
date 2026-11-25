function setupCronkite(){
 const model=CronkiteDiscovery,list=$('waypoint-list');let dragged=null,menuId=null;
 const pending=()=>model.clean(state.discoveryInbox).records;
 function redraw(){renderWaypoints();draw();}
 async function persist(){await save();redraw();}
 async function receive(input){const before=structuredClone(state.discoveryInbox);const result=model.receive(state,input,crypto.randomUUID());if(result.status==='ACCEPTED'){state.discoveryInbox.displayOrder=[result.id,...[...list.children].map(n=>n.dataset.id).filter(Boolean)];try{await persist();}catch(error){state.discoveryInbox=before;redraw();throw error;}}status('CRONKITE: '+result.status);return result;}
 async function decide(id,approve){model.decide(state,id,approve);await persist();status(approve?'Waypoint approved. Use PLOT ROUTE to include it.':'Discovery rejected; existing route retained.');}
 const importButton=button('RECEIVE CRONKITE DISCOVERY',async()=>{const input=await window.nerds.importCronkite();if(input)await receive(input);},'Import a CRONKITE discovery JSON handoff. Approval is required before routing.');importButton.id='cronkite-import';list.before(importButton);
 const menu=document.createElement('div');menu.id='cronkite-menu';menu.hidden=true;menu.style.cssText='position:fixed;z-index:10000;background:#18252c;padding:10px;border:1px solid #ffbf47';
 const approve=button('APPROVE WAYPOINT',async()=>{menu.hidden=true;await decide(menuId,true);}),reject=button('REJECT WAYPOINT',async()=>{menu.hidden=true;await decide(menuId,false);});menu.append(approve,reject);document.body.append(menu);
 function showMenu(e,id){const r=pending().find(r=>r.id===id);if(!r||r.status!==model.PENDING)return;e.preventDefault();e.stopPropagation();menuId=id;menu.hidden=false;menu.style.left=Math.min(e.clientX,innerWidth-240)+'px';menu.style.top=Math.min(e.clientY,innerHeight-120)+'px';}
 document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))menu.hidden=true;});
 const originalRender=renderWaypoints;renderWaypoints=()=>{originalRender();const box=model.clean(state.discoveryInbox);for(const r of [...box.records].reverse()){
  const row=document.createElement('div');row.className='waypoint discovery-waypoint';row.dataset.id=r.id;row.dataset.discoveryStatus=r.status;row.draggable=true;
  const title=document.createElement('strong');title.textContent=r.data.name;const statusText=document.createElement('p');statusText.textContent='4nR-CRONKITE · '+r.status;
  const details=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('pre');summary.textContent='Discovery details';body.textContent=JSON.stringify(r.data,null,2);body.style.whiteSpace='pre-wrap';details.append(summary,body);row.append(title,statusText,details);
  if(r.status===model.PENDING)row.append(button('APPROVE WAYPOINT',()=>decide(r.id,true)),button('REJECT WAYPOINT',()=>decide(r.id,false)));
  row.oncontextmenu=e=>showMenu(e,r.id);row.ondragstart=e=>{dragged=r.id;dragId=null;e.dataTransfer.setData('text/plain',r.id);e.dataTransfer.effectAllowed='move';};row.ondragend=()=>{dragged=null;};
  const at=box.displayOrder.indexOf(r.id),next=box.displayOrder.slice(at+1).map(id=>[...list.children].find(n=>n.dataset.id===id)).find(Boolean);list.insertBefore(row,next||null);
 }$('count').textContent=state.waypoints.length+box.records.length;};
 list.addEventListener('dragover',e=>{if(dragged){e.preventDefault();e.stopImmediatePropagation();}},true);
 list.addEventListener('drop',run(async e=>{if(!dragged)return;e.preventDefault();e.stopImmediatePropagation();const target=e.target.closest('[data-id]'),id=dragged;dragged=null;if(!target||target.dataset.id===id)return;model.reorder(state,id,target.dataset.id,e.clientY>target.getBoundingClientRect().top+target.offsetHeight/2);await persist();}),true);
 const oldDraw=draw;draw=()=>{oldDraw();for(const r of pending())viewer.entities.add({id:'discovery:'+r.id,position:Cesium.Cartesian3.fromDegrees(r.data.longitude,r.data.latitude),point:{pixelSize:11,color:Cesium.Color.fromCssColorString(r.status===model.PENDING?'#ffbf47':'#9ce7d6'),outlineColor:Cesium.Color.BLACK,outlineWidth:2},label:{show:state.mapPresentation.waypointLabels,text:r.data.name+' · '+r.status,font:'12px Segoe UI',pixelOffset:new Cesium.Cartesian2(12,-15),fillColor:Cesium.Color.WHITE,style:Cesium.LabelStyle.FILL_AND_OUTLINE,outlineWidth:3}});};
 $('globe-view').addEventListener('contextmenu',e=>{const rect=viewer.canvas.getBoundingClientRect(),hit=viewer.scene.pick(new Cesium.Cartesian2(e.clientX-rect.left,e.clientY-rect.top))?.id;if(String(hit?.id).startsWith('discovery:'))showMenu(e,String(hit.id).slice(10));},true);
 const oldPlot=plotRoute;plotRoute=async options=>{if(model.promote(state)){autoRoute=false;clearTimeout(replotTimer);refresh();autoRoute=false;clearTimeout(replotTimer);await save();autoRoute=false;clearTimeout(replotTimer);}return oldPlot(options);};
 setInterval(()=>{if(!state||!viewer)return;const color=Date.now()%1000<500?'#ffbf47':'#d87500';for(const row of list.querySelectorAll('[data-discovery-status="AWAITING APPROVAL"]')){row.style.borderColor=color;row.style.boxShadow='inset 4px 0 '+color;}for(const r of pending().filter(r=>r.status===model.PENDING)){const e=viewer.entities.getById('discovery:'+r.id);if(e)e.point.color=Cesium.Color.fromCssColorString(color);}if(pending().length)viewer.scene.requestRender();},100);
 window.CronkiteInbox={receive,decide,reorder:async(id,target,after)=>{model.reorder(state,id,target,after);await persist();}};
}
