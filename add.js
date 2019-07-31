const electron = require('electron');
const {ipcRenderer} = electron;
const remote = electron.remote;

const form = document.querySelector('form');
form.addEventListener('submit', submitForm);

function submitForm (e) {
  e.preventDefault();
  const address = document.querySelector('#address').value;
  if (address) {
    ipcRenderer.send('address:add', address);
    let window = remote.getCurrentWindow();
    window.close();
  }
}
