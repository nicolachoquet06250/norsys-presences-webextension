const today = new Date();
const days = ['',
    'Lundi', 'Mardi', 'Mercredi', 'Jeudi',
    'Vendredi', 'Samedi', 'Dimanche'
];
const months = [
    'Janvier', 'Février', 'Mars', 'Avril',
    'Mai', 'Juin', 'Juillet', 'Août',
    'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const check_passwords_validity =
    () => document.querySelector('#password-1').value
        === document.querySelector('#password-2').value;

const table_line_template = line => `
    <tr>
        <td>${line.date}</td>
        <td>${line.uname}</td>
        <td>${line.arrival}</td>
        <td>${line.departure}</td>
    </tr>
`;

function write_table(json) {
    if (json.length !== 0) {
        let tbody = '';
        for (let line of json) {
            let date = new Date(line.arrival_date);
            let arrival = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
            let departure = line.departure_date !== null ?
                (parseInt((new Date(line.departure_date)).getHours()) < 10 ? '0' + (new Date(line.departure_date)).getHours() : (new Date(line.departure_date)).getHours()) + ':' + (parseInt((new Date(line.departure_date)).getMinutes()) < 10 ? '0' + (new Date(line.departure_date)).getMinutes() : (new Date(line.departure_date)).getMinutes()) : '';

            tbody += table_line_template({
                date: `${(date.getDate() < 10 ? '0' : '')}${date.getDate()}/${(date.getMonth() + 1 < 10 ? '0' : '')}${(date.getMonth() + 1)}/${date.getFullYear()}`,
                uname: `${line.lastname} ${line.firstname.substr(0, 1)}.`,
                arrival, departure
            });

            browser.storage.local.get(['user'])
                .then(r => r.user)
                .then(user => JSON.parse(user))
                .then(user => JSON.parse(user))
                .then(user =>
                    line.firstname === user.firstname
                    && line.lastname === user.lastname)
                .then(me => {
                    if (me) {
                        document.querySelector('#arrival').classList.add('btn-disabled');
                        document.querySelector('#arrival').setAttribute('disabled', 'disabled');


                        document.querySelector('#departure').classList.remove('btn-disabled');
                        document.querySelector('#departure').removeAttribute('disabled');

                        if (departure) {
                            document.querySelector('#departure').classList.add('btn-disabled');
                            document.querySelector('#departure').setAttribute('disabled', 'disabled');
                        }
                    }
                })
        }

        document.querySelector('tbody').innerHTML = tbody;
    }
}

function get_presences(json) {
    if (json.error && json.authent)
        window.location.href
            = '/popup/index.html?identError='
            + json.response;
    else write_table(JSON.parse(json.response));
}

function get_history(json, port) {
    document.querySelector('.norsys-dropdown .norsys-dropdown-content').innerHTML = '';

    for (let date of JSON.parse(json.response)) {
        let _date = new Date(date);
        _date = days[_date.getDay()] + ' ' + _date.getDate() + ' ' + months[_date.getMonth()] + ' ' + _date.getFullYear();

        let today = new Date();

        if (date === `${today.getFullYear()}-${(parseInt(today.getMonth() + 1) < 10 ? '0' : '')}${parseInt(today.getMonth() + 1)}-${(parseInt(today.getDate()) < 10 ? '0' : '')}${today.getDate()}`) {
            _date = 'Aujourd\'hui';
        }

        const li = document.createElement('li');
        if (_date === 'Aujourd\'hui') li.classList.add('active');

        const a = document.createElement('a');
        a.classList.add('dropdown-item');
        a.setAttribute('href', '#');
        a.setAttribute('data-date', date);
        a.innerHTML = _date;

        li.appendChild(a);

        document.querySelector('.norsys-dropdown .norsys-dropdown-content')
            .appendChild(li);
    }

    Array.from(document.querySelectorAll('a[data-date]'))
        .map(el => el.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();

            port.postMessage({
                type: 'search_history',
                date: el.getAttribute('data-date')
            });
        }));
}

function search_history(json) {
    write_table(JSON.parse(json.response));

    document.querySelector('.norsys-dropdown .norsys-dropdown-content li.active')
        .classList.remove('active');
    document.querySelector(`a[data-date="${json.date}"]`)
        .parentElement.classList.add('active');

    let current_date = new Date(json.date);

    document.querySelector('#today')
        .innerHTML = `${days[current_date.getDay()]} ${current_date.getDate()} ${months[current_date.getMonth()]} ${current_date.getFullYear()}`;
}

function change_password(json) {
    if (json.error) {
        document.querySelector('#password-2')
            .classList.remove('is-valid');
        document.querySelector('#password-2')
            .classList.add('is-invalid');

        document.querySelector('#password-1')
            .classList.remove('is-valid');
        document.querySelector('#password-1')
            .classList.add('is-invalid');


        document.querySelector('.modal-alerts').innerHTML = `
		    <div class="alert alert-danger" role="alert">
                ${json.response}
            </div>`;
    } else {
        document.querySelector('#password-2')
            .classList.remove('is-invalid');
        document.querySelector('#password-2')
            .classList.add('is-valid');

        let error_alert;
        if ((error_alert = document.querySelector('.modal-alerts .alert'))) {
            error_alert.remove();
        }

        browser.storage.local.remove(['user'])
            .then(() => window.location.href = '/popup/index.html?passwordUpdated');
    }
}

