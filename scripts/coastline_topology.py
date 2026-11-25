"""Strict regional coastline classification. Tile boundaries clip evidence; they are not coastlines."""
import shapely
from shapely.geometry import LineString, Point
from shapely.ops import polygonize, unary_union

def local_coordinates(points, center):
    result=[]
    for p in points:
        lon,lat=p['lon'],p['lat']
        if abs(lat)>=90:raise ValueError('Pole vertex requires a polar topology chart')
        reference=result[-1][0] if result else center
        lon+=360*round((reference-lon)/360)
        if abs(lon-reference)==180:raise ValueError('Ambiguous antipodal longitude segment')
        result.append((lon,lat))
    if len(points)>1 and points[0]==points[-1] and result[0]!=result[-1]:
        raise ValueError('Pole-enclosing ring requires a polar topology chart')
    return result

def classify(elements, extent):
    lines=[]; ids=[]
    for e in elements:
        if e.get('type')!='way' or e.get('tags',{}).get('natural')!='coastline': continue
        coords=local_coordinates(e.get('geometry',[]),(extent.bounds[0]+extent.bounds[2])/2)
        if len(coords)<2: raise ValueError('Incomplete coastline geometry')
        line=LineString(coords)
        if not line.is_simple: raise ValueError('Self-intersecting coastline')
        clipped=line.intersection(extent)
        parts=list(clipped.geoms) if hasattr(clipped,'geoms') else [clipped]
        lines.extend(p for p in parts if p.geom_type=='LineString' and p.length>0)
        ids.append('way/'+str(e['id']))
    if not lines:return [],[],{'status':'NO_COASTLINE_EVIDENCE','sources':ids}
    network=shapely.MultiLineString(lines)
    if not network.is_simple:raise ValueError('Intersecting or overlapping coastline')
    balance={}
    for line in lines:
        c=list(line.coords)
        for p,delta in [(c[0],1),(c[-1],-1)]:
            count,b=balance.get(p,(0,0));balance[p]=(count+1,b+delta)
    for p,(count,b) in balance.items():
        if extent.boundary.distance(Point(p))>1e-10 and (count!=2 or b!=0):
            raise ValueError('Open, branched or inconsistent directed coastline inside coverage')
    faces=list(polygonize(unary_union([extent.boundary,*lines])))
    # Query only directed edges touching this face. Avoid faces x all-source-edges scans.
    edges=[];directions=[]
    for line in lines:
        coords=list(line.coords)
        for a,b in zip(coords,coords[1:]):
            if a==b:continue
            edges.append(LineString([a,b]));directions.append((a,b))
    tree=shapely.STRtree(edges)
    water=[];land=[]
    for face in faces:
        votes=set();boundary=face.boundary;shapely.prepare(face);shapely.prepare(boundary)
        for index in tree.query(boundary,predicate='intersects'):
            edge=edges[index];a,b=directions[index]
            # Faces are polygonized from these already clipped, non-intersecting edges.
            # Endpoint-only contact contributes no vote when both probes lie outside.
            midpoint=edge.interpolate(.5,normalized=True);dx=b[0]-a[0];dy=b[1]-a[1];length=(dx*dx+dy*dy)**.5
            epsilon=min(length*1e-6,1e-8)
            left=Point(midpoint.x-dy/length*epsilon,midpoint.y+dx/length*epsilon)
            right=Point(midpoint.x+dy/length*epsilon,midpoint.y-dx/length*epsilon)
            if face.contains(left):votes.add('LAND')
            if face.contains(right):votes.add('WATER')
        if len(votes)!=1:raise ValueError('Ambiguous or conflicting coastline face')
        (land if 'LAND' in votes else water).append(face)
    return water,land,{'status':'DIRECTED_SOURCE_CLASSIFIED','sources':ids,'waterFaces':len(water),'landFaces':len(land),'boundaryRole':'Clipping only; no invented coastline'}
