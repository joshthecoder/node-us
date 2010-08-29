/**
 * Twitter Geolocation Realtime map server.
 *
 * This server provides a stream of coordinates and tweets to the
 * client which then uses them to plot on a map in realtime.
 * Data is received from Twitter via thair streaming API.
 */

var sys = require('sys');
var connect = require('connect');
var socketio = require('socket.io');
var twitter = require('twitter-node');
var yahoo = require('./lib/yahooapis');

// Server options...
var PUBLIC_PATH = __dirname + '/public';
var HTTP_PORT = 8080;
var TWITTER_CREDENTIALS = {
    //user: 'node_us',
    //password: 'Windy48$'
    user: 'tweepytest',
    password: 'josh123'
}
var PLACEFINDER_DELAY = 5000;
var YAHOOAPPID = 'mQ1VLh58';

/**
 * HTTP server for static and streaming content
 */
var httpserver = connect.createServer(
    connect.staticProvider(PUBLIC_PATH)
);
httpserver.listen(HTTP_PORT);

/**
 * Twitter geolocation stream server socket
 */
var tweetstream = socketio.listen(httpserver, {resource: 'tweetstream'});

/**
 * Yahoo Geocoding API
 *
 * If we are unable to get a geolocation for a tweet, we
 * can try looking up the user's profile location instead.
 * We pass Yahoo the location string and their service tries to
 * convert it into a coordinate set.
 */
var placefinder = new yahoo.PlaceFinder(YAHOOAPPID);
placefinder._canQuery = true;
placefinder.throttledQuery = function(location) {
    // To avoid eating up our quota of query calls, we will
    // only poll the location every X seconds.
    if (this._canQuery) {
        sys.log('Querying user location...');
        this.query(location);
        this._canQuery = false;
        setTimeout(function() { placefinder._canQuery = true; }, PLACEFINDER_DELAY);
    }
}
placefinder.on('results', function(results) {
    if (!results.length) return;
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

    var msg = JSON.stringify([result.latitude, result.longitude]);
    sys.log('Got location result: ' + msg);
    tweetstream.broadcast(msg);
});
placefinder.on('error', function(code, msg) {
    sys.log('Placefinder error: #' + code + ' - ' + msg);
});

/**
 * Twitter streaming API sampler
 */
var tweetsampler = new twitter.TwitterNode(TWITTER_CREDENTIALS);
tweetsampler.action = 'sample';
tweetsampler.on('tweet', function(tweet) {
    if (tweet.geo) {
        var msg = JSON.stringify(tweet.geo.coordinates);
        tweetstream.broadcast(msg);
    } else {
        var location = tweet.user.location;
        if (location) {
            placefinder.throttledQuery(location);
        }
    }
});
tweetsampler.on('error', function(error) {
    sys.log('Tweet sampler error: ' + error);
});
tweetsampler.on("end", function() {
    sys.log('Tweet sampler stopped while try restarting in a bit');
    setTimeout(function() {
        // Attempt to restart stream after a little bit...
        sys.log("Attempting to restart stream...");
        tweetsampler.stream();
    }, 20000);
})
tweetsampler.stream();