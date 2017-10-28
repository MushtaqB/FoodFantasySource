var i18n = require('i18n');
var passport = require('passport');
const util = require('util');
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

var BearerStrategy = require('passport-http-bearer').Strategy;

var errorsHandler = require('../utils/errorsHandler');
var Roles = require('../commons/roles_const').Roles;
var models = require('../models/index');
var User = models.users;
var PendingUser = models.pending_users;

var TokenController = require('./token');
var UserController = require('./user');
var mobileCodeController = require('./mobile_codes');

passport.use(new BearerStrategy(
  function (token, cb) {
    TokenController.findToken(token)
      .then(function (result) {

        if (!result) {
          throw new Error(i18n.__('Invalid access token'))
        }

        console.log('user id: ' + result.user_id);
        console.log('token: ' + token);
        console.log('token object: ' + util.inspect(result.toJSON(), false, null));

        return UserController.findUser(result.user_id);
      })
      .then(function (user) {

        if (!user) {
          throw new Error(i18n.__('Invalid access token'))
        }

        console.log('user: ' + user);
        return cb(null, {user: user, token: token})
      })
      .catch(function (error) {
        console.log(error);
        return cb(null, false);
      });
  }
));

exports.authenticate = passport.authenticate('bearer', {session: false});

exports.authorize = function(req, res, next) {
  let user_id = req.user.user.user_id;
  let requested_user_id = req.params.user_id;

  if (user_id === requested_user_id) {
    next();
  } else {
    res.status(401).send({message: i18n.__('Invalid access token')});
  }
};

exports.isValidMobileNumber = function (req, res, next) {
  let mobile = req.body.mobile;

  // Fix mobile number
  mobile = mobile.replace(/[٠١٢٣٤٥٦٧٨٩]/g, function(d) {
    return d.charCodeAt(0) - 1632;
  });
  mobile = mobile.replace('+96605', '+9665');
  req.body.mobile = mobile;

  req.assert('mobile', i18n.__('Invalid mobile')).notEmpty().withMessage(i18n.__('Filed is required'));

  var errors = req.validationErrors();

  var mobileObj = phoneUtil.parse(mobile);
  if(!phoneUtil.isValidNumber(mobileObj)) {
    var error = {param: "mobile", msg: i18n.__("Invalid mobile")};
    if (errors)
      errors.push(error);
    else
      errors = error;
  }

  if (errors) {
    errorsHandler.handle(400, errors, res);
  } else {
    next();
  }
};

exports.setAsRecipeOwner = function (req, res, next) {
  req.is_provider = true;
  next();
};

exports.sendSMS = function (req, res) {
  let mobile = req.body.mobile;

  User.find({where: {mobile: mobile}})
    .then(function (user) {
      if (user) {
        // Send sms activation code
        mobileCodeController.createAndSendCode(mobile, res);
      } else {
        // create pending user
        let role_id = req.is_provider ? Roles.RECIPE_OWNER : Roles.USER;
        PendingUser.upsert({mobile: mobile, role_id: role_id})
          .then(function (pendingUser) {
            // Send sms activation code
            mobileCodeController.createAndSendCode(mobile, res);
          })
          .catch(function (error) {
            errorsHandler.handle(500, error, res);
          });
      }
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    })
};

exports.login = function (req, res) {
  TokenController.createToken(req.user.user.user_id)
    .then(function (result) {
      req.user.access_token = result.get({plain: true}).access_token;
      res.status(200).send(req.user);
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};

exports.logout = function (req, res) {
  TokenController.deleteToken(req.user.token)
    .then(function (result) {
      res.status(200).send();
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};


exports.isValidSMSActivationCode = function (req, res, next) {

  let code = req.body.code;
  code = code.replace(/[٠١٢٣٤٥٦٧٨٩]/g, function(d) {
    return d.charCodeAt(0) - 1632;
  });
  req.body.code = code;

  req.assert('code', i18n.__('Invalid SMS activation code'))
    .notEmpty().isInt();

  var errors = req.validationErrors();

  if (errors) {
    errorsHandler.handle(400, errors, res);
  } else {
    next();
  }
};

exports.hasRecipeOwnerPerm = function (req, res, next) {
  if (req.user.user.role_id === Roles.RECIPE_OWNER || req.user.user.role_id === Roles.ADMIN) {
    next();
  } else {
    res.status(401).send({
      message: i18n.__('You are not authorized to do this action')});
  }
};

exports.hasAdminPerm = function (req, res, next) {
  if (req.user.user.role_id === Roles.ADMIN) {
    next();
  } else {
    res.status(401).send({
      message: i18n.__('You are not authorized to do this action')});
  }
};
exports.isAdminOrSupervisor = function (req, response, next) {
  console.log("============================== Validate is Admin or Supervisor =============================");
  let reqUser = req.user.user;

  if (isAdmin(reqUser)) {
    next();
  } else if (isSupervisor(reqUser)) {
    next();
  } else {
    response.send(401);
  }
};

const isAdmin = function (user) {
  return user.role_id === Roles.ADMIN;
};

const isSupervisor = function (user) {
  return user.role_id === Roles.SUPERVISOR;
};
