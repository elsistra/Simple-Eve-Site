module.exports = function (app) {
  const db = app.get('db');
  const regions = db.collection("regions");

  app.get('/', async (req, res) => {
    const allRegionsArray = await regions.find().toArray();
    // Send along Session Data
    res.render('index', { session: req.session, regions: allRegionsArray});
  });
};
