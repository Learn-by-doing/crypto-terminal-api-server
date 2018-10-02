'use strict';

if (process.env.NODE_ENV !== 'test') {
	throw new Error('NODE_ENV must be set to "test" to run tests');
}

var _ = require('underscore');
var async = require('async');
var express = require('express');
var app = require('../');

var manager = module.exports = {

	app: app,
	config: app.config,
	fixtures: require('./fixtures'),

	url: function(uri) {

		return 'http://' + manager.config.host + ':' + manager.config.port + uri;
	},

	socketClient: function(options) {

		options = _.defaults(options || {}, {
			host: app.config.host,
			port: app.config.port
		});

		var uri = 'http://' + options.host + ':' + options.port;
		var socket = new app.sockets.primus.Socket(uri);

		return {
			onError: function(cb) {
				this.socket.on('data', function(data) {
					if (data.error) {
						cb(new Error(data.error));
					}
				});
			},
			subscribe: function(channel, done) {
				socket.write({
					action: 'join',
					channel: channel,
				});
				socket.id(function(id) {
					async.until(function() {
						var spark = app.sockets.primus.spark(id);
						return spark.isInChannel(channel);
					}, function(next) {
						_.delay(next, 5);
					}, done);
				});
			},
			unsubscribe: function(channel, done) {
				socket.write({
					action: 'leave',
					channel: channel,
				});
				socket.id(function(id) {
					async.until(function() {
						var spark = app.sockets.primus.spark(id);
						return !spark.isInChannel(channel);
					}, function(next) {
						_.delay(next, 5);
					}, done);
				});
			},
			socket: socket,
		};
	},

	waitFor: function(test, cb) {

		async.until(
			test,
			function(next) { _.delay(next, 5) },
			cb
		);
	},

	createMockServer: function(port, host, cb) {

		if (_.isFunction(host)) {
			cb = host;
			host = null;
		}

		host = host || 'localhost';

		var mock = express();
		mock.server = mock.listen(port, host, function(error) {
			if (error) return cb(error);
			var address = mock.server.address();
			var host = address.address;
			var port = address.port;
			var baseUrl = 'http://' + host + ':' + port;
			cb(null, baseUrl);
		});
		return mock;
	},

};

// Global hooks:
before(app.onReady);
