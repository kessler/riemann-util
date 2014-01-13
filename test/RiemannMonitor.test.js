var assert = require('assert');
var RiemannMonitor = require('../lib/RiemannMonitor');
var $u = require('util');

function MockClient() {
	this.events = []
}

MockClient.prototype.send = function(event) {
	this.events.push(event);
};

MockClient.prototype.Event = function(data) {
	return data;
};


describe('Monitor hides the monitoring client from the application code', function() {

	var mockClient = new MockClient();
	var monitor = new RiemannMonitor({ defaultTags: ['moo'], ttl: 60, role: 'aRole' });
	monitor.bindClient(mockClient);

	describe('when constructed', function () {

		it('combines default tags from configuration with the role', function() {
			var topic = new RiemannMonitor({ defaultTags: ['moo'], ttl: 60, role: 'aRole' });
			topic.bindClient(mockClient);
			assert.strictEqual(topic.defaultTags.length, 2);
			assert.ok(topic.defaultTags.indexOf('aRole') > -1);
			assert.ok(topic.defaultTags.indexOf('moo') > -1);
		});

		it('throws an exception, when a config object is not provided', function() {
			try {
				var topic = new RiemannMonitor();
				topic.bindClient(mockClient);

				assert.fail('expected an exception to be thrown');
			} catch (e) {
				assert.strictEqual(e.message, RiemannMonitor.MissingConfigObjectError);
			}
		});

		it('throws an exception, when a config object is provided but missing a role key inside it or the role key is invalid', function() {
			try {
				var topic = new RiemannMonitor({});
				topic.bindClient(mockClient);

				assert.fail('expected an exception to be thrown');
			} catch (e) {
				assert.strictEqual(e.message, RiemannMonitor.InvalidOrMissingRoleError);
			}

			try {
				var topic = new RiemannMonitor({ role: 1} );
				topic.bindClient(mockClient);

				assert.fail('expected an exception to be thrown');
			} catch (e) {
				assert.strictEqual(e.message, RiemannMonitor.InvalidOrMissingRoleError);
			}
		});

		it('throws an exception, when a config object is provided but missing a ttl key inside it or the ttl key is invalid', function() {
			try {
				var topic = new RiemannMonitor({ role: 'role' });
				topic.bindClient(mockClient);

				assert.fail('expected an exception to be thrown');
			} catch (e) {
				assert.strictEqual(e.message, RiemannMonitor.InvalidOrMissingTTLError);
			}

			try {
				var topic = new RiemannMonitor({ role: 'role', ttl: '12323' } );
				topic.bindClient(mockClient);

				assert.fail('expected an exception to be thrown');
			} catch (e) {
				assert.strictEqual(e.message, RiemannMonitor.InvalidOrMissingTTLError);
			}
		});
	});


	describe('when sending events', function () {

		it('forwards events to the client', function() {
			var event = {};
			monitor.send(event);
			assert.strictEqual(mockClient.events.length, 1);
		});

		it('will assign a default service name it is not specified in the event', function() {
			var event = {};
			monitor.send(event);

			assert.ok('service' in event);
			assert.strictEqual(event.service, 'no_service_name');
		});

		it('will assign Date.now() in seconds if time is not specified in the event', function() {
			var event = {};
			var now = Date.now();
			monitor.send(event);

			assert.ok('time' in event);
			assert.strictEqual(typeof(event.time), 'number');

			// this might fail occasionally ?
			assert.strictEqual(event.time, Math.floor(now / 1000));
		});

		it('will assign default ttl if it is not specified in the event', function() {
			var event = {};
			monitor.send(event);

			assert.ok('ttl' in event);
			assert.strictEqual(typeof(event.ttl), 'number');

			assert.strictEqual(event.ttl, monitor.config.ttl);
		});

		it('assign default tags, if tags are missing in the event', function() {
			var event = {};
			monitor.send(event);

			assert.ok('tags' in event);
			assert.ok($u.isArray(event.tags));
			assert.strictEqual(event.tags.length, 2);
			assert.ok(event.tags.indexOf('aRole') > -1);
			assert.ok(event.tags.indexOf('moo') > -1);
		});

		it('combines default tags with the tags that are specified in the event, ', function() {
			var event = { tags: ['a']};
			monitor.send(event);
			assert.strictEqual(event.tags.length, 3);
			assert.ok(event.tags.indexOf('aRole') > -1);
			assert.ok(event.tags.indexOf('moo') > -1);
			assert.ok(event.tags.indexOf('a') > -1);
		});
	});

	describe('it acts normally but discard events, when a client is not bound', function () {
		var topic = new RiemannMonitor({ defaultTags: ['moo'], ttl: 60, role: 'aRole' });

		it ('send an event', function() {
			try {
				topic.send({})
				assert.ok('all is good');
			} catch (e) {
				console.log(e);
				assert.fail(e, null || undefined, 'an error should not have been thrown', '===');
			}
		});
	});
});