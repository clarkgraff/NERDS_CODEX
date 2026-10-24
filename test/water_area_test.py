import importlib.util,unittest
spec=importlib.util.spec_from_file_location('prepare','scripts/prepare-water-areas.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def way(points,role='outer',ref=1):return {'type':'way','role':role,'ref':ref,'geometry':[{'lon':x,'lat':y} for x,y in points]}
class Rings(unittest.TestCase):
 def test_open_ambiguous_and_self_intersection_rejected(self):
  for parts in [[[(0,0),(1,0),(1,1)]],[[(0,0),(1,0)],[(1,0),(0,0)],[(1,0),(1,1)]]]:
   with self.assertRaises(ValueError):m.rings(parts)
  with self.assertRaises(ValueError):m.feature(way([(0,0),(2,2),(0,2),(2,0),(0,0)]))
 def test_overlapping_holes_remain_excluded(self):
  outer=way([(0,0),(4,0),(4,4),(0,4),(0,0)]);h1=way([(1,1),(3,1),(3,3),(1,3),(1,1)],'inner',2);h2=way([(2,2),(3.5,2),(3.5,3.5),(2,3.5),(2,2)],'inner',3)
  polys,holes=m.feature({'type':'relation','members':[outer,h1,h2]});self.assertEqual(len(holes),2);self.assertAlmostEqual(polys[0].area,10.75);self.assertTrue(polys[0].is_valid)
 def test_exact_ring_members_connect_without_snapping(self):
  self.assertEqual(len(m.rings([[(0,0),(2,0),(2,2)],[(0,0),(0,2),(2,2)]])),1)
  with self.assertRaises(ValueError):m.rings([[(0,0),(2,0),(2,2)],[(0,0),(0,2),(2,2.00001)]])
if __name__=='__main__':unittest.main()
