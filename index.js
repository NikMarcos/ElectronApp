const electron = require('electron');
const $ = require('jquery');
const path = require('path');
const BrowserWindow = electron.remote.BrowserWindow
const {ipcRenderer} = electron;
const shell = require('electron').shell;
const request = require('request-promise');
const fs = require('fs');
const os = require('os');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


$('#addAddress').click(function() {
  let win = new BrowserWindow ({alwaysOnTop: true, width: 450, height: 200, backgroundColor: '#b7d6ec'});
  win.on('close', function() {win = null})
  win.loadFile('add.html')
  win.show()
});

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
};
const address = $('#address');
const buttons = $('#buttons');
const elm = $('#goal');
const searchField = $('#search');
let unique;
let rawData;
let idClick;
let listAssets = {};


ipcRenderer.on('link:add', function (e, data) {
    elm.empty();
    buttons.empty();
    address.empty();
    searchField.empty();
    let searchWord = $('<div/>', {
      text: "Ищу...",
      class: 'searchWord',
      css: {
        textAlign: 'center'
      }
    }).appendTo('#goal');
});

ipcRenderer.on('add:add', function (e, data) {
  rawData = data;
  let assetIdArray = [];
  for (let i = 1; i < data.length; i++) {
    let nextObj = data[i];
    let partofApi;
    let partOfApi2;
    if (nextObj['type'] == 7) {
      if (listAssets[nextObj['order1']['assetPair']['amountAsset']] == undefined) {
        partofApi = `ids=${nextObj['order1']['assetPair']['amountAsset']}&`;
        assetIdArray.push(partofApi);
      }
      if (listAssets[nextObj['order1']['assetPair']['priceAsset']] == undefined) {
        partOfApi2 = `ids=${nextObj['order1']['assetPair']['priceAsset']}&`;
        assetIdArray.push(partOfApi2);
      }
    } else if (nextObj['type'] == 4) {
      partofApi = `ids=${nextObj['assetId']}&`;
      assetIdArray.push(partofApi);
    } else if (nextObj['type'] == 11) {
      partofApi = `ids=${nextObj['assetId']}&`;
      assetIdArray.push(partofApi);
    } else if (nextObj['type'] == 3) {
      partofApi = `ids=${nextObj['assetId']}&`;
      assetIdArray.push(partofApi);
    }
   }
   unique = [...new Set(assetIdArray)];
   let arr = unique.filter(function(item) {
     return item != 'ids=null&'
   });
   ipcRenderer.send('ids:add', arr);
});

let commonAssetsList;
let csvAll = [];
let csvDeposit = [];
let csvWithdrawal = [];
let csvAssets = [];
let csvEx = [];

