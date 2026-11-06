// Geographic estimates only. This is deliberately separate from the LLM.
const RADIUS_NM = 6371008.8 / 1852;
function estimateNM(a, b) {
  const rad = n => n * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIUS_NM * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
const geodesic=require('geographiclib-geodesic').Geodesic.WGS84;
function distanceNM(a,b){return geodesic.Inverse(a.lat,a.lon,b.lat,b.lon).s12/1852;}
function interpolate(a,b,fraction){const line=geodesic.Inverse(a.lat,a.lon,b.lat,b.lon),p=geodesic.Direct(a.lat,a.lon,line.azi1,line.s12*fraction);return {lat:p.lat2,lon:p.lon2};}
function calculate(state) {
  if (state.waypoints.length < 2) throw Error('Add at least two waypoints.');
  if (!(state.cruisingKnots > 0)) throw Error('Enter an assumed cruising speed in knots.');
  let totalNM = 0;
  const legs = state.waypoints.slice(1).map((w, index) => {
    const previous = state.waypoints[index];
    const a = state.transport === 'BY-SEA' && previous.access ? previous.access : previous;
    const b = state.transport === 'BY-SEA' && w.access ? w.access : w;
    const distance = distanceNM(a, b); totalNM += distance;
    return {waypointId:w.id,distanceNM:distance,hours:distance/state.cruisingKnots,totalNM,totalHours:totalNM/state.cruisingKnots};
  });
  return {kind:'geographic-estimate',warning:'Great-circle estimates, not navigable routes. Connections may cross land. No tides, weather, depth or performance model.',legs,totalNM,hours:totalNM/state.cruisingKnots};
}
module.exports = { distanceNM, estimateNM, interpolate, calculate };
