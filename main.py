import flask
import os
import json
import random
import time
from werkzeug.utils import secure_filename
import detect

app = flask.Flask(__name__)

B64_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"
B64_CHARS_NO_SPECIAL = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
def randomB64(length):
	# https://stackoverflow.com/a/2511238
	return random.choice(B64_CHARS_NO_SPECIAL) + ("".join(random.choice(B64_CHARS) for _ in range(length - 2))) + random.choice(B64_CHARS_NO_SPECIAL)

@app.route("/", methods=["GET", "POST"])
def home():
	if flask.request.method == "GET":
		return flask.render_template("index.html")
	files = flask.request.files.getlist("file")

	sessionID = randomB64(200)
	while os.path.exists(sessionID):
		sessionID = randomB64(200)
	os.makedirs(os.path.join("static", "images", sessionID))

	for file in files:
		filename = os.path.join("static", "images", sessionID, secure_filename(file.filename))
		file.save(filename)
	
	created = round(time.time())
	return flask.render_template("makecookie.html", session=sessionID, created=created)

@app.route("/imageList", methods=["POST"])
def imageList():
	session = flask.request.data.decode("ascii")
	sessionList = os.listdir("static/images")
	if session not in sessionList:
		return json.dumps([])
	images = os.listdir(os.path.join("static", "images", session))
	return json.dumps(images)

@app.route("/label", methods=["GET"])
def label():
	return flask.render_template("label.html")

@app.route("/verifyCookie", methods=["POST"])
def verifyCookie():
	data = json.loads(flask.request.data.decode("ascii"))

	session = data["session"]
	created = int(data["created"])

	sessionList = os.listdir("static/images")
	current = round(time.time())
	
	if session not in sessionList:
		return "/"
	if current - created >= 604800:
		return "/"

	return "/label"

@app.route("/save", methods=["POST"])
def save():
	data = json.loads(flask.request.data.decode("ascii"))
	session = secure_filename(data["session"])
	completed = data["completed"]
	fileList = os.listdir(os.path.join("static", "images", session))
	for filename in completed:
		secure = secure_filename(filename)
		if secure in fileList:
			os.remove(os.path.join("static", "images", session, secure))
	return ""

@app.route("/clear", methods=["POST"])
def clear():
	session = secure_filename(flask.request.data.decode("ascii"))
	dirList = os.listdir(os.path.join("static", "images"))
	if session in dirList:
		os.rmdir(os.path.join("static", "images", session))
	os.remove(os.path.join("static", "models", session + ".tflite"))
	return ""

@app.route("/uploadmodel", methods=["POST"])
def uploadmodel():
	files = flask.request.files.getlist("file")
	session = flask.request.form["session"]
	for file in files:
		filename = os.path.join("static", "models", session + ".tflite")
		file.save(filename)
	
	return ""


@app.route("/aidetect", methods=["POST"])
def aidetect():
	data = json.loads(flask.request.data.decode("ascii"))
	session = secure_filename(data["session"])
	imageName = secure_filename(data["imagename"])

	imageList = os.listdir(os.path.join("static", "images", session))
	modelList = os.listdir(os.path.join("static", "models"))

	if (session + ".tflite") not in modelList:
		return "no uploaded model"
	if imageName not in imageList:
		return "no such image"

	try:
		notes = detect.get_detections(os.path.join("static", "images", session, imageName), os.path.join("static", "models", session + ".tflite"))
	except:
		return "bad model, upload another one"

	detections = []
	for note in notes:
		detections.append({
			"class": note[0],
			"conf": int(round(note[1] * 100)),
			"xmin": note[2],
			"ymin": note[3],
			"xmax": note[4],
			"ymax": note[5],
		})
	return json.dumps(detections)

if __name__ == '__main__':  
	app.run(port=5000)