/*
	Created by: Joseph Tveter
	email: josephtveter@gmail.com
	git: https://github.com/josephtveter/FN_Ajax
	GPL: Use and edit and Enjoy.  This is an example of my work.

	Purpose:
		This library is to give Promise Object support.  If your site needs to support promises but also needs to support IE, so you can not use window.Promise.  Jquery is nice, but it is heavy.  FN_Deferred weighs in about 3kb.  FN_Deferred is a great stable micro library. Give it a whirl.   
*/
(function(global){
	
	var delay = function () {
		if ( typeof setImmediate != "undefined" ) {
			return setImmediate;
		}
		else if ( typeof process != "undefined" ) {
			return process.nextTick;
		}
		else {
			return function ( arg ) {
				if(arg){
					setTimeout( arg, 0 );
				}
			};
		}
	}();

	/**
	 * Iterates obj and executes fn
	 *
	 * Parameters for fn are 'value', 'index'
	 *
	 * @method each
	 * @private
	 * @param  {Array}    obj Array to iterate
	 * @param  {Function} fn  Function to execute on index values
	 * @return {Array}        Array
	 */
	function each ( obj, fn ) {
		var nth = obj.length,
		    i   = -1;

		while ( ++i < nth ) {
			if ( fn.call( obj, obj[i], i ) === false ) {
				break;
			}
		}
		return obj;
	}


	var Deferred = function(resolvedCallBack, rejectedCallBack, timeout, id)
	{
		var self = this;
		this.id = id || null;
		timeout = !isNaN(timeout) && timeout !== true ? timeout : 0;

		var onDone = [];
		var onAlways = [];
		var onFail = [];

		this.state = Deferred.state.PENDING;
		this.value = null;

		if(resolvedCallBack)
		{
			onDone.push(resolvedCallBack);
		}
		if(rejectedCallBack)
		{
			onFail.push(rejectedCallBack);
		}

		/**
		 * Rejects the Promise
		 *
		 * @method reject
		 * @param  {Mixed} arg Rejection outcome
		 * @return {Object}    Deferred instance
		 */
		this.reject = function ( arg ) {
			if ( self.state > Deferred.state.PENDING ) {
				return self;
			}
			self.state = Deferred.state.FAILURE;
			process.apply(this, arguments);
			return self;
		};

		/**
		 * Resolves the Promise
		 *
		 * @method resolve
		 * @param  {Mixed} arg Resolution outcome
		 * @return {Object}    Deferred instance
		 */
		this.resolve = function ( arg ) {
			if ( self.state > Deferred.state.PENDING ) {
				return self;
			}
			self.state = Deferred.state.SUCCESS;
			process.apply(this, arguments);
			return self;
		};

		/**
		 * Returns the Deferred Promise. This is included to ease in jquery replacement
		 *
		 * @method promise
		 * @return {Object}       Deferred instance
		 */
		this.promise = function ( arg ) {
			return self;
		};

		/**
		 * Registers a function to execute after Promise is reconciled
		 *
		 * @method always
		 * @param  {Function} arg Function to execute
		 * @return {Object}       Deferred instance
		 */
		this.always = function ( arg ) {
			if ( typeof arg == "function" ) {
				if(self.state !== Deferred.state.PENDING)
				{
					// delay(arg(self.value, self.isResolved()));
					delay(arg.apply(this, self.value));
				}
				onAlways.push( arg );
			}
			return self;
		};

		/**
		 * Registers a function to execute after Promise is resolved
		 *
		 * @method done
		 * @param  {Function} arg Function to execute
		 * @return {Object}       Deferred instance
		 */
		this.done = function ( arg ) {
			if ( typeof arg == "function" ) {
				if(self.state === Deferred.state.SUCCESS)
				{
					delay(arg.apply(this, self.value));
				}
				onDone.push( arg );
			}
			return self;
		};

		/**
		 * Registers handler(s) for the Promise
		 *
		 * @method then
		 * @param  {Function} success Executed when/if promise is resolved
		 * @param  {Function} failure [Optional] Executed when/if promise is broken
		 * @return {Object}           New Promise instance
		 */
		this.then = function ( onFulfilled, onRejected ) {
			self.done( onFulfilled );
			self.fail( onRejected );
			return self;
		};

		/**
		 * Registers a function to execute after Promise is rejected
		 *
		 * @method fail
		 * @param  {Function} arg Function to execute
		 * @return {Object}       Deferred instance
		 */
		self.fail = function ( arg ) {
			if ( typeof arg == "function" ) {
				if(self.state === Deferred.state.FAILURE)
				{
					// delay(arg(self.value, false));
					delay(arg.apply(this, self.value));
				}
				onFail.push( arg );
			}
			return self;
		};
		/**
		 * Registers a function to execute after Promise is rejected
		 *
		 * @method catch
		 * @param  {Function} arg Function to execute
		 * @return {Object}       Deferred instance
		 */
		this.catch = this.fail;

		/**
		 * Determines if Deferred is rejected
		 *
		 * @method isRejected
		 * @return {Boolean} `true` if rejected
		 */
		this.isRejected = function () {
			return ( self.state === Deferred.state.FAILURE );
		};

		/**
		 * Determines if Deferred is resolved
		 *
		 * @method isResolved
		 * @return {Boolean} `true` if resolved
		 */
		this.isResolved = function () {
			return ( self.state === Deferred.state.SUCCESS );
		};

		/**
		 * Gets the state of the Promise
		 *
		 * @method status
		 * @return {String} Describes the status
		 */
		this.status = function () {
			var state = self.state;
			var rtn = Deferred.status[state];
			
			return rtn;
		};

		var retryProcess = true;
		var process = function(arg) {
			if ( self.state === Deferred.state.PENDING ) {
				return self;
			}

			self.value = arguments;

			var mapped = function(arr, context, args)
			{
				var i=0;
				try 
				{
					var len = arr.length;
					for(i=0;i<len;i++)
					{
						arr[i].apply(context, args);
					}
				}
				catch(e)
				{
					console.warn("Deferred callback Failed for state - "+self.status()+": "+e.message);
					// TODO FAIL???
					if(retryProcess)
					{
						retryProcess = false;
						self.state = Deferred.state.FAILURE;
						process({errorType: "deferred_callback_error", error: e, message: "An Error occured in this function: "+arr[i].toString()});
					}
				}
			};
			if(self.state === Deferred.state.SUCCESS)
			{
				mapped(onDone, this, arguments);
			}
			else if(self.state === Deferred.state.FAILURE)
			{
				mapped(onFail, this, arguments);
			}
			mapped(onAlways, this, arguments);
			return self;
		};

		if(timeout)
		{
			window.setTimeout(function()
			{
				if(self.state === Deferred.state.PENDING)
				{
					self.reject({errorType: "deferred_timed_out"});
				}
			}, timeout);
		}
	};

	/**
	 * States of a Promise
	 *
	 * @private
	 * @type {Object}
	 */
	Deferred.state = {
		PENDING : 0,
		FAILURE : 1,
		SUCCESS : 2
	};

	/**
	 * Status of a Promise
	 *
	 * @private
	 * @type {Array}
	 */
	Deferred.status = [
		"pending",
		"rejected",
		"resolved"
	];

	/**
	 * Accepts Deferreds or Promises as arguments or an Array
	 *
	 * @method when
	 * @return {Object} Deferred instance
	 */
	Deferred.when = function () {
		var i     = 0,
		    defer = new Deferred(),
		    args  = [].slice.call( arguments ),
		    nth,
		    callback = null;

		// Did we receive an Array? if so it overrides any other arguments
		if ( args[0] instanceof Array ) {
			args = args[0];
		}
		if( typeof arguments[1] === "function")
		{
			callback = arguments[1];
		}

		// How many instances to observe?
		nth = args.length;

		// None, end on next tick
		if ( nth === 0 ) {
			defer.resolve( null );
		}
		// Setup and wait
		else {
			each( args, function ( p ) {
				p.then( function () {
					if ( ++i === nth && !defer.isResolved() ) {
						defer.resolve.apply(this, args);
						if ( callback ) {
							callback.apply(this, args);
						}
					}
				}, function () {
					if ( !defer.isResolved() ) {
						defer.reject.apply(this, args);
						if ( callback ) {
							callback.apply(this, args);
						}
					}
				} );
			} );
		}

		return defer;
	};

	if ( typeof exports !== "undefined" ) {
	    module.exports = Deferred;
	}
	else if ( typeof define === "function" && define.amd) {
	    define( "Deferred", [], function(){ return Deferred;});
	}
	else if ( typeof define === "function" ) {
	    define( "Deferred", Deferred);
	}
	else {
	    window.Deferred = Deferred;
	}
})(this);





