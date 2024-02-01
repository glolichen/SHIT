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
imageContainer.addEventListener("mouseup", event => {
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

const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
this.addEventListener("keypress", event => {
	let num = NUMBERS.indexOf(event.key)
	if (num != -1) {
		objects = num;
		setObjectsButton(objects);
		return;
	}
	if (event.key == "u")
		undo();
});

var filename = "0009_png.rf.1dc9bfbe681d3e0ed0087d03185238d3.jpg";

saveButton.onclick = () => {
	const filename = "file.xml";

	var element = document.createElement("a");
	var text = '<?xml version="1.0" ?>\n<annotation>\n';
	text += `\t<filename>${filename}</filename>\n\t<size>\n`;
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
		text += `\t\t\t<xmin>${box.minX - image.offsetLeft}</xmin>\n`;
		text += `\t\t\t<xmax>${box.maxX - image.offsetLeft}</xmax>\n`;
		text += `\t\t\t<ymin>${box.minY - image.offsetTop}</ymin>\n`;
		text += `\t\t\t<ymax>${box.maxY - image.offsetTop}</ymax>\n`;
		text += "\t\t</bndbox>\n";
		text += "\t</object>\n"
	}

	text += "</annotation>\n";

	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	element.setAttribute("download", filename);

	element.style.display = "none";
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

image.src = "/static/images/th6EE-SfM4CvwD3nAUbzo8lUgF_ancLIHTaSpi0GGF63FSID9uy9SS84lUdrq23b6uWtJDSTsoqcTDS36BPM9g5XZGYymzM4RAmX/" + filename
image.style.height = (PAGE_HEIGHT - image.offsetTop - 10) + "px";
