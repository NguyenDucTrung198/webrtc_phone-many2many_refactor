// var util = require('util');
// var eventEmitter = require('events').EventEmitter;

// function Event () {
//     eventEmitter.call(this);
// }
// util.inherits(Event, eventEmitter);
// var eventBus = new Event();

// module.exports = {
//     emitter : Event,
//     eventBus : eventBus
// };

var events = require('events');
var em = new events.EventEmitter();

module.exports.eventBus = em;