const {parentPort}=require('node:worker_threads');
parentPort.on('message',({state,options})=>{try{parentPort.postMessage({result:require('./passage.cjs').plan(state,options)});}catch(e){parentPort.postMessage({error:e.stack||e.message});}});