ipcRenderer.on('idsandprecision:add', function (e, listAssets) {
  elm.empty();
  let type;
  let type2;
  let status;
  let amountAsset;
  let priceAsset;
  let cancelLeasingId;
  let assetId;
  let htmlDiv = ``;
  for (let i = 1; i < rawData.length; i++) {
    let csvTemp = {};
    let divStyle = {borderBottom:'1px solid black', padding: '3px'};
    let div = $('<div>');
    // const divBal = document.createElement('div');
    // divBal.setAttribute('id', 'oldBal');
    // divBal.style.cssText = 'border-bottom:1px solid black;background-color:#8FB4F5;transform:rotate(90deg);float:right;';
    // divBal.innerHTML = "Баланс";
    // $("divBal").css('transform', 'rotate(90deg)');
    // let strong = document.createElement("STRONG");
    let strong = $('<STRONG>', {
       class: '',
       id: ''
     });
    // let strongSec = document.createElement("STRONG");
    let strongSec = $('<STRONG>', {
       class: '',
       id: ''
     });
    // let strongDate = document.createElement("STRONG");
    let strongDate = $('<STRONG>');
    let textCorrectName;
    let obj = rawData[i];
    if (obj['type'] == 7) {
      let decAmount;
      let decPrice;
      let amount;
      let price;
      let spend;
      let residual;
      amountAsset = listAssets[obj['order1']['assetPair']['amountAsset']][0];
      priceAsset = listAssets[obj['order1']['assetPair']['priceAsset']][0];
      residual = listAssets[obj['order1']['assetPair']['amountAsset']][1] - listAssets[obj['order1']['assetPair']['priceAsset']][1];
      if (listAssets[obj['order1']['assetPair']['amountAsset']][2] == "spam" || listAssets[obj['order1']['assetPair']['priceAsset']][2] == "spam") {
        divStyle['backgroundColor'] = '#D3D3D3';
      }
      if (residual >= 0) {
         decAmount = decimal(listAssets[obj['order1']['assetPair']['amountAsset']][1]);
         decPrice = decimal(listAssets[obj['order1']['assetPair']['priceAsset']][1]);
         amount = obj['amount']/decAmount;
         price = obj['price']/decPrice;
         spend = amount*price;
      } else {
        let newResidual = listAssets[obj['order1']['assetPair']['priceAsset']][1] - listAssets[obj['order1']['assetPair']['amountAsset']][1];
        decAmount = decimal(listAssets[obj['order1']['assetPair']['amountAsset']][1]);
        decPrice = decimal(newResidual);
        amount = obj['amount']/decAmount;
        let tempDelim = obj['price']/100000000;
        price = tempDelim/decPrice;
        spend = amount*price;
      }
      div.attr('class', `7 bal ${obj['timestamp']}`);
      div.attr('id', `${amountAsset.toLowerCase()}${priceAsset.toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
      if (obj['order1']['sender'] == rawData[0]) {
        if (obj['order1']['orderType'] == 'buy') {
          textCorrectName = 'Обмен: Купил ';
          const correctName = $(document.createTextNode(textCorrectName));
          strong.append(correctName);
          const correctSec = $(document.createTextNode(' за '));
          strongSec.append(correctSec);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          type2 = `${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}`;

          htmlDiv += `<div class="7 bal ${obj['timestamp']}"
          id="${amountAsset.toLowerCase()}${priceAsset.toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">
          <strong>Обмен: Купил </strong>${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}
          <strong> за </strong>
          ${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        } else {
          textCorrectName = 'Обмен: Продал ';
          const correctName = $(document.createTextNode(textCorrectName));
          strong.append(correctName);
          const correctSec = $(document.createTextNode(' за '));
          strongSec.append(correctSec);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          type2 = `${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}`;

          htmlDiv += `<div class="7 bal ${obj['timestamp']}"
          id="${amountAsset.toLowerCase()}${priceAsset.toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">
          <strong>Обмен: Продал </strong>${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}
          <strong> за </strong>
          ${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        }
      } else {
        if (obj['order2']['orderType'] == 'buy') {
          textCorrectName = 'Обмен: Купил ';
          const correctName = $(document.createTextNode(textCorrectName));
          strong.append(correctName);
          const correctSec = $(document.createTextNode(' за '));
          strongSec.append(correctSec);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          type2 = `${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}`;

          htmlDiv += `<div class="7 bal ${obj['timestamp']}"
          id="${amountAsset.toLowerCase()}${priceAsset.toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">
          <strong>Обмен: Купил </strong>${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}
          <strong> за </strong>
          ${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        } else {
          textCorrectName = 'Обмен: Продал ';
          const correctName = $(document.createTextNode(textCorrectName));
          strong.append(correctName);
          const correctSec = $(document.createTextNode(' за '));
          strongSec.append(correctSec);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          type2 = `${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}`;

          htmlDiv += `<div class="7 bal ${obj['timestamp']}"
          id="${amountAsset.toLowerCase()}${priceAsset.toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">
          <strong>Обмен: Продал </strong>${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}
          <strong> за </strong>
          ${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        }
      }
    } else if (obj['type'] == 4) {
      if (listAssets[obj['assetId']][2] == "spam") {
        divStyle['backgroundColor'] = '#D3D3D3';
      }
      let amm = listAssets[obj['assetId']];
      let amOfAsset = decimal(amm[1]);
      div.attr('id', `${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
      if (obj['sender'] == rawData[0]) {
        textCorrectName = 'Вывод: ';
        const correctName = $(document.createTextNode(textCorrectName));
        strong.append(correctName);
        const correctSec = $(document.createTextNode(' на адрес '));
        strongSec.append(correctSec);
        div.attr('class', `send bal ${obj['timestamp']}`);
        type = `${(obj['amount']/amOfAsset).toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
        type2 = `${obj['recipient']}`;
        if (listAssets[obj['assetId']][2] == "spam") {
          htmlDiv += `<div class="send bal ${obj['timestamp']} spam"
          id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
        } else {
          htmlDiv += `<div class="send bal ${obj['timestamp']}"
          id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
        }
        htmlDiv += `<strong>Вывод </strong>${(obj['amount']/amOfAsset).toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}
        <strong> на адрес </strong>
        ${obj['recipient']}
        <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}
        <div class="linkId"><strong> Id: </strong>
        <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
        </div>`;
        csvTemp['type'] = textCorrectName;
        csvTemp['data'] = type;
        csvAll.push(csvTemp);
        csvWithdrawal.push(csvTemp);
      } else {
        textCorrectName = 'Ввод: ';
        const correctName = $(document.createTextNode(textCorrectName));
        strong.append(correctName);
        const correctSec = $(document.createTextNode(' с адреса '));
        strongSec.append(correctSec);
        div.attr('class', `deposit bal ${obj['timestamp']}`);
        type = `${(obj['amount']/amOfAsset).toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
        type2 = `${obj['sender']}`;
        if (listAssets[obj['assetId']][2] == "spam") {
          htmlDiv += `<div class="deposit bal ${obj['timestamp']} spam"
          id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
        } else {
          htmlDiv += `<div class="deposit bal ${obj['timestamp']}"
          id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
        }
        htmlDiv += `<strong>Ввод </strong>
        ${(obj['amount']/amOfAsset).toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}
        <strong> с адреса </strong>
        ${obj['sender']}
        <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}
        <div class="linkId"><strong> Id: </strong>
        <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
        </div>`;
        csvTemp['type'] = textCorrectName;
        csvTemp['data'] = type;
        csvAll.push(csvTemp);
        csvDeposit.push(csvTemp);
      }
    } else if (obj['type'] == 2) {
        let amOfAsset = 100000000;
        let amount = obj['amount']/amOfAsset;
        div.attr('id', `${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}waves${new Date(obj['timestamp']).toLocaleDateString()}`);
        if (obj['sender'] == rawData[0]) {
          textCorrectName = 'Вывод: ';
          const correctName = $(document.createTextNode(textCorrectName));
          strong.append(correctName);
          const correctSec = $(document.createTextNode(' на адрес '));
          strongSec.append(correctSec);
          div.attr('class', `send bal ${obj['timestamp']}`);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves`;
          type2 = `${obj['recipient']}`;

          htmlDiv += `<div class="send bal ${obj['timestamp']}"
          id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}waves${new Date(obj['timestamp']).toLocaleDateString()}">
          <strong>Вывод </strong>
          ${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves
          <strong> на адрес </strong>
          ${obj['recipient']}
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;

          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvWithdrawal.push(csvTemp);
        } else {
          textCorrectName = 'Ввод: ';
          const correctName = $(document.createTextNode(textCorrectName));
          strong.append(correctName);
          const correctSec = $(document.createTextNode(' с адреса '));
          strongSec.append(correctSec);
          div.attr('class', `deposit bal ${obj['timestamp']}`);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves`;
          type2 = `${obj['sender']}`;

          htmlDiv += `<div class="deposit bal ${obj['timestamp']}"
          id="${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}waves${new Date(obj['timestamp']).toLocaleDateString()}">
          <strong>Вывод </strong>
          ${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves
          <strong> с адреса </strong>
          ${obj['sender']}
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;

          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvDeposit.push(csvTemp);
        }
    } else if (obj['type'] == 11) {
      if (listAssets[obj['assetId']][2] == "spam") {
        divStyle['backgroundColor'] = '#D3D3D3';
      }
        let amm = listAssets[obj['assetId']];
        let amOfAsset = decimal(amm[1]);
        div.attr('id', `${obj['sender'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
        if (obj['sender'] == rawData[0]) {
          textCorrectName = 'Массовая транзакция: Вывод ';
          const correctName = $(document.createTextNode(textCorrectName));
          strong.append(correctName);
          let allAmount = obj['totalAmount']/amOfAsset;
          type = `${allAmount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
          div.attr('class', `massSend bal ${obj['timestamp']}`);

          if (listAssets[obj['assetId']][2] == "spam") {
            htmlDiv += `<div class="massReceiv bal ${obj['timestamp']} spam"
            id="${obj['sender'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
          } else {
            htmlDiv += `<div class="massReceiv bal ${obj['timestamp']}"
            id="${obj['sender'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
          }
          htmlDiv += `<strong>Массовая транзакция: Вывод </strong>
          ${allAmount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;

          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvWithdrawal.push(csvTemp);
        } else {
          textCorrectName = 'Массовая транзакция: Ввод ';
          const correctName = $(document.createTextNode(textCorrectName));
          strong.append(correctName);
          const correctSec = $(document.createTextNode(' с адреса '));
          strongSec.append(correctSec);
          let allAmount = obj['transfers'][0]['amount']/amOfAsset;
          div.attr('class', `massReceiv bal ${obj['timestamp']}`);
          type = `${allAmount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]} `;
          type2 = `${obj['sender']}`;

          if (listAssets[obj['assetId']][2] == "spam") {
            htmlDiv += `<div class="massReceiv bal ${obj['timestamp']} spam"
            id="${obj['sender'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
          } else {
            htmlDiv += `<div class="massReceiv bal ${obj['timestamp']}"
            id="${obj['sender'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
          }
          htmlDiv += `<strong>Массовая транзакция: Ввод </strong>
          ${allAmount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}
          <strong> с адреса </strong>
          ${obj['sender']}
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;

          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvDeposit.push(csvTemp);
        }
    } else if (obj['type'] == 8) {
      div.attr('class', `8 bal ${obj['timestamp']}`);
      div.attr('id', `waves${new Date(obj['timestamp']).toLocaleDateString()}`);
      if (obj['status'] == 'canceled') {
        status = " (отменен)"
      } else {
        status = " (не отменен)"
      }
      textCorrectName = 'Лизинг: ';
      const correctName = $(document.createTextNode(textCorrectName));
      strong.append(correctName);
      type = `${(obj['amount']/100000000).toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves`;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 9) {
      div.attr('class', `9 bal ${obj['timestamp']}`);
      div.attr('id', `waves${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `${obj['leaseId']}`;
      textCorrectName = 'Отмена лизинга с ID: ';
      const correctName = $(document.createTextNode(textCorrectName));
      strong.append(correctName);
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 3) {
      if (listAssets[obj['assetId']][2] == "spam") {
        divStyle['backgroundColor'] = '#D3D3D3';
      }
      let amOfAsset = decimal(listAssets[obj['assetId']][1]);
      let amount = obj['quantity']/amOfAsset;
      div.attr('class', `3 bal ${obj['timestamp']}`);
      div.attr('id', `${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
      if (obj['script'] == null) {
        textCorrectName = 'Создание ассета: ';
        const correctName = $(document.createTextNode(textCorrectName));
        strong.append(correctName);
        type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
        csvTemp['type'] = textCorrectName;
        csvTemp['data'] = type;
        csvAll.push(csvTemp);
      } else {
        textCorrectName = 'Создание ассета: ';
        const correctName = $(document.createTextNode(textCorrectName));
        strong.append(correctName);
        type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]} (смарт-ассет)`;
        csvTemp['type'] = textCorrectName;
        csvTemp['data'] = type;
        csvAll.push(csvTemp);
      }
    } else if (obj['type'] == 6) {
      if (listAssets[obj['assetId']][2] == "spam") {
        divStyle['backgroundColor'] = '#D3D3D3';
      }
      let amOfAsset = decimal(listAssets[obj['assetId']][1]);
      let amount = obj['amount']/amOfAsset;
      textCorrectName = 'Сжигание ассета: ';
      const correctName = document.createTextNode(textCorrectName);
      strong.append(correctName);
      div.attr('class', `6 bal ${obj['timestamp']}`);
      div.attr('id', `${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 5) {
      if (listAssets[obj['assetId']][2] == "spam") {
        divStyle['backgroundColor'] = '#D3D3D3';
      }
      let amOfAsset = decimal(listAssets[obj['assetId']][1]);
      let amount = obj['quantity']/amOfAsset;
      textCorrectName = 'Довыпуск ассета: ';
      const correctName = $(document.createTextNode(textCorrectName));
      strong.append(correctName);
      div.attr('class', `5 bal ${obj['timestamp']}`);
      div.attr('id', `${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 12) {
      textCorrectName = "";
      div.attr('class', `12 bal ${obj['timestamp']}`);
      div.attr('id', `${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `Дата-транзакция `;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 10) {
      textCorrectName = 'Создание алиаса: ';
      const correctName = $(document.createTextNode(textCorrectName));
      strong.append(correctName);
      div.attr('class', `10 bal ${obj['timestamp']}`);
      div.attr('id', `${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `${obj['alias']}`;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 13) {
      textCorrectName = "";
      div.attr('class', `13 bal ${obj['timestamp']}`);
      div.attr('id', `${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `Скрипт-транзакция`;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 16) {
      textCorrectName = "";
      div.attr('class', `16 bal ${obj['timestamp']}`);
      div.attr('id', `${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `Вызов скрипта `;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else {
      textCorrectName = "";
      type = `Type: ${obj['type']}, `
      div.attr('class', `else bal ${obj['timestamp']}`);
      div.attr('id', `${new Date(obj['timestamp']).toLocaleDateString()}`);
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    }


     let id = `${obj['id']}`;
     let textId = 'Id: ';
     let dateStr = `${new Date(obj['timestamp']).toLocaleString()}`;
     const correctDate = $(document.createTextNode(` Дата: `));
     strongDate.append(correctDate);
     div.css(divStyle);
     // const div2 = document.createElement('div');
     let div2 = $('<div>', {
        class: 'linkId'
      });
     // const a = document.createElement('a');
     let a = $('<a>');
     a.css({textDecoration:'none'});
     a.attr('href', `https://wavesexplorer.com/tx/${obj['id']}`);

     // a.setAttribute('target', '_blank');
     const correctType = $(document.createTextNode(type));
     const correctDateStr = $(document.createTextNode(dateStr));
     const correctId = $(document.createTextNode(id));
     const correctTextId = $(document.createTextNode(textId));
     a.append(correctId);
     div2.append(correctTextId);
     div2.append(a);
     if (obj['type'] == 8) {
       const correctStatus = $(document.createTextNode(status));
       div2.append(correctStatus);
     };

     div.append(strong);
     div.append(correctType);
     if (obj['type'] == 7 || obj['type'] == 4 || obj['type'] == 2 || obj['type'] == 11) {
       div.append(strongSec);
       div.append($(document.createTextNode(type2)));
     }
     div.append(strongDate);
     div.append(correctDateStr);
     div.append(div2);
     if (cancelLeasingId && obj['type'] == 9) {
       const correctCancelLeasingId = $(document.createTextNode(cancelLeasingId));
       div.append(correctCancelLeasingId);
     };
      // div.appendChild(divBal);
      elm.removeAttr("style");
      elm.append(div);
      type2 = '';
   };
   elm.append(htmlDiv);

   address.css({'text-align': 'center'});
   const correctAddress = $(document.createTextNode(rawData[0]));
   let strongAddress = $('<STRONG>');
   strongAddress.append(correctAddress);
   $(address).append(strongAddress);

   let classMassReceiv = $('.massReceiv');
   let classDep = $('.deposit');

   if (classDep.length || classMassReceiv.length) {
     let csvEx = $('<button>', {
        text: `Экспорт обменов`,
        class: 'extractMe',
        id: 'csvEx'
      });
      $('#buttons').append(csvEx);
   }

   if (classDep.length || classMassReceiv.length) {
     let first = $('#buttons').find('button').first();
     let csvWithdrawal = $('<button>', {
       text: `Экспорт выводов`,
       class: 'extractMe',
       id: 'csvWithdrawal'
    });
    $(csvWithdrawal).insertBefore(first);
   }

   if (classDep.length || classMassReceiv.length) {
     let first = $('#buttons').find('button').first();
     let csvDeposit = $('<button>', {
        text: `Экспорт вводов`,
        class: 'extractMe',
        id: 'csvDeposit'
      });
      $(csvDeposit).insertBefore(first);
   }
   //
   if (classDep.length || classMassReceiv.length) {
     let first = $('#buttons').find('button').first();
     let csvAll = $('<button>', {
        text: `Экспорт всех транзакций`,
        class: 'extractMe',
        id: 'csvAll'
      });
      $(csvAll).insertBefore(first);
   }

   let classElse = $('.else');
   if (classElse.length) {
     let first = $('#buttons').find('button').first();
     let btnElse = $('<button>', {
        text: `Другие транзакции (${classElse.length})`,
        class: 'clickMe',
        id: 'else'
     });
      $(btnElse).insertBefore(first);
   }

   let class13 = $('.13');
   if (class13.length) {
     let first = $('#buttons').find('button').first();
     let btn13 = $('<button>', {
        text: `Скрипт-транзакция (${class13.length})`,
        class: 'clickMe',
        id: 13
      });
      $(btn13).insertBefore(first);
   }

   let class12 = $('.12');
   if (class12.length) {
     let first = $('#buttons').find('button').first();
     let btn12 = $('<button>', {
        text: `Дата-транзакция (${class12.length})`,
        class: 'clickMe',
        id: 12
      });
      $(btn12).insertBefore(first);
   }

   let class10 = $('.10');
   if (class10.length) {
     let first = $('#buttons').find('button').first();
     let btn10 = $('<button>', {
        text: `Создание алиаса (${class10.length})`,
        class: 'clickMe',
        id: 10
      });
      $(btn10).insertBefore(first);
   }

   let class6 = $('.6');
   if (class6.length) {
   let first = $('#buttons').find('button').first();
   let btn6 = $('<button>', {
      text: `Сжигание ассета (${class6.length})`,
      class: 'clickMe',
      id: 6
    });
    $(btn6).insertBefore(first);
   }

   let class5 = $('.5');
   if (class5.length) {
   let first = $('#buttons').find('button').first();
   let btn5 = $('<button>', {
      text: `Довыпуск ассета (${class5.length})`,
      class: 'clickMe',
      id: 5
    });
    $(btn5).insertBefore(first);
   }

   let class3 = $('.3');
   if (class3.length) {
     let first = $('#buttons').find('button').first();
     let btn3 = $('<button>', {
        text: `Создание ассета (${class3.length})`,
        class: 'clickMe',
        id: 3
      });
      $(btn3).insertBefore(first);
   }

   if (classMassReceiv.length) {
     let first = $('#buttons').find('button').first();
     let btnMassRec = $('<button>', {
      text: `Массовая транзакция: Ввод (${classMassReceiv.length})`,
      class: 'clickMe',
      id: 'massReceiv'
    });
    $(btnMassRec).insertBefore(first);
   }

   let classMassSend = $('.massSend');
   if (classMassSend.length) {
     let first = $('#buttons').find('button').first();
     let btnMassSend = $('<button>', {
        text: `Массовая транзакция: Вывод (${classMassSend.length})`,
        class: 'clickMe',
        id: 'massSend'
      });
      $(btnMassSend).insertBefore(first);
   }

   let class9 = $('.9');
   if (class9.length) {
     let first = $('#buttons').find('button').first();
     let btn9 = $('<button>', {
        text: `Отмена лизинг (${class9.length})`,
        class: 'clickMe',
        id: 9
      });
      $(btn9).insertBefore(first);
   }

   let class8 = $('.8');
   if (class8.length) {
     let first = $('#buttons').find('button').first();
     let btn8 = $('<button>', {
      text: `Лизинг (${class8.length})`,
      class: 'clickMe',
      id: 8
    });
    $(btn8).insertBefore(first);
   }

   let class7 = $('.7');
   if (class7.length) {
     let first = $('#buttons').find('button').first();
     let btn7 = $('<button>', {
        text: `Обмен (${class7.length})`,
        class: 'clickMe',
        id: 7
      });
      $(btn7).insertBefore(first);
   }

   let classSend = $('.send');
   if (classSend.length) {
     let first = $('#buttons').find('button').first();
     let btnSend = $('<button>', {
        text: `Вывод (${classSend.length})`,
        class: 'clickMe',
        id: 'send'
      });
      $(btnSend).insertBefore(first);
   }

   if (classDep.length) {
     let first = $('#buttons').find('button').first();
     let btnDeposit = $('<button>', {
        text: `Ввод (${classDep.length})`,
        class: 'clickMe',
        id: 'deposit'
      });
      $(btnDeposit).insertBefore(first);
   }

   if (classDep.length || classMassReceiv.length) {
     let first = $('#buttons').find('button').first();
     let btnAll = $('<button>', {
        text: `Все транзакции (${rawData.length - 1})`,
        class: 'clickMe',
        id: 'all'
      });
      $(btnAll).insertBefore(first);
   }

   let buttonBalance = $('.clickMe');
   if (classDep.length || classMassReceiv.length) {
     let first = $('#buttons').find('button').first();
     let btnBal = $('<button>', {
        text: `Баланс аккаунта`,
        class: 'balance',
        id: 'balance'
      });
      $(btnBal).insertBefore(first);
   }

   let inputForSearch = $('<input>', {
      type: 'text',
      text: `Баланс аккаунта`,
      id: 'field',
      css:{
        width: '60%'
      }
    });

   let buttonForSearch = $('<input>', {
      type: 'button',
      value: 'Жми сюда для поиска',
      id: 'searchButton',
      css: {
        backgroundColor:'#7FFFD4',
        borderRadius:'15px'
      }
    });

   const correctText = $(document.createTextNode('Введите текст или Waves адрес для поиска ' ));
   searchField.append(correctText);
   searchField.append(inputForSearch);
   searchField.append(buttonForSearch);

   $("body").on("dblclick", ".bal", function(){
     let waves = "" + null;
     let divClass = $(this).attr('class').split(' ');
     // let index = $(this).index();
//      $($(`#goal > div:gt(${index - 1})`).get().reverse()).each(function(index, value){
//        console.log($(this).text().split(" "));
// });

     let reversedRawData = rawData.reverse();
     // let arrayBal = [];
     let objectBal = {};
     for (let i = 0; i < reversedRawData.length; i++) {
       if (i % 10 == 0) {
         console.log(objectBal);
       }
       let objBal = reversedRawData[i];
       if (divClass[2] >= objBal['timestamp']) {
         if(objBal['type'] == 2) {
           if (objectBal[waves]) {
             if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
               objectBal[waves] -= (objBal['amount']/100000000);
               console.log("Waves -" + objBal['amount']/100000000);
               objectBal[waves] -= objBal['fee']/100000000
               console.log(" Waves -" + objBal['amount']/100000000);
             } else {
               objectBal[waves] += objBal['amount']/100000000;
               console.log("Waves +" + objBal['amount']/100000000);
             }
           } else {
             objectBal[waves] = objBal['amount']/100000000;
             console.log("Waves +" + objBal['amount']/100000000);
           }

         } else if (objBal['type'] == 4) {
           if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
             console.log("Вывод ");
             let assetId = listAssets[objBal['assetId']];
             let decAsset = decimal(assetId[1]);
             objectBal[objBal['assetId']] -= Math.floor((objBal['amount']/decAsset) * decAsset) / decAsset;
             console.log(objBal['assetId'] + " - " + Math.floor((objBal['amount']/decAsset) * decAsset) / decAsset);                      // Вычитание суммы из баланса если отправитель
             let feeAssetId = listAssets[objBal['feeAssetId']];                               // Вычитание комиссии из баланса если отправитель
             let decFee = decimal(feeAssetId[1]);                                             // *
             objectBal[objBal['feeAssetId']] -= objBal['fee']/decFee;
             console.log("Waves - " + objBal['fee']/decFee);
           } else if (objBal['recipient'] == reversedRawData[reversedRawData.length - 1]) {
             console.log("Ввод ");
             if (objectBal[objBal['assetId']]) {
               let assetId = listAssets[objBal['assetId']];
               let decAsset = decimal(assetId[1]);
               objectBal[objBal['assetId']] += Math.floor((objBal['amount']/decAsset) * decAsset) / decAsset;
               console.log(objBal['assetId'] +  " + " + Math.floor((objBal['amount']/decAsset) * decAsset) / decAsset);
             } else {
               let assetId = listAssets[objBal['assetId']];
               let decAsset = decimal(assetId[1]);
               objectBal[objBal['assetId']] = Math.floor((objBal['amount']/decAsset) * decAsset) / decAsset;
               console.log(objBal['assetId'] + " + " + Math.floor((objBal['amount']/decAsset) * decAsset) / decAsset);
             }
           } else {                                                      // Для транзакции оплаченой спонсорским ассетом
             let feeAssetId = listAssets[objBal['feeAssetId']];          // Прибаление комиссии к балансу
             let decFee = decimal(feeAssetId[1]);                        // *
             objectBal[objBal['feeAssetId']] += objBal['fee']/decFee;
             console.log(objBal['feeAssetId'] + " + " + objBal['fee']/decFee);
             // let waves = "" + null;
            // console.log(objectBal[objBal["" + "null"]]);
             objectBal[waves] -= 100000/100000000;               // Вычитание 0.001 Waves в качестве оплаты комиссии за проведение тр-ции
             console.log("Waves - " + 0.001);
           }
         } else if (objBal['type'] == 7) {
           console.log("Обмен ");
           let feeAssetId = listAssets[objBal['feeAssetId']];
           let decFee = decimal(feeAssetId[1]);
           let amountAsset;
           let priceAsset;
           let decAmount;
           let decPrice;
           let amount;
           let price;
           let spend;
           let residual;
           amountAsset = listAssets[objBal['order1']['assetPair']['amountAsset']][0];
           priceAsset = listAssets[objBal['order1']['assetPair']['priceAsset']][0];
           residual = listAssets[objBal['order1']['assetPair']['amountAsset']][1] - listAssets[objBal['order1']['assetPair']['priceAsset']][1];
           if (residual >= 0) {
              decAmount = decimal(listAssets[objBal['order1']['assetPair']['amountAsset']][1]);
              decPrice = decimal(listAssets[objBal['order1']['assetPair']['priceAsset']][1]);
              amount = Math.floor((objBal['amount']/decAmount) * decAmount) / decAmount;
              // parseFloat((objBal['amount']/decAmount).toFixed(listAssets[objBal['order1']['assetPair']['amountAsset']][1]));
              // Math.floor((objBal['amount']/decAmount) * decAmount) / decAmount;
              price = objBal['price']/decPrice;
              let spend1 = Math.floor((amount*price) * decPrice);
              spend = spend1 / decPrice;
              // parseFloat((amount*price).toFixed(listAssets[objBal['order1']['assetPair']['priceAsset']][1]));
              // Math.floor(a * 100) / 100;
           } else {
             let newResidual = listAssets[objBal['order1']['assetPair']['priceAsset']][1] - listAssets[objBal['order1']['assetPair']['amountAsset']][1];
             decAmount = decimal(listAssets[objBal['order1']['assetPair']['amountAsset']][1]);
             decPrice = decimal(newResidual);
             amount = Math.floor((objBal['amount']/decAmount) * decAmount) / decAmount;
             // parseFloat((objBal['amount']/decAmount).toFixed(listAssets[objBal['order1']['assetPair']['amountAsset']][1]));
             let tempDelim = objBal['price']/100000000;
             price = tempDelim/decPrice;
             let spend1 = Math.floor((amount*price) * decPrice);
             spend = spend1 / decPrice;
           }

           if (objBal['order1']['sender'] == reversedRawData[reversedRawData.length - 1]) {
             if (objBal['order1']['orderType'] == 'buy') {
               textCorrectName = 'Обмен: Купил ';
               objectBal[objBal['feeAssetId']] -= objBal['buyMatcherFee']/decFee;  //////////////////
               console.log(objBal['feeAssetId'] + " - " + objBal['buyMatcherFee']/decFee);
               if (objectBal[objBal['order1']['assetPair']['amountAsset']]) {
                 objectBal[objBal['order1']['assetPair']['amountAsset']] += amount;
                 console.log(objBal['order1']['assetPair']['amountAsset'] + " + " + amount);
                 // console.log(objBal['order1']['assetPair']['priceAsset'] + objectBal[objBal['order1']['assetPair']['priceAsset']] + " - " + spend);
                 objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;
                 console.log(objBal['order1']['assetPair']['priceAsset'] + " - " + spend);
               } else {
                 objectBal[objBal['order1']['assetPair']['amountAsset']] = amount;
                 console.log(objBal['order1']['assetPair']['amountAsset'] + " + " + amount);
                 objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;
                 console.log(objBal['order1']['assetPair']['priceAsset'] + " - " + spend);
               }

             } else {
               textCorrectName = 'Обмен: Продал ';
               objectBal[objBal['feeAssetId']] -= objBal['sellMatcherFee']/decFee;
               console.log("Waves - " + objBal['sellMatcherFee']/decFee);
               if (objectBal[objBal['order1']['assetPair']['priceAsset']]) {
                 objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
                 console.log(objBal['order1']['assetPair']['amountAsset'] + "-" + amount);
                 objectBal[objBal['order1']['assetPair']['priceAsset']] += spend;
                 console.log(objBal['order1']['assetPair']['priceAsset'] + " + " + spend);
               } else {
                 objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
                 console.log(objBal['order1']['assetPair']['amountAsset'] + "-" + amount);
                 objectBal[objBal['order1']['assetPair']['priceAsset']] = spend;
                 console.log(objBal['order1']['assetPair']['priceAsset'] + " + " + spend);
               }
             }
           } else {
             if (objBal['order2']['orderType'] == 'buy') {
               textCorrectName = 'Обмен: Купил ';
               objectBal[objBal['feeAssetId']] -= objBal['buyMatcherFee']/decFee;
               console.log("Waves -" + objBal['buyMatcherFee']/decFee);
               if (objectBal[objBal['order1']['assetPair']['amountAsset']]) {
                 objectBal[objBal['order1']['assetPair']['amountAsset']] += amount;
                 console.log(objBal['order1']['assetPair']['amountAsset'] + " + " + amount);
                 objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;
                 console.log(objBal['order1']['assetPair']['priceAsset'] + " - " + spend);
               } else {
                 objectBal[objBal['order1']['assetPair']['amountAsset']] = amount;
                 console.log(objBal['order1']['assetPair']['amountAsset'] + " + " + amount);
                 objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;
                 console.log(objBal['order1']['assetPair']['priceAsset'] + " - " + spend);
               }

             } else {
               textCorrectName = 'Обмен: Продал ';
               objectBal[objBal['feeAssetId']] -= objBal['sellMatcherFee']/decFee;
               console.log("Waves - " + objBal['sellMatcherFee']/decFee);
               if (objectBal[objBal['order1']['assetPair']['priceAsset']]) {
                 objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
                 console.log(objBal['order1']['assetPair']['amountAsset'] + " - " + amount);
                 objectBal[objBal['order1']['assetPair']['priceAsset']] += spend;
                 console.log(objBal['order1']['assetPair']['priceAsset'] + " + " + spend);
               } else {
                 objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
                 console.log(objBal['order1']['assetPair']['amountAsset'] + " - " + amount);
                 objectBal[objBal['order1']['assetPair']['priceAsset']] = spend;
                 console.log(objBal['order1']['assetPair']['priceAsset'] + " + " + spend);
               }
             }
           }
         } else if (objBal['type'] == 10) {
           let feeAssetId = listAssets['null'];
           let decFee = decimal(feeAssetId[1]);
           objectBal[waves] -= objBal['fee']/decFee;
         } else if (objBal['type'] == 6) {
           let feeAssetId = listAssets['null'];
           let decFee = decimal(feeAssetId[1]);
           objectBal[waves] -= objBal['fee']/decFee;
           let assetId = listAssets[objBal['assetId']];
           let decAsset = decimal(assetId[1]);
           objectBal[objBal['assetId']] -= objBal['amount']/decAsset;
         } else if (objBal['type'] == 12) {
           let feeAssetId = listAssets['null'];
           let decFee = decimal(feeAssetId[1]);
           objectBal[waves] -= objBal['fee']/decFee;
         } else if (objBal['type'] == 16) {
           if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
             let feeAssetId = listAssets[objBal['feeAssetId']];
             let decFee = decimal(feeAssetId[1]);
             objectBal[objBal['feeAssetId']] -= objBal['fee']/decFee;
       }

           let transfers = objBal['stateChanges']['transfers'];
           if (transfers.length > 0) {
               if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {

               for (let i = 0; i < transfers.length; i++) {
                 let assetId = listAssets[transfers[i]['asset']];
                 let decAsset = decimal(assetId[1]);
                 if (transfers[i]['address'] == reversedRawData[reversedRawData.length - 1]) {
                   if (objectBal[transfers[i]['asset']]) {
                   objectBal[transfers[i]['asset']] += transfers[i]['amount']/decAsset;
                 } else {
                   objectBal[transfers[i]['asset']] = transfers[i]['amount']/decAsset;
                 }
                 }
               }
             } else {
               for (let i = 0; i < transfers.length; i++) {
                 let assetId = listAssets[transfers[i]['asset']];
                 let decAsset = decimal(assetId[1]);
                 objectBal[transfers[i]['asset']] -= transfers[i]['amount']/decAsset;
               }
             }
           }
             let payment = objBal['payment'];
             if (payment.length > 0) {
               if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
                 for(let i = 0; i < payment.length; i++) {
                      let amount = payment[i]['amount'];
                      let assetId = listAssets[payment[i]['assetId']];
                      let decAsset = decimal(assetId[1]);
                       objectBal[payment[i]['assetId']] -= payment[i]['amount']/decAsset;
                 }
               } else {
                 for(let i = 0; i < payment.length; i++) {
                    let assetId = listAssets[payment[i]['assetId']];
                    let decAsset = decimal(assetId[1]);
                    if (objectBal[payment[i]['assetId']]) {
                     objectBal[payment[i]['assetId']] += payment[i]['amount']/decAsset;
                    } else {
                     objectBal[payment[i]['assetId']] = payment[i]['amount']/decAsset;
                   }
                 }
               }
             }
         } else if (objBal['type'] == 3) {
           let feeAssetId = listAssets[objBal['feeAssetId']];
           let decFee = decimal(feeAssetId[1]);
           objectBal[waves] -= objBal['fee']/decFee;
           let assetId = listAssets[objBal['assetId']];
           let decAsset = decimal(assetId[1]);
           objectBal[objBal['assetId']] = objBal['quantity']/decAsset;
         } else if (objBal['type'] == 9) {
         let feeAssetId = listAssets[objBal['feeAssetId']];
         let decFee = decimal(feeAssetId[1]);
         objectBal[waves] -= objBal['fee']/decFee;
         } else if (objBal['type'] == 8) {
          let feeAssetId = listAssets[objBal['feeAssetId']];
          let decFee = decimal(feeAssetId[1]);
          objectBal[waves] -= objBal['fee']/decFee;
         } else if (objBal['type'] == 11) {
         if(objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
           let feeAssetId = listAssets[objBal['feeAssetId']];
           let decFee = decimal(feeAssetId[1]);
           objectBal[waves] -= objBal['fee']/decFee;
           let assetId = listAssets[objBal['assetId']];
           let decAsset = decimal(assetId[1]);
           objectBal[objBal['assetId']] -= objBal['totalAmount']/decAsset;
         } else {
           let assetId = listAssets[objBal['assetId']];
           let decAsset = decimal(assetId[1]);
           for(let i = 0; i < objBal['transfers'].length; i++) {
             if (objBal['transfers'][i]['recipient'] == reversedRawData[reversedRawData.length - 1]) {
               if (objectBal[objBal['assetId']]) {
                 objectBal[objBal['assetId']] += objBal['transfers'][i]['amount']/decAsset;
               } else {
                 objectBal[objBal['assetId']] = objBal['transfers'][i]['amount']/decAsset;
               }
             }
           }
         }
         } else if (objBal['type'] == 5) {
           let feeAssetId = listAssets[objBal['feeAssetId']];
           let decFee = decimal(feeAssetId[1]);
           objectBal[waves] -= objBal['fee']/decFee;
           let assetId = listAssets[objBal['assetId']];
           let decAsset = decimal(assetId[1]);
           objectBal[objBal['assetId']] += objBal['quantity']/decAsset;
         } else if (objBal['type'] == 15) {
           let feeAssetId = listAssets[objBal['feeAssetId']];
           let decFee = decimal(feeAssetId[1]);
           objectBal[waves] -= objBal['fee']/decFee;
         } else if (objBal['type'] == 13) {
           let feeAssetId = listAssets[objBal['feeAssetId']];
           let decFee = decimal(feeAssetId[1]);
           objectBal[waves] -= objBal['fee']/decFee;
         } else if (objBal['type'] == 14) {
           let feeAssetId = listAssets[objBal['feeAssetId']];
           let decFee = decimal(feeAssetId[1]);
           objectBal[waves] -= objBal['fee']/decFee;
           // console.log(objBal['fee']/decFee);
         }
       } else {
         break;
       }
     }
     for (var id in objectBal) {
       console.log("Id " + id + " = " + objectBal[id].toFixed(8));
     }
     console.log(objectBal);
   });
});

$(document).ready(function() {
idClick = 'all';
  $(document).on('click', 'a[href^="http"]', function(event) {
      event.preventDefault();
      shell.openExternal(this.href);
  });


  $('body').on("click", ".clickMe", function(){
    idClick = $(this).attr('id');
      if (idClick == "all") {
        $('#goal').children().show();
      } else {
        $("#goal").children().show();
        // $(`.${idClick}`).show();
        $(`.${idClick}`).children().show();
        $(`.linkId`).children().show();
        $("#goal").children().not(`.${idClick}`).not(`button`).hide();
      }
    // } else {
    //   console.log('not_value');
    //   if (idClick == "all") {
    //     console.log("all");
    //     $("#goal").children().show();
    //   } else {
    //     console.log('spec');
    //     $("#goal").children().show();
    //     $(`.${idClick}`).children().show();
    //     $(`.linkId`).children().show();
    //     $("#goal").children().not(`.${idClick}`).not(`button`).hide();
    //   }
    // }
  });

  $('body').on("click", ".balance", function(){
    let win = new BrowserWindow ({alwaysOnTop: false, width: 400, height: 500});
    win.on('close', function() {win = null});
    win.loadFile('balance.html');
    win.show();
  });

/////////////////////// Рабочий (но медленный) поиск по тексту в div ///////////////////////////////////

  // $('body').on("click", "#searchButton", function() {
  //    value = $("#field").val().toLowerCase();
  //    if (idClick == 'all' || idClick == '' || idClick == 'undefined') {
  //      $("#goal *").filter(function() {
  //        $(this).not($('.linkId')).not($('.linkId').children()).toggle($(this).text().toLowerCase().indexOf(value) > -1);
  //      });
  //    } else {
  //    $(`.${idClick}`).each (function () {
  //      $(this).not($('.linkId')).not($('.linkId').children()).toggle($(this).text().toLowerCase().indexOf(value) > -1);
  //    });
  //  }
  //  });

/////////////////////////////////////////////////////////////////////////////////////////

  $('body').on("click", "#searchButton", function() {
    let value = $("#field").val().toLowerCase();
    if (value) {
       if (idClick == 'all') {
         $('#goal').children().show();
         $('#goal').children().not($(`div[id*='${value}']`)).hide();
       } else {
         $(`div[class^='${idClick}'`).show();
         $(`div[class^='${idClick}']`).not($(`div[id*='${value}']`)).hide();
    }
   } else {
     if (idClick == 'all') {
     $('#goal').children().show();
   } else {
     $("#goal").children().show();
     $(`.${idClick}`).children().show();
     $(`.linkId`).children().show();
     $("#goal").children().not(`.${idClick}`).not(`button`).hide();
   }
   }
   });

   $('body').on("click", ".extractMe", function() {
     let csvExport = $(this).attr("id");
     const csvWriter = createCsvWriter({
         path: `../${csvExport}.csv`,
         header: [
           {id: 'type', title: 'Тип транзакции'},
           {id: 'data', title: 'Данные транзакции'}
         ]
     });
     csvWriter.writeRecords(eval(`${csvExport}`))
         .then(() => {
             console.log("The .csv file has saved!");
         });
   });

   // $("body").on("dblclick", ".bal", function(){
   //   console.log(listAssets);
   //   let clickss = 0;
   //   let clickss4 = 0;
   //   let divClass = $(this).attr('class').split(' ');
   //   let reversedRawData = rawData.reverse();
   //   let arrayBal = [];
   //   let objectBal = {};
   //   for (let i = 1; i < reversedRawData.length; i++) {
   //     clickss++;
   //     let objBal = reversedRawData[i];
   //     if (divClass[2] > objBal['timestamp']) {
   //       if(objBal['type'] == 2) {
   //         if (objectBal['null']) {
   //           if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
   //             objectBal['null'] -= objBal['amount']/100000000;
   //             objectBal['assetId'] -= objBal['fee']/100000000
   //           } else {
   //             objectBal['null'] += objBal['amount']/100000000;
   //           }
   //         } else {
   //           objectBal['null'] = objBal['amount']/100000000;
   //         }
   //
   //       } else if (objBal['type'] == 4) {
   //         if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
   //           let assetId = listAssets[objBal['assetId']];
   //           let decAsset = decimal(assetId[1]);
   //           objectBal[objBal['assetId']] -= objBal['amount']/decAsset;  // Вычитание суммы из баланса если отправитель
   //           let feeAssetId = listAssets[objBal['feeAssetId']];          // Вычитание комиссии из баланса
   //           let decFee = decimal(feeAssetId[1]);                        // *
   //           objectBal[objBal['assetId']] -= objBal['fee']/decFee;       // *
   //         } else if (objBal['recipient'] == reversedRawData[reversedRawData.length - 1]) {
   //           console.log(listAssets);
   //           let assetId = listAssets[objBal['assetId']];
   //           console.log("Массив: " + assetId);
   //           let decAsset = decimal(assetId[1]);
   //           if (objectBal[objBal['assetId']]) {
   //             objectBal[objBal['assetId']] += objBal['amount']/decAsset;
   //           } else {
   //             objectBal[objBal['assetId']] = objBal['amount']/decAsset;
   //           }
   //         } else {                                                      // Для транзакции оплаченой спонсорским ассетом
   //           let feeAssetId = listAssets[objBal['feeAssetId']];          // Прибаление комиссии к балансу
   //           let decFee = decimal(feeAssetId[1]);                        // *
   //           objectBal[objBal['assetId']] += objBal['fee']/decFee;       // *
   //           objectBal[objBal['null']] -= 100000/decFee;                 // Вычитание 0.001 Waves в качестве оплаты комиссии за проведение тр-ции
   //         }
   //       }
   //       else if (objBal['type'] == 7) {
   //         let feeAssetId = listAssets[objBal['feeAssetId']];
   //         let decFee = decimal(feeAssetId[1]);
   //         let amountAsset;
   //         let priceAsset;
   //         let decAmount;
   //         let decPrice;
   //         let amount;
   //         let price;
   //         let spend;
   //         let residual;
   //         amountAsset = listAssets[objBal['order1']['assetPair']['amountAsset']][0];
   //         priceAsset = listAssets[objBal['order1']['assetPair']['priceAsset']][0];
   //         residual = listAssets[objBal['order1']['assetPair']['amountAsset']][1] - listAssets[objBal['order1']['assetPair']['priceAsset']][1];
   //         if (residual >= 0) {
   //            decAmount = decimal(listAssets[objBal['order1']['assetPair']['amountAsset']][1]);
   //            decPrice = decimal(listAssets[objBal['order1']['assetPair']['priceAsset']][1]);
   //            amount = objBal['amount']/decAmount;
   //            price = objBal['price']/decPrice;
   //            spend = amount*price;
   //         } else {
   //           let newResidual = listAssets[objBal['order1']['assetPair']['priceAsset']][1] - listAssets[objBal['order1']['assetPair']['amountAsset']][1];
   //           decAmount = decimal(listAssets[objBal['order1']['assetPair']['amountAsset']][1]);
   //           decPrice = decimal(newResidual);
   //           amount = objBal['amount']/decAmount;
   //           let tempDelim = objBal['price']/100000000;
   //           price = tempDelim/decPrice;
   //           spend = amount*price;
   //         }
   //
   //         if (objBal['order1']['sender'] == reversedRawData[reversedRawData.length - 1]) {
   //           if (objBal['order1']['orderType'] == 'buy') {
   //             textCorrectName = 'Обмен: Купил ';
   //             objectBal[objBal['feeAssetId']] -= objBal['buyMatcherFee']/decFee;
   //             if (objectBal[objBal['order1']['assetPair']['amountAsset']]) {
   //               objectBal[objBal['order1']['assetPair']['amountAsset']] += amount;
   //               objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;
   //             } else {
   //               objectBal[objBal['order1']['assetPair']['amountAsset']] = amount;
   //               objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;
   //             }
   //
   //           } else {
   //             textCorrectName = 'Обмен: Продал ';
   //             objectBal[objBal['feeAssetId']] -= objBal['sellMatcherFee']/decFee;
   //             if (objectBal[objBal['order1']['assetPair']['priceAsset']]) {
   //               objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
   //               objectBal[objBal['order1']['assetPair']['priceAsset']] += spend;
   //             } else {
   //               objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
   //               objectBal[objBal['order1']['assetPair']['priceAsset']] = spend;
   //             }
   //           }
   //         } else {
   //           if (objBal['order2']['orderType'] == 'buy') {
   //             textCorrectName = 'Обмен: Купил ';
   //             objectBal[objBal['feeAssetId']] -= objBal['buyMatcherFee']/decFee;
   //             if (objectBal[objBal['order1']['assetPair']['amountAsset']]) {
   //               objectBal[objBal['order1']['assetPair']['amountAsset']] += amount;
   //               objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;
   //             } else {
   //               objectBal[objBal['order1']['assetPair']['amountAsset']] = amount;
   //               objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;
   //             }
   //
   //           } else {
   //             textCorrectName = 'Обмен: Продал ';
   //             objectBal[objBal['feeAssetId']] -= objBal['sellMatcherFee']/decFee;
   //             if (objectBal[objBal['order1']['assetPair']['priceAsset']]) {
   //               objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
   //               objectBal[objBal['order1']['assetPair']['priceAsset']] += spend;
   //             } else {
   //               objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
   //               objectBal[objBal['order1']['assetPair']['priceAsset']] = spend;
   //             }
   //           }
   //         }
   //       } else if (objBal['type'] == 10) {
   //         let feeAssetId = listAssets['null'];
   //         let decFee = decimal(feeAssetId[1]);
   //         objectBal['null'] -= objBal['fee']/decFee;
   //       } else if (objBal['type'] == 6) {
   //         let feeAssetId = listAssets['null'];
   //         let decFee = decimal(feeAssetId[1]);
   //         objectBal['null'] -= objBal['fee']/decFee;
   //         let assetId = listAssets[objBal['assetId']];
   //         let decAsset = decimal(assetId[1]);
   //         objectBal[objBal['assetId']] -= objBal['amount']/decAsset;
   //       } else if (objBal['type'] == 12) {
   //         let feeAssetId = listAssets['null'];
   //         let decFee = decimal(feeAssetId[1]);
   //         objectBal['null'] -= objBal['fee']/decFee;
   //       } else if (objBal['type'] == 16) {
   //         if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
   //           let feeAssetId = listAssets[objBal['feeAssetId']];
   //           let decFee = decimal(feeAssetId[1]);
   //           objectBal[objBal['feeAssetId']] -= objBal['fee']/decFee;
   //     }
   //
   //         let transfers = objBal['trace'][0]['result']['transfers'];
   //         if (transfers.length > 0) {
   //             if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
   //
   //             for (let i = 0; i < transfers.length; i++) {
   //               let assetId = listAssets[transfers[i]['assetId']];
   //               let decAsset = decimal(assetId[1]);
   //               if (transfers[i]['address'] == reversedRawData[reversedRawData.length - 1]) {
   //                 if (objectBal[payment[i]['assetId']]) {
   //                 objectBal[transfers[i]['assetId']] += transfers[i]['amount']/decAsset;
   //               } else {
   //                 objectBal[transfers[i]['assetId']] = transfers[i]['amount']/decAsset;
   //               }
   //               }
   //             }
   //           } else {
   //             for (let i = 0; i < transfers.length; i++) {
   //               let assetId = listAssets[transfers[i]['assetId']];
   //               let decAsset = decimal(assetId[1]);
   //               objectBal[transfers[i]['assetId']] -= transfers[i]['amount']/decAsset;
   //             }
   //           }
   //         }
   //           let payment = objBal['payment'];
   //           if (payment.lenght > 0) {
   //             if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
   //               for(let i = 0; i < payment.length; i++) {
   //                    let amount = payment[i]['amount'];
   //                    let assetId = listAssets[payment[i]['assetId']];
   //                    let decAsset = decimal(assetId[1]);
   //                     objectBal[payment[i]['assetId']] -= payment[i]['amount']/decAsset;
   //               }
   //             } else {
   //               for(let i = 0; i < payment.length; i++) {
   //                  let assetId = listAssets[payment[i]['assetId']];
   //                  let decAsset = decimal(assetId[1]);
   //                  if (objectBal[payment[i]['assetId']]) {
   //                   objectBal[payment[i]['assetId']] += payment[i]['amount']/decAsset;
   //                  } else {
   //                   objectBal[payment[i]['assetId']] = payment[i]['amount']/decAsset;
   //                 }
   //               }
   //             }
   //           }
   //       } else if (objBal['type'] == 3) {
   //         let feeAssetId = listAssets[objBal['feeAssetId']];
   //         let decFee = decimal(feeAssetId[1]);
   //         objectBal['null'] -= objBal['fee']/decFee;
   //         let assetId = listAssets[objBal['assetId']];
   //         let decAsset = decimal(assetId[1]);
   //         objectBal[objBal['assetId']] = objBal['quantity']/decAsset;
   //       } else if (objBal['type'] == 9) {
   //       let feeAssetId = listAssets[objBal['feeAssetId']];
   //       let decFee = decimal(feeAssetId[1]);
   //       objectBal['null'] -= objBal['fee']/decFee;
   //       } else if (objBal['type'] == 8) {
   //        let feeAssetId = listAssets[objBal['feeAssetId']];
   //        let decFee = decimal(feeAssetId[1]);
   //        objectBal['null'] -= objBal['fee']/decFee;
   //       } else if (objBal['type'] == 11) {
   //       if(objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
   //         let feeAssetId = listAssets[objBal['feeAssetId']];
   //         let decFee = decimal(feeAssetId[1]);
   //         objectBal['null'] -= objBal['fee']/decFee;
   //         let assetId = listAssets[objBal['assetId']];
   //         let decAsset = decimal(assetId[1]);
   //         objectBal[objBal['assetId']] -= objBal['totalAmount']/decAsset;
   //       } else {
   //         let assetId = listAssets[objBal['assetId']];
   //         let decAsset = decimal(assetId[1]);
   //         for(let i = 0; i < objBal['transfers'].length; i++) {
   //           if (objBal['transfers'][i]['recipient'] == reversedRawData[reversedRawData.length - 1]) {
   //             if (objectBal[objBal['assetId']]) {
   //               objectBal[objBal['assetId']] += objBal['transfers'][i]['amount']/decAsset;
   //             } else {
   //               objectBal[objBal['assetId']] = objBal['transfers'][i]['amount']/decAsset;
   //             }
   //           }
   //         }
   //       }
   //       } else if (objBal['type'] == 5) {
   //         let feeAssetId = listAssets[objBal['feeAssetId']];
   //         let decFee = decimal(feeAssetId[1]);
   //         objectBal['null'] -= objBal['fee']/decFee;
   //         let assetId = listAssets[objBal['assetId']];
   //         let decAsset = decimal(assetId[1]);
   //         objectBal[objBal['assetId']] += objBal['quantity']/decAsset;
   //       } else if (objBal['type'] == 15) {
   //         let feeAssetId = listAssets[objBal['feeAssetId']];
   //         let decFee = decimal(feeAssetId[1]);
   //         objectBal['null'] -= objBal['fee']/decFee;
   //       } else if (objBal['type'] == 13) {
   //         let feeAssetId = listAssets[objBal['feeAssetId']];
   //         let decFee = decimal(feeAssetId[1]);
   //         objectBal['null'] -= objBal['fee']/decFee;
   //       } else if (objBal['type'] == 14) {
   //         let feeAssetId = listAssets[objBal['feeAssetId']];
   //         let decFee = decimal(feeAssetId[1]);
   //         objectBal['null'] -= objBal['fee']/decFee;
   //       }
   //       //
   //       // arrayBal.push(objBal);
   //     } else {
   //       break;
   //     }
   //   }
   //   // console.log(clickss4);
   //   // console.log(clickss);
   //   console.log(objectBal);
   //   // console.log(arrayBal.length);
   // });
});
