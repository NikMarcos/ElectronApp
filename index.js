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
const interimBalance = require('./interimBalance');
const {type4Sender, type4Recipient} = require('./modules/type4');
const {type2Sender, type2Recipient} = require('./modules/type2');



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

const address = $('.content #address');
const buttons = $('.filter #buttons');
const elm = $('.content #goal');
const searchField = $('.filter #search');
const extractButtons = $('.filter #extract');
const searchDataInp = $('#searchDataInp');

let unique;
let rawData;
let idClick;
let listAssets = {};


ipcRenderer.on('link:add', function (e, data) {
    elm.empty();
    // buttons.empty();
    address.empty();
    // searchField.empty();
    extractButtons.empty();
    let html = `<div id="testDiv">Поиск данных аккаунта...</div>`;
    $(elm).html(html);
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
      if (obj['order1']['sender'] == rawData[0]) {
        if (obj['order1']['orderType'] == 'buy') {
          htmlDiv += `<div class="7 bal ${obj['timestamp']}"
          id="${amountAsset.toLowerCase()}${priceAsset.toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">
          <strong>Обмен: Купил </strong>${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}
          <strong> за </strong>
          ${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}<br>
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;
          csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
          csvTemp['type'] = 'Обмен: Купил';
          csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        } else {
          htmlDiv += `<div class="7 bal ${obj['timestamp']}"
          id="${amountAsset.toLowerCase()}${priceAsset.toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">
          <strong>Обмен: Продал </strong>${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}
          <strong> за </strong>
          ${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}<br>
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;
          csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
          csvTemp['type'] = 'Обмен: Продал';
          csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        }
      } else {
        if (obj['order2']['orderType'] == 'buy') {
          htmlDiv += `<div class="7 bal ${obj['timestamp']} new"
          id="${amountAsset.toLowerCase()}${priceAsset.toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">
          <strong>Обмен: Купил </strong>${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}
          <strong> за </strong>
          ${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}<br>
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;
          csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
          csvTemp['type'] = 'Обмен: Купил';
          csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        } else {
          htmlDiv += `<div class="7 bal ${obj['timestamp']} new"
          id="${amountAsset.toLowerCase()}${priceAsset.toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">
          <strong>Обмен: Продал </strong>${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}
          <strong> за </strong>
          ${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}<br>
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;
          csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
          csvTemp['type'] = 'Обмен: Продал';
          csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        }
      }
    } else if (obj['type'] == 4) {
      let amm = listAssets[obj['assetId']];
      let amOfAsset = decimal(amm[1]);
      if (obj['sender'] == rawData[0]) {

        let type4Send = type4Sender(obj, listAssets);
        htmlDiv += type4Send;

        csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
        csvTemp['type'] = `Вывод`;
        csvTemp['data'] = `${(obj['amount']/amOfAsset).toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
        csvAll.push(csvTemp);
        csvWithdrawal.push(csvTemp);
      } else {

        let type4Rec = type4Recipient(obj, listAssets);
        htmlDiv += type4Rec;

        csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
        csvTemp['type'] = `Ввод`;
        csvTemp['data'] = `${(obj['amount']/amOfAsset).toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
        csvAll.push(csvTemp);
        csvDeposit.push(csvTemp);
        }
    } else if (obj['type'] == 1) {

      htmlDiv += `<div class="creation bal ${obj['timestamp']}"
      id="${obj['recipient'].toLowerCase()}waves${new Date(obj['timestamp']).toLocaleDateString()}">
      <strong>Создание </strong>
      ${(obj['amount']/100000000).toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves
      <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Создание Waves`;
      csvTemp['data'] = `${(obj['amount']/100000000).toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves`;
      csvAll.push(csvTemp);
      csvDeposit.push(csvTemp);

    } else if (obj['type'] == 2) {
        let amOfAsset = 100000000;
        let amount = obj['amount']/amOfAsset;
        if (obj['sender'] == rawData[0]) {

          let type2Send = type2Sender(obj, amount);
          htmlDiv += type2Send;

          csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
          csvTemp['type'] = `Вывод`;
          csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves`;
          csvAll.push(csvTemp);
          csvWithdrawal.push(csvTemp);
        } else {

          let type2Recip = type2Recipient(obj, amount);
          htmlDiv += type2Recip;

          csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
          csvTemp['type'] = `Ввод`;
          csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves`;
          csvAll.push(csvTemp);
          csvDeposit.push(csvTemp);
        }
    } else if (obj['type'] == 11) {
        let amm = listAssets[obj['assetId']];
        let amOfAsset = decimal(amm[1]);
        if (obj['sender'] == rawData[0]) {
          let amount = obj['totalAmount']/amOfAsset;
          if (listAssets[obj['assetId']][2] == "spam") {
            htmlDiv += `<div class="massSend bal ${obj['timestamp']} spam"
            id="${obj['sender'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
          } else {
            htmlDiv += `<div class="massSend bal ${obj['timestamp']}"
            id="${obj['sender'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
          }
          htmlDiv += `<strong>Массовая транзакция: Вывод </strong>
          ${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}<br>
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;
          csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
          csvTemp['type'] = `Массовая транзакция: Вывод`;
          csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
          csvAll.push(csvTemp);
          csvWithdrawal.push(csvTemp);
        } else {
          let amount;
          for(let i = 0; i < obj['transfers'].length; i++) {
            if (obj['transfers'][i]['recipient'] == rawData[0]) {
              amount = obj['transfers'][i]['amount']/amOfAsset;
            }
          }
          if (listAssets[obj['assetId']][2] == "spam") {
            htmlDiv += `<div class="massReceiv bal ${obj['timestamp']} spam"
            id="${obj['sender'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
          } else {
            htmlDiv += `<div class="massReceiv bal ${obj['timestamp']}"
            id="${obj['sender'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
          }
          htmlDiv += `<strong>Массовая транзакция: Ввод </strong>
          ${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}
          <strong> с адреса </strong>${obj['sender']}<br>
          <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
          <div class="linkId"><strong> Id: </strong>
          <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
          </div>`;
          csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
          csvTemp['type'] = `Массовая транзакция: Ввод`;
          csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
          csvAll.push(csvTemp);
          csvDeposit.push(csvTemp);
        }
    } else if (obj['type'] == 8) {
      htmlDiv += `<div class="8 bal ${obj['timestamp']}"
      id="waves${new Date(obj['timestamp']).toLocaleDateString()}">
      <strong>Лизинг </strong>
      ${(obj['amount']/100000000).toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves<br>
      <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div></div>`;
      // Раскомментировать после перехода на нормальную версию API с debug версии //////////////////
      // if (obj['status'] == 'canceled') {
      //   htmlDiv += ` (отменен)</div></div>`;
      // } else {
      //   htmlDiv += ` (не отменен)</div></div>`;
      // }
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Лизинг`;
      csvTemp['data'] = `${(obj['amount']/100000000).toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves`;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 9) {
      htmlDiv += `<div class="9 bal ${obj['timestamp']}"
      id="waves${new Date(obj['timestamp']).toLocaleDateString()}">
      <strong>Отмена лизинга с ID:  </strong>${obj['leaseId']}<br>
      <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Отмена лизинга с ID:`;
      csvTemp['data'] = `${obj['leaseId']}`;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 3) {
      let amOfAsset = decimal(listAssets[obj['assetId']][1]);
      let amount = obj['quantity']/amOfAsset;
      if (listAssets[obj['assetId']][2] == "spam") {
        htmlDiv += `<div class="3 bal ${obj['timestamp']} spam"
        id="${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
      } else {
        htmlDiv += `<div class="3 bal ${obj['timestamp']}"
        id="${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
      }
      htmlDiv += `<strong>Создание ассета: </strong>
      ${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
      if (obj['script'] != null) {
        htmlDiv += ` (скрипт-ассет)`;
      }
      htmlDiv += `<br><strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Создание ассета:`;
      csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 6) {
      let amOfAsset = decimal(listAssets[obj['assetId']][1]);
      let amount = obj['amount']/amOfAsset;
      if (listAssets[obj['assetId']][2] == "spam") {
        htmlDiv += `<div class="6 bal ${obj['timestamp']} spam"
        id="${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
      } else {
        htmlDiv += `<div class="6 bal ${obj['timestamp']}"
        id="${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
      }
      htmlDiv += `<strong>Сжигание ассета: </strong>
      ${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}<br>
      <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Сжигание ассета:`;
      csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 5) {
      let amOfAsset = decimal(listAssets[obj['assetId']][1]);
      let amount = obj['quantity']/amOfAsset;
      if (listAssets[obj['assetId']][2] == "spam") {
        htmlDiv += `<div class="5 bal ${obj['timestamp']} spam"
        id="${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
      } else {
        htmlDiv += `<div class="5 bal ${obj['timestamp']}"
        id="${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}">`
      }
      htmlDiv += `<strong>Довыпуск ассета: </strong>
      ${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}<br>
      <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Довыпуск ассета:`;
      csvTemp['data'] = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 12) {
      htmlDiv += `<div class="12 bal ${obj['timestamp']}"
      id="${new Date(obj['timestamp']).toLocaleDateString()}">
      <strong>Дата-транзакция </strong><br>
      <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Дата-транзакция`;
      // csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 10) {
      htmlDiv += `<div class="10 bal ${obj['timestamp']}"
      id="${new Date(obj['timestamp']).toLocaleDateString()}">
      <strong>Создание алиаса: </strong>${obj['alias']}<br>
      <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Создание алиаса:`;
      csvTemp['data'] = `${obj['alias']}`;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 13) {
      htmlDiv += `<div class="13 bal ${obj['timestamp']}"
      id="${new Date(obj['timestamp']).toLocaleDateString()}">
      <strong>Скрипт-транзакция </strong><br>
      <strong> Дата: </strong>${new Date(obj['timestamp']).toLocaleString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Скрипт-транзакция`;
      // csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 14) {
      if (obj['minSponsoredAssetFee'] == null) {
        htmlDiv += `<div class="14 bal ${obj['timestamp']}"
        id="${new Date(obj['timestamp']).toLocaleDateString()}">
        <strong>Отмена спонсорства для </strong>${listAssets[obj['assetId']][0]}<br>
        <strong>Дата: </strong> ${new Date(obj['timestamp']).toLocaleDateString()}<br>
        <div class="linkId"><strong> Id: </strong>
        <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
        </div>`;
        csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
        csvTemp['type'] = `Отмена спонсорства`;
        // csvTemp['data'] = type;
        csvAll.push(csvTemp);
      } else {
        htmlDiv += `<div class="14 bal ${obj['timestamp']}"
        id="${new Date(obj['timestamp']).toLocaleDateString()}">
        <strong>Активация спонсорства для </strong>${listAssets[obj['assetId']][0]}<br>
        <strong>Дата: </strong> ${new Date(obj['timestamp']).toLocaleDateString()}<br>
        <div class="linkId"><strong> Id: </strong>
        <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
        </div>`;
        csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
        csvTemp['type'] = `Активация спонсорства`;
        // csvTemp['data'] = type;
        csvAll.push(csvTemp);
      }
    } else if (obj['type'] == 15) {
      htmlDiv += `<div class="15 bal ${obj['timestamp']}"
      id="${new Date(obj['timestamp']).toLocaleDateString()}">
      <strong>Установка скрипта на ассет </strong><br>
      <strong>Дата: </strong> ${new Date(obj['timestamp']).toLocaleDateString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Установка скрипта на ассет`;
      // csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 16) {
      htmlDiv += `<div class="16 bal ${obj['timestamp']}"
      id="${new Date(obj['timestamp']).toLocaleDateString()}">
      <strong>Вызов скрипта </strong><br>
      <strong>Дата: </strong> ${new Date(obj['timestamp']).toLocaleDateString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Вызов скрипта`;
      // csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else {
      htmlDiv += `<div class="else bal ${obj['timestamp']}"
      id="${new Date(obj['timestamp']).toLocaleDateString()}">
      <strong>Type: ${obj['type']}</strong><br>
      <strong>Дата: </strong> ${new Date(obj['timestamp']).toLocaleDateString()}<br>
      <div class="linkId"><strong> Id: </strong>
      <a href="https://wavesexplorer.com/tx/${obj['id']}" target="_blank">${obj['id']}</a></div>
      </div>`;
      csvTemp['date'] = `${new Date(obj['timestamp']).toLocaleString()}`;
      csvTemp['type'] = `Другая транзакция`;
      // csvTemp['data'] = type;
      csvAll.push(csvTemp);
    }
   };

   elm.append(htmlDiv);

   const correctAddress = $(document.createTextNode(rawData[0]));
   let strongAddress = $('<STRONG>');
   strongAddress.append(correctAddress);
   $(address).append(strongAddress);

   let classMassReceiv = $('.massReceiv');
   let classDep = $('.deposit');
   let extractDiv = $('.filter .extract');

   if (!classDep.length && !classMassReceiv.length) {
     $('#csvEx').hide();
   }

   if (!classDep.length && !classMassReceiv.length) {
    $('#csvWithdrawal').hide();
   }

   if (!classDep.length && !classMassReceiv.length) {
     $('#csvDeposit').hide();

   }
   //
   if (!classDep.length && !classMassReceiv.length) {
     $('#csvAll').hide();
   }

   let classElse = $('.else');
   if (classDep.length || classMassReceiv.length) {
      $('.else-btn').text('Другие (' + classElse.length + ')');
   } else {
     $('.else-btn').parent().hide();
   }

   let class16 = $('.16');
   if (class16.length) {
      $('.scriptCall-btn').text('Вызов скрипта (' + class16.length + ')');
    } else {
      $('.scriptCall-btn').parent().hide();
    }

    let class15 = $('.15');
    if (class15.length) {
      $('.assetScript-btn').text('Скрипт на ассет (' + class15.length + ')');
    } else {
      $('.assetScript-btn').parent().hide();
    }

   let class14 = $('.14');
   if (class14.length) {
      $('.sponsor-btn').text('Спонсорство (' + class14.length + ')');
    } else {
      $('.sponsor-btn').parent().hide();
    }

   let class13 = $('.13');
   if (class13.length) {
      $('.script-btn').text('Скрипт-транзакция (' + class13.length + ')');
   } else {
     $('.script-btn').parent().hide();
   }

   let class12 = $('.12');
   if (class12.length) {
      $('.data-btn').text('Дата-транзакция (' + class12.length + ')');
    } else {
      $('.data-btn').parent().hide();
    }

   let class10 = $('.10');
   if (class10.length) {
      $('.alias-btn').text('Создание алиаса (' + class10.length + ')');
    } else {
      $('.alias-btn').parent().hide();
    }

   let class6 = $('.6');
   if (class6.length) {
    $('.burn-btn').text('Сжигание ассета (' + class6.length + ')');
  } else {
    $('.burn-btn').parent().hide();
  }

   let class5 = $('.5');
   if (class5.length) {
    $('.assetReissue-btn').text('Довыпуск ассета (' + class5.length + ')');
  } else {
    $('.assetReissue-btn').parent().hide();
  }

   let class3 = $('.3');
   if (class3.length) {
      $('.assetCreation-btn').text('Создание ассета (' + class3.length + ')');
    } else {
      $('.assetCreation-btn').parent().hide();
    }

   if (classMassReceiv.length) {
    $('.massReceive-btn').text('Массовая транзакция: Ввод (' + classMassReceiv.length + ')');
  } else {
    $('.massReceive-btn').parent().hide();
  }

   let classMassSend = $('.massSend');
   if (classMassSend.length) {
      $('.massSend-btn').text('Массовая транзакция: Вывод (' + classMassSend.length + ')');
    } else {
      $('.massSend-btn').parent().hide();
    }

   let class9 = $('.9');
   if (class9.length) {
      $('.cancLeas-btn').text('Отмена лизинг (' + class9.length + ')');
   }

   let class8 = $('.8');
   if (class8.length) {
    $('.leasing-btn').text('Лизинг (' + class8.length + ')');
  } else {
    $('.leasing-btn').parent().hide();
  }

   let class7 = $('.7');
   if (class7.length) {
      $('.exch-btn').text('Обмен (' + class7.length + ')');
    } else {
      $('.exch-btn').parent().hide();
    }

   let classSend = $('.send');
   if (classSend.length) {
      $('.send-btn').text('Вывод (' + classSend.length + ')');
    } else {
      $('.send-btn').parent().hide();
    }

   if (classDep.length) {
      $('.dep-btn').text('Ввод (' + classDep.length + ')');
    } else {
      $('.dep-btn').parent().hide();
    }

   if (classDep.length || classMassReceiv.length) {
      $('.all-btn').text('Все транзакции (' + rawData.length + ')');
    } else {
      $('.all-btn').parent().hide();
    }

   let buttonBalance = $('.clickMe');
   if (classDep.length || classMassReceiv.length) {
      $('.bal-btn').text('Баланс аккаунта');
   }

   let htmlSearhForm = `
   <div class="cross">
   <svg width="10" height="10">
   <path d="M0 0 L 10 10 M10 0 L 0 10" stroke="black" stroke-width="1"/>
   </svg>
   </div>
   Введите Waves адрес/название ассета/дату для поиска <br>
   <input type="text" id="field">
   <input type="button" id="searchButton" value="Поиск">`
   $('.filter').show();
   ipcRenderer.send('alias:add', rawData[0]);
   ipcRenderer.on('aliases:add', function (e, aliases) {
     interimBalance.balance(rawData, listAssets, aliases);
   });

});


