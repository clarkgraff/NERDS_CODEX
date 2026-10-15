const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),{createHash}=require('node:crypto');
const dir=path.join(__dirname,'../assets'),manifest=require('../assets/gazetteer-manifest.json');
const file=path.join(dir,'geonames.sqlite');
if(!fs.existsSync(file)||createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==manifest.sha256){const bytes=zlib.gunzipSync(fs.readFileSync(file+'.gz'));if(createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw Error('Gazetteer integrity check failed.');fs.writeFileSync(file,bytes);}
console.log('Verified worldwide gazetteer:',manifest.count,'places');
