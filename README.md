# riemann-util [![Build Status](https://secure.travis-ci.org/kessler/riemann-util.png?branch=master)](http://travis-ci.org/kessler/riemann-util)

Provides utilities and abstractions over node.js riemann.io client

## Install
```
npm install riemann-util
```

## class RiemannMonitor
A small abstraction over riemann client that provides defaults, demands require fields and simplifies event sending. This class can be used as is or for building more complex subclasses.

### Example
```javascript

var RiemannMonitor = require('riemann-util').RiemannMonitor;

var monitor = new RiemannMonitor({
	role: 'ninja',
	ttl: 60 * 60, // 1 hour in seconds
});

var client = ... get riemann client, possibly asynchronously or not

monitor.bindClient(client);

monitor.send({
	metric: 5,
	description: 'bar and foo',
	service: 'bar'
});

```

### RiemannMonitor.Ctor(config)
contructs a riemann monitor.


***config*** - see below

### RimannMonitor.bindClient(client)
Binds a node.js riemann client to this monitor instance. Monitor will discard events if a client is not bound. If a client is not bound while the first event sent to the monitor, a single warning will be printed using console.warn()


***client*** - an instance of a node.js riemann client

### RiemannMonitor.send(event)
Sends an event to riemman. Defaults from config will be applied. Event data here will always override the config, except for tags, which will be concatenated to default tags.

***event*** - a javascript object specifing one or more [riemann event fields](http://riemann.io/concepts.html) and their values

### RiemannMonitor.errorListener(serviceName, tags)
A convenience callback/event listener generator. Will return a ```function onError(err) {}``` that sends error events through this client.

All error events will be sent with default tags, argument tags, the service name and an ```error``` tag.

Their metric will be 1, their description will be an inspection of the error argument in _onError_ and their ttl will be the default ttl or the error ttl specified in the config.

The error event time is Date.now() in seconds and its state will be set to ```critical```


***serviceName*** - event service


***tags*** - an array of additional tags

### RiemannMonitor._generateHostLabel()
Override this to change the host label generation behavior.

### configuration options

Where it makes sense, configuration options can be overridden or augmented when sending an event.

```
	{
		// required, is sent with every event, included in default tags and might a be part of the host label.
		role: 'worker',

		// required, default ttl in SECONDS for each event
		ttl: 10,

		// optional, an array of tags that will be added to EACH event fired from this monitor
		defaultTags: [],

		// optional, completely override host label generation with a fixed host label. The default host label is [role]-[ip address]-[process id]
		hostLabel: 'my-super-server-is-awesome',

		// optional, if an event is missing a service use this. The default service is 'no_service_name'
		service: 'foo-workers',

		// optional, ttl used for error events generated through errorListener, if omitted ttl is used instead.
		errorTTL: 20,
	}
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2014 Yaniv Kessler. Licensed under the MIT license.
