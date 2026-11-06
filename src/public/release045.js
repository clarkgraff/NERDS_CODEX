function setupRelease045(){
 const list=$('waypoint-list');let collapsed=false;
 const sun=button('SUN OFF',async()=>{state.mapPresentation.sun=!state.mapPresentation.sun;applySun();await save();});sun.id='sun-toggle';document.querySelector('.map-toolbar .segmented').append(sun);
 function applySun(){viewer.scene.globe.enableLighting=state.mapPresentation.sun===true;sun.textContent=state.mapPresentation.sun?'SUN ON':'SUN OFF';sun.setAttribute('aria-pressed',String(state.mapPresentation.sun===true));viewer.scene.requestRender();}
 const expand=button('COLLAPSE ALL',()=>{collapsed=!collapsed;for(const row of list.children)row.classList.toggle('compact-waypoint',collapsed);expand.textContent=collapsed?'EXPAND ALL':'COLLAPSE ALL';});expand.id='expand-waypoints';
 const reverse=button('REVERSE LIST',async()=>{state.mapPresentation.reverseList=!state.mapPresentation.reverseList;applyOrder();await save();});reverse.id='reverse-list';list.before(expand,reverse);
 function applyOrder(){const rows=new Map([...list.children].map(e=>[e.dataset.id,e]));const order=state.mapPresentation.reverseList?[...state.waypoints].reverse():state.waypoints;for(const w of order){const row=rows.get(w.id);if(row)list.append(row);}reverse.textContent=state.mapPresentation.reverseList?'ORIGINAL LIST':'REVERSE LIST';}
 const previous=renderWaypoints;renderWaypoints=()=>{previous();for(const row of list.children){row.classList.toggle('compact-waypoint',collapsed);const toggle=button('EXPAND / COLLAPSE',()=>row.classList.toggle('compact-waypoint'));toggle.className='card-expansion';row.prepend(toggle);}applyOrder();};
 function handles(){const enabled=$('edit-user-path')?.getAttribute('aria-pressed')==='true';for(const e of viewer.entities.values)if(e.customRole||String(e.id).startsWith('custom-handle-'))e.show=enabled;viewer.scene.requestRender();}
 const oldDraw=draw;draw=()=>{oldDraw();applySun();handles();};$('edit-user-path').addEventListener('click',handles);viewer.scene.morphComplete.addEventListener(()=>{draw();viewer.scene.requestRender();});applySun();handles();
}
