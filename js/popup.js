'use strict';

class AzureKuduInstanceSelector extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			error: null,
			isLoaded: false,
			items: []
		};
	}

	getCurrentUrl() {
		return new Promise(function (resolve) {
			chrome.tabs.getSelected(tab=>{
				resolve(tab.url);
			})
		});
	}

	async componentDidMount() {
		// Get current tab url
		const currentTabUrl = await this.getCurrentUrl();

		// Get subscriptionid, resource group, App Service
		// https://portal.azure.com/#@{AADTENANT}/resource/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/{RESOURCEGROUP}/providers/Microsoft.Web/sites/{SITE}/kudu
		const regexpWeb = /https:\/\/portal\.azure\.com\/[^\/]*\/resource\/subscriptions\/([^\/]*)\/resourceGroups\/([^\/]*)\/providers\/Microsoft\.Web\/sites\/([^\/]*)/i;
		// https://portal.azure.com/#blade/WebsitesExtension/FunctionsIFrameBlade/id/%2Fsubscriptions%2F00000000-0000-0000-0000-000000000000%2Fresourcegroups%2F{RESOURCEGROUOP}%2Fproviders%2FMicrosoft.Web%2Fsites%2F{SITE}
		const regexpBlade = /https:\/\/portal\.azure\.com\/#blade\/WebsitesExtension\/FunctionsIFrameBlade\/id\/\/subscriptions\/([^\/]*)\/resourcegroups\/([^\/]*)\/providers\/Microsoft\.Web\/sites\/([^\/]*)/i;
		var appservice = [];
		if (regexpWeb.test(currentTabUrl)) {
			appservice = currentTabUrl.match(regexpWeb);
		} else if (regexpBlade.test(decodeURIComponent(currentTabUrl))) {
			appservice = decodeURIComponent(currentTabUrl).match(regexpBlade);
		} else {
			var result = {
				dontwork: true,
				message: [
					"This page is not an App Serivce page.",
					"Please go to the App Service page and click on this again."
				]
			}
			this.setState({
				isLoaded: true,
				items: result
			})
			return;
		}

		// Get AccessToken from Background
		port.postMessage({name: "get-accesstoken"});
		port.onMessage.addListener(response => {
			var authorizationToken = response.authorizationToken;
			// Get instances
			fetch("https://management.azure.com"
				+ "/subscriptions/" + appservice[1] 
				+ "/resourceGroups/" + appservice[2] 
				+ "/providers/Microsoft.Web/sites/" + appservice[3] 
				+ "/instances?api-version=2019-08-01", 
			{
				headers: {
					'Authorization': authorizationToken,
					'Content-Type': 'application/json'
				}
			}).then(res => res.json()).then(
				(result) => {
					this.setState({
						isLoaded: true,
						items: result
					});
				},
				(error) => {
					this.setState({
						isLoaded: true,
						error
					});
				}
			)
		});
	}
	
  	render() {
		const {error, isLoaded, items} = this.state;
		if (error) {
			console.error(error);
			return e('div', {className: "dontwork"}, 'Error: ' + error.message);
		} else if (!isLoaded) {
			return e('div', {className: "dontwork"}, 'Loading...');
		} else {
			if (items.dontwork === undefined) {
				const regexp = /https:\/\/[^\.]*\.scm\.azurewebsites\.net/i;
				var li = items.value.map(
					item=> (
						React.createElement('li', {key: item.name, className: "instance"}, 
							React.createElement('span', {className: "name"}, "instance: " + item.name.substr(0, 6)), 
							React.createElement('a', {href: item.properties.consoleUrl.match(regexp) + "?instance=" + item.name, target: "_blank"}, "Kudu"),
							React.createElement('a', {href: item.properties.consoleUrl, target: "_blank"}, "console" )
						)
					)
				)
				return e('ul', {className: "instances"}, li);
			} else {
				var div = items.message.map(
					item=> (
						React.createElement('div', {className: "message"}, item)
					)
				)
				return e('div', {className: "dontwork"}, div);
			}
		}
  	}
}

const e = React.createElement;
var port = chrome.runtime.connect({name: "my-background-port"});

const domContainer = document.querySelector('#popupContainer');
ReactDOM.render(e(AzureKuduInstanceSelector), domContainer);
