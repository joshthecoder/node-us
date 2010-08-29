/**
 * Twitter Geolocation Realtime map server.
 *
 * This server provides a stream of coordinates and tweets to the
 * client which then uses them to plot on a map in realtime.
 * Data is received from Twitter via thair streaming API.
 */

var sys = require('sys');
var fs = require('fs');
var connect = require('connect');
var socketio = require('socket.io');
var twitter = require('twitter-node');
var yahoo = require('./lib/yahooapis');
var geocache = require('./lib/geocache.js');

// Load settings
var settings = JSON.parse(fs.readFileSync('/home/node/settings.json', 'utf8'));

// Location of our public asserts folder
var PUBLIC_PATH = __dirname + '/public';

/**
 * HTTP server for static and streaming content
 */
var httpserver = connect.createServer(
    connect.staticProvider(PUBLIC_PATH)
);
httpserver.listen(settings.http_port);

/**
 * A stream of ember data used by the client to plot
 * tweets and other cool geotagged data.
 */
var emberstream = socketio.listen(httpserver, {resource: 'emberstream'});
emberstream.broadcastTweet = function(tweet, location) {
    var msg = JSON.stringify({
        type: 'tweet',
        location: location,
        text: tweet.text,
        screen_name: tweet.user.screen_name
    });
    this.broadcast(msg);
}

/**
 * Yahoo Geocoding API
 *
 * If we are unable to get a geolocation for a tweet, we
 * can try looking up the user's profile location instead.
 * We pass Yahoo the location string and their service tries to
 * convert it into a coordinate set.
 */
var placefinder = new yahoo.PlaceFinder(settings.yahoo.appid);
placefinder._canQuery = true;
placefinder.throttledQuery = function(location, callback) {
    // To avoid eating up our quota of query calls, we will
    // only poll the location every X seconds.
    if (this._canQuery) {
        this.queryBest(location, callback);
        this._canQuery = false;
        setTimeout(function() { placefinder._canQuery = true; }, settings.yahoo.placefinder_delay);
    }
}
placefinder.on('error', function(code, msg) {
    sys.log('Placefinder error: #' + code + ' - ' + msg);
});

/**
 * Twitter streaming API sampler
 */
var tweetsampler = new twitter.TwitterNode(settings.twitter);
tweetsampler.action = 'sample';
tweetsampler.on('tweet', function(tweet) {
    if (tweet.geo) {
        emberstream.broadcastTweet(tweet, tweet.geo.coordinates);
    } else {
        var location = tweet.user.location;
        if (!location) return;

        // If there is no geo-location attached to the tweeet,
        // use the user's location property instead.
        // First check our cache for coordinates to their location.
        geocache.query(location, function(value) {
            if (value) {
                var coordinates = String.prototype.split.call(value, ' ');
                emberstream.broadcastTweet(tweet, coordinates);
            } else {
                // Try looking up location with Yahoo API
                placefinder.throttledQuery(location, function(result) {
                   if (result) {
                       var coordinates = [result.latitude, result.longitude];
                       emberstream.broadcastTweet(tweet, coordinates)
                   }
                });
            }
        });
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