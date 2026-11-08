(function(root){
const keys=['vesselDraught','minimumDepth','underKeelClearance','airDraught','bridgeClearance','channelWidth','tides','currents','weather','vesselSuitability'];
function clean(input={}){return {enabled:input.enabled===true,individual:Object.fromEntries(keys.map(k=>[k,input.individual?.[k]===true]))};}
function assess(input){const c=clean(input);return {enabled:c.enabled,checks:c.enabled?keys.filter(k=>c.individual[k]).map(key=>({key,status:'UNRESOLVED',reason:'Current route-wide supporting evidence is unavailable; no clearance or suitability approval is established.'})):[]};}
const api={keys,clean,assess};if(typeof module!=='undefined')module.exports=api;else root.NavigationConstraints=api;
})(globalThis);
