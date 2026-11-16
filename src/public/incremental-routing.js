(function(root){
 function crosses(a,b,width,height){if(!a||!b)return false;let lo=0,hi=1;const dx=b.x-a.x,dy=b.y-a.y;for(const [p,q] of [[-dx,a.x],[dx,width-a.x],[-dy,a.y],[dy,height-a.y]]){if(p===0){if(q<0)return false;continue;}const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false;}return true;}
 const api={crosses};if(typeof module!=='undefined')module.exports=api;else root.RouteViewport=api;
})(globalThis);
function visibleRouteLegs(){
 const C=Cesium,scene=viewer.scene,canvas=scene.canvas,ellipsoid=scene.globe.ellipsoid;
 const horizon=scene.mode===C.SceneMode.SCENE3D?new C.EllipsoidalOccluder(ellipsoid,viewer.camera.positionWC):null;
 const project=p=>{const world=C.Cartesian3.fromDegrees(p.lon,p.lat);if(horizon&&!horizon.isPointVisible(world))return null;return C.SceneTransforms.worldToWindowCoordinates(scene,world);};
 const visible=[];
 for(let i=1;i<state.waypoints.length;i++){
  const a=state.waypoints[i-1],b=state.waypoints[i],id=a.id+'->'+b.id,existing=(calculation?.legs||state.route?.legs||[]).find(l=>l.id===id);
  const points=existing?.points?.length>1?existing.points:[a,b];let hit=false;
  for(let j=1;j<points.length&&!hit;j++){
   const start=C.Cartographic.fromDegrees(points[j-1].lon,points[j-1].lat),end=C.Cartographic.fromDegrees(points[j].lon,points[j].lat);
   let line;try{line=new C.EllipsoidGeodesic(start,end);}catch{continue;}
   const steps=Math.max(1,Math.ceil(line.surfaceDistance/50000));let prev=project(points[j-1]);
   for(let k=1;k<=steps;k++){const geo=line.interpolateUsingFraction(k/steps),p=project({lon:C.Math.toDegrees(geo.longitude),lat:C.Math.toDegrees(geo.latitude)});if(RouteViewport.crosses(prev,p,canvas.clientWidth,canvas.clientHeight)){hit=true;break;}prev=p;}
  }if(hit)visible.push(id);
 }return visible;
}
function setupIncrementalRouting(){
 const pane=document.createElement('details');pane.id='error-status-pane';pane.style.overflowWrap='anywhere';const heading=document.createElement('summary');heading.textContent='ERROR & STATUS';pane.append(heading);
 const counts=document.createElement('p');counts.id='route-job-counts';pane.append(counts);
 const tools=document.createElement('div'),log=document.createElement('div');log.style.cssText='max-height:260px;overflow:auto;font-size:12px';pane.append(tools,log);document.querySelector('.inspector').prepend(pane);
 let events=[],jobs=[],visible=[],currentProject=state.projectId;
 const exportText=()=>JSON.stringify(events,null,2);
 tools.append(button('COPY',()=>navigator.clipboard.writeText(exportText())),button('EXPORT',()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([exportText()],{type:'application/json'}));a.href=url;a.download='NERDS-status.json';a.click();URL.revokeObjectURL(url);}),button('CANCEL ALL',()=>window.nerds.cancelLeg()),button('RETRY FAILED',()=>window.nerds.retryLeg()));
 function inspect(id){const [from,to]=id.split('->');selectedId=to;renderWaypoints();const leg=calculation?.legs?.find(l=>l.id===id);const p=leg?.points?.[Math.floor(leg.points.length/2)]||state.waypoints.find(w=>w.id===to);if(p)viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(p.lon,p.lat,100000)});}
 function append(e){events.push(e);if(events.length>2000)events.shift();const row=document.createElement('details'),title=document.createElement('summary');title.style.textTransform='none';title.textContent=`${e.timestamp} · ${e.component} · ${e.severity} · ${e.location||''} ${e.message}`;row.append(title);const detail=document.createElement('pre');detail.style.whiteSpace='pre-wrap';detail.textContent=JSON.stringify(e,null,2);row.append(detail);if(e.legId)row.append(button('INSPECT',()=>inspect(e.legId)),button('CANCEL LEG',()=>window.nerds.cancelLeg(e.legId)),button('RETRY LEG',()=>window.nerds.retryLeg(e.legId)));log.prepend(row);while(log.children.length>300)log.lastChild.remove();}
 window.nerds.operationEvents().then(rows=>rows.forEach(append));window.nerds.onStatusEvent(append);
 window.recordOperation=(component,message,severity='INFO',details)=>window.nerds.recordEvent({component,message,severity,details});
 const oldStatus=status;status=(message,error=false)=>{oldStatus(message,error);recordOperation('APPLICATION',message,error?'ERROR':'INFO');};
 window.addEventListener('error',e=>recordOperation('RENDERER',e.message,'ERROR',{stack:e.error?.stack}));window.addEventListener('unhandledrejection',e=>recordOperation('APPLICATION',String(e.reason),'ERROR'));
 function count(){const selected=new Set(visible),v=jobs.filter(j=>selected.has(j.id)),n=s=>v.filter(j=>s.includes(j.status)).length;counts.textContent=`Visible: ${n(['PENDING'])} awaiting · ${n(['RUNNING'])} calculating · ${n(['COMPLETE'])} completed · ${n(['UNRESOLVED','CONFLICT','CANCELLED'])} unresolved. Background: ${jobs.filter(j=>!selected.has(j.id)&&['RUNNING','PENDING'].includes(j.status)).length}`;}
 async function priority(focus=false){visible=visibleRouteLegs();await window.nerds.routePriority({ids:visible,focus});count();}
 viewer.camera.moveEnd.addEventListener(()=>priority());
 $('focus').title='Prioritise visible route legs without changing the camera';$('focus').onclick=()=>priority(true);
 tools.append(button('FOCUS SELECTED LEG',()=>{const index=state.waypoints.findIndex(w=>w.id===selectedId);if(index>0)window.nerds.routePriority({ids:[state.waypoints[index-1].id+'->'+selectedId],focus:true});}));
 window.nerds.onRouteUpdate(update=>{
  if(update.projectId!==state.projectId)return;if(currentProject!==state.projectId){jobs=[];currentProject=state.projectId;}
  state.routeWork=update.records;if(!jobs.length)visible=visibleRouteLegs();jobs=update.jobs;count();
  // Refinement is a proposal. Only preliminary CHEKOV results appear incrementally.
  if(update.refine||update.basisKey&&update.basisKey!==routeKey())return;
  const changed=update.result.legs.some(l=>{const a=state.waypoints.find(w=>w.id===l.fromId),b=state.waypoints.find(w=>w.id===l.waypointId);const anchors=l.evidence?.anchors;return !a||!b||!anchors||anchors[0].lat!==a.lat||anchors[0].lon!==a.lon||anchors[1].lat!==b.lat||anchors[1].lon!==b.lon;});
  if(changed)return;calculation={...update.result,basisKey:routeKey()};calculationKey=routeKey();state.route=calculation;renderMetrics();draw();
 });
 window.RouteJobs={priority,get jobs(){return jobs;},get events(){return events;}};
}
