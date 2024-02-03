// https://www.w3schools.com/js/js_cookies.asp

var session = null, created = null;
var cookies = document.cookie.split(";");
for (var cookie of cookies) {
	cookie = cookie.split("=");
	cookie[0] = cookie[0].trim();
	if (cookie[0] == "session")
		session = cookie[1];
	if (cookie[0] == "created")
		created = cookie[1];
}

if (session == null || created == null) {
	if (window.location.pathname != "/")
		window.open("/", "_self")
}
else {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/verifyCookie", false);
	xhr.onreadystatechange = () => {
		if (xhr.status == 200 && xhr.responseText != "") {
			if (window.location.pathname != xhr.responseText)
				window.open(xhr.responseText, "_self");
		}
	}
	xhr.send(JSON.stringify({ "session": session, "created": created }));
}