import listener from '../'

// NOTE: Registering method should have a 'notify' method
let notify = function (response) {
    //console.dir(response, {showHidden: true, colors: true, depth: null})
}

// Register modules - the module's notify will be called on events
listener.register(notify)

// Start listener
listener.start({
	listener:{
		endpoint: '/register',
		basic_auth:{
			user:"admin",
			pass: "admin"
		}
	}	
})