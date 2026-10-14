const fs=require('node:fs');
const path=require('node:path');
const input=process.argv[2];
const geo=JSON.parse(fs.readFileSync(input,'utf8'));
const polygons=geo.features.flatMap(f=>f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates]);
function raster(width,height,step,west,southOrigin,padding){
const land=new Uint8Array(width*height);
// Rasterize land conservatively; inland holes are not treated as navigable water.
for(const polygon of polygons){
 const ring=polygon[0];let south=90,north=-90;
 for(const [,lat] of ring){south=Math.min(south,lat);north=Math.max(north,lat);}
 for(let y=Math.max(0,Math.floor((south-southOrigin)/step));y<=Math.min(height-1,Math.floor((north-southOrigin)/step));y++){
  const lat=southOrigin+(y+.5)*step,xs=[];
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[j],b=ring[i];if((a[1]>lat)!==(b[1]>lat))xs.push(a[0]+(lat-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }
  xs.sort((a,b)=>a-b);
  for(let i=0;i+1<xs.length;i+=2)for(let x=Math.max(0,Math.floor((xs[i]-west)/step));x<=Math.min(width-1,Math.floor((xs[i+1]-west)/step));x++)land[y*width+x]=1;
 }
 // Cover narrow islands and boundary segments even when no cell centre intersects them.
 for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];const n=Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))/step*3);
  for(let k=0;k<=n;k++){const t=n?k/n:0,x=Math.floor((a[0]+(b[0]-a[0])*t-west)/step),y=Math.floor((a[1]+(b[1]-a[1])*t-southOrigin)/step);if(x>=0&&x<width&&y>=0&&y<height)land[y*width+x]=1;}
 }
}
const blocked=land.slice();
if(padding)for(let y=1;y<height-1;y++)for(let x=0;x<width;x++)if(land[y*width+x])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)blocked[(y+dy)*width+(x+dx+width)%width]=1;
// Exclude small disconnected pockets from offshore suggestions (e.g. unresolved estuaries).
const seen=new Uint8Array(blocked.length),queue=new Int32Array(blocked.length);
for(let id=0;id<blocked.length;id++){
 if(blocked[id]||seen[id])continue;let head=0,tail=1;queue[0]=id;seen[id]=1;
 while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);for(const n of [x>0?p-1:-1,x<width-1?p+1:-1,y>0?p-width:-1,y<height-1?p+width:-1])if(n>=0&&!blocked[n]&&!seen[n]){seen[n]=1;queue[tail++]=n;}}
 if(tail<1000)for(let i=0;i<tail;i++)blocked[queue[i]]=1;
}
return blocked;
}
const out=path.resolve(__dirname,'../assets');
fs.writeFileSync(path.join(out,'land-mask.bin'),raster(3600,1800,.1,-180,-90,true));
fs.writeFileSync(path.join(out,'europe-mask.bin'),raster(2400,1200,.025,-20,40,false));
const rounded=polygons.map(p=>p.map(r=>r.map(c=>c.map(n=>+n.toFixed(5)))));
fs.writeFileSync(path.join(out,'land.json'),JSON.stringify(rounded));
console.log('Prepared offline coastline and conservative 0.1 degree research grid.');
