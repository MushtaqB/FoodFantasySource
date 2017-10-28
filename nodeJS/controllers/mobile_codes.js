const i18n = require('i18n');
const errorsHandler = require('../utils/errorsHandler');
const smsProvider = require('../utils/nexmo');
const config = require('../config/app_config');
const moment = config.moment;
const models = require('../models/index');
const MobileCodes = models.mobile_codes;
const User = require('./user');

const accountSid = 'ACcd41bab55b759e50dd1500ac22589b44';
const authToken = 'bc58fe8e9b16093a3c256b00ed0836a0';
const client = require('twilio')(accountSid, authToken);

exports.setUsed = function (req, res, next) {
  const mobile = req.body.mobile;
  const code = req.body.code;
  MobileCodes.update({used: true}, {where: {mobile: mobile, code: code}})
    .then(function (result) {
      next();
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};

const createAndSendCode = function (mobile, res) {
  const code = {
    mobile: mobile,
    code: Math.floor(1000 + Math.random() * 9000),
    expire_at: moment().add(30, 'minutes')
  };

  const message = i18n.__("your activation code is: ") + ' ' + code.code;

  MobileCodes.create(code)
    .then(function (result) {
      if (process.env.NODE_ENV === 'local') {
        res.status(200).send({success: true});
      } else {

        // smsProvider.send(mobile.substring(1), message, function (error, statusCode) {
        //   if (statusCode == 200) {
        //     res.status(200).send({success: true});
        //   } else {
        //     errorsHandler.handle(500, i18n.__('SMS Provider failed to send message'), res);
        //   }
        // });

        sendSMS(mobile, message)
          .then((message) => {
            console.log(message.sid);
            res.status(200).send({success: true});
          })
          .catch((e) => {
            console.log(e);
            errorsHandler.handle(500, i18n.__('SMS Provider failed to send message'), res);
          });
      }
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};

const sendSMS = function (mobile, message) {
  return client.messages
    .create({
      to: mobile,
      from: '+16467830745',
      body: message,
    });
};

exports.verifySMSCode = function (req, res, next) {
  const mobile = req.body.mobile;
  let code = req.body.code;

  code = code.replace(/[٠١٢٣٤٥٦٧٨٩]/g, function(d) {
    return d.charCodeAt(0) - 1632;
  });

  MobileCodes.findOne({
    where: {mobile: mobile, code: code, expire_at: {$gt: Date.now()}, used: false}
  })
    .then(function (result) {
      if (result) {
        next();
      } else {
        errorsHandler.handle(400, i18n.__("Invalid SMS activation code"), res);
      }
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};


exports.create = function (req, response) {
  const mobile = req.body.mobile;
  createAndSendCode(mobile, response);
};

exports.validate = function (req, res, next) {
  req.assert('code', i18n.__('code is required'))
    .notEmpty().isInt();

  const errors = req.validationErrors();

  if (errors) errorsHandler.handle(400, errors, res);
  else next();
};

// ckeck if there is another user with the same mobile set it to unverified
exports.checkOtherMobile = function (req, res, next) {
  const userId = req.user.user.user_id;
  const mobile = req.body.mobile;

  User.find({where: {mobile: mobile, user_id: {$not: userId}}}).then(function (user) {
    if (user) {
      User.updateWithAttributes({mobile_activated: false}, user.user_id).then(function (result) {
        next();
      }).catch(function (error) {
        errorsHandler.handle(500, error, res);
      });
    }
    else next();
  }).catch(function (error) {
    errorsHandler.handle(500, error, res);
  });
};


exports.activateUser = function (req, res, next) {
  const user = req.user.user;
  const attributes = {mobile_activated: true};
  User.updateWithAttributes(attributes, user.user_id).then(function (result) {
    user.mobile_activated = true;
    next();
  }).catch(function (error) {
    errorsHandler.handle(500, error, res);
  });
};

exports.validatePeriod = function (req, res, next) {
  const mobile = req.query.mobile;

  MobileCodes.find({
    where: {
      mobile: mobile,
      created_at: {$gte: moment().subtract(60, 'seconds')}
    }
  }).then(function (result) {
    if (result) {
      const error = {param: "code", msg: i18n.__("please wait for 60 seconds to request another code")}
      errorsHandler.handle(429, error, res);
    } else next();
  })
};

exports.responseWithMobile = function (req, res) {
  const mobile = req.body.mobile;

  res.status(200).send({mobile: mobile});
};

exports.sendSMS = sendSMS;
exports.createAndSendCode = createAndSendCode;