$(document).ready(function() {

  $(document).on('click', '.cross', () => {
    let text = $('.inspectInput').val('');
  });

  let rotateMenuBtn = 1;
  $(document).on('click', '#additionalMenu', () => {
    if (rotateMenuBtn % 2) {
      $('.buttons-form').css({
        'transform': 'rotateY(180deg)'
      });
    } else {
      $('.buttons-form').css({
        'transform': 'rotateY(0deg)'
      });
    }
    rotateMenuBtn++;
  });



  idClick = 'all';
  $(document).on('click', 'a[href^="http"]', function(event) {
      event.preventDefault();
      shell.openExternal(this.href);
  });

  $('.content .blick_btn').click(function(e){
    e.preventDefault();
    let address = searchDataInp.val().trim(); // добавил trim()
    if (address) {
      searchDataInp.val('');
      // $('.content').css('width', '100%');
      // searchDataInp.css('width', '80%');
      ipcRenderer.send('address:add', address);
    }
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
  });

  $('body').on("click", "#balance", function(){
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

  $('body').on("click", ".inspectBtn", function() {
    let value = $(".inspectInput").val().toLowerCase();
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
           {id: 'date', title: 'Дата'},
           {id: 'type', title: 'Тип транзакции'},
           {id: 'data', title: 'Данные транзакции'}
         ]
     });
     csvWriter.writeRecords(eval(`${csvExport}`))
         .then(() => {
             console.log("The .csv file has saved!");
         });
   });
});
