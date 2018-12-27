module.exports = function (app) {
  // Render the index page on request
  app.get('/', (req, res) => {
    // Send along Session Data
    res.render('index', { session: req.session });
  });
};
