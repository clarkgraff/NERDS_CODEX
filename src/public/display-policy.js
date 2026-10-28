(function(root){
 const finite=(v,d,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):d;
 function clean(p={}){const min=finite(p.populationMin,0,0,50000000);return {cartography:['baseline','simple','terrain'].includes(p.cartography)?p.cartography:'terrain',hoverRadius:finite(p.hoverRadius,24,0,100),relief:finite(p.relief,.25,0,1),cityLabels:p.cityLabels!==false,waypointLabels:p.waypointLabels!==false,featureLabels:p.featureLabels!==false,populationMin:min,populationMax:Math.max(min,finite(p.populationMax,50000000,0,50000000)),unknownPopulation:p.unknownPopulation!==false,exclusionRadius:finite(p.exclusionRadius,60,0,300),leftWidth:finite(p.leftWidth,275,200,750),rightWidth:finite(p.rightWidth,290,220,750)};}
 function eligible(p,pref,height){return pref.cityLabels&&(p.population===null?pref.unknownPopulation:p.population>=pref.populationMin&&p.population<=pref.populationMax)&&height<=p.max;}
 function select(rows,radius){const selected=[];for(const p of [...rows].sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name))){if(selected.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=Math.max(radius,(p.width+q.width)/2+5)||Math.abs(q.y-p.y)>20))selected.push(p);}return selected;}
 const api={clean,eligible,select};if(typeof module!=='undefined')module.exports=api;else root.NerdsDisplay=api;
})(globalThis);
