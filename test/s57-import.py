import importlib.util,pathlib,tempfile,zipfile,unittest,json
spec=importlib.util.spec_from_file_location('prepare_s57',pathlib.Path(__file__).parents[1]/'scripts/prepare-s57.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
SOURCE=pathlib.Path(r'C:\DATA_DRIVE\NERDS\GEOGRAPHIC_DATA\MARINE_CHARTS\NOAA_USA\NOAA_All_ENCs.zip')
class S57Test(unittest.TestCase):
 def test_actual_base_update_and_no_overwrite(self):
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t)/'package';d=m.prepare(SOURCE,'US5ILGCC',p)
   self.assertEqual(d['chartMetadata'][0]['DSID_UPDN'],'1');self.assertEqual(d['chartMetadata'][0]['DSPM_CSCL'],12000)
   for layer in ['BRIDGE','DEPARE','SOUNDG']:self.assertGreater(d['layers'][layer],0)
   self.assertFalse(d['verifiedClearance']);before=(p/'features.geojson').read_bytes()
   with self.assertRaisesRegex(ValueError,'exists'):m.prepare(SOURCE,'US5ILGCC',p)
   self.assertEqual(before,(p/'features.geojson').read_bytes())
 def test_missing_update_and_missing_base(self):
  for members in [['X.000','X.002'],['X.001']]:
   with tempfile.TemporaryDirectory() as t:
    p=pathlib.Path(t);z=p/'bad.zip'
    with zipfile.ZipFile(z,'w') as f:
     for name in members:f.writestr(name,b'not a chart')
    with self.assertRaises(ValueError):m.prepare(z,'X',p/'out')
    self.assertFalse((p/'out').exists())
if __name__=='__main__':unittest.main()
