(function(root){
 function preferred(p,mode){
  const kind=[p.featureKind,p.kind,p.featureCode,p.feature_code,p.tags?.amenity,p.tags?.leisure,p.tags?.waterway,p.tags?.aeroway].filter(Boolean).join(' ').toLowerCase();
  const tokens=mode==='BY-SEA'?['harbor','harbour','marina','wharf','dock','pier','yacht_club','hbr','whf']:mode==='BY-AIR'?['airport','airfield','aerodrome','airp','airf']:['townhall','city_hall','municipal'];
  return tokens.some(t=>kind.split(/[\s,;]+/).includes(t));
 }
 function rank(rows,mode,visible){return rows.map((p,i)=>({p,i,v:visible(p),t:preferred(p,mode)})).sort((a,b)=>Number(b.v)-Number(a.v)||Number(b.t)-Number(a.t)||a.i-b.i).map(r=>r.p);}
 const api={preferred,rank};if(typeof module!=='undefined')module.exports=api;else root.SearchPolicy=api;
})(globalThis);
function searchPointVisible(p){
 const world=Cesium.Cartesian3.fromDegrees(p.lon,p.lat),scene=viewer.scene;
 if(scene.mode===Cesium.SceneMode.SCENE3D&&!new Cesium.EllipsoidalOccluder(scene.globe.ellipsoid,viewer.camera.positionWC).isPointVisible(world))return false;
 const q=Cesium.SceneTransforms.worldToWindowCoordinates(scene,world);
 return !!q&&q.x>=0&&q.y>=0&&q.x<=viewer.canvas.clientWidth&&q.y<=viewer.canvas.clientHeight;
}
