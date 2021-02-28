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

function range(a, b) {
    return [...Array(b - a).keys()].map(i => i + a);
}

function request_calendar(json, port) {
    json = JSON.parse(json.response);

    const months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    browser.storage.local.get(['user'])
        .then(r => r.user)
        .then(user => JSON.parse(user))
        .then(user => JSON.parse(user))
        .then(user => {
            function build_day_modal(date, reservations, presences) {
                const modal = document.querySelector('#modal-calandar-day');
                const date_el = modal.querySelector('.day');
                const reservations_el = modal.querySelector('.reservations');
                const presences_el = modal.querySelector('.presences');

                date_el.innerHTML = days[date.getDay()] + ' ' + date.getDate() + ' ' + months[date.getMonth() + 1] + ' ' + date.getFullYear();
                reservations_el.innerHTML = reservations.length > 0
                    ? reservations.map(reservation => `<tr>
                        <td>${reservation.firstname}</td>
                        <td>${reservation.lastname}</td>
                        <td>
                            <a href="mailto:${reservation.email}">
                                ${reservation.email}
                            </a>
                        </td>
                    </tr>`).join('')
                        : `<tr>
                                <td colspan="3" style="text-align: center; font-weight: bold;">
                                    Aucune réservation ce jour
                                </td>
                            </tr>`;

                presences_el.innerHTML = presences.length > 0
                    ? presences.map(presence => `<tr>
                        <td>${presence.firstname}</td>
                        <td>${presence.lastname}</td>
                        <td>
                            <a href="mailto:${presence.email}">
                                ${presence.email}
                            </a>
                        </td>
                        <td>${presence.arrival}</td>
                        <td>${presence.departure ? presence.departure : ''}</td>
                    </tr>`).join('')
                    : `<tr>
                            <td colspan="5" style="text-align: center; font-weight: bold;">
                                Aucune personnes présentes ce jour
                            </td>
                        </tr>`;
            }

            function create_current_month_day(day, row) {
                let col = document.createElement('div');
                col.classList.add(`col-2`, 'calendar-day');
                const today = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();

                if (today === day.date) col.classList.add('today');
                if (day.day >= 6) {
                    col.classList.remove('col-2');
                    col.classList.add('weekend', 'col-1');
                } else {
                    col.addEventListener('click', e => {
                        if (e.target.tagName === 'DIV') {
                            build_day_modal(new Date(day.date), day.reservations, day.presences);

                            window.location.href = '#modal-calandar-day';
                        }
                    });
                }

                const badges_container = document.createElement('div');
                badges_container.classList.add('badges-container');

                if (day.reservations.length > 0) {
                    const badge = document.createElement('span');
                    badge.classList.add('nb-reservations');
                    badge.classList.add('badge', 'bg-secondary', 'text-light');
                    badge.innerHTML = day.reservations.length;
                    badges_container.appendChild(badge);
                }

                const day_badge = document.createElement('span');
                day_badge.classList.add('badge', 'rounded-pill', 'bg-info', 'text-dark');
                day_badge.innerHTML = day.date.split('-')[2];
                badges_container.appendChild(day_badge);

                col.appendChild(badges_container);

                const content = document.createElement('div');
                if (day.day < 6) {
                    const reservation_btn = document.createElement('button');
                    reservation_btn.setAttribute('type', 'button');
                    reservation_btn.classList.add('btn', 'btn-primary', 'btn-sm');

                    const iHaveReserved = day.reservations.reduce((reducer, curr) => {
                        if (curr.id_user === user.id) reducer = true;
                        return reducer;
                    }, false);

                    if (day.reservations.length === 5 && !iHaveReserved) {
                        reservation_btn.setAttribute('disabled', 'disabled');
                        reservation_btn.classList.add('btn-disabled');
                    }

                    reservation_btn.addEventListener('click', e => {
                        e.preventDefault();

                        port.postMessage({
                            type: `${iHaveReserved ? 'delete' : 'post'}_reservation`,
                            user_id: user.id,
                            date: day.date
                        });
                    });

                    const btn_content = document.createElement('span');
                    btn_content.classList.add('d-none', 'd-md-inline');
                    btn_content.innerHTML = iHaveReserved ? 'Annuler' : 'Réserver'

                    reservation_btn.appendChild(btn_content);

                    const btn_icon = document.createElement('i');
                    btn_icon.classList.add('fas', 'd-inline', 'd-md-none');
                    btn_icon.classList.add((iHaveReserved ? 'fa-user-minus' : 'fa-user-plus'));

                    reservation_btn.appendChild(btn_icon);
                    content.appendChild(reservation_btn);
                }
                col.appendChild(content);
                row.appendChild(col);
            }

            function create_external_month_day(json, last_day, date_day, additional_class, row) {
                let col = document.createElement('div');
                col.classList.add(`col-2`, 'calendar-day', additional_class);
                if (last_day >= 6) {
                    col.classList.remove('col-2');
                    col.classList.add('weekend', 'col-1');
                }

                const date = new Date();
                date.setYear(parseInt(json.month) === 12 ? parseInt(json.year) + 1 : json.year);
                date.setMonth(parseInt(json.month) === 12 ? 1 : json.month + 1);
                date.setDate(date_day);

                const badges_container = document.createElement('div');
                badges_container.classList.add('badges-container');

                const day_badge = document.createElement('span');
                day_badge.classList.add('badge', 'rounded-pill', 'bg-info', 'text-dark');
                day_badge.innerHTML = date.getDate();
                badges_container.appendChild(day_badge);

                col.appendChild(badges_container);

                const content = document.createElement('div');
                col.appendChild(content);

                row.appendChild(col);
            }

            document.querySelector('.calendar-header .date')
                .innerHTML = `<h2>${months[json.month]} ${json.year}</h2>`;

            const nb_days = json.nb_days.current;
            let previous_month_nb_days = json.nb_days.previous;

            let i = 0;
            const container = document.querySelector('.calendar-body');

            container.innerHTML = '';

            let array = json.month === 1 ? Object.keys(json.calendar) : Object.keys(json.calendar).map(n => parseInt(n)).sort((x, y) => x - y);

            for (let week_nb of array) {
                let week_nb_str = typeof week_nb === 'number' ? `${week_nb < 10 ? '0' : ''}${week_nb}` : week_nb;
                const week = json.calendar[week_nb_str];

                /** ********************************** **/
                /** ** FIRST WEEK OF MONTH *********** **/
                /** ********************************** **/
                if (i === 0) {
                    let row = document.createElement('div');
                    row.classList.add('row');

                    if (week.length < 7) {
                        let nb_days_to_first_day = 0;
                        for (let n = 0; n < week[0].day - 1; n++) nb_days_to_first_day++;
                        previous_month_nb_days -= nb_days_to_first_day;

                        for (let j in range(1, nb_days_to_first_day + 1)) {
                            create_external_month_day(json, j, previous_month_nb_days, 'previous-month-day', row);
                            previous_month_nb_days ++;
                        }
                    }

                    for (let day of week) create_current_month_day(day, row);

                    container.appendChild(row);
                }

                /** ********************************** **/
                /** ** MIDDLE WEEKS OF MONTH ********* **/
                /** ********************************** **/
                if (i > 0 && i < Object.keys(json.calendar).length - 1) {
                    let row = document.createElement('div');
                    row.classList.add('row');

                    for (let day of week) create_current_month_day(day, row);

                    container.appendChild(row);
                }

                /** ********************************** **/
                /** ** LAST WEEK OF MONTH ************ **/
                /** ********************************** **/
                if (i === Object.keys(json.calendar).length - 1) {
                    let row = document.createElement('div');
                    row.classList.add('row');

                    let start_second_loop = 1;
                    let last_day;

                    for (let day of week) {
                        create_current_month_day(day, row);

                        start_second_loop++;
                        last_day = day.day;
                    }

                    if (week.length < 7) {
                        let n = 1;

                        for (let _ in range(start_second_loop, 8)) {
                            create_external_month_day(json, last_day, n, 'next-month-day', row);
                            n++; last_day++;
                        }
                    }

                    container.appendChild(row);
                }

                i++;
            }
        })
}

