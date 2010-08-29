/**
 * When we get a geocoded result from Yahoo, we
 * will cache it into redis to provide quick access
 * for later queries of the same location.
 */

var sys = require('sys');
var redis = require('redis-client');
var crypto = require('crypto');

var client = redis.createClient();
client.on('connected', function() {
    sys.log('Connected to redis');
});
client.on('reconnecting', function() {
    sys.log('Attempting to re-connect to redis...');
});
client.on('noconnection', function() {
    sys.log('Could not connect to redis!');
});

function hashLocation(location) {
    location = location.replace(/,/g, "");
    location = location.replace(/  /g, " ");
    location = location.toLowerCase();
    sys.log("location for tweet: '" + location + "'");
    return crypto.createHash('md5').update(location).digest("hex");
}

var hits = 0, total = 0;

exports.query = function(location, callback) {
    var hash = hashLocation(location);
    client.get(hash, function(err, value) {
        if (err) {
            sys.log('Redis get failed: ' + err);
        } else {
            if (value) hits++;
            total++;
            callback(parseString(value));
        }
    });
}

exports.store = function(location, coordinates) {
    var hash = hashLocation(location);
    client.set(hash, coordinates[0] + " " + coordinates[1], function(err) {
        if (err) {
            sys.log('Redis set failed: ' + err);
        }
    });
}

// Output information about our cache hit rate
setInterval(function() {
    sys.log('Location cache ' + (hits / total) * 100 + "% hits");
    hits = total = 0;
}, 30000);
