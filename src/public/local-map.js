/* global Cesium */
const mapDataCache=new Map();
async function mapData(url){if(!mapDataCache.has(url))mapDataCache.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('Map data unavailable');return r.json();}));return mapDataCache.get(url);}
async function localMap(overlays={}){
 const layers=[];
 for(const key of ['roads','borders','timezones'])if(overlays[key]){
 const data=await mapData('assets/layers/'+key+'.geojson');const shapes=[];
 for(const f of data.features){const g=f.geometry;if(!g)continue;let lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'||g.type==='Polygon'?g.coordinates:g.type==='MultiPolygon'?g.coordinates.flat():[];
 for(const line of lines){let west=180,east=-180,south=90,north=-90;for(const [lon,lat] of line){west=Math.min(west,lon);east=Math.max(east,lon);south=Math.min(south,lat);north=Math.max(north,lat);}shapes.push({line,west,east,south,north,label:key==='timezones'?f.properties.time_zone||f.properties.name:''});}}
 layers.push({key,shapes});}

 const polygons=await mapData('assets/land.json');
 const shapes=polygons.map(rings=>{let west=180,east=-180,south=90,north=-90;for(const p of rings[0]){west=Math.min(west,p[0]);east=Math.max(east,p[0]);south=Math.min(south,p[1]);north=Math.max(north,p[1]);}return {rings,west,east,south,north};});
 const scheme=new Cesium.GeographicTilingScheme();
 return {tileWidth:512,tileHeight:512,minimumLevel:0,maximumLevel:12,tilingScheme:scheme,rectangle:scheme.rectangle,tileDiscardPolicy:undefined,errorEvent:new Cesium.Event(),credit:new Cesium.Credit('Natural Earth · 1:10 million · research map'),hasAlphaChannel:false,getTileCredits:()=>undefined,pickFeatures:()=>undefined,
 async requestImage(x,y,level){const r=scheme.tileXYToRectangle(x,y,level),deg=Cesium.Math.toDegrees,west=deg(r.west),east=deg(r.east),south=deg(r.south),north=deg(r.north);const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#173f53';ctx.fillRect(0,0,512,512);ctx.fillStyle='#516c5b';ctx.strokeStyle='#9bb59c';ctx.lineWidth=.65;
  for(const s of shapes){if(s.west>east||s.east<west||s.south>north||s.north<south)continue;ctx.beginPath();for(const ring of s.rings){ring.forEach(([lon,lat],i)=>{const px=(lon-west)/(east-west)*512,py=(north-lat)/(north-south)*512;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});ctx.closePath();}ctx.fill('evenodd');ctx.stroke(); }
 for(const layer of layers){if(layer.key==='roads'&&level<3)continue;ctx.strokeStyle={roads:'#d3b77c',borders:'#ecd5dd',timezones:'#a0a8f5'}[layer.key];ctx.lineWidth=layer.key==='roads'?.8:1.3;ctx.setLineDash(layer.key==='borders'?[5,3]:layer.key==='timezones'?[2,4]:[]);
 for(const s of layer.shapes){if(s.west>east||s.east<west||s.south>north||s.north<south)continue;ctx.beginPath();s.line.forEach(([lon,lat],i)=>{const px=(lon-west)/(east-west)*512,py=(north-lat)/(north-south)*512;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});ctx.stroke();if(s.label&&level>=2&&s.west>=west&&s.west<=east&&s.north>=south&&s.north<=north){ctx.fillStyle='#d7d9ff';ctx.font='12px sans-serif';ctx.fillText(s.label,(s.west-west)/(east-west)*512,(north-s.north)/(north-south)*512+15);}}
 }return c;
 }};
}

