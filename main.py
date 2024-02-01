import flask
import os
import json
import random
import time
from werkzeug.utils import secure_filename

app = flask.Flask(__name__)

B64_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"
def randomB64(length):
	# https://stackoverflow.com/a/2511238
	return "".join(random.choice(B64_CHARS) for _ in range(length))

@app.route("/", methods=["GET", "POST"])
def home():
	if flask.request.method == "GET":
		return flask.render_template("index.html")
	files = flask.request.files.getlist("file")

	sessionID = randomB64(100)
	while os.path.exists(sessionID):
		sessionID = randomB64(100)
	os.makedirs(os.path.join("static", "images", sessionID))

	for file in files:
		filename = os.path.join("static", "images", sessionID, secure_filename(file.filename))
		file.save(filename)
	
	created = round(time.time())
	return flask.render_template("makecookie.html", session=sessionID, created=created)

@app.route("/label", methods=["POST"])
def label():
	session = flask.request.form["sessionID"]
	created = int(flask.request.form["created"])
	current = round(time.time())
	if (current - created >= 604800):
		return "you will be deleted"
	images = os.listdir(os.path.join("static", "images", session))
	return flask.render_template("label.html", images=json.dumps(images))

if __name__ == '__main__':  
	app.run()