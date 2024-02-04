class Box {
	constructor(x1, y1, x2, y2) {
		this.minX = Math.min(x1, x2);
		this.maxX = Math.max(x1, x2);
		this.minY = Math.min(y1, y2);
		this.maxY = Math.max(y1, y2);
	}
}

const saveButton = document.getElementById("save");
const undoButton = document.getElementById("undo");
const nextButton = document.getElementById("next");
const uploadButton = document.getElementById("upload");

const submitButton = document.getElementById("formsubmit");

const image = document.getElementById("image");
const imageContainer = document.getElementById("imagecontainer");
const tempCanvas = document.getElementById("tempcanvas");

const PAGE_WIDTH = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
const PAGE_HEIGHT = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

const RED = 41;
const GREEN = 197;
const BLUE = 246;
const FILL_ALPHA1 = 0.15;
const FILL_ALPHA2 = 0.3;
const STROKE_ALPHA = 0.8;

var selected = 0;

tempCanvas.width = PAGE_WIDTH;
tempCanvas.height = PAGE_HEIGHT;

function clamp(num, min, max) {
	if (num < min)
		return min;
	if (num > max)
		return max;
	return num;
}

let boxes = [];

let mouseDown = false;
let startX, startY, endX, endY;
imageContainer.addEventListener("mousedown", event => {
	let x = event.clientX, y = event.clientY;
	if (x < image.offsetLeft || x > image.offsetLeft + image.offsetWidth ||
		y < image.offsetTop || y > image.offsetTop + image.offsetHeight)
		return;

	startX = x, startY = y;
	mouseDown = true;
});
imageContainer.addEventListener("mousemove", event => {
	if (!mouseDown)
		return;

	const ctx = tempCanvas.getContext("2d");
	ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

	let x = clamp(event.clientX, image.offsetLeft, image.offsetLeft + image.offsetWidth);
	let y = clamp(event.clientY, image.offsetTop, image.offsetTop + image.offsetHeight);

	ctx.fillStyle = `rgba(${RED}, ${GREEN}, ${BLUE}, ${FILL_ALPHA1})`;
	ctx.fillRect(startX, startY, x - startX, y - startY);

	ctx.lineWidth = 1;
	ctx.strokeStyle = `rgba(${RED}, ${GREEN}, ${BLUE}, ${STROKE_ALPHA})`;
	ctx.strokeRect(startX, startY, x - startX, y - startY);
});
this.addEventListener("mouseup", event => {
	if (!mouseDown)
		return;
	
	const ctx1 = tempCanvas.getContext("2d");
	ctx1.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

	const canvas = document.createElement("canvas");
	canvas.id = "box" + selected;
	canvas.width = PAGE_WIDTH;
	canvas.height = PAGE_HEIGHT;

	imageContainer.appendChild(canvas);

	const ctx2 = canvas.getContext("2d");

	endX = clamp(event.clientX, image.offsetLeft, image.offsetLeft + image.offsetWidth);
	endY = clamp(event.clientY, image.offsetTop, image.offsetTop + image.offsetHeight);
	
	ctx2.fillStyle = `rgba(${RED}, ${GREEN}, ${BLUE}, ${FILL_ALPHA2})`;
	ctx2.fillRect(startX, startY, endX - startX, endY - startY);

	ctx2.lineWidth = 2;
	ctx2.strokeStyle = `rgba(${RED}, ${GREEN}, ${BLUE}, ${STROKE_ALPHA})`;
	ctx2.strokeRect(startX, startY, endX - startX, endY - startY);

	boxes.push(new Box(startX, startY, endX, endY));
	selected++;

	mouseDown = false;
});

function undo() {
	if (boxes.length == 0)
		return;
	boxes = boxes.slice(0, -1);
	document.getElementById("box" + boxes.length).outerHTML = "";
	selected--;
}
undoButton.onclick = function() {
	undo();
}

var imageNum = 0;

