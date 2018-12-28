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
        resolve(JSON.parse(data));
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

module.exports = (app) => {
  app.get('/updateItems', async (req, res, next) => {
    const db = app.get('db');
    var itemIdsArray = [];
    const itemsCollection = db.collection("items");

    for (var i = 1; i < 37; i++){
      const itemPageIdsArray = await requestDataFromUrl('https://esi.evetech.net/latest/universe/types/?datasource=tranquility&page=' + i);
      itemIdsArray = itemIdsArray.concat(itemPageIdsArray);
    }
    console.dir(itemIdsArray);
    await itemsCollection.deleteMany();
    await Promise.all(itemIdsArray.map(async (itemId) => {
      // Use ItemID to get item name using API call
      var itemInfo = await requestDataFromUrl('https://esi.evetech.net/latest/universe/types/' + itemId + '/?datasource=tranquility&language=en-us');
      await itemsCollection.insert({ _id: itemId, name: itemInfo.name});
    }));

    //res.end('Success!');
    res.redirect('/');
  });
}
