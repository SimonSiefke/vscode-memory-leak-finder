import pathlib
from wsgiref.simple_server import make_server

from app import app

with make_server("127.0.0.1", 0, app) as server:
    ready = pathlib.Path(".flask-port.tmp")
    ready.write_text(str(server.server_port), encoding="utf-8")
    ready.replace(".flask-port")
    server.serve_forever()
