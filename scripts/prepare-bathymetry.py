"""Prepare a bounded, lossless bathymetry window for offline advisory sampling."""
import argparse,pathlib,json,hashlib,rasterio,numpy as np
from rasterio.windows import from_bounds,Window
p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--output',required=True);p.add_argument('--bbox',nargs=4,type=float,required=True);a=p.parse_args();out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
with rasterio.open(a.source) as src:
 if str(src.crs)!='EPSG:4326':raise ValueError('Geographic raster required; explicit reprojection not implemented')
 w=from_bounds(*a.bbox,src.transform).round_offsets().round_lengths();data=src.read(1,window=w).astype('<f4');transform=src.window_transform(w);bounds=rasterio.windows.bounds(w,src.transform)
 payload=data.tobytes();(out/'depth.f32').write_bytes(payload)
 info={'schemaVersion':1,'source':str(pathlib.Path(a.source).resolve()),'sourceName':'GEBCO 2026','sourceBytes':pathlib.Path(a.source).stat().st_size,'attribution':'GEBCO Compilation Group (2026)','license':'Public domain with source acknowledgement; https://www.gebco.net/data-products/gridded-bathymetry/terms-of-use','bounds':list(bounds),'width':data.shape[1],'height':data.shape[0],'resolutionDegrees':[transform.a,-transform.e],'nodata':src.nodata,'values':'elevation metres; negative below reference surface','verticalDatum':'GEBCO heterogeneous sources; not guaranteed chart datum','file':'depth.f32','sha256':hashlib.sha256(payload).hexdigest(),'policy':'ADVISORY_ONLY','limitations':['Not an ENC or hydrographic clearance certification','Tides, uncertainty, survey age and under-keel clearance unresolved','Nearest source cell; no invented depth or interpolation']}
 (out/'manifest.json').write_text(json.dumps(info,indent=2));print(json.dumps({'cells':data.size,'bytes':len(payload),'bounds':bounds}))
