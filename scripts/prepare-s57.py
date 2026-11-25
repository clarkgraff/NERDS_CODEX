"""Prepare one local S-57 cell, preserving source/update provenance. Never edits source archives."""
import argparse,hashlib,json,pathlib,tempfile,zipfile,os
import fiona
from fiona.model import to_dict

def prepare(archive,cell,output):
    archive=pathlib.Path(archive); output=pathlib.Path(output)
    if output.exists(): raise ValueError('Output already exists; preserve the previous package')
    if not cell.isalnum(): raise ValueError('Invalid cell identifier')
    with zipfile.ZipFile(archive) as z, tempfile.TemporaryDirectory(prefix='nerds-s57-') as temp:
        records={}
        for info in z.infolist():
            p=pathlib.PurePosixPath(info.filename)
            if p.stem.upper()==cell.upper() and p.suffix[1:].isdigit():
                n=int(p.suffix[1:])
                if n in records: raise ValueError('Ambiguous duplicate cell/update')
                if info.file_size>256*1024*1024: raise ValueError('Cell exceeds preparation budget')
                records[n]=info
        if 0 not in records: raise ValueError('Base cell missing')
        if sorted(records)!=list(range(max(records)+1)): raise ValueError('Missing intermediate update')
        sources=[]
        for n,info in sorted(records.items()):
            data=z.read(info); name=f'{cell}.{n:03d}';pathlib.Path(temp,name).write_bytes(data)
            sources.append({'member':info.filename,'update':n,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
        base=str(pathlib.Path(temp,f'{cell}.000'));features=[];metadata=[];counts={}
        with fiona.Env(OGR_S57_OPTIONS='UPDATES=APPLY,RETURN_DSID=ON,SPLIT_MULTIPOINT=ON,ADD_SOUNDG_DEPTH=ON'):
            for layer in fiona.listlayers(base):
                with fiona.open(base,layer=layer) as src:
                    if src.crs and src.crs.to_epsg()!=4326: raise ValueError('Unexpected chart coordinate reference')
                    count=0
                    for feature in src:
                        item=to_dict(feature);item['properties']['sourceLayer']=layer
                        if layer=='DSID':metadata.append(item['properties'])
                        else: features.append(item)
                        count+=1
                        if len(features)>500000:raise ValueError('Feature budget exceeded')
                    counts[layer]=count
        if not metadata:raise ValueError('Missing chart identification metadata')
        if any(int(m.get('DSID_UPDN',-1))!=max(records) for m in metadata):raise ValueError('Applied update does not match source update sequence')
        if not features:raise ValueError('Cell contains no geographic features')
        payload=json.dumps({'type':'FeatureCollection','features':features},allow_nan=False).encode()
        manifest={'schemaVersion':1,'format':'S-57','cell':cell,'sourceArchive':str(archive.resolve()),'sourceFiles':sources,'chartMetadata':metadata,'layers':counts,'parser':{'name':'Fiona/GDAL','fiona':fiona.__version__,'gdal':fiona.__gdal_version__},'file':'features.geojson','sha256':hashlib.sha256(payload).hexdigest(),'bytes':len(payload),'status':'PREPARED_NOT_NAVIGATION_VALIDATED','verifiedClearance':False,'limitations':['Source permission and update currency require verification','Vertical datums and quality are retained as chart attributes, not assumed harmonised','No tide or vessel clearance certification','No routing graph adoption implied']}
        output.parent.mkdir(parents=True,exist_ok=True)
        with tempfile.TemporaryDirectory(dir=output.parent,prefix='.s57-stage-') as staging:
            stage=pathlib.Path(staging)/'package';stage.mkdir();(stage/'features.geojson').write_bytes(payload);(stage/'manifest.json').write_text(json.dumps(manifest,indent=2))
            os.rename(stage,output)
        return manifest
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--archive',required=True);p.add_argument('--cell',required=True);p.add_argument('--output',required=True);a=p.parse_args()
    print(json.dumps(prepare(a.archive,a.cell,a.output),indent=2))
