/* Sooner, (c) 2017 Patrick Stillhart
 * @license MIT */
(function(root, factory) {

	if (typeof define === 'function' && define.amd) define(factory)
	else if (typeof exports === 'object') module.exports = factory()
	else root.Sooner = factory()

})(this, function() {

	var Sooner = {}

	Sooner.version = '0.0.1'

	/**************************************************************************\
		SETUP
	\**************************************************************************/

	var Settings = Sooner.settings = {

		hostname: ['localhost'],

		wrapper: document.getElementById('wrapper'),

		scrollTop: true,

		scrollSpeed: 1000,

		events: {
			beginLoad: function() {},
			progressLoad: function() {},
			endLoad: function() {}
		},

		componentRefresh: function(data) {},

		render: function(data, callback) {

			document.title = 'sooner.js'
			callback('<b>Implement a renderer for sooner.js</b><br><br><pre><code>' + JSON.stringify(data, null, 2) + '</code></pre>')

		},

		onError: function(error, href, method, callback) {
			callback([{
				title: 'Ups',
				view: 'error',
				error: error
			}, href])
		}

	}

	var domUserScripts = []

	;(function() {
		// encapsulate userScripts array
		var userScripts = document.getElementsByTagName("script")
		for (var userScript, i = 0; userScript = userScripts[i]; i++) {
			if (userScript.src) domUserScripts.push(userScript.src)
		}
	})()


	/**************************************************************************\
		EVENT HANDLER
	\**************************************************************************/

	document.addEventListener('click', onClick, false)
	document.addEventListener('submit', onSubmit, false)

	window.addEventListener('popstate', function(e) {
		Settings.events.beginLoad()
		if (e.state) Sooner.render(e.state)
	})

	window.addEventListener('beforeunload', function(e) {
		var userScripts = Settings.wrapper.getElementsByTagName('script')
		executeScript(userScripts, 'end')
	})

	/**************************************************************************\
		PUBLIC METHODS
	\**************************************************************************/

	/**
   * Configure sooner.js
   * options: the object with the new configuration
	 */
	Sooner.configure = function(options) {
		var key, value
		for (key in options) {
			value = options[key]
			if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value
		}

		return this
	}

	/**
	 * Navigates to the URL (works also with anchors)
	 * href: the new URL
	 */
	Sooner.navigate = function(href) {

		// check if this is a different URL
		if (Settings.hostname.indexOf(stringToURL(href).hostname) === -1) return window.location.href = href

		// check for anchor link
		if (stringToURL(href).pathname, window.location.pathname && href.indexOf('#') > -1) {
			var anchor = document.getElementById(href.substr(href.indexOf('#') + 1))
			if (anchor) {
				window.history.replaceState(undefined, undefined, '#' + anchor.id)
				scrollTo(anchor)
				return
			} else return console.error('invalid anchor tag', href)
		}

		Settings.events.beginLoad()

		Sooner.getJSON('get', href, false, function(error, data, meta) {
			if (error) return Settings.onError(error, href, 'get', function(handled) {
				Sooner.render.apply(this, handled)
				Settings.events.endLoad()
			})

			var anchor = href.indexOf('#') > -1 ? href.substring(href.indexOf("#")) : ''
			// todo check if same location
			Sooner.render(data, (meta.responseURL) ? meta.responseURL + anchor : href)

		})

	}

	/**
	 * Reloads the current page
	 */
	Sooner.reload = function() {
		Sooner.navigate(window.location)
	}

	/**
	 * Render the data and update the url
	 * data: the data object
	 * href: the new url
	 */
	Sooner.render = function(data, href) {

		Settings.render(data, function(html) {
			htmlRender(html, href, data)
		})

	}

	/**
	 * Loads a document in JSON
	 * method: 'GET', 'POST' or any other HTTP method
	 * href: the URL to load from
	 * toSend: false OR an object to send
	 * callback: will be called after the load
	 */
	Sooner.getJSON = function(method, href, toSend, callback) {
		var callback = callback || function() {}

		var xhr = new XMLHttpRequest()
		xhr.open(method, href)
		xhr.setRequestHeader('Accept', 'application/json')

		xhr.onload = function() {
			if (this.status === 200) {
				try {
					var json = JSON.parse(xhr.responseText)
				} catch (e) {
					return callback({
						status: this.status,
						statusText: "Invalied JSON response",
						content: xhr.responseText
					})
				}

				// dont have this inside the try block
				callback(null, json, xhr)

			} else callback({
				status: this.status,
				statusText: xhr.statusText
			})
		}

		xhr.onerror = function() {
			callback({
				status: this.status,
				statusText: xhr.statusText
			})
		}

		if (toSend) {
			xhr.setRequestHeader('Content-Type', 'application/json')
			xhr.send(JSON.stringify(toSend))
		} else xhr.send()

	}

	/**************************************************************************\
		INTERNAL METHODS
	\**************************************************************************/
	function onClick(e) {

		// antoher function might have prevented the send already and does something else
		if (e.defaultPrevented) return

		// ignore middle click
		if (e.which == 2 || e.button == 4) return

		var isLink = false
		for (var element, i = 0; element = e.path[i]; i++) {
			if (element.tagName === 'A' && element.href && !hasAttribute(element, 'passthrough')) {
				isLink = true
				break
			}
		}

		if (!isLink || element.hostname && Settings.hostname.indexOf(element.hostname) === -1) return

		e.preventDefault()
		Sooner.navigate(element.href)

	}

	function onSubmit(e) {
		// console.log('CATCH submit')

		if (e.defaultPrevented || hasAttribute(e.target, 'passthrough')) return

		e.preventDefault()

		Settings.events.beginLoad()

		var url = e.target.getAttribute('action') || window.location.href

		var elements = e.target.elements

		// add and filter ( FormData alternative )
		var data = {}
		var add = function(name, value) {
			if (!value) value = ''
			if (!data[name]) data[name] = value
			else if (data[name].constructor === Array) { data[name].push(value) } else data[name] = [data[name], value]
		}

		for (var i = 0; i < elements.length; i++) {
			var item = elements.item(i)
			if (!item.name || item.disabled) continue
			if (!item.type) add(item.name, item.value)

			else if (item.type == 'checkbox' || item.type == 'radio') { if (item.checked) add(item.name, item.value) }

			else if (item.type == 'select-multiple') {for (var j = 0, op; op = item.options[j++];)if (op.selected) add(item.name, op.value)}

			else if (item.type == 'file') add(item.name, item.files)

			else if (item.type == 'submit') { if (item === document.activeElement) add(item.name, item.value) }

			else add(item.name, item.value)

		}

		// if get add to url and clean data
		if (e.target.method === 'get') {

			if (url.indexOf('?') >= 0) url = url.split('?')[0]

			for (var key in data) {
				if (data.hasOwnProperty(key) && typeof data[key] === 'string') {
					url += (url.indexOf('?') >= 0 ? '&' : '?') + encode(key) + '=' + encode(data[key])
				}
			}

			data = false

		}


		Sooner.getJSON(e.target.method, url, data, function(error, data, meta) {
			if (error) return Settings.onError(error, url, e.target.method, function(handled) {
				Sooner.render.apply(this, handled)
				Settings.events.endLoad()
			})

			Sooner.render(data, meta.responseURL)

		})

	}

	function htmlRender(html, href, data) {
		//console.log('render', href, data)

		var userScripts = Settings.wrapper.getElementsByTagName('script')
		executeScript(userScripts, 'end')

		// set new content
		Settings.wrapper.innerHTML = html

		// refresh custom parts
		Settings.componentRefresh(JSON.clone(data))

		if (href && href.length > 0) {
			window.history.pushState(data, document.title, href)
			if (Settings.scrollTop) {
				if (window.location.hash.substr(1)) {
					scrollTo(document.getElementById(window.location.hash.substr(1)))
				} else scroll(0, 0)
			}
		}

		// autofocus
		var inputs = Settings.wrapper.getElementsByTagName('input')
		for (var input, i = 0; input = inputs[i]; i++) {
			if (input.hasAttribute('autofocus')) {
				input.focus()
				break
			}
		}

		Settings.events.progressLoad()

		userScripts = Settings.wrapper.getElementsByTagName('script')
		loadExternalScripts(userScripts, function() {

			executeScript(userScripts, 'initialize')

			Settings.events.endLoad()

		})

	}

	/**************************************************************************\
	    HELPER
	\**************************************************************************/

	function executeScript(userScripts, name) {
		var name = name.toLowerCase()
		for (var userScript, i = 0; userScript = userScripts[i]; i++) {
			try {
				if (hasAttribute(userScript, name)) eval('(function(){' + userScript.innerHTML + '}())')
			} catch (e) {
				console.error(e)
			}
			Settings.events.progressLoad()
		}

	}

	function loadExternalScripts(userScripts, callback) {

		var waiting = userScripts.length
		if (!waiting) callback()

		for (var userScript, i = 0; userScript = userScripts[i]; i++) {

			if (!userScript.src || domUserScripts.indexOf(userScript.src) > -1) {
				if (--waiting === 0) callback()
				continue
			}

			var node = document.createElement('script')
			node.src = userScript.src
			node.addEventListener("load", function() {
				Settings.events.progressLoad()
				if (--waiting === 0) callback()
			})

			domUserScripts.push(userScript.src)
			document.head.appendChild(node)
		}

	}

	function hasAttribute(element, value) {
		if (!element || !element.hasAttribute) return false
		return element.hasAttribute('sooner') && element.getAttribute('sooner').toLowerCase() == value
	}

	function stringToURL(stringURL) {
		var aElement = document.createElement('a')
		aElement.href = stringURL
		return aElement.cloneNode(false)
	}

	function encode(s) {
		return encodeURIComponent(s).replace(/%20/g, '+')
	}

	function easeOutCubic(t, b, c, d) {
		t /= d
		t--
		return c * (t * t * t + 1) + b
	}

	function scrollTo(target) {

		var origin = window.pageYOffset
		var timeOrigin = Date.now()
		var change = target.offsetTop - window.pageYOffset - 10
		var durration = Settings.scrollSpeed

		var pageHeight = window.innerHeight + window.pageYOffset

		;(function update() {

			var now = Date.now()
			var progress = easeOutCubic(now - timeOrigin, origin, change, durration)

			// if still time && not reached the bottom
			if (timeOrigin + durration > now && (change < 0 || pageHeight < document.body.offsetHeight)) {
				requestAnimationFrame(update)
				window.scrollTo(window.scrollX, progress)
			} else window.scrollTo(window.scrollX, origin + change)

		}())

	}

	/**************************************************************************\
	  POLYFIL
	\**************************************************************************/

	// path polyfil
	if (!('path' in Event.prototype))
		Object.defineProperty(Event.prototype, 'path', {
			get: function() {
				var path = []
				var currentElem = this.target
				while (currentElem) {
					path.push(currentElem)
					currentElem = currentElem.parentElement
				}
				if (path.indexOf(window) === -1 && path.indexOf(document) === -1) path.push(document)
				if (path.indexOf(window) === -1) path.push(window)

				return path
			}
		})

	// requestAnimationFrame polyfil
	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = (function() {
			return window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function(callback) { window.setTimeout(callback, 1000 / 60) }
		})()

	// clone polyfil
	if (typeof JSON.clone !== 'function')
		JSON.clone = function(obj) {
			return JSON.parse(JSON.stringify(obj))
		}

	/**************************************************************************\
	  AAAAAAND WE'RE DONE
  \**************************************************************************/

	return Sooner

})
