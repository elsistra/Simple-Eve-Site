const { requestDataFromUrl } = require('../lib/requestDataFromUrl');
const { composeProgressText } = require('../lib/composeProgressText');
const { composeLogProgressFunction } = require('../lib/composeLogProgressFunction');

module.exports = (app) => {
  app.get('/updateItems', async (req, res, next) => {
    // Disable timeout for this request.
    req.setTimeout(0);

    const db = app.get('db');
    const itemsCollection = db.collection("items");

    let itemIdsArray = [];

    const batchMax = 10;
    let batch = [];

    let failedItemPagesCount = 0;
    const maxPages = 36;
    for (var i = 0; i < maxPages; i++) {
      const pageNum = i + 1;
      const progressText = composeProgressText(pageNum, maxPages);
      const logProgress = composeLogProgressFunction(progressText);

      const promise = new Promise(async (resolve) => {
        let itemPageIdsArray;
        try {
          logProgress('fetching page', pageNum);
          itemPageIdsArray = await requestDataFromUrl('https://esi.evetech.net/latest/universe/types/?datasource=tranquility&page=' + pageNum);
          logProgress('received page', pageNum);
          itemIdsArray = itemIdsArray.concat(itemPageIdsArray);
        } catch (err) {
          console.error(err, err.context);
          logProgress('failed page', pageNum);
          failedItemPagesCount++
        }

        resolve();
      });

      batch.push(promise);

      if (batch.length >= batchMax) {
        logProgress('flushing batch');
        await Promise.all(batch);
        logProgress('flushed batch');
        batch = [];
      }
    }

    if (batch.length) {
      console.log('flushing batch');
      await Promise.all(batch);
      console.log('flushed batch');
      batch = [];
    }

    console.log('failed page item IDs count:', failedItemPagesCount);
    console.log('item IDs count:', itemIdsArray.length);

    await itemsCollection.deleteMany();

    let failedItemsCount = 0;
    for (var i = 0; i < itemIdsArray.length; i++) {
      // Use ItemID to get item name using API call.

      const itemId = itemIdsArray[i];
      const progressText = composeProgressText(i + 1, itemIdsArray.length);
      const logProgress = composeLogProgressFunction(progressText);

      const promise = new Promise(async (resolve) => {
        let itemInfo;
        try {
          logProgress('fetching item', itemId);
          itemInfo = await requestDataFromUrl('https://esi.evetech.net/latest/universe/types/' + itemId + '/?datasource=tranquility&language=en-us');
        } catch (err) {
          console.error(err, err.context);
          logProgress('failed item', itemId);
          failedItemsCount++;
        }

        if (itemInfo) {
          logProgress('saving item', itemId, itemInfo.name);
          await itemsCollection.insert({ _id: itemId, name: itemInfo.name });
          logProgress('saved item', itemId, itemInfo.name);
        }

        resolve();
      });

      batch.push(promise);

      if (batch.length >= batchMax) {
        logProgress('flushing batch');
        await Promise.all(batch);
        logProgress('flushed batch');
        batch = [];
      }
    }

    if (batch.length) {
      console.log('flushing batch');
      await Promise.all(batch);
      console.log('flushed batch');
      batch = [];
    }

    console.log('failed items count:', failedItemsCount);

    //res.end('Success!');
    res.redirect('/');
  });
}
