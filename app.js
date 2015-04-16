var express = require('express');
var app = express();
var request = require('request');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

//request options
var options = {
	qs: {'key' : process.env.API_KEY},
	method: 'GET'
	};

//used to check if files are older than 60s
var older_than = 60;

//middleware to create dir and check json data
app.use(function (req, res, next) {
    //make dir if it doesnt exist
    var filepath = path.join(__dirname, '/json' + req.url + '/');
    mkdirp((filepath), function(err){
        if (err) console.error(err);
        else{
            fs.exists(filepath+'json', function(exists){
                if(exists){
                    console.log('exists');
                    //check if it's old enough
                    fs.readFile(filepath+'json', function(err, data){
                        json_data = JSON.parse(data);
                        var file_time = moment(json_data.time);
                        var now = moment();
                        var diff = now.diff(file_time, 'seconds');
                        if(diff>older_than){
                            //call api and overwrite file
                            console.log('old');
                            next();
                        }
                        else{
                            console.log('new');
                            //send this file
                            req.datafile = json_data;
                            next();
                        }
                    });
                }
                else{
                    //call the API and save file
                    console.log('doesnt exist');
                    next();
                }
            });
        }
    });
});

var saveFile = function(url, json_data){
    var filepath = path.join(__dirname, '/json' + url + '/');
    fs.writeFile(filepath + 'json', JSON.stringify(json_data), function(err){
        if(err) console.log('ERR: ' + err);
        else console.log('saved file successfully');
    })
};

//stop info
app.get('/stop/:stopId', function (req, res) {
    if(req.datafile){
        console.log('sending old');
        res.send(req.datafile);
    }
    else {
        console.log('sending new API');
        options.uri = 'https://developer.cumtd.com/api/v2.2/json/GetStop';
        options.qs.stop_id = req.stopId;
        request.get(options, function (response, body, error) {
            var json_body = JSON.parse(body.body);
            saveFile(req.url, json_body);
            res.send(json_body);
        });
    }
});

//departures
app.get('/departures/:stopId', function (req, res) {
    if(req.datafile){
        console.log('sending old');
        res.send(req.datafile);
    }
    else {
        options.uri = 'https://developer.cumtd.com/api/v2.2/json/GetDeparturesByStop';
        options.qs.stop_id = req.stopId;

        request.get(options, function (response, body, error) {
            var json_body = JSON.parse(body.body);
            saveFile(req.url, json_body);
            res.send(json_body);
        });
    }
});

//routes by stop
app.get('/routes/:stopId', function (req, res) {
    if(req.datafile){
        console.log('sending old');
        res.send(req.datafile);
    }
    else {
        options.uri = 'https://developer.cumtd.com/api/v2.2/json/GetRoutesByStop';
        options.qs.stop_id = req.stopId;

        request.get(options, function (response, body, error) {
            var json_body = JSON.parse(body.body);
            saveFile(req.url, json_body);
            res.send(json_body);
        });
    }
});

//middleware for getting parameters
app.param('stopId', function(req, res, next, stopId) {
    req.stopId = stopId;
    next();
});


var port = process.env.PORT || 3000;
var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});