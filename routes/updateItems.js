const https = require('https');

const requestDataFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (resp) => {
      let data = '';
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk;
      });
      // The whole response has been received.
      resp.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (err) {
          err.context = { data }
          reject(err);
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

const composeProgressText = (current, total) => {
  const percent = Math.round(current / total * 100);
  return percent + '% ' + current.toLocaleString() + '/' + total.toLocaleString();
}

const composeLogProgressFunction = (progressText) => {
  return (message, ...args) => {
    console.log('[' + progressText + '] ' + message + ':', ...args);
  }
}

module.exports = (app) => {
  app.get('/updateItems', async (req, res, next) => {
    // Disable timeout for this request.
    req.setTimeout(0);

    const db = app.get('db');
    const itemsCollection = db.collection("items");

    const maxPages = 36;
    const failedItemPages = [];
    let itemIdsArray = [];
    for (var i = 0; i < maxPages; i++) {
      const pageNum = i + 1;
      const progressText = composeProgressText(pageNum, maxPages);
      const logProgress = composeLogProgressFunction(progressText);

      try {
        logProgress('fetching page', pageNum);
        itemPageIdsArray = await requestDataFromUrl('https://esi.evetech.net/latest/universe/types/?datasource=tranquility&page=' + pageNum);
      } catch (err) {
        console.error(err, err.context);
        logProgress('failed page', pageNum);
        failedItemPages.push(i);
      }

      if (itemPageIdsArray) {
        logProgress('received page', pageNum);
        itemIdsArray = itemIdsArray.concat(itemPageIdsArray);
      }
    }

    console.log('failed page item IDs count:', failedItemPages.length);
    console.log('item IDs count:', itemIdsArray.length);

    await itemsCollection.deleteMany();

    const failedItems = []
    for (var i = 0; i < itemIdsArray.length; i++) {
      // Use ItemID to get item name using API call.

      const itemId = itemIdsArray[i];
      const progressText = composeProgressText(i + 1, itemIdsArray.length);
      const logProgress = composeLogProgressFunction(progressText);

      let itemInfo;
      try {
        logProgress('fetching item', itemId);
        itemInfo = await requestDataFromUrl('https://esi.evetech.net/latest/universe/types/' + itemId + '/?datasource=tranquility&language=en-us');
      } catch (err) {
        console.error(err, err.context);
        logProgress('failed item', itemId);
        failedItems.push(itemId);
      }

      if (itemInfo) {
        logProgress('saving item', itemId);
        await itemsCollection.insert({ _id: itemId, name: itemInfo.name});
      }
    }

    console.log('failed items count:', failedItems.length);

    //res.end('Success!');
    res.redirect('/');
  });
}
