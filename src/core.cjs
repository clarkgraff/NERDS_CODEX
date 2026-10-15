const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const {lookup}=require('./gazetteer.cjs');
const Time=require('./public/time.js');
const {cleanLayers}=require('./layers.cjs');
const { cleanVessel } = require('./vessel.cjs');
const missions = ['ROUTE PLOT','SURVEYOR – MUSIC','SURVEYOR – CUISINE','SURVEYOR – CULTURE','SURVEYOR – HISTORY','SURVEYOR – ARCHITECTURE','TBD'];
const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function coord(value, min, max) { if (value === '' || value == null || !Number.isFinite(Number(value)) || Number(value)<min || Number(value)>max) throw Error(`Coordinate must be between ${min} and ${max}.`); return Number(value); }
function cleanWaypoint(w) {
  if (!w || typeof w.name !== 'string' || !w.name.trim() || w.name.length>200) throw Error('Enter a waypoint name (1–200 characters).');
  let access = null;
  if (w.access) {
    access = {name:String(w.access.name||'User-assigned water access').slice(0,200),lat:coord(w.access.lat,-90,90),lon:coord(w.access.lon,-180,180),source:String(w.access.source||'').slice(0,2000)};
    for (const key of ['depth','airClearance','maxLOA','maxBeam']) access[key] = w.access[key] === '' || w.access[key] == null ? null : coord(w.access[key],0,100000);
  }
  return {id:typeof w.id==='string' && w.id.length<80?w.id:randomUUID(), name:w.name.trim(),lat:coord(w.lat,-90,90),lon:coord(w.lon,-180,180),notes:String(w.notes||'').slice(0,20000),locationLabel:String(w.locationLabel||'User-defined location').slice(0,200),source:String(w.source||'').slice(0,2000),access,country:String(w.country||'').slice(0,200),region:String(w.region||'').slice(0,200),aliases:Array.isArray(w.aliases)?w.aliases.map(String).slice(0,500):[],sourceId:String(w.sourceId||''),resolutionMethod:String(w.resolutionMethod||'manual'),coordinatePrecision:String(w.coordinatePrecision||'User-supplied WGS84 coordinates'),coordinateOverride:!!w.coordinateOverride,kind:['place','port','transit','land-visit'].includes(w.kind)?w.kind:'place',operatingMode:['AUTO','SAIL','POWER-DIESEL','POWER-ELECTRIC'].includes(w.operatingMode)?w.operatingMode:'AUTO',zone:Time.zone(w.zone||'UTC')};
}
function cleanState(s) {
  if(!s || !Array.isArray(s.waypoints) || s.waypoints.length>1000) throw Error('Invalid waypoint collection.');
  const waypoints=s.waypoints.map(cleanWaypoint);
  if(new Set(waypoints.map(w=>w.id)).size!==waypoints.length) throw Error('Duplicate waypoint identifiers.');
  const oneOf=(v,options)=>{if(!options.includes(v))throw Error('Invalid route option.');return v;};
  if(s.departure && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s.departure)) throw Error('Invalid departure time.');
  const createdAt=s.createdAt||new Date().toISOString(),timeZone=Time.zone(s.timeZone||'UTC');
  const departureUTC=s.departureUTC|| (s.departure?Time.fromLocal(s.departure,'UTC','earlier'):createdAt);
  if(!Number.isFinite(Date.parse(createdAt))||!Number.isFinite(Date.parse(departureUTC)))throw Error('Invalid project timestamp.');
  return {waypoints,projectId:String(s.projectId||randomUUID()),createdAt,timeZone,departureUTC:new Date(departureUTC).toISOString(),mission:oneOf(s.mission,missions),transport:oneOf(s.transport==='BY-ROAD'?'BY-LAND':s.transport,['BY-SEA','BY-LAND','BY-AIR']),speed:oneOf(s.speed,['BEST-TIME','BEST-EFFICIENCY','BEST-SAILING']),view:oneOf(s.view,['GLOBE','MERCATOR','TILTED']),departure:Time.local(departureUTC,timeZone),vessel:cleanVessel(s.vessel),cruisingKnots:coord(s.cruisingKnots??6,0,200),routePreference:s.routePreference==='SHORTEST WATER'?'SHORTEST WATER':'OFFSHORE PREFERRED',coastalSeparationNM:coord(s.coastalSeparationNM??10,0,1000),overlays:Object.fromEntries(['roads','borders','timezones','MUSIC','CUISINE','CULTURE','HISTORY','ARCHITECTURE','environment'].map(k=>[k,!!s.overlays?.[k]])),externalLayers:cleanLayers(s.externalLayers),route:cleanRoute(s.route)};
}
function cleanRoute(r){if(!r)return null;if(!Array.isArray(r.legs)||r.legs.length>999||!Array.isArray(r.alternatives)||r.alternatives.length>10)throw Error('Invalid saved route.');for(const candidate of [r,...r.alternatives]){if(!Array.isArray(candidate.legs))throw Error('Invalid route alternative.');for(const leg of candidate.legs){if(!Array.isArray(leg.points)||leg.points.length>100000||!Number.isFinite(leg.distanceNM)||leg.distanceNM<0)throw Error('Invalid route leg.');for(const p of leg.points){coord(p.lat,-90,90);coord(p.lon,-180,180);}}}return JSON.parse(JSON.stringify(r));}
function emptyState() { return cleanState({waypoints:[],mission:'ROUTE PLOT',transport:'BY-SEA',speed:'BEST-TIME',view:'GLOBE',departure:''}); }
function openStore(dir) {
  fs.mkdirSync(dir,{recursive:true});
  const db=new DatabaseSync(path.join(dir,'nerds.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, source_path TEXT NOT NULL UNIQUE, name TEXT NOT NULL, lat REAL, lon REAL, waypoint_id TEXT, metadata TEXT NOT NULL, imported_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS research (id TEXT PRIMARY KEY, waypoint_id TEXT, title TEXT NOT NULL, body TEXT NOT NULL, source_url TEXT, license TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS acquisitions (id TEXT PRIMARY KEY, provider TEXT NOT NULL, source_url TEXT, license TEXT, local_path TEXT, sha256 TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL);
    PRAGMA user_version=1;`);
  const get=(key,fallback)=>{const row=db.prepare('SELECT value FROM settings WHERE key=?').get(key);return row?JSON.parse(row.value):fallback;};
  const put=(key,value)=>db.prepare('INSERT OR REPLACE INTO settings VALUES (?,?)').run(key,JSON.stringify(value));
  if(!get('state',null)) put('state',emptyState());
  else put('state',cleanState(get('state')));
  return {db,get,put,read:()=>get('state'),save:s=>{const valid=cleanState(s);put('state',valid);return valid;},
    media:()=>db.prepare('SELECT * FROM media ORDER BY imported_at DESC').all().map(m=>({...m,metadata:JSON.parse(m.metadata)})),
    addMedia:m=>{db.prepare('INSERT INTO media VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(source_path) DO UPDATE SET lat=excluded.lat,lon=excluded.lon,metadata=excluded.metadata,waypoint_id=excluded.waypoint_id').run(m.id,m.source_path,m.name,m.lat,m.lon,m.waypoint_id,JSON.stringify(m.metadata),m.imported_at);},
    close:()=>db.close()};
}
function localEndpoint(input) {
  const url=new URL(input);
  if(!['http:','https:'].includes(url.protocol)||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash) throw Error('Use a local HTTP API URL, such as http://127.0.0.1:1234/v1.');
  return url.href.replace(/\/$/,'');
}
module.exports={lookup,cleanWaypoint,cleanState,openStore,missions,localEndpoint,emptyState};
