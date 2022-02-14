const app = require("express")();
const bodyParser = require("body-parser");
const fs = require("fs");
let CRM = require("vtiger");

const request = require("request");

function addCall(uri) {
	let clientServerOptions = {
		uri: uri,
		body: JSON.stringify("yes yes yes"),
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-VTIGER-SECRET": "129412201662064da8bece7",
		},
	};
	request(clientServerOptions, function (error, response) {
		console.log(error, response.body);
		return;
	});
}

let connection = new CRM.Connection(
	"https://digimium2.od2.vtiger.com",
	"yacine@digimium.fr",
	"Kn5kbakmLT3UDZWE"
);

const PORT = process.env.PORT || 3000;

let info = "";
let rawdata = "";
let test = "";
let lol = "eee";

app.use(bodyParser.json());

app.get("/", (req, res) => {
	rawdata = fs.readFileSync("test.json");
	test = JSON.parse(rawdata);
	res.json(test);
	res.sendStatus(200);
});

app.get("/aircall/calls", (req, res) => {
	res.sendStatus(200);
});
// rest
app.post("/aircall/calls", (req, res) => {
	if (req.body.event === "call.created") {
		info = req.body.data;
		call = {
			call_id: info.id,
			event: "call_initiated",
			direction: info.direction,
		};
		switch (call.direction) {
			case "inbound":
				call.from = info.number.digits;
				call.to = info.user.id;
				break;
			case "outbound":
				call.to = info.number.digits;
				call.from = info.user.id;
			default:
				break;
		}
		uri =
			"https://digimium2.od2.vtiger.com/modules/PhoneCalls/callbacks/Generic.php?to=" +
			encodeURI(call.to) +
			"&event=" +
			call.event +
			"&call_id=" +
			call.call_id +
			"&from=" +
			encodeURI(call.from) +
			"&direction=" +
			call.direction;
		addCall(uri);
	}

	if (req.body.event === "call.answered") {
		info = req.body.data;
		call = {
			call_id: info.id,
			event: "call_connected",
		};
		switch (call.direction) {
			case "inbound":
				call.from = info.number.digits;
				call.to = info.user.id;
				break;
			case "outbound":
				call.to = info.number.digits;
				call.from = info.user.id;
			default:
				break;
		}
		uri =
			"https://digimium2.od2.vtiger.com/modules/PhoneCalls/callbacks/Generic.php?to=" +
			encodeURI(call.to) +
			"&event=" +
			call.event +
			"&call_id=" +
			call.call_id +
			"&from=" +
			encodeURI(call.from);
		addCall(uri);
	}

	if (req.body.event === "call.ended") {
		info = req.body.data;
		// RECORD THE CALL
		call = {
			call_id: info.id,
			event: "call_recording",
			recordingurl: info.asset,
		};
		uri =
			"https://digimium2.od2.vtiger.com/modules/PhoneCalls/callbacks/Generic.php?recordingurl=" +
			encodeURI(call.recordingurl) +
			"&event=" +
			call.event +
			"&call_id=" +
			call.call_id;
		addCall(uri);

		// END THE CALL
		call = {
			call_id: info.id,
			event: "call_hangup",
			note: info.number.name + " " + info.number.digits,
		};
		uri =
			"https://digimium2.od2.vtiger.com/modules/PhoneCalls/callbacks/Generic.php?event=" +
			call.event +
			"&call_id=" +
			call.call_id +
			"&notes=" +
			encodeURI(call.note);
		addCall(uri);

		info = {
			fld_vtcmaircallname: info.id,
			cf_vtcmaircall_calllink: info.asset,
			fld_callername: info.user.name,
			cf_vtcmaircall_caller: info.number.name,
			cf_vtcmaircall_callernumber: info.raw_digits,
			assigned_user_id: "19x141",
			id: info.id,
		};
		connection.login().then(() => {
			connection.create("vtcmaircall", info);
		});
	}

	//fs.appendFileSync("test.json", JSON.stringify(req.body) + " <==> ");

	res.sendStatus(200);
});

app.listen(PORT);
