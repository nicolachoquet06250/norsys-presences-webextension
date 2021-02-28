function connect() {
    browser.tabs.query({ active: true, currentWindow: true },
            tabs => {
                const port = browser.tabs.connect(tabs[0].id);

                document.querySelector('button[type="submit"]')
                    .addEventListener('click', e => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (document.querySelector('#password-1').value
                            === document.querySelector('#password-2').value) {
                            port.postMessage({
                                type: 'register',
                                firstname: document.querySelector('#firstname').value,
                                lastname: document.querySelector('#lastname').value,
                                password: document.querySelector('#password-1').value,
                                agency: document.querySelector('#agency').value
                            });
                        } else {
                            document.querySelector('.alerts .row').innerHTML = `
  				                <div class="col-12">
  				                    <div class="alert alert-danger" role="alert">
                                        Les 2 mots de passes ne sont pas identiques
                                    </div>
  				                </div>`;
                        }
                    });

                port.onMessage.addListener(json => {
                    if (json.type === 'register') {
                        if (json.error) {
                            document.querySelector('.alerts .row').innerHTML = `
                                <div class="col-12">
                                    <div class="alert alert-danger" role="alert">
                                        ` + json.response + `
                                    </div>
                                </div>`;
                        } else {
                            window.location.href = '/popup/index.html';
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

    document.querySelector('#alereay-account').addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/popup/index.html';
    });

    // execute the script now so it can listen to the messages sent by the code below
    browser.tabs.executeScript(null, { file: "/content_script/norsys_content.js" }).then(connect);
});
