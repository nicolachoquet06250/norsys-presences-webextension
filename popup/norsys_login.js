function parseQueryParams() {
    const queryString = new URL(window.location.href).searchParams;
    let queryParams = {};

    if (queryString) {
        let queryArray = queryString.toString().split('&');
        let tmp = {};
        for (elem of queryArray) {
            if (elem.indexOf('=')) {
                tmp[elem.split('=')[0]] = (elem.split('=')[1] === '' ? true : elem.split('=')[1]);
            } else {
                tmp[elem] = true;
            }
        }
        queryParams = tmp;
    }

    return queryParams;
}

function connect() {
    browser.tabs.query({ active: true, currentWindow: true },
            tabs => {
                const port = browser.tabs.connect(tabs[0].id);

                document.querySelector('button[type="submit"]')
                    .addEventListener('click', e => {
                        e.preventDefault();
                        e.stopPropagation();

                        port.postMessage({
                            type: 'login',
                            email: document.querySelector('#email').value,
                            password: document.querySelector('#password').value
                        });
                    })

                port.onMessage.addListener(r => {
                    if (r.type === 'login') {
                        if (r.error) {
                            document.querySelector('.alerts .row').innerHTML = `
                                <div class="col-12">
                                      <div class="alert alert-danger" role="alert">
                                        ` + r.response + `
                                      </div>
                                </div>`;
                        } else {
                            browser.storage.local.set({
                                user: JSON.stringify(r.response)
                            }).then(() => window.location.href = '/popup/home.html');
                        }
                    }
                });
            });
}

window.addEventListener('load', () => {
    browser.storage.local.get(['user']).then(r => {
        if ('user' in r) {
            window.location.href = '/popup/home.html'
        }
    });

    const query = parseQueryParams();
    if (query.passwordUpdated) {
        document.querySelector('.alerts .row').innerHTML = `
		    <div class="col-12 mt-2">
		        <div class="alert alert-success" role="alert">
                    Votre mot de passe à été modifié avec succes
                </div>
		    </div>`;
    } else if (query.identError) {
        localStorage.removeItem('user');
        document.querySelector('.alerts .row').innerHTML = `
		    <div class="col-12 mt-2">
		        <div class="alert alert-danger" role="alert">
                    ` + (typeof query.identError === "string" ? (query.identError).replace(/\+/g, ' ') : 'Problème d\'identification') + `
                </div>
		    </div>`;
    }

    document.querySelector('#not-account')
        .addEventListener('click', e => {
            e.preventDefault();
            window.location.href = '/popup/register.html';
        });

    // execute the script now so it can listen to the messages sent by the code below
    browser.tabs.executeScript(null, { file: "/content_script/norsys_content.js" })
        .then(connect);
});
