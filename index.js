const electron = require('electron');
const path = require('path');
const BrowserWindow = electron.remote.BrowserWindow
const {ipcRenderer} = electron;
const shell = require('electron').shell;
const request = require('request-promise');
const fs = require('fs');
const os = require('os');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


const addAddress = document.getElementById('addAddress');
addAddress.addEventListener('click', function() {

  let win = new BrowserWindow ({alwaysOnTop: true, width: 450, height: 200});
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
const address = document.getElementById('address');
const buttons = document.getElementById('buttons');
const elm = document.getElementById('goal');
const searchField = document.getElementById('search');
let unique;
let rawData;
let idClick;
let listAssets = {};


ipcRenderer.on('link:add', function (e, data) {
  while (elm.firstChild) {
  elm.removeChild(elm.firstChild);
  }
  while (buttons.firstChild) {
  buttons.removeChild(buttons.firstChild);
  }
  while (address.firstChild) {
  address.removeChild(address.firstChild);
  }
  while (searchField.firstChild) {
  searchField.removeChild(searchField.firstChild);
  }

  let searchText = 'Ищу...';
  const correctCoco = document.createTextNode(searchText);
  elm.setAttribute("style", "text-align:center");
  elm.appendChild(correctCoco);
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
      };
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
  while (elm.firstChild) {
  elm.removeChild(elm.firstChild);
}

while (elm.firstChild) {
elm.removeChild(elm.firstChild);
}
  let type;
  let type2;
  let status;
  let amountAsset;
  let priceAsset;
  let cancelLeasingId;
  let assetId;
  for (let i = 1; i < rawData.length; i++) {
    let csvTemp = {};
    let divStyle = 'border-bottom:1px solid black; padding: 3px;';
    const div = document.createElement('div');
    // const divBal = document.createElement('div');
    // divBal.setAttribute('id', 'oldBal');
    // divBal.style.cssText = 'border-bottom:1px solid black;background-color:#8FB4F5;transform:rotate(90deg);float:right;';
    // divBal.innerHTML = "Баланс";
    // $("divBal").css('transform', 'rotate(90deg)');
    let strong = document.createElement("STRONG");
    let strongSec = document.createElement("STRONG");
    let strongDate = document.createElement("STRONG");
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
        divStyle += 'background-color:#D3D3D3';
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
      div.setAttribute('class', `7 bal ${obj['timestamp']}`);
      div.setAttribute('id', `${amountAsset.toLowerCase()}${priceAsset.toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
      if (obj['order1']['sender'] == rawData[0]) {
        if (obj['order1']['orderType'] == 'buy') {
          textCorrectName = 'Обмен: Купил ';
          const correctName = document.createTextNode(textCorrectName);
          strong.appendChild(correctName);
          const correctSec = document.createTextNode(' за ');
          strongSec.appendChild(correctSec);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          type2 = `${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        } else {
          textCorrectName = 'Обмен: Продал ';
          const correctName = document.createTextNode(textCorrectName);
          strong.appendChild(correctName);
          const correctSec = document.createTextNode(' за ');
          strongSec.appendChild(correctSec);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          type2 = `${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        }
      } else {
        if (obj['order2']['orderType'] == 'buy') {
          textCorrectName = 'Обмен: Купил ';
          const correctName = document.createTextNode(textCorrectName);
          strong.appendChild(correctName);
          const correctSec = document.createTextNode(' за ');
          strongSec.appendChild(correctSec);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          type2 = `${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        } else {
          textCorrectName = 'Обмен: Продал ';
          const correctName = document.createTextNode(textCorrectName);
          strong.appendChild(correctName);
          const correctSec = document.createTextNode(' за ');
          strongSec.appendChild(correctSec);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${amountAsset}`;
          type2 = `${spend.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${priceAsset}`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvEx.push(csvTemp);
        }
      }
    } else if (obj['type'] == 4) {
      if (listAssets[obj['assetId']][2] == "spam") {
        divStyle += 'background-color:#D3D3D3';
      }
      let amm = listAssets[obj['assetId']];
      let amOfAsset = decimal(amm[1]);
      div.setAttribute('id', `${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
      if (obj['sender'] == rawData[0]) {
        textCorrectName = 'Вывод: ';
        const correctName = document.createTextNode(textCorrectName);
        strong.appendChild(correctName);
        const correctSec = document.createTextNode(' на адрес ');
        strongSec.appendChild(correctSec);
        div.setAttribute('class', `send bal ${obj['timestamp']}`);
        type = `${(obj['amount']/amOfAsset).toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
        type2 = `${obj['recipient']}`;
        csvTemp['type'] = textCorrectName;
        csvTemp['data'] = type;
        csvAll.push(csvTemp);
        csvWithdrawal.push(csvTemp);
      } else {
        textCorrectName = 'Ввод: ';
        const correctName = document.createTextNode(textCorrectName);
        strong.appendChild(correctName);
        const correctSec = document.createTextNode(' с адреса ');
        strongSec.appendChild(correctSec);
        div.setAttribute('class', `deposit bal ${obj['timestamp']}`);
        type = `${(obj['amount']/amOfAsset).toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
        type2 = `${obj['sender']}`;
        csvTemp['type'] = textCorrectName;
        csvTemp['data'] = type;
        csvAll.push(csvTemp);
        csvDeposit.push(csvTemp);
      }
    } else if (obj['type'] == 2) {
        let amOfAsset = 100000000;
        let amount = obj['amount']/amOfAsset;
        div.setAttribute('id', `${obj['sender'].toLowerCase()}${obj['recipient'].toLowerCase()}waves${new Date(obj['timestamp']).toLocaleDateString()}`);
        if (obj['sender'] == rawData[0]) {
          textCorrectName = 'Вывод: ';
          const correctName = document.createTextNode(textCorrectName);
          strong.appendChild(correctName);
          const correctSec = document.createTextNode(' на адрес ');
          strongSec.appendChild(correctSec);
          div.setAttribute('class', `send bal ${obj['timestamp']}`);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves`;
          type2 = `${obj['recipient']}`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvWithdrawal.push(csvTemp);
        } else {
          textCorrectName = 'Ввод: ';
          const correctName = document.createTextNode(textCorrectName);
          strong.appendChild(correctName);
          const correctSec = document.createTextNode(' с адреса ');
          strongSec.appendChild(correctSec);
          div.setAttribute('class', `deposit bal ${obj['timestamp']}`);
          type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves`;
          type2 = `${obj['sender']}`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvDeposit.push(csvTemp);
        }
    } else if (obj['type'] == 11) {
      if (listAssets[obj['assetId']][2] == "spam") {
        divStyle += 'background-color:#D3D3D3';
      }
        let amm = listAssets[obj['assetId']];
        let amOfAsset = decimal(amm[1]);
        div.setAttribute('id', `${obj['sender'].toLowerCase()}${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
        if (obj['sender'] == rawData[0]) {
          textCorrectName = 'Массовая транзакция: Вывод ';
          const correctName = document.createTextNode(textCorrectName);
          strong.appendChild(correctName);
          let allAmount = obj['totalAmount']/amOfAsset;
          type = `${allAmount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
          div.setAttribute('class', `massSend bal ${obj['timestamp']}`);
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvWithdrawal.push(csvTemp);
        } else {
          textCorrectName = 'Массовая транзакция: Ввод ';
          const correctName = document.createTextNode(textCorrectName);
          strong.appendChild(correctName);
          const correctSec = document.createTextNode(' с адреса ');
          strongSec.appendChild(correctSec);
          let allAmount = obj['transfers'][0]['amount']/amOfAsset;
          div.setAttribute('class', `massReceiv bal ${obj['timestamp']}`);
          type = `${allAmount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]} `;
          type2 = `${obj['sender']}`;
          csvTemp['type'] = textCorrectName;
          csvTemp['data'] = type;
          csvAll.push(csvTemp);
          csvDeposit.push(csvTemp);
        }
    } else if (obj['type'] == 8) {
      div.setAttribute('class', `8 bal ${obj['timestamp']}`);
      div.setAttribute('id', `waves${new Date(obj['timestamp']).toLocaleDateString()}`);
      if (obj['status'] == 'canceled') {
        status = " (отменен)"
      } else {
        status = " (не отменен)"
      }
      textCorrectName = 'Лизинг: ';
      const correctName = document.createTextNode(textCorrectName);
      strong.appendChild(correctName);
      type = `${(obj['amount']/100000000).toLocaleString('en-US', {maximumSignificantDigits: 16})} Waves`;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 9) {
      div.setAttribute('class', `9 bal ${obj['timestamp']}`);
      div.setAttribute('id', `waves${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `${obj['leaseId']}`;
      textCorrectName = 'Отмена лизинга с ID: ';
      const correctName = document.createTextNode(textCorrectName);
      strong.appendChild(correctName);
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 3) {
      if (listAssets[obj['assetId']][2] == "spam") {
        divStyle += 'background-color:#D3D3D3';
      }
      let amOfAsset = decimal(listAssets[obj['assetId']][1]);
      let amount = obj['quantity']/amOfAsset;
      div.setAttribute('class', `3 bal ${obj['timestamp']}`);
      div.setAttribute('id', `${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
      if (obj['script'] == null) {
        textCorrectName = 'Создание ассета: ';
        const correctName = document.createTextNode(textCorrectName);
        strong.appendChild(correctName);
        type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
        csvTemp['type'] = textCorrectName;
        csvTemp['data'] = type;
        csvAll.push(csvTemp);
      } else {
        textCorrectName = 'Создание ассета: ';
        const correctName = document.createTextNode(textCorrectName);
        strong.appendChild(correctName);
        type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]} (смарт-ассет)`;
        csvTemp['type'] = textCorrectName;
        csvTemp['data'] = type;
        csvAll.push(csvTemp);
      }
    } else if (obj['type'] == 6) {
      if (listAssets[obj['assetId']][2] == "spam") {
        divStyle += 'background-color:#D3D3D3';
      }
      let amOfAsset = decimal(listAssets[obj['assetId']][1]);
      let amount = obj['amount']/amOfAsset;
      textCorrectName = 'Сжигание ассета: ';
      const correctName = document.createTextNode(textCorrectName);
      strong.appendChild(correctName);
      div.setAttribute('class', `6 bal ${obj['timestamp']}`);
      div.setAttribute('id', `${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 5) {
      if (listAssets[obj['assetId']][2] == "spam") {
        divStyle += 'background-color:#D3D3D3';
      }
      let amOfAsset = decimal(listAssets[obj['assetId']][1]);
      let amount = obj['quantity']/amOfAsset;
      textCorrectName = 'Довыпуск ассета: ';
      const correctName = document.createTextNode(textCorrectName);
      strong.appendChild(correctName);
      div.setAttribute('class', `5 bal ${obj['timestamp']}`);
      div.setAttribute('id', `${listAssets[obj['assetId']][0].toLowerCase()}${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `${amount.toLocaleString('en-US', {maximumSignificantDigits: 16})} ${listAssets[obj['assetId']][0]}`;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 12) {
      textCorrectName = "";
      div.setAttribute('class', `12 bal ${obj['timestamp']}`);
      div.setAttribute('id', `${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `Дата-транзакция `;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 10) {
      textCorrectName = 'Создание алиаса: ';
      const correctName = document.createTextNode(textCorrectName);
      strong.appendChild(correctName);
      div.setAttribute('class', `10 bal ${obj['timestamp']}`);
      div.setAttribute('id', `${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `${obj['alias']}`;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 13) {
      textCorrectName = "";
      div.setAttribute('class', `13 bal ${obj['timestamp']}`);
      div.setAttribute('id', `${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `Скрипт-транзакция`;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else if (obj['type'] == 16) {
      textCorrectName = "";
      div.setAttribute('class', `16 bal ${obj['timestamp']}`);
      div.setAttribute('id', `${new Date(obj['timestamp']).toLocaleDateString()}`);
      type = `Вызов скрипта `;
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    } else {
      textCorrectName = "";
      type = `Type: ${obj['type']}, `
      div.setAttribute('class', `else bal ${obj['timestamp']}`);
      div.setAttribute('id', `${new Date(obj['timestamp']).toLocaleDateString()}`);
      csvTemp['type'] = textCorrectName;
      csvTemp['data'] = type;
      csvAll.push(csvTemp);
    }
     let id = `${obj['id']}`;
     let textId = 'Id: ';
     let dateStr = `${new Date(obj['timestamp']).toLocaleString()}`;
     const correctDate = document.createTextNode(` Дата: `);
     strongDate.appendChild(correctDate);
     div.style.cssText = divStyle;
     const div2 = document.createElement('div');
     div2.setAttribute('class', 'linkId');
     const a = document.createElement('a');
     a.setAttribute('style', 'text-decoration:none');
     a.setAttribute('href', `https://wavesexplorer.com/tx/${obj['id']}`);
     // a.setAttribute('target', '_blank');
     const correctType = document.createTextNode(type);
     const correctDateStr = document.createTextNode(dateStr);
     const correctId = document.createTextNode(id);
     const correctTextId = document.createTextNode(textId);
     a.appendChild(correctId);
     div2.appendChild(correctTextId);
     div2.appendChild(a);
     if (obj['type'] == 8) {
       const correctStatus = document.createTextNode(status);
       div2.appendChild(correctStatus);
     };
     div.appendChild(strong);
     div.appendChild(correctType);
     if (obj['type'] == 7 || obj['type'] == 4 || obj['type'] == 2 || obj['type'] == 11) {
       div.appendChild(strongSec);
       div.appendChild(document.createTextNode(type2));
     }
     div.appendChild(strongDate);
     div.appendChild(correctDateStr);
     div.appendChild(div2);
     if (cancelLeasingId && obj['type'] == 9) {
       const correctCancelLeasingId = document.createTextNode(cancelLeasingId);
       div.appendChild(correctCancelLeasingId);
     };
      // div.appendChild(divBal);
      elm.removeAttribute("style");
      elm.appendChild(div);
      type2 = '';
   };


   address.setAttribute("style", "text-align:center");
   const correctAddress = document.createTextNode(rawData[0]);
   let strongAddress = document.createElement("STRONG");
   strongAddress.appendChild(correctAddress);
   address.appendChild(strongAddress);

   let buttonMassReceiv = document.getElementsByClassName('massReceiv');
   let buttonDep = document.getElementsByClassName('deposit');

   if (buttonDep.length > 0 || buttonMassReceiv.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'csvEx');
     button.setAttribute('class', 'extractMe');
     button.setAttribute('style', 'background-color:#98FB98; border-radius:5px');
     button.innerHTML = `Экспорт обменов`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   if (buttonDep.length > 0 || buttonMassReceiv.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'csvWithdrawal');
     button.setAttribute('class', 'extractMe');
     button.setAttribute('style', 'background-color:#98FB98; border-radius:5px');
     button.innerHTML = `Экспорт выводов`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   if (buttonDep.length > 0 || buttonMassReceiv.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'csvDeposit');
     button.setAttribute('class', 'extractMe');
     button.setAttribute('style', 'background-color:#98FB98; border-radius:5px');
     button.innerHTML = `Экспорт вводов`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   if (buttonDep.length > 0 || buttonMassReceiv.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'csvAll');
     button.setAttribute('class', 'extractMe');
     button.setAttribute('style', 'background-color:#98FB98; border-radius:5px');
     button.innerHTML = `Экспорт всех транзакций`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let buttonElse = document.getElementsByClassName('else');
   if (buttonElse.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'else');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Другие транзакции (${$('.else').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let button13 = document.getElementsByClassName('13');
   if (button13.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', '13');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Скрипт-транзакция (${$('.13').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let button12 = document.getElementsByClassName('12');
   if (button12.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', '12');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Дата-транзакция (${$('.12').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let button10 = document.getElementsByClassName('10');
   if (button10.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', '10');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Создание алиаса (${$('.10').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let button6 = document.getElementsByClassName('6');
   if (button6.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', '6');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Сжигание ассета (${$('.6').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let button5 = document.getElementsByClassName('5');
   if (button5.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', '5');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Довыпуск ассета (${$('.5').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let button3 = document.getElementsByClassName('3');
   if (button3.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', '3');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Создание ассета (${$('.3').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   if (buttonMassReceiv.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'massReceiv');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Массовая транзакция: Ввод (${$('.massReceiv').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let buttonMassSend = document.getElementsByClassName('massSend');
   if (buttonMassSend.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'massSend');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Массовая транзакция: Вывод (${$('.massSend').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let button9 = document.getElementsByClassName('9');
   if (button9.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', '9');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Отмена лизинг (${$('.9').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let button8 = document.getElementsByClassName('8');
   if (button8.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', '8');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Лизинг (${$('.8').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let button7 = document.getElementsByClassName('7');
   if (button7.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', '7');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Обмен (${$('.7').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let buttonSend = document.getElementsByClassName('send');
   if (buttonSend.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'send');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Вывод (${$('.send').length})`
     let first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }


   if (buttonDep.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'deposit');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Ввод (${$('.deposit').length})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }



   if (buttonDep.length > 0 || buttonMassReceiv.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'all');
     button.setAttribute('class', 'clickMe');
     button.innerHTML = `Все транзакции (${rawData.length - 1})`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }



   let buttonBalance = document.getElementsByClassName('clickMe');
   if (buttonDep.length > 0 || buttonMassReceiv.length > 0) {
     let button = document.createElement('button');
     button.setAttribute('id', 'balance');
     button.setAttribute('class', 'balance');
     button.innerHTML = `Баланс аккаунта`
     var first = buttons.childNodes[0];
     buttons.insertBefore(button,first);
   }

   let inputForSearch = document.createElement('input');
   let buttonForSearch = document.createElement('input');
   inputForSearch.setAttribute('type', 'text');
   buttonForSearch.setAttribute('type', 'button');
   buttonForSearch.setAttribute('style', 'background-color:#7FFFD4; border-radius:15px');
   inputForSearch.setAttribute('id', 'field');
   buttonForSearch.setAttribute('id', 'searchButton');
   buttonForSearch.setAttribute('value', 'Жми сюда для поиска');
   inputForSearch.style.width = "60%";
   const correctText = document.createTextNode('Введите текст или Waves адрес для поиска ' );
   searchField.appendChild(correctText);
   searchField.appendChild(inputForSearch);
   searchField.appendChild(buttonForSearch);

   $("body").on("dblclick", ".bal", function(){
     let waves = "" + null;
     let divClass = $(this).attr('class').split(' ');
     // let index = $(this).index();
//      $($(`#goal > div:gt(${index - 1})`).get().reverse()).each(function(index, value){
//        console.log($(this).text().split(" "));
// });


     // console.log(divClass[2]);
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
