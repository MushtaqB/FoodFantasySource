const i18n = require('i18n');
const models = require('../models/index');
const DeviceTokens = models.device_tokens;
const errorsHandler = require('../utils/errorsHandler');

exports.create = function (req, response) {
  console.log('=================== Create Device Token====================');

  const userId = req.user.user.user_id;
  const device_token = req.body.device_token;
  const tokenType = req.body.token_type;

  const notificationToken = {
    user_id: userId,
    device_token: device_token,
    token_type: tokenType
  };

  DeviceTokens.destroy({
    where: {device_token: device_token}
  })
    .then(function () {
      DeviceTokens.upsert(notificationToken)
        .then(function (created, result) {
          response.status(200).send(result);
        })
        .catch((error) => {
          console.log(error);
          errorsHandler.handle(500, error, response);
        });
    })
    .catch((error) => {
      console.log(error);
      errorsHandler.handle(500, error, response);
    });
}

exports.validate = function (req, response, next) {
  console.log('=================== Validate Device Token====================');
  req.checkBody('device_token', i18n.__('token is required')).notEmpty();
  req.checkBody('token_type', i18n.__('token_type is required')).notEmpty();

  let errors = req.validationErrors();

  const tokenType = req.body.token_type;

  if (!((tokenType == 'ANDROID') || (tokenType == 'IOS'))) {
    let error = {param: "token_type", msg: i18n.__("only ANDROID or IOS is allowed")};
    if (errors) errors.push(error);
    else errors = error;
  }

  if (errors) errorsHandler.handle(400, errors, response);
  else next();
}
