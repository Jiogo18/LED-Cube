import { ledcubeWS } from '../common/js/ws/main.js';



function updateStatus() {
	var cookie_state = document.getElementById("cookie_state");
	var cookie_button = document.getElementById("cookie_button");

	if (ledcubeWS.cookies.areAllowed()) {
		cookie_state.innerText = "Autorisés";
		cookie_button.innerText = "Refuser les cookies";
	}
	else {
		cookie_state.innerText = "Refusés";
		cookie_button.innerText = "Autoriser les cookies";
	}

	var cookies_list = document.getElementById("cookies_list");
	cookies_list.innerHTML = "";
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		const value = localStorage.getItem(key);
		const html_cookie_egal = `<span class="key">${key}</span> = <span class="value">${value}</span>`;

		switch (key) {
			case 'cookies':
				cookies_list.innerHTML += `<li>${html_cookie_egal} : Préférence sur les cookies (obligatoire)</li>`;
				break;
			case 'comeFromLogin':
				cookies_list.innerHTML += `<li>${html_cookie_egal} : Variable temporaire de la page login</li>`;
				break;
			case 'cc':
			case 'ck':
			case 'sid':
				cookies_list.innerHTML += `<li><span class="key">${key}</span> : Relatif à l'authentification</li>`;
				break;
			default:
				if (key.startsWith('animation_')) {
					cookies_list.innerHTML += `<li><span class="key">${key}</span> : Animation temporaire</li>`;
				}
				else {
					cookies_list.innerHTML += `<li><span class="key">${key}</span> : Inconnu</li>`;
				}
				break;
		}
	}
}

function toggleCookies() {
	if (ledcubeWS.cookies.areAllowed()) {
		ledcubeWS.cookies.deny();
	}
	else {
		ledcubeWS.cookies.allow();
	}
	updateStatus();
}

function removeAll() {
	ledcubeWS.cookies.removeAll();
	updateStatus();
}

function removeNonUseful() {
	ledcubeWS.cookies.removeNonUseful();
	updateStatus();
}

window.addEventListener('load', () => {
	updateStatus();
});

export default {
	ledcubeWS,
	updateStatus,
	toggleCookies,
	removeAll,
	removeNonUseful,
};