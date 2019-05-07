const listener = require('../')
const winston = require('winston')


// NOTE: Registering method should have a 'notify' method
let notify = function (response) {
		//console.dir(response, {showHidden: true, colors: true, depth: null})
	}

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	defaultMeta: {service: 'user-service'},
	transports: [
		//
		// - Write to all logs with level `info` and below to `combined.log` 
		// - Write all logs error (and below) to `error.log`.
		//
		new winston.transports.File({ filename: 'error.log', level: 'error' }),
		new winston.transports.File({ filename: 'combined.log' })
	]
});

listener.setLogger(logger);

// Register modules - the module's notify will be called on events
listener.register(notify)

// Start listener
listener.start({
	listener:{
		// endpoint: '/register',
		basic_auth:{
			user:"admin",
			pass: "admin"
		},
		bodyParser:{
			limit: '700kb',
			strict: true
		},
		emitEvent: true,
		ngrokConnect: true
	}	
})
// if emitEvent is set to true
.then(server => {
	server.on("publish", (payload) => {
		console.log('publish payload', payload)
	})
	server.on("unpublish", (payload) => {
		console.log('unpublish', payload)
	})
})