"use strict";

var db_client =  null;
var REDIS_URL = ""

if (process.env.REDIS_URL) {
    REDIS_URL = process.env.REDIS_URL;
    console.log("Redis URL updated for Heroku Cloud Deployment")
} else {
    console.log("Redis URL for test deployment")
}


exports.connect = function (done) {
  
    if (db_client != null) {
        return done()
    }

    db_client = require("redis").createClient(REDIS_URL);
    db_client.on("connect", (err, db) => {
        if (err) {
            console.log("DB Connection Failed");
            return done(err);
        } else {
            console.log("DB Connected");
            return done();
        }
      }); //connect
}

// DB connection times out frequently. Use this API to always get a new connection.
exports.new_connect = function () {
  
    return (new Promise((resolve, reject) => { 
        db_client = require("redis").createClient(REDIS_URL);
        db_client.on("connect", (err, db) => {
            if (err) {
                console.log("DB Connection Failed");
                reject(err);
            } else {
                console.log("new_connect()::DB Connected at ", Date.now());
                resolve(db_client);
            }            
        });
    }));
}

exports.get_db_client = function() {
    return db_client;
}

exports.close = function(done) {
    if (db_client) {
        db_client.quit();
        console.log("DB Connection closed");
    }
    return done();
}

