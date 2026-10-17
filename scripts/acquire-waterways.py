import urllib.request,urllib.parse,json,pathlib,time
root=pathlib.Path('work/stage2');root.mkdir(parents=True,exist_ok=True)
regions={'elbe':(53.4,8.4,54.1,10.2),'thames-full':(51.3,-0.4,51.8,1.2),'amazon':(-4,-61,1,-48),'kiel-denmark':(53.8,8.5,56.0,13.0),'st-lawrence':(43,-80,48,-69)}
for name,bbox in regions.items():
 target=root/(name.replace(' ','')+'-osm.json')
 if target.exists():continue
 q='[out:json][timeout:45];way[waterway~"^(river|canal|fairway)$"]('+','.join(map(str,bbox))+');out geom;'
 try:
  req=urllib.request.Request('https://overpass-api.de/api/interpreter',data=urllib.parse.urlencode({'data':q}).encode(),headers={'User-Agent':'NERDS-stage2-geographic-data'})
  data=urllib.request.urlopen(req,timeout=55).read();doc=json.loads(data)
  if doc.get('remark'):raise RuntimeError(doc['remark'])
  target.write_bytes(data);(root/(name+'-query.txt')).write_text(q,encoding='utf-8');print(name,len(doc['elements']),len(data),flush=True)
 except Exception as e:print(name,'FAILED',str(e),flush=True)
 time.sleep(2)
