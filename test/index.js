global.__rootDir = __dirname
global.transmit = (req, res, response) => {
	if (req.accepts(['html', 'json']) === 'json') res.json(response)
	else res.render(response.view, response)
}

let express = require('express')
let exphbs = require('express-handlebars');

let app = express()

app.engine('handlebars', exphbs({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

app.use(express.static('../'))

app.get('/', function(req, res) {
	transmit(req, res, {
		view: 'home',
		text: 'Hello World!'
	})
})

app.get('/input', function(req, res) {
	transmit(req, res, {view: 'input'})
})

app.get('/scroll', function(req, res) {
	transmit(req, res, {view: 'scroll'})
})

app.get('/error', function(req, res) {
	transmit(req, res, {view: 'error'})
})

app.listen(3000, function() {
	console.log('Example app listening on port 3000!')
})
