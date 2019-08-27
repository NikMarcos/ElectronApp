function type2Sender (obj, amount) {
  let htmlDiv = ``;
  htmlDiv += `<div class="send bal ${obj['timestamp']}"
  id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}waves${new Date(obj['timestamp']).toLocaleDateString()}">
  <strong>Вывод </strong>
  ${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves
  <strong> на адрес </strong>${obj['recipient']}<br>
  <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
  <div class="linkId"><strong> Id: </strong>
  <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
  </div>`;
  return htmlDiv;
}

function type2Recipient (obj, amount) {
  let htmlDiv = ``;
  htmlDiv += `<div class="deposit bal ${obj['timestamp']}"
  id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}waves${new Date(obj['timestamp']).toLocaleDateString()}">
  <strong>Ввод </strong>
  ${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves
  <strong> c адреса </strong>${obj['sender']}<br>
  <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
  <div class="linkId"><strong> Id: </strong>
  <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
  </div>`;
  return htmlDiv;
}

module.exports = {type2Sender, type2Recipient};
