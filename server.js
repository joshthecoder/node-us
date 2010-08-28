/**
 * Twitter Geolocation Realtime map server.
 *
 * This server provides a stream of coordinates and tweets to the
 * client which then uses them to plot on a map in realtime.
 * Data is received from Twitter via thair streaming API.
 */

var connect = require('connect');
var socketio = require('socket.io.js');
var twitter = require('twitter-node');
var log = require('sys').log;

// Server options...
var PUBLIC_PATH = __dirname + '/public';
var HTTP_PORT = 8080;
var TWITTER_CREDENTIALS = {
    user: 'tweepytest',
    password: 'josh123'
}

// Setup a HTTP server to serve both our static and streaming content.
var httpserver = connect.createServer(
    connect.staticProvider(PUBLIC_PATH)
);
httpserver.listen(HTTP_PORT);

// Setup up our listening socket that will deliver the tweet stream.
var tweetstream = io.listen(httpserver, {resource: 'tweetstream'});

// Establish a sample stream connection with Twitter.
var tweetsampler = new twitter.TwitterNode(TWITTER_CREDENTIALS);
tweetsampler.action = 'sample';
tweetsampler.on('tweet', function(tweet) {
    if (tweet.geo) {
        log("got geo! " + tweet.geo);
    } else {
        // TODO: try looking up user's location
    }
});
tweetsampler.on('error', function(error) {
    log('Tweet sampler error: ' + error);
});
tweetsampler.stream();