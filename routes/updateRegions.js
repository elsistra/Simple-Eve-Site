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
  app.get('/updateRegions', async (req, res, next) => {
    const db = app.get('db');
    const regionsCollection = db.collection("regions");

    const regionIdsArray = await requestDataFromUrl('https://esi.evetech.net/latest/universe/regions/?datasource=tranquility');
    await regionsCollection.deleteMany();

    await Promise.all(regionIdsArray.map(async (regionId) => {
      // Use regionID to get region name using API call
      const regionInfo = await requestDataFromUrl('https://esi.evetech.net/latest/universe/regions/' + regionId + '/?datasource=tranquility&language=en-us');
      await regionsCollection.insert({ _id: regionId, name: regionInfo.name});
    }));

    //res.end('Success!');
    res.redirect('/');
  });
}
