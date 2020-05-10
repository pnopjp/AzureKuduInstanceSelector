let authorizationToken;

// Creaete urls of chrome.webRequest.onBeforeSendHeaders.addListener()
let onBeforeSendHeadersUrls = [];
BackgroundOnBeforeSendHeadersPortalPaths.forEach(path => {
	portalServers.forEach(server =>{
		onBeforeSendHeadersUrls.push("https://" + server + path);
	})
});
const servers = managmenetServers.map(server => {
	return "https://" + server + "/*"
})
onBeforeSendHeadersUrls = onBeforeSendHeadersUrls.concat(servers);

chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
	const header = details.requestHeaders.find(header => header.name === 'Authorization');
	if (header !== undefined) {
		authorizationToken = header.value;
	}
	return {requestHeaders: details.requestHeaders};
},{
	urls: onBeforeSendHeadersUrls
}, ['requestHeaders','blocking']);

chrome.runtime.onConnect.addListener( port => {
	port.onMessage.addListener( arg => {
		if( arg.name == "get-accesstoken" ){
			port.postMessage({
				authorizationToken: authorizationToken
			});
			return true;
		}
	});
});

// Create conditions of chrome.declarativeContent.onPageChanged.removeRules()
const onPageChangedConditions = portalServers.map(server => {
	const condition = new chrome.declarativeContent.PageStateMatcher({
		pageUrl: {
			schemes: ['https'],
			hostEquals: server
		}
	})
	return condition;
});

chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
	chrome.declarativeContent.onPageChanged.addRules([{
		conditions: onPageChangedConditions,
		actions: [
			new chrome.declarativeContent.ShowPageAction()
		]
	}]);
});