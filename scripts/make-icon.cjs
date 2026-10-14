// Original compass artwork generated locally; no downloaded image assets.
const fs=require('node:fs');const path=require('node:path');const zlib=require('node:zlib');
const size=256,raw=Buffer.alloc((size*4+1)*size);
const tri=(x,y,a,b,c)=>{const cross=(p,q)=>(x-q[0])*(p[1]-q[1])-(p[0]-q[0])*(y-q[1]);const d=[cross(a,b),cross(b,c),cross(c,a)];return !(d.some(v=>v<0)&&d.some(v=>v>0));};
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
 const dx=x-128,dy=y-128,r=Math.hypot(dx,dy);let color=[11,25,34,255];if(r>124)color=[0,0,0,0];else if(r>117||Math.abs(r-94)<1.7)color=[68,113,124,255];
 if(tri(x,y,[154,47],[142,139],[108,119]))color=[142,220,204,255];if(tri(x,y,[102,209],[114,117],[148,137]))color=[231,197,140,255];
 if(r<9)color=[11,25,34,255];const pos=y*(size*4+1)+1+x*4;raw.set(color,pos);
}
function crc(b){let c=0xffffffff;for(const n of b){c^=n;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([size,t,data,sum]);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18);
fs.writeFileSync(path.join(__dirname,'../assets/nerds.png'),png);fs.writeFileSync(path.join(__dirname,'../assets/nerds.ico'),Buffer.concat([ico,png]));
