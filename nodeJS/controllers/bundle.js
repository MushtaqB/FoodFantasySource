var i18n = require('i18n');
var errorsHandler = require('../utils/errorsHandler');
var idGenerator = require('../utils/id_generator');

var models = require('../models/index');
var Bundle = models.bundles;

var config = require('../config/app_config');

exports.getBundles = function (req, res) {
  req.assert('id', i18n.__('truck id is required')).notEmpty().isInt();
  var errors = req.validationErrors();
  if (errors) {
    errorsHandler.handle(400, errors, res);
  } else {
    Bundle.findAll({
      where: {
        truck_id: req.params.id
      }
    })
      .then(function (results) {
        results.forEach(function (bundle) {
          bundle.bundle_images = JSON.parse(bundle.bundle_images);
        });
        res.status(200).send(results);
      }).catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
  }
};

exports.isValidBundleForAdd = function (req, res, next) {
  req.assert('bundle_name_ar', i18n.__('bundle name in Arabic is required')).notEmpty();
  req.assert('bundle_name_en', i18n.__('bundle name in English is required')).notEmpty();
  req.assert('bundle_desc_ar', i18n.__('bundle description in Arabic is required')).notEmpty();
  req.assert('bundle_desc_en', i18n.__('bundle description in English is required')).notEmpty();
  req.assert('price', i18n.__('price is required')).notEmpty().isInt();
  req.assert('bundle_capacity', i18n.__('capacity is required')).notEmpty().isInt();
  req.assert('from_time', i18n.__('from time is required')).notEmpty();
  req.assert('to_time', i18n.__('to time is required')).notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    errorsHandler.handle(400, errors, res);
  } else {
    next();
  }
};

exports.addBundle = function (req, res) {
  var user_id = req.user.user.user_id;
  var files = req.files;
  var bundle_images = [];

  if (files) {
    var images = files['image'];

    if (images && images.length > 0) {
      images.forEach(function (image) {
        bundle_images.push({
          image_id: idGenerator.generateId(),
          mime_type: image.mimetype,
          image_name: image.filename,
          url: ''
        });
      })
    }
  }

  var bundle = {
    bundle_id: idGenerator.generateId(),
    bundle_name_en: req.body.bundle_name_en,
    bundle_name_ar: req.body.bundle_name_ar,
    bundle_desc_en: req.body.bundle_desc_en,
    bundle_desc_ar: req.body.bundle_desc_ar,
    truck_id: req.params.id,
    price: req.body.price,
    currency_en: "SAR",
    currency_ar: "ريال سعودي",
    bundle_capacity: req.body.bundle_capacity,
    from_time: req.body.from_time,
    to_time: req.body.to_time,
    bundle_images: JSON.stringify(bundle_images)
  };

  Bundle.create(bundle)
    .then(function (result) {
      var addedBundle = result.get({plain: true});
      addedBundle.bundle_images = JSON.parse(addedBundle.bundle_images);
      res.status(201).send(addedBundle);
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};
