define('main', ['alf', 'js/widgets/disqus'], function (Alf, disqus) {
	"use strict";
	var $ = Alf.dom;

	// Bubble up the tap event on video elements in fullscreen slideshow
	$(document.body).on('tap', '.ap-slideshow-fullscreen .video', function() {
		var videoUrl = $(this).attr('data-video-url');
		// bridge.trigger('playVideo', videoUrl)
		alert("OK - tapped video - " + videoUrl);
	});

	var widgets = [];
      widgets.push(disqus);


	var app = {
		initialize: function () {
			this.isEmbeddedInApp = this.getURLParameter('isEmbeddedInApp', '1') != '0';
			this.page = null;
			this.event = null;
			this.bridge = null;
			this.initBridge();
			this.initLayers();
		},

		getURLParameter: function(name, fallbackValue) {
    		return decodeURI(
        		(RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,fallbackValue])[1]
    			);
		},

		logToApp: function(data) {
			this.bridge.trigger('log', data);
		},

		logToConsole: function(data) {
			if (typeof console == "object") {
				console.log(data);
			}
		},

		logToAll: function(data) {
			this.logToConsole(data);
			this.logToApp(data);
		},

		/**
		 * Initialize the bridge used for communication between native and HTML
		 *
		 * @return {void}
		 */
		initBridge: function () {
			// This is used to trigger HTML-events by the native layer
			this.event = _.extend({}, Alf.Events);

			// This is used to send event-data to the native app
			this.bridge = _.extend({}, Alf.Events, {
			  initialize: function () {
					this.frameIndex = 0;
					this.eventFrames = $('.event-frame');
					this.bind('all', this.eventTriggered);
				},

				/**
				 * Event triggered
				 *
				 * This works like a proxy for all events triggered on this.bridge
				 * Change the src attribute on any of the iframes so the native wrapper app
				 * can intercept it and decode the JSON payload in the URL
				 *
				 * @return {void}
				 */
				eventTriggered: function () {
					var eventInfo = JSON.stringify([].slice.call(arguments));
                    this.frameIndex = (this.frameIndex + 1) % this.eventFrames.length;
					if(app.isEmbeddedInApp)
					{
                    	this.eventFrames[this.frameIndex].src = 'event://' + escape(eventInfo);
					}
					else
					{
						app.logToConsole('Event: ' + eventInfo);
					}
				}
			});

			this.bridge.initialize();
		},

		/**
		 * Initialize layers
		 *
		 * This is to enable fullscreen support
		 * The article/pages and fullscreen elements are rendered in different "layers"
		 *
		 * @return {void}
		 */
		initLayers: function () {

			this.layerManager = new Alf.layer.Manager();

			this.pageLayer = new Alf.layer.Page({
				el: '#alf-layer-content',
				widgets: widgets,
				manager: this.layerManager
			});

			this.fullscreenLayer = new Alf.layer.Fullscreen({
				el: '#alf-layer-fullscreen',
				manager: this.layerManager
			});

			this.pageLayer.render();
			this.fullscreenLayer.render();
		},


		/**
		 * Render the page on screen
		 *
		 * Takes the compiled content and uses Alf.layout.Page to do rendering
		 *
		 * @param {HTMLElement} el the element to put the page inside
		 * @param {Object} deskedPage
		 * @param {String} contextHash used for race conditions
		 * @param {String} assetsBaseUrl
		 * @param {Function} onDone
		 * @return {void}
		 */
		renderPage: function (pageContentEl, deskedPage, assetsBaseUrl, onDone) {

			if (this.page) {
				this.page.tearDown();
				this.page = null;
			}

			var page;
			//TODO: remove after aptoma fix
			var pixelDensity = parseInt(window.devicePixelRatio || 1, 10) >= 2? 2 : 1;

			this.page = page = new Alf.layout.Page({
				pixelRatio: pixelDensity,
				layer: this.pageLayer,
				widgets: widgets,
				assetsBaseUrl: assetsBaseUrl
			});

			page.on('loadComplete', function () {
				onDone();
			});

			page.decompile(deskedPage, function () {
			   page.render(pageContentEl);
			});

		}

	};

	app.initialize();
	window.app = app;
	window.onerror = function(message, url, linenumber) {
		var error = url + ':' + linenumber + ' - ' + message;
		app.logToConsole(error);
		app.bridge.trigger('error', error);
	}


	Alf.hub.on('fullscreenWillAppear', function () {
		app.bridge.trigger('displayState', {event:'fullscreenWillAppear'});
	}, this);

	Alf.hub.on('fullscreenWillDisappear', function () {
		app.bridge.trigger('displayState', {event:'fullscreenWillDisappear'});
	}, this);

	Alf.hub.on('fullscreenDidAppear', function() {
		app.bridge.trigger('displayState', {event:'fullscreenDidAppear'});
	});

	Alf.hub.on('fullscreenDidDisappear', function() {
		app.bridge.trigger('displayState', {event:'fullscreenDidDisappear'});
	});

	app.event.on('renderPage', function(deskedPage, assetsBaseUrl, contextHash) {
		var pageContentEl = $('#alf-layer-content');

		window.scrollTo(0);
		app.renderPage(pageContentEl, deskedPage, assetsBaseUrl, function() {
			app.bridge.trigger('readyForDisplay', contextHash);
		});
		app.bridge.trigger('renderPageCompleted', contextHash);
	});

	app.event.on('applicationInfo', function (info) {
		//app.logToAll('Got applicationInfo:');
	});

	app.event.on('visibillity', function(state) {
		//app.logToAll('Got visibillity state: ' + state);
	});

	app.event.on('focus', function(state) {
		//app.logToAll('Got focus state: ' + state);
	});

	app.event.on('appstate', function(state) {
		//app.logToAll('Got appstate: ' + state);
	});

  $(document).ready(function () {
    app.bridge.trigger('integrationLoaded');
  });

	return app;

});