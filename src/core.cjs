const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const cities = require('../assets/cities.json');
const missions = ['ROUTE PLOT','SURVEYOR – MUSIC','SURVEYOR – CUISINE','SURVEYOR – CULTURE','SURVEYOR – HISTORY','SURVEYOR – ARCHITECTURE','TBD'];
const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function lookup(query) { const q=normalize(query); return q ? cities.filter(c=>[c.name,...c.aliases||[]].some(n=>normalize(n).includes(q))) : cities; }
function coord(value, min, max) { if (value === '' || value == null || !Number.isFinite(Number(value)) || Number(value)<min || Number(value)>max) throw Error(`Coordinate must be between ${min} and ${max}.`); return Number(value); }
function cleanWaypoint(w) {
  if (!w || typeof w.name !== 'string' || !w.name.trim() || w.name.length>200) throw Error('Enter a waypoint name (1–200 characters).');
  return {id:typeof w.id==='string' && w.id.length<80?w.id:randomUUID(), name:w.name.trim(),lat:coord(w.lat,-90,90),lon:coord(w.lon,-180,180),notes:String(w.notes||'').slice(0,20000)};
}
function cleanState(s) {
  if(!s || !Array.isArray(s.waypoints) || s.waypoints.length>1000) throw Error('Invalid waypoint collection.');
  const waypoints=s.waypoints.map(cleanWaypoint);
  if(new Set(waypoints.map(w=>w.id)).size!==waypoints.length) throw Error('Duplicate waypoint identifiers.');
  const oneOf=(v,options)=>{if(!options.includes(v))throw Error('Invalid route option.');return v;};
  if(s.departure && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s.departure)) throw Error('Invalid departure time.');
  return {waypoints,mission:oneOf(s.mission,missions),transport:oneOf(s.transport,['BY-SEA','BY-ROAD','BY-AIR']),speed:oneOf(s.speed,['BEST-TIME','BEST-EFFICIENCY','BEST-SAILING']),view:oneOf(s.view,['GLOBE','MERCATOR']),departure:s.departure||''};
}
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
  if(!get('state',null)) put('state',{waypoints:cities.slice(0,5).map(c=>cleanWaypoint(c)),mission:'ROUTE PLOT',transport:'BY-SEA',speed:'BEST-TIME',view:'GLOBE',departure:''});
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
module.exports={lookup,cleanWaypoint,cleanState,openStore,missions,localEndpoint};
