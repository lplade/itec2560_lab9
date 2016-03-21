var express = require("express");
var MongoClient = require("mongodb").MongoClient;
var engines = require("jade");
var assert = require('assert');
var bodyParser = require('body-parser');

var app = express();

app.set("view engine", "jade");
app.set("views", __dirname + "/views");

app.use(express.static("public"));

//bodyParser needed to enable routes to extract request body
app.use(bodyParser.urlencoded({ extended : true }));

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

	app.get("/details/:flower", function (req, res) {
		var flowerName = req.params.flower;//Get value of "flower" param
		//DB query for this flower. Use findOne and note the callback.
		db.collection("flowers").find({"name": flowerName}).limit(1).next(function (err, doc) {
			if (err) {
				return res.sendStatus(500);
			}
			console.log(doc);
			return res.render("flowerDetails", doc);
		});
	});

	app.post("/addNewFlower", function(req, res){
		//TODO
		//On the server, check that the new flower doesn't already exist.
		// Refuse to save new flowers if they are already in the database.
		// How will you notify the user if they try and create a flower that already exists?

		db.collection("flowers").insertOne(req.body, function(err, result){
			if (err) { return res.sendStatus(500); }
			return res.redirect('/'); //todo send success/fail back to client
		});
	});

	app.put("/updateColor", function(req, res){
		//Filter is the flower with the given name
		console.log(req.body);
		var filter = {"name": req.body.name };
		var update = { $set : req.body };
		//By default, findOneAndUpdate replace the record with the update.
		//So, here, need to use $set parameter to specify we want to update only the fields given.
		db.collection("flowers").findOneAndUpdate(filter, update, function(err, result){
			if (err) {
				console.log("Error when updating color " + err);
				return res.sendStatus(500);
			} else {
				console.log("Updated - result: " + result);
				return res.send({"color" : req.body.color});
				//Send the updated color back. AJAX is expecting a response.
			}
		});
	});

	//TODO photo upload

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
