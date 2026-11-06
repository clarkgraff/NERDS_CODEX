const {parentPort}=require('node:worker_threads');
const {lookup}=require('./gazetteer.cjs');
parentPort.on('message',({id,query})=>{const start=performance.now();try{parentPort.postMessage({id,records:lookup(query),elapsedMs:performance.now()-start});}catch(e){parentPort.postMessage({id,error:e.message});}});
