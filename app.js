var express = require("express");
var MongoClient = require("mongodb").MongoClient;
var engines = require("jade");
var assert = require('assert');

app = express();

app.set("view engine", "jade");
app.set("views", __dirname + "/views");

//Attempt to connect to mongodb
MongoClient.connect("mongodb://localhost:27017/garden", function (err, db) {
	assert.equal(null, err); //This will crash the app if there is an error.
	console.log("Connected to MongoDB");

	//routes - this is for the home page
	app.get('/', function (req, res) {
		db.collection('flowers').find({}, {
			"name": true,
			"color": true
		}).toArray(function (err, flowerdocs) {
			if (err) {
				return res.sendStatus(500);
			}
			var colordocs = db.collection('flowers').distinct("color", function (err, colordocs) {
				if (err) {
					return res.sendStatus(500);
				}
				return res.render('allflowers', {
					'flowers': flowerdocs,
					"flowerColors": colordocs
				});
			})
		});
	});
	//Form-handling route - show only flowers of selected color
	app.get("/showColors", function (req, res) {
		//console.log("Show colors!");
		var color = req.query.colorDropDown;
		//Get all of the flowers of the desired color. Only return name and color.
		db.collection('flowers').find({
			"color": color
		}, {
			"name": true,
			"color": true
		}).toArray(function (err, docs) {
			if (err) {
				return res.sendStatus(500);
			}

			var colordocs = db.collection('flowers').distinct("color", function (err, colordocs) {
				if (err) {
					return res.sendStatus(500);
				}
				//Turn "red" into "Red" for display
				var displayColor = color.slice(0, 1).toUpperCase() + color.slice(1, color.length);
				//return res.render statement recommended inside a callback to prevent further processing of res
				return res.render('allflowers',
					{
						'flowers': docs,
						"currentColor": displayColor,
						"flowerColors": colordocs
					});
			});
		});
	});

	//All other requests, return 404 not found
	app.use(function (req, res) {
		res.sendStatus(404);
	});

	//And start the server on any port you like.
	var server = app.listen(3050, function () {
		var port = server.address().port;
		console.log("Server listening on port " + port);
	});

});
