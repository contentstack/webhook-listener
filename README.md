[![Contentstack](https://www.contentstack.com/docs/static/images/contentstack.png)](https://www.contentstack.com/)
## Contentstack webhook listener

Contentstack is a headless CMS with an API-first approach. It is a CMS that developers can use to build powerful cross-platform applications in their favorite languages. Build your application frontend, and Contentstack will take care of the rest. [Read More](https://www.contentstack.com/). 

Contentstack provides Webhook listener to get notified when webhook gets triggered. It is build to use along with Contentstack Sync Manager and Contentstack Asset stores and Content stores.

### Prerequisite

You need Node.js version 4.4.7 or later installed to use the Contentstack wehbook listener and register a method which gets called on webhook triggered.

### Config

listener.port

### Usage

```js
import * as listener from 'contentstack-wehbook-listener';

// Function which will get called when webhook triggered
let notify: function (data) {
     
}

register(notify)

// Start listener 
start({
	listener:{
		endpoint: '/register',
		basic_auth:{
			user:"admin",
			pass: "admin"
		}
	}	
})

```
