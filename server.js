'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');

var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');

var MongoClient = require('mongodb').MongoClient;


var app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);


// Get a DB handle. We connect only once.
// Since this is a function that returns a promise, it runs only when the
// funtion is invoked otherwise. when the execution hits resolve (or reject)
// the promise is fulfilled and "then (or catch)" gets called and promise
// is fulfilled.
var connect2DB = function () {
  console.log("connect2DB_ver1")
  return new Promise(function(resolve, reject) {
    MongoClient.connect(process.env.DB, (err, db) => {
      if (err) {
        reject(err);
      } else {
        console.log("DB Connected using Version 1");
        resolve(db);
      }
    });//connect
  });//Promise
}//connect2DB

// Another way to create promise without function but this behaves different from a function !!
// In this case, the code gets executed now but it blocks at resolve(or reject)
// and then would resume when someone uses this variable and calls then on it.
var connect2DB_ver2 = new Promise(function(resolve, reject) {
    console.log("connect2DB_ver2")
    MongoClient.connect(process.env.DB, (err, db) => {
      if (err) {
        reject(err);
      } else {
        console.log("DB Connected using Version 2");
        resolve(db);
      }
    });//connect
  });//Promise

// This is an example of then chaining. https://scotch.io/tutorials/javascript-promises-for-dummies
//connect2DB()
connect2DB_ver2
  .then(db => {
    //Routing for API
    console.log("Then #1 - Install Routes")
    apiRoutes(app, db);  
  })//then
  .then(() => {
    //Install 404 Not Found Middleware
    console.log("Then #2 - Install 404 Not Found")
    app.use(function(req, res, next) {
      res.status(404)
        .type('text')
        .send('Not Found');
    });    
  })//then
  .then( () => {
    //Start our server and tests!
    console.log("Then #3 - Start Server")
    app.listen(process.env.PORT || 3000, function () {
      console.log("Listening on port " + process.env.PORT);
      if(process.env.NODE_ENV==='test') {
        console.log('Running Tests...');
        setTimeout(function () {
          try {
            runner.run();
          } catch(e) {
            var error = e;
              console.log('Tests are not valid:');
              console.log(error);
          }
        }, 3500);
      }//if
    }); //app.listen     
  })//then
  .catch(err => {
    console.log("Database Connection Failed", err);
  });//catch
 
  


 


module.exports = app; //for testing