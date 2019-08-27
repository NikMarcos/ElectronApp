const electron = require('electron');
const {ipcRenderer} = electron;
const remote = electron.remote;
const $ = require('jquery');

$('#search').click(function(e){
  e.preventDefault();
  let address = $('#address').val();
  if (address) {
    ipcRenderer.send('address:add', address);
    let window = remote.getCurrentWindow();
    window.close();
  }
});
