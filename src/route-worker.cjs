const {parentPort,workerData}=require('node:worker_threads');
try{parentPort.postMessage(require('./passage.cjs').plan(workerData.state||workerData,{...workerData.options,progress:workerData.progressEvents?p=>parentPort.postMessage({progress:p}):undefined}));}catch(e){parentPort.postMessage({error:e.message});}
