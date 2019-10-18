const { app, BrowserWindow, Menu, nativeImage, ipcMain, session } = require('electron');
const request = require('request-promise');
const path = require('path');
const url = require('url');
const shell = require('electron').shell;
const iconImg = nativeImage.createFromPath(__dirname + '/elect.icns')
const Buffer = require('buffer').Buffer;
const client = require('electron-connect').client;

let win;
let spamList = [];
function createWindow () {
  const options = {
    method: 'GET',
    uri: "https://raw.githubusercontent.com/wavesplatform/waves-community/master/Scam%20tokens%20according%20to%20the%20opinion%20of%20Waves%20Community.csv",
    json: true
  };
  request(options)
  .then(function (response2) {
    spamList = response2.split("\n");

    /////// Сохранение данных запроса в файл и их построчное чтение из файла (добавление в массив) ///////////////////////
    // fs.writeFile("spam.csv", response2, function(err) {
    //   if(err) {return console.log(err);}
    //   console.log("The file was saved!");
    // });
    //
    // var lineReader = require('readline').createInterface({
    // input: fs.createReadStream("spam.csv"),
    // output: process.stdout,
    // terminal:false
    // });
    //
    // lineReader.on('line', function (line) {
    //   let spamList = [];
    //   spamList.push(line);
    // });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  });

// max-width: 810
  win = new BrowserWindow({
    width: 600,
    height: 147,
    resizable: false,
    // frame: false,
    // transparent: true,
    'webPreferences':
    {"nodeIntegration": true,
    "webSecurity": true}
  })

  // and load the index.html of the app.
  win.loadFile('index.html')
  client.create(win);

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null
  })

  const mainMenu = [{
    label: app.getName(),
    submenu: [
      {label: 'Notification value'},
      {label: 'Waves Explorer',
        click() {
          shell.openExternal('https://wavesexplorer.com')
        }
      },
      {type: 'separator'},
      {label: 'Quit',
        click() {
          app.quit();
        },
        accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
      }
    ]
  },
  {
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}];

  if (process.env.NODE_ENV !== 'production') {
  mainMenu.push({
    label: 'Developer Tools',
    submenu:[
      {label: 'Toggle DevTools',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      }
    ]
  })
}



const menu = Menu.buildFromTemplate(mainMenu);
Menu.setApplicationMenu(menu)
// client.create(win);
}

app.on('ready', createWindow);
// client.create(BrowserWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window when the dock icon is clicked
  if (win === null) {
    createWindow();
  }
})

function loopAPI(array, address, lastId) {
const opt = {
  method: 'GET',
  // uri: `https://nodes.wavesnodes.com/transactions/address/${address}/limit/1000?after=${lastId}`,
  uri: `https://nodes.wavesnodes.com/debug/stateChanges/address/${address}/limit/1000?after=${lastId}`,
  json: true
}
request(opt)
  .then(function (response2) {
    let array2 = response2;
    array2.forEach(function (item) {
      array.push(item)
    });
    if (response2.length > 0 && array.length < 100000) {
    lastObject = array2[array2.length-1];
    lastId = lastObject['id'];
    loopAPI(array, address, lastId);
    win.webContents.send('perc2:add', 'array');
  } else {
    array.unshift(address);
    win.webContents.send('add:add', array);
  }
  });
};

let array;
ipcMain.on('address:add', function (event, reqAddress) {
  // win.setSize(500,600)/////////////////////////////////////////
  win.webContents.send('link:add', 'array');
  let address = reqAddress;
  const cookie = { url: 'http://localhost', name: 'address', value: address }
  session.defaultSession.cookies.set(cookie, (error) => {
    if (error) console.log(error);
  })


  const options = {
    method: 'GET',
    // Закомментировать при переходе на старый API ////////////////////////////////////////
    uri: `https://nodes.wavesnodes.com/debug/stateChanges/address/${address}/limit/100`,
    // Раскомментировать при переходе на старый API //////////////////////////////////////
    // uri: `https://nodes.wavesnodes.com/transactions/address/${address}/limit/100`,
    json: true
};
request(options)
    .then(function (response) {
      // Раскомментировать при переходе на старый API ////////////////////////////////////
      // array = response[0];
      // Закомментировать при переходе на старый API ////////////////////////////////////
      array = response;
      console.log("First loop " + array.length);
      if (array.length == 100 && array[array.length-1] != undefined) {
        let lastObject = array[array.length-1];
        let lastId = lastObject['id'];
        loopAPI(array, address, lastId);
        win.webContents.send('perc1:add', 'array');
      } else {
  array.unshift(address);
  win.webContents.send('add:add', array);
}
});
});

let listAssets = {};
let currentList = {null: ['Waves', 8]};

function listIds(getArray) {
if (getArray.length > 0) {
let items = getArray.splice(0, 99).join('');
let url = `https://api.wavesplatform.com/v0/assets?${items}`
  const options = {
      method: 'GET',
      uri: url,
      json: true
    };
    request(options)
      .then(function (response) {
        let names = response['data'];
        for (let i = 0; i < names.length; i++) {
          let fullArr = [];
          fullArr.push(names[i]['data']['name']);
          fullArr.push(names[i]['data']['precision']);

          if ( spamList.indexOf(names[i]['data']['id']) != -1 ) {
            fullArr.push('spam');
          }
          currentList[names[i]['data']['id']] = fullArr;
        }
        win.webContents.send('perc3:add', 'array');
        listIds(getArray);
      })
    } else {

      win.webContents.send('idsandprecision:add', currentList);
    }
    };

ipcMain.on('ids:add', function (event, array) {
  let getArray = array;
  listIds(getArray);
  win.setSize(1700,690)
  });


  ipcMain.on('balance:add', function (event, reqAdd) {

  session.defaultSession.cookies.get({ url: 'http://localhost' }, (error, cookies) => {
    let addAdd = cookies[0]['value'];
    let url = `https://nodes.wavesnodes.com/assets/balance/${addAdd}`;
    let balanceList = {};
  const options = {
      method: 'GET',
      uri: url,
      json: true
    };
    request(options)
      .then(function (response) {
        let assets = response['balances'];
        let wavesUrl = `https://nodes.wavesnodes.com/addresses/balance/${addAdd}`;
        const options = {
          method: 'GET',
          uri: wavesUrl,
          json: true
      };
  request(options)
    .then(function (response1) {
      let wavesBalance = [];
      wavesBalance.push(8);
      wavesBalance.push(response1['balance']);
      balanceList['Waves'] = wavesBalance;
      for (let i = 0; i < assets.length; i++) {
        let balanceArr = [];
        balanceArr.push(assets[i]['issueTransaction']['decimals']);
        balanceArr.push(assets[i]['balance']);

        if (spamList.indexOf(assets[i]['issueTransaction']['assetId']) != -1) {
          balanceArr.push('spam');
          balanceList[`${assets[i]['issueTransaction']['name']} (спам)`] = balanceArr;
        } else {
          balanceList[assets[i]['issueTransaction']['name']] = balanceArr;
        }
      }
      event.sender.send('sendBalance:add', balanceList);
      });
     });
    })
  });

ipcMain.on('alias:add', function (event, address) {

    const options = {
      method: 'GET',
      uri: `https://nodes.wavesnodes.com/alias/by-address/${address}`,
      json: true
    };
    request(options)
      .then(function (response) {
        console.log(response);
        win.webContents.send('aliases:add', response);
      });
  });