function completed() {
	const filename = imageList[imageNum].split(".jpg")[0] + ".xml";
	let shrinkRatio = image.naturalHeight / image.clientHeight;

	let element = document.createElement("a");
	element.className = "filedownload";
	
	let text = '<?xml version="1.0" ?>\n<annotation>\n';
	text += `\t<filename>${imageList[imageNum]}</filename>\n\t<size>\n`;
	text += `\t\t<width>${image.naturalWidth}</width>\n`;
	text += `\t\t<height>${image.naturalHeight}</height>\n`;
	text += "\t\t<depth>3</depth>\n";
	text += "\t</size>\n";
	for (let box of boxes) {
		text += "\t<object>\n";
		text += `\t\t<name></name>\n`;
		text += "\t\t<pose>Unspecified</pose>\n";
		text += "\t\t<truncated>0</truncated>\n";
		text += "\t\t<difficult>0</difficult>\n";
		text += "\t\t<bndbox>\n";
		text += `\t\t\t<xmin>${Math.round((box.minX - image.offsetLeft) * shrinkRatio)}</xmin>\n`;
		text += `\t\t\t<xmax>${Math.round((box.maxX - image.offsetLeft) * shrinkRatio)}</xmax>\n`;
		text += `\t\t\t<ymin>${Math.round((box.minY - image.offsetTop) * shrinkRatio)}</ymin>\n`;
		text += `\t\t\t<ymax>${Math.round((box.maxY - image.offsetTop) * shrinkRatio)}</ymax>\n`;
		text += "\t\t</bndbox>\n";
		text += "\t</object>\n"
	}

	text += "</annotation>\n";

	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	element.setAttribute("download", filename);

	element.style.display = "none";
	document.body.appendChild(element);

	completedImages.push(imageList[imageNum]);

	imageNum++;
	nextImage();
 
	boxes = [];

	let canvases = imageContainer.getElementsByTagName("canvas");
	console.log(canvases);
	for (let i = canvases.length - 1; i >= 0; i--) {
		if (canvases[i].id != "tempcanvas")
			canvases[i].outerHTML = "";
	}
}

nextButton.onclick = () => {
	completed();
}

let completedImages = [];
function save() {
	let elements = document.getElementsByClassName("filedownload");
	for (let i = elements.length - 1; i >= 0; i--) {
		elements[i].click();
		document.body.removeChild(elements[i]);
	}
	let xhr = new XMLHttpRequest();
	xhr.open("POST", "/save", false);
	xhr.send(JSON.stringify({ "session": session, "completed": completedImages }));
}

saveButton.onclick = () => {
	save();
}

function nextImage() {
	if (imageNum == imageList.length) {
		save();
		let xhr = new XMLHttpRequest();
		xhr.open("POST", "/clear", false);
		xhr.onreadystatechange = () => {
			if (xhr.status == 200) {
				document.cookie = "";
				window.onbeforeunload = () => {}
				alert("Labeling complete! Press OK to return to home screen");
				window.open("/", "_self");
			}
		}
		xhr.send(session);
		return;
	}
	image.src = `/static/images/${session}/${imageList[imageNum]}`;
	image.style.height = (PAGE_HEIGHT - image.offsetTop - 10) + "px";
}

window.onbeforeunload = () => {
	return "a";
}

uploadButton.onclick = () => {
	document.getElementById("dialog").setAttribute("open", true);
}

submitButton.onclick = () => {
	let files = document.getElementById("uploadinput").files;
	let formData = new FormData();
	formData.append("file", files[0]);
	formData.append("session", session);
	
	uploadDone = false;
	let xhr = new XMLHttpRequest();
	xhr.open("POST", "uploadmodel");
	xhr.send(formData);
	document.getElementById("tfliteupload").reset();
	document.getElementById("dialog").removeAttribute("open");
}

const ERRORS = ["no uploaded model", "no such image", "bad model, upload another one"];
function autoLabel() {
	let xhr = new XMLHttpRequest();
	xhr.open("POST", "/aidetect", false);
	xhr.onreadystatechange = () => {
		if (xhr.status == 200) {
			let response = xhr.responseText;
			if (ERRORS.indexOf(response) != -1) {
				alert(response);
				return;
			}
			console.log(xhr.responseText);
		}
	}
	xhr.send(JSON.stringify({ "session": session, "imagename": imageList[imageNum] }));
}

this.addEventListener("keypress", event => {
	switch (event.key) {
		case "u":
			undo();
			break;
		case "Enter":
			completed();
			break;
		case "s":
			save();
			break;
		case "a":
			autoLabel()
			break;
	}
});

var xhr = new XMLHttpRequest();
xhr.open("POST", "/imageList", false);
xhr.onreadystatechange = () => {
	if (xhr.status == 200 && xhr.responseText != "") {
		imageList = JSON.parse(xhr.responseText);
		nextImage();
	}
}
xhr.send(session);

