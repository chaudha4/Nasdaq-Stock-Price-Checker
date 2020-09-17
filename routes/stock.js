"use strict";

// Used to fetch Stock Price from a Proxy Server
var https = require("https");


exports.getStockPrice = function(ticker, done) {

    let url = `https://stock-price-checker-proxy--freecodecamp.repl.co/v1/stock/${ticker}/quote`

    https.get(url, urlResp => {
        if (urlResp.statusCode < 200 || urlResp.statusCode >= 300) {
            return done(null); 
        }        
        urlResp.setEncoding("utf8");
        let body = "";
        
        urlResp.on("data", data => {
          body += data;
        });
        
        urlResp.on("end", () => {
          body = JSON.parse(body);
          if (body == "Invalid symbol") {
            return done(null); 
          }
          let result = {
            stock: body.symbol,
            price: body.latestPrice,
            companyName: body.companyName,
          };
          return done(result);
        });
        
        urlResp.on("error", err => {
            return done(null); 
        });
        
      }); //get

}

exports.getStockPrices = function(tickers, done) {
    
    let promiseArr = [];

    tickers.forEach(ticker => {
        let url = `https://stock-price-checker-proxy--freecodecamp.repl.co/v1/stock/${ticker}/quote`
        
        promiseArr.push( new Promise((resolve, reject) => {

            https.get(url, (res) => {
                console.log('statusCode:', res.statusCode);
                console.log('headers:', res.headers);
                res.setEncoding("utf8");
                let body = "";
                
                res.on("data", data => {
                  body += data;
                });
                
                res.on("end", () => {
                  body = JSON.parse(body);
                  if (body == "Invalid symbol") {
                    console.log(body)
                    reject(body); 
                  }
                  resolve({ 
                    stock: body.symbol,
                    price: body.latestPrice,
                    companyName: body.companyName,
                  });
                });              
              
              }).on('error', (e) => {
                console.log(e);
                reject(e);
              });            
        })); 
    }) //tickers.forEach

    Promise.all(promiseArr)
    .then( values => {
        console.log("Promise.all", JSON.stringify(values));
        done(values);
    })
    .catch( err => {
        console.log("Promise.all Failures", err);
        done(null);
    })

    
}