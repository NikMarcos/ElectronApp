// // console.log("lf");
// exports = exports || {};

exports.balance = function (rawData, listAssets, aliases) {
  console.log(aliases);
  $("body").on("dblclick", ".bal", function(){
    let waves = "" + null;
    let divClass = $(this).attr('class').split(' ');
    let reversedRawData = rawData.reverse();
    let objectBal = {};
    // let testobjectBal = {null:100000}
    let iter = 1;
    for (let i = 0; i < reversedRawData.length; i++) {


      let objBal = reversedRawData[i];
      if (divClass[2] >= objBal['timestamp']) {

        if(objBal['type'] == 2) {
          // console.log(objBal);
          if (objBal['sender'] == reversedRawData[reversedRawData.length - 1] && objBal['recipient'] == reversedRawData[reversedRawData.length - 1]) {
            objectBal[waves] -= (objBal['fee']/100000000);
          } else if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
            console.log('Send тип2 ' + objectBal[waves]);
            console.log("- " + objBal['amount']/100000000);
            console.log("- " + objBal['fee']/100000000);
            objectBal[waves] -= (objBal['amount']/100000000);
            objectBal[waves] -= (objBal['fee']/100000000);
            console.log('После ' + objectBal[waves]);


          } else {
            console.log('Deposit тип2 ' + objectBal[waves]);
            console.log("+ " + objBal['amount']/100000000);
            if (objectBal[waves]) {
              objectBal[waves] += (objBal['amount']/100000000);
            } else {
              objectBal[waves] = (objBal['amount']/100000000);
            }
            console.log('После ' + objectBal[waves]);
          }
        } else if (objBal['type'] == 4) {
          if (objBal['sender'] == reversedRawData[reversedRawData.length - 1] && objBal['recipient'] == reversedRawData[reversedRawData.length - 1]) {
            // console.log('Send to myself');
            let feeAssetId = listAssets[objBal['feeAssetId']];
            let decFee = decimal(feeAssetId[1]);
            objectBal[objBal['feeAssetId']] -= (objBal['fee']/decFee);
          } else if (objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
            // console.log('Send');

            let assetId = listAssets[objBal['assetId']];
            let decAsset = decimal(assetId[1]);
            // console.log('Send ' + objectBal[objBal['assetId']] + " - " + objBal['amount']/decAsset);
            objectBal[objBal['assetId']] -= (objBal['amount']/decAsset);


            let feeAssetId = listAssets[objBal['feeAssetId']];
            let decFee = decimal(feeAssetId[1]);
            // console.log("комиссия " + objectBal[objBal['feeAssetId']] + " - " + objBal['fee']/decFee);
            objectBal[objBal['feeAssetId']] -= (objBal['fee']/decFee);


          } else if (objBal['recipient'] == reversedRawData[reversedRawData.length - 1] || aliases.includes(objBal['recipient'])) {
            // console.log('Deposit');
            if (objectBal[objBal['assetId']]) {

              let assetId = listAssets[objBal['assetId']];
              let decAsset = decimal(assetId[1]);
              objectBal[objBal['assetId']] += (objBal['amount']/decAsset);


            } else {

              let assetId = listAssets[objBal['assetId']];
              let decAsset = decimal(assetId[1]);
              objectBal[objBal['assetId']] = (objBal['amount']/decAsset);


            }
          } else {
            // console.log("sponsored fee");
            // console.log(objBal);
            // console.log(listAssets[objBal['feeAssetId']]);
            let feeAssetId = listAssets[objBal['feeAssetId']];
            let decFee = decimal(feeAssetId[1]);
            objectBal[objBal['feeAssetId']] += (objBal['fee']/decFee);


            // let waves = "" + null;

            objectBal[waves] -= 100000/100000000;               // Вычитание 0.001 Waves в качестве оплаты комиссии за проведение тр-ции

          }
        } else if (objBal['type'] == 7) {
          let amount;
          let price;
          let spend;
          let feeAssetId = listAssets[objBal['feeAssetId']];
          let decFee = decimal(feeAssetId[1]);
          let amountAsset = listAssets[objBal['order1']['assetPair']['amountAsset']][0];
          let priceAsset = listAssets[objBal['order1']['assetPair']['priceAsset']][0];
          let precAmount = listAssets[objBal['order1']['assetPair']['amountAsset']][1];
          let precPrice = listAssets[objBal['order1']['assetPair']['priceAsset']][1];
          let residual = precAmount - precPrice;

          if (residual >= 0) {
             decAmount = decimal(precAmount);
             decPrice = decimal(precPrice);
             // amount = objBal['amount']/decAmount;
             amount = parseFloat((objBal['amount']/decAmount).toFixed(precAmount));
             // Math.floor((objBal['amount']/decAmount) * decAmount) / decAmount;
             price = objBal['price']/decPrice;
             // spend = amount*price;

             spend = parseFloat((amount*price).toFixed(precPrice));
             // Math.floor(a * 100) / 100;
          } else {
            let newResidual = listAssets[objBal['order1']['assetPair']['priceAsset']][1] - listAssets[objBal['order1']['assetPair']['amountAsset']][1];
            decAmount = decimal(precAmount);
            decPrice = decimal(newResidual);
            // amount = objBal['amount']/decAmount;
            amount = parseFloat((objBal['amount']/decAmount).toFixed(precAmount));
            let tempDelim = (objBal['price']/100000000);
            price = tempDelim/decPrice;
            // spend = amount*price;
            spend = parseFloat((amount*price).toFixed(precPrice));
          }

            if (objBal['order1']['sender'] == reversedRawData[reversedRawData.length - 1] && objBal['order2']['sender'] == reversedRawData[reversedRawData.length - 1]) {
              // console.log("Цель" + objBal['id']);
                objectBal[objBal['feeAssetId']] -= (objBal['buyMatcherFee']/decFee);
                objectBal[objBal['feeAssetId']] -= (objBal['sellMatcherFee']/decFee);

            } else if (objBal['order1']['sender'] == reversedRawData[reversedRawData.length - 1]) {

            if (objBal['order1']['orderType'] == 'buy') {
              // console.log('buy 1');
              textCorrectName = 'Обмен: Купил ';
              // console.log("комиссия " + objectBal[objBal['feeAssetId']] + " - " + objBal['buyMatcherFee']/decFee);
              objectBal[objBal['feeAssetId']] -= (objBal['buyMatcherFee']/decFee);



              if (objectBal[objBal['order1']['assetPair']['amountAsset']]) {
                // console.log("amount " + objectBal[objBal['order1']['assetPair']['amountAsset']] + " + " + amount);
                objectBal[objBal['order1']['assetPair']['amountAsset']] += amount;
                // console.log("spend " + objectBal[objBal['order1']['assetPair']['priceAsset']] + " - " + spend);
                objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;

              } else {

                objectBal[objBal['order1']['assetPair']['amountAsset']] = amount;
                // console.log("hgjhgjamount " + objectBal[objBal['order1']['assetPair']['amountAsset']] + " + " + amount);
                objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;
                // console.log("jgjgjspend " + objectBal[objBal['order1']['assetPair']['priceAsset']] + " - " + spend);

              }

            } else {
                // console.log('sell');
              textCorrectName = 'Обмен: Продал ';
              objectBal[objBal['feeAssetId']] -= (objBal['sellMatcherFee']/decFee);

              if (objectBal[objBal['order1']['assetPair']['priceAsset']]) {

                objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
                objectBal[objBal['order1']['assetPair']['priceAsset']] += spend;

              } else {

                objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
                objectBal[objBal['order1']['assetPair']['priceAsset']] = spend;

              }
            }
          } else {
            if (objBal['order2']['orderType'] == 'buy') {
  // console.log('buy 2');
              textCorrectName = 'Обмен: Купил ';
              objectBal[objBal['feeAssetId']] -= (objBal['buyMatcherFee']/decFee);

              if (objectBal[objBal['order1']['assetPair']['amountAsset']]) {

                objectBal[objBal['order1']['assetPair']['amountAsset']] += amount;
                objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;

              } else {

                objectBal[objBal['order1']['assetPair']['amountAsset']] = amount;
                objectBal[objBal['order1']['assetPair']['priceAsset']] -= spend;
              }

            } else {
  // console.log('sell');
              textCorrectName = 'Обмен: Продал ';
              objectBal[objBal['feeAssetId']] -= (objBal['sellMatcherFee']/decFee);

              if (objectBal[objBal['order1']['assetPair']['priceAsset']]) {

                objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
                objectBal[objBal['order1']['assetPair']['priceAsset']] += spend;

              } else {

                objectBal[objBal['order1']['assetPair']['amountAsset']] -= amount;
                objectBal[objBal['order1']['assetPair']['priceAsset']] = spend;

              }
            }
          }
        } else if (objBal['type'] == 1) {
          objectBal[waves] = (objBal['amount']/100000000);
        } else if (objBal['type'] == 10) {
            // console.log('alias');
          let feeAssetId = listAssets[waves];
          let decFee = decimal(feeAssetId[1]);
          objectBal[waves] -= (objBal['fee']/decFee);
        } else if (objBal['type'] == 6) {
          console.log('burn');
          let feeAssetId = listAssets[waves];
          let decFee = decimal(feeAssetId[1]);
          objectBal[waves] -= (objBal['fee']/decFee);

          let assetId = listAssets[objBal['assetId']];
          let decAsset = decimal(assetId[1]);
          objectBal[objBal['assetId']] -= (objBal['amount']/decAsset);

        } else if (objBal['type'] == 12) {
          // console.log('data');
          let feeAssetId = listAssets[waves];
          let decFee = decimal(feeAssetId[1]);
          objectBal[waves] -= (objBal['fee']/decFee);
        } else if (objBal['type'] == 16) {
            // console.log('invoke');
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
            console.log('asset creation');
          let feeAssetId = listAssets[objBal['feeAssetId']];
          let decFee = decimal(feeAssetId[1]);
          objectBal[waves] -= (objBal['fee']/decFee);

          let assetId = listAssets[objBal['assetId']];
          let decAsset = decimal(assetId[1]);
          objectBal[objBal['assetId']] = (objBal['quantity']/decAsset);
        } else if (objBal['type'] == 9) {
          console.log('cancel leasing');
        let feeAssetId = listAssets[objBal['feeAssetId']];
        let decFee = decimal(feeAssetId[1]);
        objectBal[waves] -= objBal['fee']/decFee;
        } else if (objBal['type'] == 8) {
          console.log('leasing');
         let feeAssetId = listAssets[objBal['feeAssetId']];
         let decFee = decimal(feeAssetId[1]);
         objectBal[waves] -= (objBal['fee']/decFee);
        } else if (objBal['type'] == 11) {
        if(objBal['sender'] == reversedRawData[reversedRawData.length - 1]) {
          console.log('mass send');
          let feeAssetId = listAssets[objBal['feeAssetId']];
          let decFee = decimal(feeAssetId[1]);
          objectBal[waves] -= (objBal['fee']/decFee);
          let assetId = listAssets[objBal['assetId']];
          let decAsset = decimal(assetId[1]);
          objectBal[objBal['assetId']] -= objBal['totalAmount']/decAsset;
        } else {
          console.log('mass receive');
          let assetId = listAssets[objBal['assetId']];
          let decAsset = decimal(assetId[1]);
          for(let i = 0; i < objBal['transfers'].length; i++) {
            if (objBal['transfers'][i]['recipient'] == reversedRawData[reversedRawData.length - 1]) {
              if (objectBal[objBal['assetId']]) {

                objectBal[objBal['assetId']] += (objBal['transfers'][i]['amount']/decAsset);
              } else {

                objectBal[objBal['assetId']] = (objBal['transfers'][i]['amount']/decAsset);
              }
            }
          }
        }
        } else if (objBal['type'] == 5) {
          console.log('recreation asset');
          let feeAssetId = listAssets[objBal['feeAssetId']];
          let decFee = decimal(feeAssetId[1]);
          objectBal[waves] -= objBal['fee']/decFee;
          let assetId = listAssets[objBal['assetId']];
          let decAsset = decimal(assetId[1]);
          objectBal[objBal['assetId']] += objBal['quantity']/decAsset;
        } else if (objBal['type'] == 15) {
          console.log('set asset script');
          let feeAssetId = listAssets[objBal['feeAssetId']];
          let decFee = decimal(feeAssetId[1]);
          objectBal[waves] -= objBal['fee']/decFee;
        } else if (objBal['type'] == 13) {
          console.log('set script');
          let feeAssetId = listAssets[objBal['feeAssetId']];
          let decFee = decimal(feeAssetId[1]);
          objectBal[waves] -= objBal['fee']/decFee;
        } else if (objBal['type'] == 14) {
          console.log('sponsored');
          let feeAssetId = listAssets[objBal['feeAssetId']];
          let decFee = decimal(feeAssetId[1]);
          objectBal[waves] -= objBal['fee']/decFee;
        }
      } else {
        break;
      }
      // if (objectBal[waves]) {
      //   console.log(iter + ") " + objectBal);
      // }
      //
      // iter++;
    }
    // for (var id in objectBal) {
    //   console.log("Id " + id + " = " + objectBal[id].toFixed(8));
    // }
    console.log( objectBal );
  });
}
