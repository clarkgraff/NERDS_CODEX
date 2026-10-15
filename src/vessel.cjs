const LENGTH_FIELDS = ['loa', 'beam', 'draftWater', 'draftAir', 'lwl'];
function optionalNumber(value, max = 1000000) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max) throw Error('Vessel measurements must be non-negative numbers within range.');
  return n;
}
function cleanVessel(v = {}) {
  const result = {};
  for (const key of ['name', 'imo', 'mmsi', 'flag', 'hullType']) result[key] = String(v[key] || '').trim().slice(0, 200);
  result.imo = result.imo.replace(/^IMO\s*/i, '');
  if (result.imo && !/^\d{7}$/.test(result.imo)) throw Error('IMO must contain seven digits, or be left blank.');
  if (result.mmsi && !/^\d{9}$/.test(result.mmsi)) throw Error('MMSI must contain nine digits, or be left blank.');
  result.propulsion = ['SAIL', 'POWER', 'SAIL + POWER'].includes(v.propulsion) ? v.propulsion : 'SAIL + POWER';
  result.propulsionModes = Array.isArray(v.propulsionModes) ? [...new Set(v.propulsionModes)].filter(m=>['SAIL','POWER-DIESEL','POWER-ELECTRIC'].includes(m)) : result.propulsion==='SAIL'?['SAIL']:result.propulsion==='POWER'?['POWER-DIESEL']:['SAIL','POWER-DIESEL'];
  if(!result.propulsionModes.length)throw Error('Select at least one propulsion mode.');
  for(const [key,fallback] of [['referenceKnots',6],['sailKnots',6],['dieselKnots',10],['electricKnots',10],['landKnots',30],['airKnots',250]]){const n=Number(v[key]??fallback);if(!Number.isFinite(n)||n<=0||n>1000)throw Error('Nominal speeds must be positive and at most 1,000 knots.');result[key]=n;}
  for(const key of ['underKeel','airAllowance','draftAllowance'])result[key]=optionalNumber(v[key])??0;
  result.assumptions=String(v.assumptions||'Nominal planning assumptions; no calibrated environmental model.').slice(0,4000);
  result.lengthUnit = v.lengthUnit === 'ft' ? 'ft' : 'm';
  result.massUnit = v.massUnit === 'kg' ? 'kg' : 't';
  for (const key of [...LENGTH_FIELDS, 'displacement']) result[key] = optionalNumber(v[key]);
  result.hullSpeed = optionalNumber(v.hullSpeed, 200);
  result.imageData = typeof v.imageData === 'string' && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v.imageData) && v.imageData.length < 3000000 ? v.imageData : '';
  return result;
}
function metres(v, key) { return v[key] == null ? null : v[key] * (v.lengthUnit === 'ft' ? 0.3048 : 1); }
function estimateHullSpeed(v) {
  const vessel = cleanVessel(v);
  if (vessel.hullType !== 'Displacement monohull' || !vessel.lwl) throw Error('This estimate requires a displacement monohull and waterline length.');
  return 1.34 * Math.sqrt(metres(vessel, 'lwl') / 0.3048);
}
function accessAssessment(access, v) {
  if (!access) return 'Water access not assigned; verified local chart data required.';
  const checks = [['draftWater', 'depth'], ['draftAir', 'airClearance'], ['loa', 'maxLOA'], ['beam', 'maxBeam']];
  const exceeds = checks.filter(([dimension, limit]) => metres(v, dimension) != null && access[limit] != null && metres(v, dimension)+(dimension==='draftWater'?(v.underKeel||0)+(v.draftAllowance||0):dimension==='draftAir'?(v.airAllowance||0):0) > access[limit]);
  if (exceeds.length) return 'UNSUITABLE: vessel exceeds supplied ' + exceeds.map(([, key]) => key).join(', ') + ' limits.';
  return 'UNVERIFIED: user-assigned access. Tides, clearance margins, restrictions and approach must be checked against current charts.';
}
module.exports = { cleanVessel, estimateHullSpeed, accessAssessment, metres };
