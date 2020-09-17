"use strict";

var https = require("https");   // Used to fetch Stock Price from a Proxy Server
var helmet = require("helmet");
var db = require("../db.js");
var stockApi = require("./stock.js");

module.exports = function(app, db_client) {
  app.use(helmet.xssFilter()); // Mitigate the risk of XSS(Cross-site scripting)
  app.use(
    helmet.contentSecurityPolicy({
      reportOnly: true
    })
  );

  // Log all CSP violations from Browsers
  app.post("/report-violation", (req, res) => {
    console.log("CSP Violation: ", req.body);
    res.status(204).end();
  }); //post 'report-violation'

  
  app.route("/api/stock-prices").get(function(req, res) {
    console.log("/GET called", req.route.methods, req.route.path, req.query);

    function afterGettingStockQuote(result) {
      console.log("afterGettingStockQuote-", result)
      if (result == null) {
        res.send("");
        return;   // This is still required.
      }

      // If here, we have got a valid stock quote. Now check our local DB for
      // number of likes (if any).
 
      //db.get_db_client().smembers(req.query.stock.toUpperCase(), (err, reply) => { 
      db.new_connect().then( db => {
        db.smembers(req.query.stock.toUpperCase(), (err, reply) => {
          if (err) {
            return; // Nothing to do. Likes will be 0.
          }
          console.log(reply);
          let likes = reply.length;
  
          // Before sending response, increment the like count asynchrnously.
          if (req.query.like) {
            db.sadd([req.query.stock.toUpperCase(), req.ip], (err, reply) => {
              // Nothing to do for asyn request.
            });
          }
          
          // Send the response
          res.send({
            stockData: {
              "stock": result.stock,
              "price": result.price,
              "companyName": result.companyName,
              "likes": likes,
            }
          });           
  
        }); //db.smembers
      }); //db.new_connect()         
    }

    function afterGettingStockQuotes(result) {

      console.log("afterGettingStockQuotes-", result)
      if (result == null) {
        res.send("");
        return;   // This is still required.
      }
      //res.send(JSON.stringify(result));      

      let promiseArr = [];

      db.new_connect().then( db => {

        result.forEach(r => {
          promiseArr.push( new Promise((resolve, reject) => {
  
            db.smembers(r.stock, (err, reply) => { 
              if (err) {
                reject();
              }
              console.log(reply);
              let likes = reply.length;
      
              // Before sending response, increment the like count asynchrnously.
              if (req.query.like) {
                db.sadd([r.stock, req.ip], (err, reply) => {
                  // Nothing to do.
                });
              }
  
              // Resolve the promise
              resolve({
                stockData: {
                  "stock": r.stock,
                  "price": r.price,
                  "companyName": r.companyName,
                  "likes": likes,
                }
              });           
            }); //db         
          }));  //promiseArr.push
        }); //result.forEach     

        Promise.all(promiseArr)
        .then( values => {
            console.log("Promise.all", JSON.stringify(values));
            res.send(values);
        })
        .catch( err => {
            console.log("Promise.all Failures", err);
            res.send(null);
        })

      }); //db.new_connect().then
    }

    if (typeof req.query.stock === "string") {
      stockApi.getStockPrice(req.query.stock.toUpperCase(), afterGettingStockQuote);
    } else {
      // Multiple Stock request. 
      stockApi.getStockPrices(req.query.stock, afterGettingStockQuotes);

    }

    
  });

    
};
