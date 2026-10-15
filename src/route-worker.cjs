const {parentPort,workerData}=require('node:worker_threads');
try{parentPort.postMessage(require('./passage.cjs').plan(workerData));}catch(e){parentPort.postMessage({error:e.message});}
