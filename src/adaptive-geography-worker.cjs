const {parentPort,workerData}=require('node:worker_threads');
const {GeographicDataManager}=require('./geographic-data.cjs');
require('./adaptive-geography.cjs').expand(new GeographicDataManager(workerData.cacheDirectory),workerData.points,{...workerData.options,provider:require('./geographic-providers.cjs').osmHydrography()}).then(result=>parentPort.postMessage({result})).catch(e=>parentPort.postMessage({error:e.message}));
