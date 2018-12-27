const https = require('https');

module.exports = function (app) {
  app.get('/updateRegions', function (req, res, next) {
    const db = app.get('db');
    const regionsCollection = db.collection("regions");
    https.get('https://esi.evetech.net/latest/universe/regions/?datasource=tranquility', (resp) => {
      let data = '';

      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', async () => {
        const regionIdsArray = JSON.parse(data);

        await Promise.all(regionIdsArray.map(async (regionId) => {
          await regionsCollection.insert({ _id: regionId });
        }));

        res.end('Success!');
        next();
      });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
      res.end('Fail!');
      next();
    });
  });
}