(function(global){
	/* Start Ajax */
	function ajax (params, retry) {
		return new Ajax(params, retry);
	}

		
	var Ajax = function(params, retry)
	{
		var self = this;
		params = params || {};
		retry = retry || 0;

		var deferred = new Deferred();
		var xhr = new XMLHttpRequest();
		var DEFAULT_TIMEOUT = 20000;
		var DEFAULT_METHOD = "GET";
		var DEFAULT_RETRY = 5;
		var DEFAULT_CONTENT_TYPE = 'application/x-www-form-urlencoded; charset=UTF-8';
		var DEFAULT_DATA_TYPE = "json"; // dataType (default: Intelligent Guess (xml, json, script, or html))
		var boundary = '------multipartformboundary' + (new Date).getTime();
		var dashdash = '--';
		var crlf = '\r\n';
		var multipart = params.contentType && params.contentType.indexOf("multipart") !== -1 ? true : false;
		var content = null;
		
		

		var requestType = params.requestType;
		var url = params.url;
		var maxRetry = params.maxRetry || params.retry || DEFAULT_RETRY;
		var dataType = params.dataType || DEFAULT_DATA_TYPE;
		var method = params.method === "GET" || params.method === "POST" ? params.method : DEFAULT_METHOD;
		var async = params.async || true;

		var sendData = "";
		if(params.data)
		{
			if(typeof params.data === "object")
			{
				for(var item in params.data)
				{
					var getVal = item+"="+encodeURIComponent(params.data[item]);
					if(method === "GET" && url.indexOf(getVal) !== -1 )
					{
						// Skip it
					}
					else
					{
						if(sendData.length > 0)
						{
							sendData += "&";
						}
						sendData += getVal;
					}
				}
			}
			else if(typeof params.data === "string")
			{
				sendData = params.data;
			}

			if(sendData.length > 0 && method === "GET")
			{
				if(url.indexOf("?") === -1)
				{
					url += "?";
				}
				else
				{
					url += "&";
				}
				url += sendData;
			}

		}

		var ua = navigator.userAgent.toString();
		var isTrident = ua.indexOf("Trident") !== -1 ? true : false;
		if(isTrident === false) // IE Trident trident bug. Setting timeout will fire an error
		{
			xhr.timeout = params.timeout ? params.timeout : DEFAULT_TIMEOUT; // Set timeout to 4 seconds (4000 milliseconds)
		}
		
		xhr.open(method, url, async);
		this.contentType = params.contentType ? params.contentType : DEFAULT_CONTENT_TYPE;
		
		if(multipart)
		{
			this.contentType += "; boundary="+boundary;
		}
		if(!params.headers || ( params.headers && !params.headers["Content-Type"] ) )
		{
			xhr.setRequestHeader("Content-Type", this.contentType);
		}
		if(params.headers)
		{
			if(typeof(params.headers) === "object")
			{
				for(var item in params.headers)
				{
					xhr.setRequestHeader(item, params.headers[item]);
				}
			}
			if(!params.headers["X-Requested-With"])
			{
				xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			}
			
		}
		this.statusCode = null;
		this.responseObj = {};
		

		var responseType = params.responseType || params.dataType || DEFAULT_DATA_TYPE;
		var failed = false;
		
		this.done = deferred.done;
		this.success = this.done;
		
		this.fail = deferred.fail;
		this.always = deferred.always;

		if(params.error)
		{
			this.fail(params.error);
		}
		if(params.success)
		{
			this.done(params.success);
		}
		if(params.complete)
		{
			this.always(params.complete);
		}
		var resolveCompletedFile = function(responseText, xhr)
		{
			var headers = parseHeaders();
			var response = responseText;
			self.statusCode = xhr.status;
			switch(responseType)
			{
				case "json":
					try 
					{
						if(typeof(responseText) === "string")
						{
							responseText = responseText.replace(/(\r\n|\n|\r)/gm,"");
							response = JSON.parse(responseText);
						}
						else
						{
							response = responseText;
						}
						
					}
					catch(e)
					{
						var message = typeof e == "string" ? e : JSON.stringify(e);
						console.warn(message+" ---- fnAjax JSON.parse Fail: "+responseText);
						response = responseText;
					}
				break;
				default:
					response = responseText;
				break;
			}
			deferred.resolve(response, xhr, headers, (requestType || url));
		};

		var resolveFailFile = function(e, errorObj)
		{
			if(!failed)
			{
				self.statusCode = xhr.status;
				failed = true;
				deferred.reject(errorObj, (requestType || url), xhr);
			}
		};

		var parseHeaders = function()
		{
			var headers = {};
			var arr = xhr.getAllResponseHeaders().split("\n");
			var len = arr.length;
			for(var i=0;i<len;i++)
			{
				if(arr[i].length > 0)
				{
					var idx = arr[i].indexOf(":");
					if(idx > 0)
					{
						var key = arr[i].substring(0, idx);
						var val = arr[i].substring(idx+1).trim();
						headers[key] = val;
					}
				}
			}
			return headers;
		};
		xhr.onreadystatechange = function() 
		{
	    	if(xhr.readyState === 4 && xhr.status === 200) 
	    	{
	    		self.responseObj = {
	    			url: url, 
	    			status: xhr.status, 
	    			responseText: xhr.responseText,
	    			requestType: requestType
	    		};
	      		resolveCompletedFile(xhr.responseText, xhr);
	    	}
	    	else if(xhr.status !== 200 && xhr.status !== 0) // fail fast
	    	{
	    		var errorType = null;
	    		switch(xhr.status)
	    		{
	    			case 404:
	    				errorType = "NotFound";
	    			break;
	    			default:
	    				errorType = "unknown";
	    			break;
	    		}
	    		resolveFailFile({}, {errorType: errorType, status: xhr.status, requestType: requestType, requestParams: params});
	    	}
	  	};

		xhr.ontimeout = function(e)
		{ 
			if(retry <= maxRetry)
			{
				retry++;
				params.timeout = xhr.timeout + (retry * 1000);
				ajax(params, retry).fail(function(result)
				{
					resolveFailFile(e, {errorType: "xhrTimeout"});
				}).done(function(responseText)
				{
					resolveCompletedFile(responseText, xhr);
				});
					
			}
			else
			{
				resolveFailFile(e, {errorType: "xhrTimeout"});
			}
		};

		xhr.onabort = function(e)
		{ 
			resolveFailFile(e, {errorType: "xhrAbort"});
		};

		xhr.onerror = function(e)
		{
			resolveFailFile(e, {errorType: "xhrError", status: xhr.status, requestType: requestType, requestParams: params});
		};

		if(multipart)
		{
			// TODO Multipart is not complete
			console.warn("FN_Ajax multipart is not complete. It may or may not function.");
			var filetype = null;
			var fileObject = params.data.file;
			if ( fileObject.type == '' ){
		        filetype = 'application/octet-stream';
		    } else {
		        filetype = fileObject.type;
		    }
			var formData = new FormData(params.data.form);
			xhr.send(formData);
		}
	  	else if(method === "GET")
	  	{
	  		xhr.send(null);
	  	}
	  	else
	  	{
	  		var data = sendData.length > 0 ? sendData : null;
	  		xhr.send( data );
	  	}
	  	return this;
	  	
	};

	
	// Node, AMD & window supported
	if ( typeof exports !== "undefined" ) {
		module.exports = ajax;
	}
	else if ( typeof define === "function" && define.amd) {
	    define( "ajax", [], function(){ return ajax;});
	}
	else if ( typeof define === "function" ) {
		define("ajax", ajax);
	}
	else {
		window.ajax = ajax;
	}

})(this);