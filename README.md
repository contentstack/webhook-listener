[![Contentstack](https://www.contentstack.com/docs/static/images/contentstack.png)](https://www.contentstack.com/)
## Contentstack Webhook Listener

Contentstack is a headless CMS with an API-first approach. It is a CMS that developers can use to build powerful cross-platform applications in their favorite languages. Build your application frontend, and Contentstack will take care of the rest. [Read More](https://www.contentstack.com/). 

Contentstack webhook listener is HTTP webserver to get notified when Contentstacak webhook gets triggered. It is used as trigger in Contentstack DataSync to start synchronizing data.

### Prerequisite

Node.js 8+

### Usage

```js
import * as listener from '@contentstack/wehbook-listener';

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
## Configuration

| Property       | DataType     | Default |Description |
| :------------- | :---------- | :---------- | :---------- |
|  listener.port | number      | 5000| **Optional.** A port for starting the webhook listener. |
|  listener.endpoint | string      |  /notify| **Optional.** The URL where the webhook should be triggered. |
|  listener.basic_auth.user | string      | -| **Optional.** Basic auth username. |
|  listener.basic_auth.pass | string      |  -| **Optional.** Basic auth password. |


## Support and Feature requests
If you have any issues working with the library, please file an issue here at Github.

You can send us an e-mail if you have any support or feature requests. Our support team is available 24/7 on the intercom. You can always get in touch and give us an opportunity to serve you better!

## License
This repository is published under the [MIT license](LICENSE).
