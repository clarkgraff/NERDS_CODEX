(function(root){
class TileFallback{constructor(limit=128){this.limit=limit;this.tiles=new Map();}put(x,y,z,image){const k=`${z}/${x}/${y}`;this.tiles.delete(k);this.tiles.set(k,image);while(this.tiles.size>this.limit)this.tiles.delete(this.tiles.keys().next().value);}parent(x,y,z){for(let level=z-1;level>=0;level--){const scale=2**(z-level),image=this.tiles.get(`${level}/${Math.floor(x/scale)}/${Math.floor(y/scale)}`);if(image)return {image,scale,x:x%scale,y:y%scale,level};}return null;}}
if(typeof module!=='undefined')module.exports={TileFallback};else root.TileFallback=TileFallback;
})(globalThis);
