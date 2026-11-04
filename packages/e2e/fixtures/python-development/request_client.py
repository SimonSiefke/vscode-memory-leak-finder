import json
import pathlib
import urllib.request

port = int(pathlib.Path(".flask-port").read_text(encoding="utf-8"))
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
with opener.open(f"http://127.0.0.1:{port}/total?name=e2e", timeout=60) as response:
    result = json.load(response)
    assert response.status == 200
    assert result == {"name": "e2e", "total": 42}
pathlib.Path(".flask-response.json").write_text(json.dumps(result), encoding="utf-8")
print("Flask response: 42", flush=True)
