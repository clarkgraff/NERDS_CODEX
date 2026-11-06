'use strict';
const {distanceNM}=require('./navigation.cjs'),{clean}=require('./public/custom-course.js');
function registry(db){
 db.exec('CREATE TABLE IF NOT EXISTS precision_locations (id TEXT PRIMARY KEY, record TEXT NOT NULL)');
 const get=id=>{const row=db.prepare('SELECT record FROM precision_locations WHERE id=?').get(id);return row?JSON.parse(row.record):null;};
 function put(record,projectId){const old=get(record.id);record={...old,...record,projectIds:[...new Set([...(old?.projectIds||[]),projectId])],updatedAt:new Date().toISOString()};db.prepare('INSERT OR REPLACE INTO precision_locations VALUES (?,?)').run(record.id,JSON.stringify(record));return record;}
 function sync({projectId,anchors}){if(typeof projectId!=='string'||projectId.length>200)throw Error('Invalid precision project reference');const model=clean({anchors}),out=[];db.exec('SAVEPOINT precision_sync');try{for(const a of model.anchors.filter(a=>a.type)){out.push(put({id:a.id,name:a.name||a.type,type:a.type,subtype:a.subtype||'',...a.point,source:'USER',attribution:'User-confirmed position',coordinateReference:'WGS84',verification:'USER_POSITION_NOT_WATERWAY_VALIDATION',waypointIds:[a.fromId,a.toId].filter(Boolean),contacts:a.contacts||[],notes:a.notes||'',media:a.media||[],research:a.research||[],links:a.landing?[{id:a.landing.id,relationship:'SHORE_TRANSFER',distanceNM:distanceNM(a.point,a.landing.point)}]:[]},projectId));if(a.landing)out.push(put({id:a.landing.id,name:a.landing.name||'LANDING',type:'LANDING',...a.landing.point,source:'USER',coordinateReference:'WGS84',verification:'USER_POSITION_NOT_WATERWAY_VALIDATION',links:[{id:a.id,relationship:'ANCHORAGE',distanceNM:distanceNM(a.point,a.landing.point)}]},projectId));}db.exec('RELEASE precision_sync');}catch(e){db.exec('ROLLBACK TO precision_sync');db.exec('RELEASE precision_sync');throw e;}return out;}
 return {get,sync};
}
module.exports={registry};
