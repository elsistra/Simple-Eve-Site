const { requestDataFromUrl } = require('../lib/requestDataFromUrl');

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
