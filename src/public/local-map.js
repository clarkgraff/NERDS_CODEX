/* global Cesium */
async function localMap(){
 const polygons=await fetch('assets/land.json').then(r=>r.json());
 const shapes=polygons.map(rings=>{let west=180,east=-180,south=90,north=-90;for(const p of rings[0]){west=Math.min(west,p[0]);east=Math.max(east,p[0]);south=Math.min(south,p[1]);north=Math.max(north,p[1]);}return {rings,west,east,south,north};});
 const scheme=new Cesium.GeographicTilingScheme();
 return {tileWidth:512,tileHeight:512,minimumLevel:0,maximumLevel:12,tilingScheme:scheme,rectangle:scheme.rectangle,tileDiscardPolicy:undefined,errorEvent:new Cesium.Event(),credit:new Cesium.Credit('Natural Earth · 1:10 million · research map'),hasAlphaChannel:false,getTileCredits:()=>undefined,pickFeatures:()=>undefined,
 async requestImage(x,y,level){const r=scheme.tileXYToRectangle(x,y,level),deg=Cesium.Math.toDegrees,west=deg(r.west),east=deg(r.east),south=deg(r.south),north=deg(r.north);const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#173f53';ctx.fillRect(0,0,512,512);ctx.fillStyle='#516c5b';ctx.strokeStyle='#9bb59c';ctx.lineWidth=.65;
  for(const s of shapes){if(s.west>east||s.east<west||s.south>north||s.north<south)continue;ctx.beginPath();for(const ring of s.rings){ring.forEach(([lon,lat],i)=>{const px=(lon-west)/(east-west)*512,py=(north-lat)/(north-south)*512;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});ctx.closePath();}ctx.fill('evenodd');ctx.stroke();}return c;
 }};
}

