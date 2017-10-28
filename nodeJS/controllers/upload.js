const multer = require('multer');
const crypto = require('crypto');
const mkdirp = require('mkdirp');
const url = require('url');
const gm = require('gm');

const config = require('../config/app_config');
const errorsHandler = require('../utils/errorsHandler');

exports.uploadFiles = function (req, res, next) {

  let path_name = url.parse(req.url).pathname;
  let path = path_name.indexOf('/users') === 0 ? config.avatarsUploadPath : config.recipesUploadPath;

  let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path)
    },
    filename: function (req, file, cb) {
      getCryptoName(function (name) {
        cb(null, name + '.jpeg');
      })
    }
  });

  let upload = multer({storage: storage}).array('file');

  upload(req, res, function (err) {
    if (err) {
      errorsHandler.handle(500, err, res);
      return;
    }

    next();
  });
};

const getCryptoName = function (callback) {
  crypto.pseudoRandomBytes(16, function (err, raw) {
    callback(raw.toString('hex') + Date.now());
  });
};

exports.getCryptoName = getCryptoName;
