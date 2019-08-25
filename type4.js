function sender (obj, listAssets) {
    let htmlDiv = ``;
    let amm = listAssets[obj['assetId']];
    let amOfAsset = decimal(amm[1]);
    if (listAssets[obj['assetId']][2] == "spam") {
      htmlDiv += `<div class="send bal ${obj['timestamp']} spam"
      id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
    } else {
      htmlDiv += `<div class="send bal ${obj['timestamp']}"
      id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
    }
    htmlDiv += `<strong>Вывод </strong>${(obj['amount']/amOfAsset).toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}
    <strong> на адрес </strong>${obj['recipient']}<br>
    <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
    <div class="linkId"><strong> Id: </strong>
    <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
    </div>`;
    console.log(htmlDiv);
    return htmlDiv;
}

function recipient (obj, listAssets) {
    let htmlDiv = ``;
    let amm = listAssets[obj['assetId']];
    let amOfAsset = decimal(amm[1]);

    if (listAssets[obj['assetId']][2] == "spam") {
      htmlDiv += `<div class="deposit bal ${obj['timestamp']} spam"
      id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
    } else {
      htmlDiv += `<div class="deposit bal ${obj['timestamp']}"
      id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
    }
    htmlDiv += `<strong>Ввод </strong>
    ${(obj['amount']/amOfAsset).toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}
    <strong> с адреса </strong>${obj['sender']}<br>
    <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
    <div class="linkId"><strong> Id: </strong>
    <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
    </div>`;
    return htmlDiv;
}

module.exports = {sender, recipient};
