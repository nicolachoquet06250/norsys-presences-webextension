base_api_url = 'https://norsys-sophia-presence.nicolaschoquet.fr/api';

/** ***************************************** **/
/** *********** SCRIPT PAGE LOGIN *********** **/
/** ***************************************** **/
function login(request, client) {
    const { type, email, password } = request;

    fetch(`${base_api_url}/user/login`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(r => r.json())
        .then(json => {
            const conf = json.error ? {
                type,
                error: true,
                response: json.message
            } : {
                type,
                response: JSON.stringify(json)
            };
            client.postMessage(conf);
        })
        .catch(err => {
            client.postMessage({
                type,
                error: true,
                response: err.message
            })
        });
}

/** ***************************************** **/
/** ********* SCRIPT PAGE REGISTER ********** **/
/** ***************************************** **/
function register(request, client) {
    const { type, firstname, lastname, password, agency } = request;

    fetch(`${base_api_url}/user/register`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstname, lastname, password, agency })
    })
        .then(r => r.json())
        .then(json => {
            const conf = json.error
                ? { type, error: true, response: JSON.stringify(json.message) }
                    : { type };

            client.postMessage(conf);
        });
}

/** ***************************************** **/
/** *********** SCRIPT PAGE HOME ************ **/
/** ***************************************** **/
function get_presences(request, client) {
    const { type } = request;
    fetch(`${base_api_url}/presences/today?token=${request.token}`)
        .then(r => r.json())
        .then(json => {
            const conf = json.error && json.authent ? {
                type, today: true,
                error: true,
                authent: true,
                response: json.message
            } : {
                type, today: true,
                response: JSON.stringify(json)
            };
            client.postMessage(conf);
        });
}

function search_history(request, client) {
    fetch(`${base_api_url}/search/history/${request.date}`)
        .then(r => {
            r.json().then(json => {
                client.postMessage({
                    type: 'search_history',
                    date: request.date,
                    response: JSON.stringify(json)
                })
            })
        });
}

function set_arrival(request, client) {
    const { user_id } = request;

    fetch(`${base_api_url}/presence`, {
        method: 'post',
        body: JSON.stringify({ type: 'arrival', user_id })
    }).then(r => r.json())
        .then(json => {
            if (json.error)
                client.postMessage({
                    type: 'get_presences',
                    error: true,
                    response: json.message
                });
            else get_presences(request, client);
        })
}

function set_departure(request, client) {
    const { user_id } = request;

    fetch(`${base_api_url}/presence`, {
        method: 'post',
        body: JSON.stringify({ type: 'departure', user_id })
    }).then(r => r.json())
        .then(json => {
            if (json.error)
                client.postMessage({
                    type: 'get_presences',
                    error: true,
                    response: json.message
                });
            else get_presences(request, client);
        });
}

function get_history(request, client) {
    fetch(`${base_api_url}/search/history`)
        .then(r => r.json())
        .then(json => {
            client.postMessage({
                type: 'get_history',
                response: JSON.stringify(json)
            })
        })
}

function change_password(request, client) {
    const { type, user_id, password } = request;

    fetch(`${base_api_url}/user/password`, {
        method: 'put',
        body: JSON.stringify({ user_id, password })
    }).then(r => {
        r.json().then(json => {
            const conf = json.error ? {
                type,
                error: true,
                response: json.message
            } : {
                type,
                response: JSON.stringify(json)
            };
            client.postMessage(conf);
        })
    })
}

function export_pdf(request, client) {
    const { type, date, email } = request;

    fetch(`${base_api_url}/export/${date}`, {
        method: 'post',
        body: JSON.stringify({ email })
    }).then(r => r.json())
        .then(json => {
            const conf = json.error ? {
                type,
                error: true,
                response: json.message
            } : { type };
            client.postMessage(conf);
        });
}

/** ***************************************** **/
/** ********* SCRIPT PAGE CALENDAR ********** **/
/** ***************************************** **/
function request_calendar(request, client) {
    let { type, year, month } = request;

    if (year === null || year === undefined)
        year = new Date().getFullYear();
    if (month === null || month === undefined)
        month = new Date().getMonth() + 1;

    fetch(`${base_api_url}/calendar/${year}/${month}`)
        .then(r => r.json())
        .then(json => {
            client.postMessage({
                type, response: JSON.stringify(json)
            })
        })
}

function post_reservation(request, client) {
    const { type, user_id, date } = request;

    fetch(`${base_api_url}/reservation`, {
        method: 'post',
        body: JSON.stringify({ user_id, date })
    }).then(r => r.json())
        .then(json => {
            const conf = json.error
                ? { type, error: true, response: json.message }
                    : { type };
            client.postMessage(conf);
        });
}

function delete_reservation(request, client) {
    const { type, user_id, date } = request;

    fetch(`${base_api_url}/reservation`, {
        method: 'delete',
        body: JSON.stringify({ user_id, date })
    }).then(r => r.json())
        .then(json => {
            const conf = json.error
                ? { type, error: true, response: json.message }
                    : { type };
            client.postMessage(conf);
        });
}

/** ***************************************** **/
/** ************** SCRIPT MAIN ************** **/
/** ***************************************** **/
browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((request) => {
        if ('type' in request && request.type in this) {
            this[request.type](request, port);
        }
    });
});