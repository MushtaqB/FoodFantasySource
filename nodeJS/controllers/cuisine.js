const errorsHandler = require('../utils/errorsHandler');
const models = require('../models/index');
const Cuisines = models.cuisines;

exports.getAll = function (req, res) {
  Cuisines.findAll()
    .then(function (categories) {
      res.status(200).send(categories);
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    })
};
