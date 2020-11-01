'use strict';

class AzureKuduInstanceSelector extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			slotsNum: 0
		}

		this.updateState = this.updateState.bind(this);
	}

	updateState(state) {
		this.setState({slotsNum: state.slotsNum});
	}

	render() {
		let display;
		if (this.state.slotsNum > 0) {
			display = 'inline';
		} else {
			display = 'none';
		}
		return e('div', {id: 'popupContainer'}, 
			e('div', {id: 'productionSlot'}, e(AppServiceSlots, {query: 'instances', productionSlotDisplay: display, slot: appservice[5]}, null)),
			e('div', {id: 'slot'}, e(AppServiceSlots, {query: 'slots', productionSlotDisplay: 'inline', updateState: this.updateState.bind(this)}, null))
		)
	}
}

class AppServiceSlots extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			error: null,
			isLoaded: false,
			items: [],
			slotsNum: 0
		}
	}

	async componentDidMount() {
		if (authorizationToken !== undefined) {
			if (appservice !== undefined) {
				// Get instances
				fetch("https://management.azure.com"
					+ "/subscriptions/" + appservice[2] 
					+ "/resourceGroups/" + appservice[3] 
					+ "/providers/Microsoft.Web/sites/" + appservice[4] 
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

	instanceList() {
		const instances = this.state.items.value;
		if (instances !== undefined && instances.length > 0) {
			const regexp = /https:\/\/[^\.]*\.scm\.azurewebsites\.net/i;
			instances.sort(function(item1, item2) {
				if (item1.name > item2.name) {
					return 1;
				} else {
					return -1;
				}
			});
			return instances.map(
				item=> (
					e('li', {key: item.name, className: "instance"}, 
						e('span', {className: "name"}, "instance: " + item.name.substr(0, 6)), 
						e('a', {href: item.properties.consoleUrl.match(regexp) + "?instance=" + item.name, target: "_blank"}, "Kudu"),
						e('a', {href: item.properties.consoleUrl, target: "_blank"}, "console" )
					)
				)
			)
		} else {
			return e('li', {className: "noinstances"}, 'No instances are working.')
		}
	}

	slotList(slot) {
		let isClose = '';
		if (appservice[5] !== slot) {
			isClose = ' isClose';
		}
		return e('div', {className: "slot display-" + this.props.productionSlotDisplay}, 
			e('div', {className: "slotLeft"}, 
				e('div', {className: "slotVisible" + isClose}, null),
				e('span', {className: "slotName"}, "slot: " + slot)
			),
			e('div', {className: "slotRight"},
				e('div', {className: "slotNavi"},
					e('a', {id: 'slot-' + slot, href: "#", className: "gooverview"}, "overview")
				)
			)
		);
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
				if (this.props.query == 'instances') {
					let isClose = '';
					if (appservice[5] !== appservice[4]) {
						isClose = ' isClose';
					}
					const slot = e('div', {className: "productionSlot display-" + this.props.productionSlotDisplay},
						this.slotList(appservice[4]),
						e('ul', {className: "instances" + isClose}, this.instanceList())
					);

					return slot;
				} else if (this.props.query == 'slots') {
					let instancesNum = 0;
					if (items.value !== undefined) {
						instancesNum = items.value.length;
					}
					this.props.updateState({slotsNum: instancesNum});
					const li = items.value.map(
						item=> (
							e('li', {key: item.name, id: item.name, className: "slot"}, 
								this.slotList(item.name),
								e(AppServiceSlots, {query: "slots/" + item.name.split('/')[1] + "/instances", slot: item.name}, null)
							)
						)
					)
					return e('ul', {className: "slots"}, li);
				} else {
					let isClose = '';
					if (appservice[5] !== this.props.slot) {
						isClose = ' isClose';
					}
					return e('ul', {className: "instances" + isClose}, this.instanceList());
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
let authorizationToken;
let currentTab;
const e = React.createElement;

chrome.tabs.getSelected(function(tab) {
	currentTab = tab;

	// Get subscriptionid, resource group, App Service
	const portalServer = portalServers.find(value => {
		return currentTab.url.match(RegExp("^" + regExpEscape("https://" + value), "i"));
	});
	const regexpAppserviceUrls = [
		// [App Service 2020/05/07] https://portal.azure.com/#@{AADTENANT}/resource/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/{RESOURCEGROUP}/providers/Microsoft.Web/sites/{SITE}/kudu
		"(\\/[^\\/]*\\/resource\\/subscriptions\\/([^\\/]*)\\/resourceGroups\\/([^\\/]*)\\/providers\\/Microsoft\\.Web\\/sites\\/([^\\/]*))(?:$|(\/.*))",
		// [Functions 2020/05/07] https://portal.azure.com/#blade/WebsitesExtension/FunctionsIFrameBlade/id/%2Fsubscriptions%2F00000000-0000-0000-0000-000000000000%2Fresourcegroups%2F{RESOURCEGROUOP}%2Fproviders%2FMicrosoft.Web%2Fsites%2F{SITE}
		// [Functions(from App Service Plan > Apps) 2020/05/09] https://portal.azure.com/#blade/WebsitesExtension/FunctionsIFrameBladeFromNonBrowse/id/%2Fsubscriptions%2F00000000-0000-0000-0000-000000000000%2FresourceGroups%2F{RESOURCEGROUOP}%2Fproviders%2FMicrosoft.Web%2Fsites%2F{SITE}
		// [Functions(change "Language & region" Portal settings) 2020/05/10] https://portal.azure.com/?l=en.en-us#blade/WebsitesExtension/FunctionsIFrameBlade/id/%2Fsubscriptions%2F00000000-0000-0000-0000-000000000000%2FresourceGroups%2F{RESOURCEGROUOP}%2Fproviders%2FMicrosoft.Web%2Fsites%2F{SITE}
		"(\\/(?:\\?l=[^#]+)?#blade\\/WebsitesExtension\\/FunctionsIFrameBlade(?:FromNonBrowse)?\\/id\\/\\/subscriptions\\/([^\\/]*)\\/resourcegroups\\/([^\\/]*)\\/providers\\/Microsoft\\.Web\\/sites\\/([^\\/]*))(?:$|(\/.*))",
		// [Functions(from App Service > Functions) 2020/07/04] https://portal.azure.com/#blade/WebsitesExtension/FunctionMenuBlade/functionOverview/resourceId/%2Fsubscriptions%2F00000000-0000-0000-0000-000000000000%2FresourceGroups%2F{RESOURCEGROUP}%2Fproviders%2FMicrosoft.Web%2Fsites%2F{SITE}%2Ffunctions%2F{FUNCTION}
		"(\\/(?:\\?l=[^#]+)?#blade\\/WebsitesExtension\\/FunctionMenuBlade\\/[^\\/]*\\/resourceId\\/\\/subscriptions\\/([^\\/]*)\\/resourceGroups\\/([^\\/]*)\\/providers\\/Microsoft\\.Web\\/sites\\/([^\\/]*))(?:$|(\/.*))"
	];

	for (let i = 0; i < regexpAppserviceUrls.length; i ++) {
		const regexp = RegExp(regExpEscape("https://" + portalServer) + regexpAppserviceUrls[i], "i");
		if (regexp.test(decodeURIComponent(currentTab.url))) {
			appservice = decodeURIComponent(currentTab.url).match(regexp);
			appservice[1] = 'https://' + portalServer + appservice[1];
			break;
		}
	}
	if (appservice[5] !== undefined) {
		const regexpSlot = RegExp("^\\\/slots\\\/([^\\\/]*)", "i");
		if (regexpSlot.test(decodeURIComponent(appservice[5]))) {
			appservice[5] = appservice[4] + '/' + decodeURIComponent(appservice[5]).match(regexpSlot)[1];
		} else {
			appservice[5] = appservice[4];
		}
	} else {
		appservice[5] = appservice[4];
	}

	const port = chrome.runtime.connect({name: "my-background-port"});
	port.postMessage({name: "get-accesstoken"});
	port.onMessage.addListener(response => {
		authorizationToken = response.authorizationToken;

		ReactDOM.render(
			e(AzureKuduInstanceSelector, null, null),
			document.querySelector('body')
		)
	});
});

document.onclick = function(event) {
	const target = event.target;
	const cl = target.classList;
	if (cl.contains('gooverview')) {
		let slot = '';
		if (event.target.parentElement.parentElement.parentElement.parentElement.classList.contains('productionSlot') === false) {
			slot = '/slots/' + target.id.split('/')[1];
		}
		chrome.tabs.update(currentTab.id, {url: appservice[1] + slot});
		window.close();
	}
	if (cl.contains('slotVisible')) {
		const opTarget = target.parentElement.parentElement.parentElement;
		opTarget.querySelector('.instances').classList.toggle('isClose');
		opTarget.querySelector('.slotVisible').classList.toggle('isClose');
	}
}
