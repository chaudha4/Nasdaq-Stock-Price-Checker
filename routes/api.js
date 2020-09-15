/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var https = require("https");

var helmet = require("helmet");

module.exports = function(app, db) {
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

  
  function getStockPrice(url) {
    return new Promise( (resolve, reject) => {
      https.get(url, urlResp => {
        if (urlResp.statusCode < 200 || urlResp.statusCode >= 300) {
            return reject(new Error('statusCode=' + urlResp.statusCode));
        }        
        urlResp.setEncoding("utf8");
        let body = "";
        
        urlResp.on("data", data => {
          body += data;
        });
        
        urlResp.on("end", () => {
          body = JSON.parse(body);
          let result = {
            stock: body.symbol,
            price: body.latestPrice,
          };
          
          if (result.stock == undefined) {
            reject(body);  // Stock not found
          } else {        
            resolve(result);
          }
        });
        
        urlResp.on("error", err => {
          reject(err);
        });
        
      }); //get  
    }); //new Promise
    
  } //getStockPrice

  function findOneStock(query) {
    return new Promise ( (resolve, reject) => { 
      db.db("FCC").collection("stocks").findOne(
            { stock: query.stock }, // query
            (err, item) => {
              if (err) {
                console.log("Query Failed to run", err);
                reject(err);
              } else {
                console.log("Query Returned", item);
                resolve(item);
              }
            }); //db
    }); //Promise
  } //findOneStock  
  
  function findAndUpdateOneStock(query) {
    let updateStruct = {};
    if (query.like) {
      updateStruct.$push = {
        ip: query.ip
      }
    }
    
    return new Promise ( (resolve, reject) => { 
      db.db("FCC").collection("stocks").findAndModify(
            { stock: query.stock }, // query
            null, // sort order
            //{ $push: { ip: query.ip } }, //update
            updateStruct, //update
            { upsert: true, new: true }, //options
            (err, item) => {
              if (err) {
                console.log("Not Found", err);
                reject(err);
              } else {
                console.log("Found", item);
                resolve(item.value);
              }
            }); //db
    }); //Promise
  } //findAndUpdateOneStock
  
  function findAndUpdateOneStockV2(query) {
    // In this version we use addToSet which adds a value to an array unless the value is already present
    let updateStruct = {};
    if (query.like) {
      updateStruct.$addToSet = {        
        ip: query.ip
      }
    }
    
    return new Promise ( (resolve, reject) => { 
      db.db("FCC").collection("stocks").findAndModify(
            { stock: query.stock }, // query
            null, // sort order
            //{ $addToSet: { ip: query.ip } }, //Add if not already there
            updateStruct,
            { upsert: true, new: true }, //options
            (err, item) => {
              if (err) {
                console.log("Not Found", err);
                reject(err);
              } else {
                console.log("Found", item);
                resolve(item.value);
              }
            }); //db
    }); //Promise
  } //findAndUpdateOneStock
  
  app.route("/api/stock-prices").get(function(req, res) {
    console.log("/GET called", req.route.methods, req.route.path, req.query);

    if (typeof req.query.stock === "string") {
      let url = `https://repeated-alpaca.glitch.me/v1/stock/${req.query.stock}/quote`; 

      let query = {
        stock: req.query.stock,
        like: req.query.like ? 1 : 0,
        ip: req.ip,
        price: null,  // Known after http call
        newIp: false  // updated after DB check
      };      
      
      //https://javascript.info/promise-chaining
      getStockPrice(url)
        .then(result => {
          console.log("1st Promise done(http)", result);
          // result - { stock: 'GOOG', price: 1267.8, likes: 0 }
          //Save the stock price for later use
          query.price = result.price;
          return findOneStock(query);  // Returns a promise
        }) //then 1
      
        .then(item => {
          console.log("2nd Promise done(DB)", item);         
          
        
          if(item) {
            // If the stock is already in DB, check the IP and likes
            if (query.like && item.ip && !item.ip.includes(query.ip)) {
              // User liked, but allowed only one like per IP.
              query.newIp = true;
            }      
          } else {
            // A new Stock is being added. So IP must be saved too.
            query.newIp = true;
          }
          if (query.newIp) {
            //return findAndUpdateOneStock(query);  // Returns a promise
            return findAndUpdateOneStockV2(query);
          }
          return item;
        }) //then 2
        
        .then(item => {
          console.log("3rd Promise done(DB)", item);
          
          res.send({
            stockData: {
              "stock": query.stock,
              "price": query.price,
              "likes": item.ip ? item.ip.length:0,
            }
          });
        }) //then 3
      
        .catch(error => {
          console.log("Catch Promise Error", error);
          res.send(error);
        }); //catch
    }
  });


    
};
