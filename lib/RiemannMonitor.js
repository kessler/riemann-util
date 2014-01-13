"use strict";

var util = require('util');
var ip = require('ip');

var ipAddress = ip.address();

/*

*/
function RiemannMonitor(config) {

	if (config === undefined)
		throw new Error(RiemannMonitor.MissingConfigObjectError);

	if (typeof(config.role) !== 'string')
		throw new Error(RiemannMonitor.InvalidOrMissingRoleError);

	if (typeof(config.ttl) !== 'number')
		throw new Error(RiemannMonitor.InvalidOrMissingTTLError);

	this.config = config;

	this.defaultTTL = config.ttl;

	this.defaultErrorTTL = config.errorTTL || this.defaultTTL;

	this.defaultTags = [config.role];

	this.defaultService = config.service || 'no_service_name';

	this.noClientWarningIssued = false;

	this.host = this._generateHostLabel();

	if (util.isArray(config.defaultTags))
		this.defaultTags = this.defaultTags.concat(config.defaultTags);
}

RiemannMonitor.prototype.bindClient = function(client) {
	this.client = client;
};

RiemannMonitor.MissingConfigObjectError = 'Missing configuration object in the constructor. At the very least a role and ttl must be specified in the configuration object';
RiemannMonitor.InvalidOrMissingRoleError = 'Missing or invalid role key in configuration object';
RiemannMonitor.InvalidOrMissingTTLError = 'Missing or invalid ttl key in configuration object';

RiemannMonitor.prototype.send = function(event) {
	if (this.client === undefined) {

		if (!this.noClientWarningIssued) {
			this.noClientWarningIssued = true;
			console.warn('a client was not bound to this instance, so events are discarded');
		}

		return;
	}

	this.noClientWarningIssued = false;

	if (event.service === undefined)
		event.service = this.defaultService;

	if (util.isArray(event.tags)) {
		event.tags = event.tags.concat(this.defaultTags);
	} else {
		event.tags = this.defaultTags;
	}

	if (event.time === undefined)
		event.time = Math.floor(Date.now() / 1000);

	if (event.ttl === undefined)
		event.ttl = this.defaultTTL;

	event.host = this.host;

	this.client.send(this.client.Event(event));
};

RiemannMonitor.prototype.exceptionListener = RiemannMonitor.prototype.errorListener = function(name, tags) {
	var ttl = this.defaultErrorTTL;
	var self = this;
	tags = tags || [];
	tags.push('error');
	tags.push(name);

	return function onError(err) {

		if (err !== null) {

			self.send({
				service: name,
				description: util.inspect(err, false, 3),
				metric: 1,
				state: 'critical',
				ttl: ttl,
				tags: tags
			});
		}
	};
};

RiemannMonitor.prototype._generateHostLabel = function () {
	if (this.config.hostLabel || this.config.host)
		return this.config.hostLabel || this.config.host;
	else
		return this.config.role + '-' + ipAddress + '-' + process.pid;
};

module.exports = RiemannMonitor;