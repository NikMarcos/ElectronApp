const electron = require('electron');
const BrowserWindow = electron.remote.BrowserWindow
const {ipcRenderer} = electron;

let amountI;
function decimal(digit) {
  switch (digit) {
    case 8:
      amountI = 100000000;
      break;
    case 7:
      amountI = 10000000;
      break;
    case 6:
      amountI = 1000000;
      break;
    case 5:
      amountI = 100000;
      break;
    case 4:
      amountI = 10000;
      break;
    case 3:
      amountI = 1000;
      break;
    case 2:
      amountI = 100;
      break;
    case 1:
      amountI = 10;
      break;
    case 0:
      amountI = 1;
      break;
  }
return amountI;
}

const goalBalance = document.getElementById('goalBalance');
ipcRenderer.on('sendBalance:add', function (ev, balanceData) {
for (var key in balanceData) {
  let dec = decimal(balanceData[key][0]);
  let stringBal = `${balanceData[key][1]/dec} ${key}`
  const correctBal = document.createTextNode(stringBal);
  let div = document.createElement('div');
  if (balanceData[key][2] == 'spam') {
    div.style.cssText = 'background-color:#D3D3D3';
  }
  div.appendChild(correctBal);
  div.setAttribute('class', key);
  goalBalance.appendChild(div);
}

});

$(document).ready(function(){
ipcRenderer.send('balance:add', 'rawData');
$("#term").on("keyup", function() {
   var value = $(this).val().toLowerCase();
   $("#goalBalance *").filter(function() {
     $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
   });
 });
});