function post_reservation(json, port) {
    if (!json.error) {
        port.postMessage({
            type: 'request_calendar',
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
        });
    }
}

function delete_reservation(json, port) {
    post_reservation(json, port)
}

function connect() {
    browser.tabs.query({ active: true, currentWindow: true },
        tabs => {
            const port = browser.tabs.connect(tabs[0].id);

            Array.from(document.querySelectorAll('.next-month'))
                .map(m => m.addEventListener('click', e => {
                    e.preventDefault();

                    window.currentDate = currentDate.getMonth() + 1 === 12
                        ? new Date(currentDate.getFullYear() + 1, 0)
                            : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);

                    port.postMessage({
                        type: 'request_calendar',
                        month: currentDate.getMonth() + 1,
                        year: currentDate.getFullYear()
                    });
                }));

            Array.from(document.querySelectorAll('.previous-month'))
                .map(m => m.addEventListener('click', e => {
                    e.preventDefault();

                    window.currentDate = currentDate.getMonth() + 1 === 1
                        ? new Date(currentDate.getFullYear() - 1, 11)
                            : new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);

                    port.postMessage({
                        type: 'request_calendar',
                        month: currentDate.getMonth() + 1,
                        year: currentDate.getFullYear()
                    });
                }));

            port.postMessage({
                type: 'request_calendar'
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

    window.currentDate = new Date();

    browser.tabs.executeScript(null, { file: "/content_script/norsys_content.js" })
        .then(connect);
});