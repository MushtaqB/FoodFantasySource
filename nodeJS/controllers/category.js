const errorsHandler = require('../utils/errorsHandler');
const models = require('../models/index');
const Categories = models.categories;

exports.getAll = function (req, res) {
  Categories.findAll()
    .then(function (categories) {
      res.status(200).send(categories);
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    })
};
