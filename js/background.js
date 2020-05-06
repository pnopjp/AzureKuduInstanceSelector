var authorizationToken;

chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
	var headers = details.requestHeaders;
	for( var i = 0, l = headers.length; i < l; ++i ) {
		if (headers[i].name === 'Authorization') {
			authorizationToken = details.requestHeaders[i].value;
			break;
		}
	}
	return {requestHeaders: details.requestHeaders};
},{
	urls: [
		"https://portal.azure.com/api/*", "https://portal.azure.com/AzureHubs/api/*", "https://management.azure.com/*",
		"https://portal.azure.cn/api/*", "https://portal.azure.cn/AzureHubs/api/*", "https://management.chinacloudapi.cn/*",
		"https://portal.microsoftazure.de/api/*", "https://portal.microsoftazure.de/AzureHubs/api/*", "https://management.microsoftazure.de/*",
		"https://portal.azure.us/api/*", "https://portal.azure.us/AzureHubs/api/*", "https://management.usgovcloudapi.net/*"
	]
}, ['requestHeaders','blocking']);

chrome.runtime.onConnect.addListener( port => {
	var subResourceMap = {};
	port.onMessage.addListener( arg => {
		if( arg.name == "get-accesstoken" ){
            port.postMessage({
                authorizationToken: authorizationToken
            });
			return true;
		}
	});
});

chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
	chrome.declarativeContent.onPageChanged.addRules([{
		conditions: [
			new chrome.declarativeContent.PageStateMatcher({
				pageUrl: {
					schemes: ['https'],
					hostEquals: 'portal.azure.com'
				}
			}),
			new chrome.declarativeContent.PageStateMatcher({
				pageUrl: {
					schemes: ['https'],
					hostEquals: 'portal.azure.cn'
				}
			}),
			new chrome.declarativeContent.PageStateMatcher({
				pageUrl: {
					schemes: ['https'],
					hostEquals: 'portal.azure.us'
				}
			}),
			new chrome.declarativeContent.PageStateMatcher({
				pageUrl: {
					schemes: ['https'],
					hostEquals: 'portal.microsoftazure.de'
				}
			})
		],
		actions: [
			new chrome.declarativeContent.ShowPageAction()
		]
	}]);
  });