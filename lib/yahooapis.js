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

PlaceFinder.prototype.query = function(location) {
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
                self._processResult(JSON.parse(json).ResultSet);
            });
        }
    });
}

PlaceFinder.prototype._processResult = function(result) {
    var errorCode = result.Error;
    if (errorCode) {
        this.emit('error', errorCode, result.ErrorMessage);
    } else {
        var results = (result.Found) ? result.Results : [];
        this.emit('results', results);
    }
}
