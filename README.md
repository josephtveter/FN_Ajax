# FN_Ajax

Fractured Nations Ajax is a simple jquery like ajax library.  It wont do a dance on the table, but if your looking for small, fast, and very close to jQuery.ajax functionailty.  It is also packaged with FN_Deferred to give it the Promise Functionality simealar to jquery.  

Purpose:
	This library is to be an almost perfect dropin replacement for jQuery ajax. Except you will not have the bloat of jquery.  There are some differances, but in most cases it will opperate the same.  It has basic functionailty for GET and POST calls, and I have been working on multipart requests, but they are not functional yet.

The only field required is url.  

Usage:

	var params = {
		url: "yourUrl"
	};

	ajax(params).done(function(result)
	{
		console.info("Your file is here!");
	}).fail(function(errorObj)
	{
		console.error("Something bad happened");
	}).always(function(response)
	{
		console.log("Your call is done, it could be resolved or rejected");
	});


List of possible params:

	url - url of the site you would like to make a request to.
	requestType - just to id the call.
	maxRetry - number of retries you want to allow.
	retry - same as maxRetry
	dataType - default is json
	method - only GET and POST are currently supported
	async - sets async on the XHR request. defaults to true
	data - json to send to the server
	complete - will fire if the call is resolved or rejected
	success - will be called if the call is resolved
	error - will be called if the call is rejected

Done function

	The done function will return these arguments.

		response, xhr, headers, (requestType || url)

Fail function

	The Fail function will return these arguments

		errorObj, requestType, xhr

