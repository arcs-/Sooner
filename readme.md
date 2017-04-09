# Sooner

Sooner is a simple Framework that provides an AJAX backbone for a whole website. All navigations and forms will be caught and sent as JSON, the JSON answer from the server will then be rendered based on your chosen templating engine.

It helps to increase the user experience and minimizes the load on a server. Sooner moves the rendering part of the view to the client, so the server simply has to send the document in JSON and the template.

Benefits
 * Works well for people without Javascript
 * Almost no configuration required
 * Integrates with existing code
 * Increased user experience
 * Minimizes load

Sooner has been written using vanilla JavaScript, no additional frameworks required.

# Basic Usage

The basic usage should give you an idea on how sooner.js works, later you can tweak and optimize your configuration quite a bit. This example used handlebars as a templating engine, you virtually any can be used, you could even do it without one.

 ## Server
 The server has to be able to send rendered HTML documents or the raw JSON Object depending on the request.

 With express.js this can be done in the following fashion.
  ```js
// custom send method (will be attached to the global object)
global.transmit = (req, res, response) => {
    // check if a JSON answer was requested
    if (req.accepts(['html', 'json']) === 'json') res.json(response)
    else res.render(response.view, response)
}

// normal route (can be in separate file)
app.get('/input', function(req, res) {
    // now instead of calling "res.render('home', {name: 'max'})" use
    transmit(req, res, {view: 'home', name: 'max'})
})
 ```

 ## Client
You should have one main layout (e.g. 'layout.hbs' ) containing all the configuration and libraries.

 ```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Example App</title>
    <link rel="stylesheet" href="test/public/css/style.css">
</head>
<body>

    <nav>
        <a href="home">Home</a> |
        <a href="page">A page</a> |
        <a href="pag2">Another page</a>
    </nav>

    <!-- "wrapper" is the default id for the element to replace -->
    <div id="wrapper">{{{body}}}</div>

</body>

<script src=" <!-- your runtime templating engine --> "></script>
<script src=" <!-- your compiled templates --> "></script>
<script src="sooner.js"></script>
<script>
    Sooner.configure({
        hostname: ['localhost'],
        render: function(data, callback) {
            document.title = data.view + ' - sooner.js'
            // example for a render function
            callback(myTemplatingEngine.render(data.view, data))
        }

    })
</script>
</html>
 ```

Each page template can have a `initialize` function
```js
<!-- external scripts will be loaded only once! -->
<script src="/js/tags.js"></script>

<!-- setup page and load notify external libraries
<script sooner="initialize">
    initTags()
</script>
```

## Sooner Options

You can optimize the sooner through the `Sooner.configure({})` method.
```js
Sooner.configure({
    // options go here
})
```

### Most important options

* hostname: the domains and IPs on which sooner should work
* render: the function which is called when the page has to be rendered

```js
Sooner.configure({
    hostname: ['localhost'],
    render: function(data, callback) {
        document.title = 'sooner.js'
        callback('<b>Implement a renderer for sooner.js</b><br><br><pre><code>'
                 + JSON.stringify(data, null, 2)
                 + '</code></pre>')

        }
})
```

#### Full Default Configuration
```js
Sooner.configure({
        // the domains and IPs on which sooner works
        hostname: ['localhost'],

        // the main body in which the content changes
        wrapper: document.getElementById('wrapper'),

        // if after a page reload it should jump to the top
        scrollTop: true,

        // scroll speed for anchor tags
        scrollSpeed: 1000,

        // events you can listen to, e.g. to use nprogress.js
        events: {
            beginLoad: function() {},
            progressLoad: function() {},
            endLoad: function() {}
        },

       // this function can be used freely and is for updating content outside of the wrapper.
       // E.g. updating a profile container
       // data: contains the JSON response from the server
        componentRefresh: function(data) {},

        // the main render function. You'll hook up the render engine here
        // data: contains the JSON response from the server
        // callback function and expects the HTML as first argument ( "callback(html)" )
        render: function(data, callback) {

            document.title = 'sooner.js'
            callback('<b>Implement a renderer for sooner.js</b><br><br><pre><code>' + JSON.stringify(data, null, 2) + '</code></pre>')

        },

        // in case the server doesn't respond with a 200 or 300 message, this function will be called
        // the content will be then be forwarded to the "render" function
        // error: the error
        // href: URLon which the error happened
        // method: which HTTP was used (e.g. POST, GET or PUT)
        // callback: expects an array
        //    [0]: an object for the render function
        //    [1]: new URL
        onError: function(error, href, method, callback) {
            callback([{
                title: 'Ups',
                view: 'error',
                error: error
            }, href])
        }

})
```

#### Functions
Next to the `.configure()` function, there are following

`Sooner.navigate(href)`
Navigates to the URL (also works with anchors)
 * href: the new URL

`Sooner.reload()`
Reloads the current page

`Sooner.render(data, href)`
Render the data and update the URL
 * data: the data object
 * href: the new URL

`Sooner.getJSON(method, URL, toSend, callback)`
Loads a document in JSON
 * method: 'GET', 'POST' or any other HTTP method
 * href: the URL to load from
 * toSend: false OR an object to send
 * callback: your function that handles the response

## Development

To run the demo locally:

1. Clone this repo locally
2. Run `npm install` from your console at the /test folder
3. Run `node index.js`
4. Navigate to `http://localhost:3000/index`

## License

MIT: https://github.com/arcs-/sooner/blob/master/LICENSE
