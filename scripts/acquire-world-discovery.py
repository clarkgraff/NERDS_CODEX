import urllib.request,pathlib,time,hashlib,json
root=pathlib.Path('work/discovery');root.mkdir(parents=True,exist_ok=True)
for name in ['readme.txt','countryInfo.txt','admin1CodesASCII.txt','featureCodes_en.txt','allCountries.zip']:
 target=root/name
 if target.exists():print('Preserved',name,target.stat().st_size,flush=True);continue
 url='https://download.geonames.org/export/dump/'+name
 try:
  request=urllib.request.Request(url,headers={'User-Agent':'NERDS/0.3.1 geographic data acquisition'})
  with urllib.request.urlopen(request,timeout=45) as response,open(str(target)+'.partial','wb') as output:
   count=0;last=time.monotonic()
   while True:
    chunk=response.read(1024*1024)
    if not chunk:break
    output.write(chunk);count+=len(chunk)
    if time.monotonic()-last>15:print(name,count,'bytes',flush=True);last=time.monotonic()
  pathlib.Path(str(target)+'.partial').replace(target);print('Downloaded',name,count,flush=True)
 except Exception as e:print('FAILED',name,str(e),flush=True)
