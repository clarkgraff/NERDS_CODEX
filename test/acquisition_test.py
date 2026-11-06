import importlib.util,pathlib,tempfile,threading,unittest
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
spec=importlib.util.spec_from_file_location('acquire',pathlib.Path('scripts/acquire-world-discovery.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class AcquisitionTest(unittest.TestCase):
 def exercise(self,changed=False):
  payload=b'A'*600000;replacement=b'B'*600000;requests=[]
  class Handler(BaseHTTPRequestHandler):
   def log_message(self,*args):pass
   def do_GET(self):
    requests.append(dict(self.headers));attempt=len(requests)
    offset=int(self.headers.get('Range','bytes=0-').split('=')[1].split('-')[0])
    body=replacement if changed and attempt>1 else payload
    resume=offset>0 and not changed
    if not resume:offset=0
    self.send_response(206 if resume else 200);self.send_header('ETag','"v2"' if changed and attempt>1 else '"v1"')
    self.send_header('Content-Length',str(len(body)-offset))
    if resume:self.send_header('Content-Range',f'bytes {offset}-{len(body)-1}/{len(body)}')
    self.end_headers();self.wfile.write(body[offset:300000] if attempt==1 else body[offset:]);self.wfile.flush();self.close_connection=True
  server=ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
  try:
   with tempfile.TemporaryDirectory() as directory:
    target=pathlib.Path(directory)/'data.bin';module.acquire(f'http://127.0.0.1:{server.server_port}/data',target)
    self.assertEqual(target.read_bytes(),replacement if changed else payload)
    self.assertEqual(requests[1]['Range'],'bytes=300000-')
    self.assertEqual(requests[1]['If-Range'],'"v1"')
    if changed:self.assertEqual(len(list(pathlib.Path(directory).glob('*.superseded.*'))),1)
    module.acquire('http://invalid.example/',target)
  finally:server.shutdown();server.server_close();thread.join()
 def test_resume(self):self.exercise()
 def test_changed_source_preserved(self):self.exercise(True)
if __name__=='__main__':unittest.main()