function export_pdf(json) {
    document.querySelector('.page-alerts').innerHTML = json.error ? `
        <div class="alert alert-danger" role="alert">${json.message}</div>`
        : `<div class="alert alert-success" role="alert">
                Un email vous à été envoyé avec l'export en pièce jointe
           </div>`;

    const timeout = setTimeout(() => {
        document.querySelector('.page-alerts .alert').remove();
        clearTimeout(timeout);
    }, 3000);
}

function connect() {
    browser.tabs.query({ active: true, currentWindow: true },
        tabs => {
            const port = browser.tabs.connect(tabs[0].id);

            port.postMessage({ type: 'get_history' })

            browser.storage.local.get(['user'])
                .then(r => r.user)
                .then(user => JSON.parse(user))
                .then(user => JSON.parse(user))
                .then(user => {
                    port.postMessage({
                        type: 'get_presences',
                        today: true,
                        token: user.token
                    });
                });

            document.querySelector('#arrival')
                .addEventListener('click', () => {
                    browser.storage.local.get(['user'])
                        .then(r => r.user)
                        .then(user => JSON.parse(user))
                        .then(user => JSON.parse(user))
                        .then(user => user.id)
                        .then(user_id => {
                            port.postMessage({
                                type: 'set_arrival',
                                user_id
                            })
                        });
                });

            document.querySelector('#departure')
                .addEventListener('click', () => {
                    browser.storage.local.get(['user'])
                        .then(r => r.user)
                        .then(user => JSON.parse(user))
                        .then(user => JSON.parse(user))
                        .then(user => user.id)
                        .then(user_id => {
                            port.postMessage({
                                type: 'set_departure',
                                user_id
                            });
                        });
                });

            Array.from(document.querySelectorAll('.toggle-password'))
                .map(el => el.addEventListener('click', e => {
                    e.preventDefault();
                    if (el.classList.contains('fa-eye')) {
                        el.classList.remove('fa-eye');
                        el.classList.add('fa-eye-slash');
                    } else {
                        el.classList.remove('fa-eye-slash');
                        el.classList.add('fa-eye');
                    }
                    el.previousElementSibling
                        .setAttribute('type',
                            (e.previousElementSibling.getAttribute('type') === 'password' ? 'text' : 'password'));
                }));

            document.querySelector('form')
                .addEventListener('submit', e => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (check_passwords_validity()) {
                        browser.storage.local.get(['user'])
                            .then(r => r.user)
                            .then(user => JSON.parse(user))
                            .then(user => JSON.parse(user))
                            .then(user => user.id)
                            .then(user_id => {
                                port.postMessage({
                                    type: 'change_password', user_id,
                                    password: document.querySelector('#password-1').value
                                })
                            })
                    } else {
                        document.querySelector('#password-2')
                            .classList.add('is-invalid');
                        document.querySelector('.modal-alerts')
                            .innerHTML = `
		                    <div class="alert alert-danger" role="alert">
                                Les 2 mots de passes ne sont pas identiques
                            </div>`;
                    }
                });

            document.querySelector('#pdf-export')
                .addEventListener('click', () =>  {
                    const date = document.querySelector('.norsys-dropdown ul li.active a') ? document.querySelector('.norsys-dropdown ul li.active a').getAttribute('data-date') : ((new Date()).getFullYear() + '-' + ((new Date()).getMonth() < 10 ? '0' : '') + (new Date()).getMonth() + '-' + ((new Date().getDate()) < 10 ? '0' : '') + (new Date()).getDate());

                    browser.storage.local.get(['user'])
                        .then(r => r.user)
                        .then(user => JSON.parse(user))
                        .then(user => JSON.parse(user))
                        .then(user => user.email)
                        .then(email => {
                            port.postMessage({ type: 'export_pdf', email, date })
                        });
                })

            port.onMessage.addListener(json => {
                if (json.type in this) {
                    this[json.type](json, port);
                }
            });
        });
}

window.addEventListener('load', () => {
    browser.storage.local.get(['user'])
        .then(r => {
            if ('user' in r) return r.user;
            throw new Error('/popup/index.html')
        })
        .then(user => JSON.parse(user))
        .then(user => JSON.parse(user))
        .then(user => {
            document.querySelector('#profile span').innerHTML = user.lastname + ' ' + user.firstname.substr(0, 1) + '.';
            document.querySelector('#profile span + strong').innerHTML = user.agency;
        })
        .catch(err => {
            if (err.message.substr(0, 1) === '/') {
                window.location.href = err.message;
            }
        });

    document.querySelector('#today')
        .innerHTML = `${days[today.getDay()]} ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

    document.querySelector('#logout')
        .addEventListener('click', () => {
            browser.storage.local.removeItem(['user']);
            window.location.href = '/popup/index.html';
        });

    document.querySelector('#profile')
        .addEventListener('click', e => {
            if (e.target.getAttribute('id') === 'logout'
                || e.target.tagName === 'I') {
                e.preventDefault();
            }
        });

    // execute the script now so it can listen to the messages sent by the code below
    browser.tabs.executeScript(null, { file: "/content_script/norsys_content.js" })
        .then(connect);
});
