'use strict';

class AzureKuduInstanceSelector extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			error: null,
			isLoaded: false,
			items: [],
		}
	}

	async componentDidMount() {
		if (authorizationToken !== undefined) {
			if (appservice !== undefined) {
				// Get instances
				fetch("https://management.azure.com"
					+ "/subscriptions/" + appservice[1] 
					+ "/resourceGroups/" + appservice[2] 
					+ "/providers/Microsoft.Web/sites/" + appservice[3] 
					+ "/" + this.props.query + "?api-version=2019-08-01", 
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
			} else {
				if (this.props.query == "instances") {
					this.setState({
						isLoaded: true,
						items: {
							dontwork: true,
							message: [
								"This page is not an App Serivce page.",
								"Please go to the App Service page and click on this again."
							]
						}
					})
				}
			}
		} else {
			if (this.props.query == "instances") {
				this.setState({
					isLoaded: true,
					items: {
						dontwork: true,
						message: [
							"Please reload this App Service page."
						]
					}
				})
			}
		}
	}
	
	render() {
		const {error, isLoaded, items} = this.state;
		if (error) {
			console.error(error);
			return e('div', {className: "dontwork"}, 'Error: ' + error.message);
		} else if (!isLoaded) {
			let loading = '';
			let className = '';
			if (this.props.query != 'slots') {
				loading = 'Loading...';
				className = 'dontwork';
			}
			return e('div', {className: className}, loading);
		} else {
			if (items.dontwork === undefined) {
				const regexp = /https:\/\/[^\.]*\.scm\.azurewebsites\.net/i;
				if (this.props.query == 'slots') {
					const li = items.value.map(
						item=> (
							e('li', {key: item.name, id: item.name, className: "slot"}, 
								e('div', {className: "slot"}, "slot: " + item.name),
								e(AzureKuduInstanceSelector, {query: "slots/" + item.name.split('/')[1] + "/instances"}, null)
							)
						)
					)
					return e('ul', {className: "slots"}, li);
				} else {
					const instances = items.value;
					let li;
					if (instances.length > 0) {
						li = instances.map(
							item=> (
								e('li', {key: item.name, className: "instance"}, 
									e('span', {className: "name"}, "instance: " + item.name.substr(0, 6)), 
									e('a', {href: item.properties.consoleUrl.match(regexp) + "?instance=" + item.name, target: "_blank"}, "Kudu"),
									e('a', {href: item.properties.consoleUrl, target: "_blank"}, "console" )
								)
							)
						)
					} else {
						li = e('li', {className: "noinstances"}, 'No instances are working.')
					}
					return e('ul', {className: "instances"}, li);
				}
			} else {
				const div = items.message.map(
					item=> (
						e('div', {className: "message"}, item)
					)
				)
				return e('div', {className: "dontwork"}, div);
			}
		}
  	}
}

function regExpEscape(str) {
	return str.replace(/[-\/\\^$*+?.()|\[\]{}]/g, '\\$&');
};

let appservice;
let currentTabUrl;
let authorizationToken;
let currentTab;
const e = React.createElement;
chrome.tabs.getSelected(function(tab) {
	currentTab = tab;
	currentTabUrl = tab.url;

	// Get subscriptionid, resource group, App Service
	const portalServer = portalServers.find(value => {
		return currentTabUrl.match(RegExp("^" + regExpEscape("https://" + value), "i"));
	});
	const regexpAppserviceUrls = [
		// [App Service 2020/05/07] https://portal.azure.com/#@{AADTENANT}/resource/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/{RESOURCEGROUP}/providers/Microsoft.Web/sites/{SITE}/kudu
		"\\/[^\\/]*\\/resource\\/subscriptions\\/([^\\/]*)\\/resourceGroups\\/([^\\/]*)\\/providers\\/Microsoft\\.Web\\/sites\\/([^\\/]*)",
		// [Functions 2020/05/07] https://portal.azure.com/#blade/WebsitesExtension/FunctionsIFrameBlade/id/%2Fsubscriptions%2F00000000-0000-0000-0000-000000000000%2Fresourcegroups%2F{RESOURCEGROUOP}%2Fproviders%2FMicrosoft.Web%2Fsites%2F{SITE}
		// [Functions(from App Service Plan > Apps) 2020/05/09] https://portal.azure.com/#blade/WebsitesExtension/FunctionsIFrameBladeFromNonBrowse/id/%2Fsubscriptions%2F00000000-0000-0000-0000-000000000000%2FresourceGroups%2F{RESOURCEGROUOP}%2Fproviders%2FMicrosoft.Web%2Fsites%2F{SITE}
		// [Functions(change "Language & region" Portal settings) 2020/05/10] https://portal.azure.com/?l=en.en-us#blade/WebsitesExtension/FunctionsIFrameBlade/id/%2Fsubscriptions%2F00000000-0000-0000-0000-000000000000%2FresourceGroups%2F{RESOURCEGROUOP}%2Fproviders%2FMicrosoft.Web%2Fsites%2F{SITE}
		"\\/(?:\\?l=[^#]+)?#blade\\/WebsitesExtension\\/FunctionsIFrameBlade(?:FromNonBrowse)?\\/id\\/\\/subscriptions\\/([^\\/]*)\\/resourcegroups\\/([^\\/]*)\\/providers\\/Microsoft\\.Web\\/sites\\/([^\\/]*)",
		// [Functions(from App Service > Functions) 2020/07/04] https://portal.azure.com/#blade/WebsitesExtension/FunctionMenuBlade/functionOverview/resourceId/%2Fsubscriptions%2F00000000-0000-0000-0000-000000000000%2FresourceGroups%2F{RESOURCEGROUP}%2Fproviders%2FMicrosoft.Web%2Fsites%2F{SITE}%2Ffunctions%2F{FUNCTION}
		"\\/(?:\\?l=[^#]+)?#blade\\/WebsitesExtension\\/FunctionMenuBlade\\/[^\\/]*\\/resourceId\\/\\/subscriptions\\/([^\\/]*)\\/resourceGroups\\/([^\\/]*)\\/providers\\/Microsoft\\.Web\\/sites\\/([^\\/]*)\\/functions\\/.*"
	];

	for (let i = 0; i < regexpAppserviceUrls.length; i ++) {
		const regexp = RegExp(regExpEscape("https://" + portalServer) + regexpAppserviceUrls[i], "i");
		if (regexp.test(decodeURIComponent(currentTabUrl))) {
			appservice = decodeURIComponent(currentTabUrl).match(regexp);
			break;
		}
	}

	const port = chrome.runtime.connect({name: "my-background-port"});
	port.postMessage({name: "get-accesstoken"});
	port.onMessage.addListener(response => {
		authorizationToken = response.authorizationToken;

		ReactDOM.render(
			e(AzureKuduInstanceSelector, {query: 'instances'}, null),
			document.querySelector('#productionSlot')
		);

		ReactDOM.render(
			e(AzureKuduInstanceSelector, {query: 'slots'}, null),
			document.querySelector('#slots')
		);
	});
});