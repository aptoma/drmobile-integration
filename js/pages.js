define('pages', [], function(){
	"use strict";

	function updateProgress (oEvent) {
	  if (oEvent.lengthComputable) {
	    var percentComplete = oEvent.loaded / oEvent.total;
	    percentComplete = percentComplete * 100;
	    percentComplete = Math.round(percentComplete, 2);
	    console.log('progress', percentComplete, ' from 100.');
	  } else {
	    console.log('progress unknown');
	  }
	}

	return {
		get: function(cfg){
			if(typeof cfg == "undefined" || !cfg.url || !cfg.callback){
				throw "Lack of configuration";
			}

			var xhr = new XMLHttpRequest();
			xhr.onload = function(){
				var pages = JSON.parse(this.response);
				cfg.callback(pages);
			};
			xhr.addEventListener("progress", updateProgress, false);
			xhr.open("get", cfg.url, true);
			xhr.send();
		}
	};

});