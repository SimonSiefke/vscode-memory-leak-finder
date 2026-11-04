from flask import Flask, request
from project.models import Invoice

app = Flask(__name__)


@app.get("/total")
def total():
    name = request.args["name"]
    amount = Invoice([10, 20, 12]).total()
    return {"name": name, "total": amount}
