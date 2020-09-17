"use strict";

var bodyParser = require("body-parser");
//var cors = require("cors");
var express = require("express");
var apiRoutes = require("./routes/api.js");
var db = require("./db.js");

var app = express();

// https://expressjs.com/en/guide/writing-middleware.html

// Middleware function to print  Info when a request passes through it.
var myLogger = function (req, res, next) {
  console.log('LOGGED')
  next()
}
app.use(myLogger)

// Middleware function to serve static files using the 
// express.static function
app.use("/public", express.static(process.cwd() + "/public"));

//app.use(cors({origin: '*'}));

// The bodyParser middlewares will populate the "req.body" property with 
// the parsed body. It will only parse json and only look at requests 
// where the Content-Type header matches the type option.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//Index page (static HTML)
//app.route("/").get(function (req, res) {
app.get("/", function (req, res) {  
  res.sendFile(process.cwd() + "/views/index.html");
});

// Install REST API Routes
apiRoutes(app);


// gracefully shutdown when receiving SIGTERM
process
  .on('SIGTERM', shutdown('SIGTERM'))
  .on('SIGINT', shutdown('SIGINT'))
  .on('uncaughtException', shutdown('uncaughtException'));


function shutdown(signal) {
  return (err) => {
    db.close();
    console.log(`In Shutdown - ${ signal }...`);
    if (err) console.error(err.stack || err);
    setTimeout(() => {
      console.log('...waited 5s, exiting.');
      process.exit(err ? 1 : 0);
    }, 5000).unref();
  };
}

// Now start the Express server
var port_used = process.env.PORT || 3001;
try {
  app.listen(port_used, function () {
    console.log("Listening on port " + port_used);
  })
} catch(er) {
  console.log(er);
}


