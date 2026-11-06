'use strict';
const fs=require('node:fs'),path=require('node:path');
const preparation=require('./geographic-preparation.cjs');
function inspect(manager,tiles){
 const directories=preparation.prepared(manager),packages=directories.map(dir=>({dir,info:preparation.verify(dir),manifest:JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')))}));
 const bundled=require('../assets/water-areas/manifest.json');
 return manager.inventory(tiles).map(item=>{
  const t=item.tile,p=packages.find(p=>p.info.source.tile.id===t.id),overlap=r=>r.extent.west<t.east&&r.extent.east>t.west&&r.extent.south<t.north&&r.extent.north>t.south;
  return {...item,evidenceRequired:true,providerAvailable:'osm-hydrography',sourceDownloaded:!!item.record,sourceValidated:item.status==='SOURCE_READY',routingPrepared:!!p,routingIndexAvailable:!!p,preparedDirectory:p?.dir||null,bundledWaterAreas:bundled.regions.filter(overlap).map(r=>({id:r.id,resolutionDegrees:r.resolutionDegrees,coverage:'INTERSECTION_ONLY'})),oceanSource:'Bundled Natural Earth coarse ocean mask; availability is not proof of local connectivity',connectivity:'UNRESOLVED_UNTIL_ROUTE_VERIFIED'};
 });
}
module.exports={inspect};
