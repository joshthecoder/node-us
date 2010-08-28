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

// Server options...
var PUBLIC_PATH = __dirname + '/public';
var HTTP_PORT = 8080;

// Setup a HTTP server to serve both our static and streaming content.
var httpserver = connect.createServer(
    connect.staticProvider(PUBLIC_PATH)
);

httpserver.listen(HTTP_PORT);
