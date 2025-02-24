import { ledcubeWS } from '../common/js/ws/main.js';

var input = document.querySelector('.pswrd');
var show = document.querySelector('.show');
show.addEventListener('click', showPassword);
function showPassword() {
	if (input.type === "password") {
		input.type = "text";
		show.style.color = "#1DA1F2";
		show.textContent = "HIDE";
	} else {
		input.type = "password";
		show.textContent = "SHOW";
		show.style.color = "#111";
	}
}

document.querySelector('#username').addEventListener('keydown', inputKeyDown);
document.querySelector('.pswrd')?.addEventListener('keydown', inputKeyDown);

ledcubeWS.addEventListener(ledcubeWS.EVENTS.LOGGED, event => onLogged(event));
ledcubeWS.addEventListener(ledcubeWS.EVENTS.LOGIN_REJECTED, event => {
	console.log('login rejected', event);
	switch (event.reason) {
		case 'wrong_password':
			onWrongPassword();
			break;
		case 'cancel':
		default:
			onAuthCancel();
			break;
	}
});

function inputKeyDown(e) {
	if (e.keyCode === 13) {
		e.preventDefault();
		document.querySelector('#login').click();
	}
}

/**
 * @param {Function} callback
 */
function askCookies(callback) {
	let loginForm = document.querySelector('#loginForm');

	// Remove inputs by translating them out of the screen
	/** @type {HTMLDivElement[]} */
	let loginInputs = loginForm.querySelectorAll('.input-field');
	loginInputs[0].style.transform = 'translateX(-200%)';
	loginInputs[1].style.transform = 'translateX(200%)';

	// Reduce the size of the login button and remove the text
	/** @type {HTMLDivElement} */
	let loginButtonDiv = loginForm.querySelector('#button-login');
	let loginButton = loginButtonDiv.querySelector('button');

	// Add the deny button
	let buttonDeny = document.createElement('button');
	buttonDeny.innerText = 'Refuser';
	buttonDeny.classList.add('cookies-deny');
	buttonDeny.type = 'button';
	buttonDeny.style.width = '0%';
	buttonDeny.style.opacity = 0;
	loginButtonDiv.appendChild(buttonDeny);
	// Grow
	setTimeout(() => buttonDeny.style.removeProperty('width'), 1);

	function removeButtons() {
		buttonDeny.disabled = true;
		loginButton.disabled = true;
	}

	loginButton.onclick = event => {
		removeButtons();
		event.stopImmediatePropagation();
		ledcubeWS.cookies.allow();
		callback();
	}
	buttonDeny.onclick = event => {
		removeButtons();
		event.stopImmediatePropagation();
		ledcubeWS.cookies.deny();
		callback();
	}
	loginButton.style.opacity = 0;
	loginButton.classList.add('cookies-allow');
	setTimeout(() => {
		loginButton.textContent = 'Autoriser';
		loginButton.style.removeProperty('opacity');
		buttonDeny.style.removeProperty('opacity');
	}, 500);

	let divMessage = document.createElement('div');
	let p1 = document.createElement('p');
	p1.innerText = 'Les cookies sont nécessaires pour se connecter';
	let p2 = document.createElement('p');
	p2.innerText = 'Voulez-vous autoriser les cookies ?';
	let a = document.createElement('a');
	a.innerText = "Plus d'informations";
	a.href = webFolder + 'cookie';
	divMessage.appendChild(p1);
	divMessage.appendChild(p2);
	divMessage.appendChild(a);
	divMessage.id = 'cookies-message';

	loginForm.insertBefore(divMessage, loginInputs[0]);
}

function hideAskCookies() {
	let loginForm = document.querySelector('#loginForm');

	// Show inputs by removing the translation
	/** @type {HTMLDivElement[]} */
	let loginInputs = loginForm.querySelectorAll('.input-field');
	loginInputs[0].style.transform = 'translateX(0%)';
	loginInputs[1].style.transform = 'translateX(0%)';

	// Reset the login button
	/** @type {HTMLDivElement} */
	let loginButtonDiv = loginForm.querySelector('#button-login');
	let loginButton = loginButtonDiv.querySelector('button.cookies-allow');
	let buttonDeny = document.querySelector('button.cookies-deny');

	// Hide the buttons
	loginButton.style.opacity = 0;
	buttonDeny.style.opacity = 0;
	loginButton.classList.remove('cookies-allow');
	setTimeout(() => {
		loginButton.textContent = 'Se connecter';
		loginButton.style.removeProperty('opacity');
		buttonDeny.remove();
		loginButton.disabled = false;
		loginButton.onclick = () => { };
	}, 500);


	// Remove the message
	let divMessage = document.querySelector('#cookies-message');
	divMessage.remove();
}

function loginLedCube() {
	if (!ledcubeWS.cookies.areAllowed()) {
		askCookies(() => {
			if (!ledcubeWS.cookies.areAllowed()) {
				alert('Les cookies sont nécessaires pour se connecter, redirection à la page d\'accueil');
				window.location.href = webFolder;
			}
			else {
				loginLedCube();
			}
		});
		return;
	}
	const clientChallenge = dcodeIO.bcrypt.genSaltSync();
	const username = document.querySelector('#username').value;
	const password = document.querySelector('#pswrd').value;
	const cookieKey = dcodeIO.bcrypt.hashSync(password, clientChallenge);

	ledcubeWS.cookies.setItem('ck', cookieKey);
	ledcubeWS.cookies.setItem('cc', clientChallenge);
	ledcubeWS.cookies.setItem('sid', '');
	console.log('connecting...', { clientChallenge, cookieKey });
	ledcubeWS.connect();
}

/**
 * @param {HTMLElement} element
 */
function shakeLogin(element) {
	if (document.querySelector('#cookies-message'))
		hideAskCookies();
	element.setAttribute('shake', 'true');
	setTimeout(() => {
		element.removeAttribute('shake');
	}, 1000);
}

function onWrongPassword() {
	// shake the password input
	const field = document.querySelector('#field-password');
	shakeLogin(field);
}

function onAuthCancel() {
	// shake the button
	const button = document.querySelector('#button-login');
	shakeLogin(button);
}

function onLogged() {
	const form = document.querySelector('#loginForm');
	form.style.display = 'none';
	const loggedAnimation = document.querySelector('#loggedAnimation');
	loggedAnimation.style.display = '';

	// redirect
	setTimeout(() => {
		if (!ledcubeWS.cookies.areAllowed()) {
			window.location.href = webFolder;
			return;
		}
		ledcubeWS.cookies.setItem('comeFromLogin', '1');
		window.history.back();
		setTimeout(() => {
			window.location.href = webFolder;
		}, 1000);
	}, 500);
}

export default {
	ledcubeWS,
	showPassword,
	inputKeyDown,
	loginLedCube,
	onWrongPassword,
	onAuthCancel,
	onLogged,
	askCookies,
};