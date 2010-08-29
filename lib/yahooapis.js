/**
 * A wrapper for the Yahoo PlaceFinder API
 */

var sys = require('sys');
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var querystring = require('querystring');

var HOST = 'where.yahooapis.com';
var httpclient = http.createClient(80, HOST);
 
function PlaceFinder(appid) {
    this.appid = appid;
}

sys.inherits(PlaceFinder, EventEmitter);
exports.PlaceFinder = PlaceFinder;

PlaceFinder.prototype.query = function(location, callback) {
    var query = querystring.stringify({
        location: location,
        flags: 'J',
        appid: this.appid
    });
    var request = httpclient.request('GET', '/geocode?' + query, {
        'Host': HOST,
        'Content-length': '0'
    });
    request.end();

    var self = this;
    request.on('response', function(response) {
        if (response.statusCode != 200) {
            sys.log('Yahoo PlaceFinder HTTP ' + response.statusCode + " error!");
        } else {
            var json = "";
            response.setEncoding('utf8');
            response.on('data', function(chunk) {
                json += chunk;
            });
            response.on('end', function() {
                self._processResult(JSON.parse(json).ResultSet, callback);
            });
        }
    });
}

PlaceFinder.prototype.queryBest = function(location, callback) {
    this.query(location, function(results) {
        if (!results.length) callback(null);
        var result = results[0];

        if (results.length > 1) {
            // If we get many results, use the one with one
            // with the top quality score.
            for (var i = 1; i < results.length; results++) {
                if (results[i].quality > result.quality) {
                    result = results[i];
                }
            }
        }
        callback(result);
    });
}

PlaceFinder.prototype._processResult = function(result, callback) {
    var errorCode = result.Error;
    if (errorCode) {
        this.emit('error', errorCode, result.ErrorMessage);
    } else {
        var results = (result.Found) ? result.Results : [];
        callback(results);
    }
}
