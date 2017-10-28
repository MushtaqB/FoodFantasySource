const i18n = require('i18n');
const models = require('../models/index');
const User = models.users;
const PendingUser = models.pending_users;

const idGenerator = require('../utils/id_generator');
const errorsHandler = require('../utils/errorsHandler');

exports.deletePendingUser = function (req, res, next) {
  let mobile = req.body.mobile;

  User.find({where: {mobile: mobile}})
    .then(function (result) {
      if (result) {
        // todo: update user mobile_activated to true if it's false "in case he update his mobile and logout without verification

        result.reload({
          include: [
            {model: models.roles, as: 'role'},
          ],
          exclude: [models.roles.role_id]
        }).then(function (fullUser) {
          req.user = {user: fullUser.toJSON()};
          console.log('login user: ' + req.user);
          next();
        }).catch(function (error) {
          errorsHandler.handle(500, error, res);
        });

      } else {

        PendingUser.find({where: {mobile: mobile}})
          .then(function (pendingUser) {
            User.create({
              user_id: idGenerator.generateId(),
              mobile: mobile,
              mobile_activated: true,
              role_id: pendingUser.role_id
            })
              .then(function (createdUser) {
                createdUser.reload({
                  include: [
                    {model: models.roles, as: 'role'},
                  ],
                  exclude: [models.roles.role_id]
                }).then(function (fullUser) {
                  req.user = {user: fullUser.toJSON()};
                  console.log('register user: ' + req.user);
                  PendingUser.destroy({where: {mobile: mobile}})
                    .then(function (pendingUser) {
                      next();
                    })
                    .catch(function (error) {
                      errorsHandler.handle(500, error, res);
                    });
                }).catch(function (error) {
                  errorsHandler.handle(500, error, res);
                });
              })
              .catch(function (error) {
                errorsHandler.handle(500, error, res);
              });
          }).catch(function (error) {
          errorsHandler.handle(500, error, res);
        });
      }
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};

exports.getById = function (req, res) {
  let userId = req.params.user_id;

  User.findById(userId)
    .then(function (user) {
      if (user) {
        res.status(200).send(user);
      } else {
        errorsHandler.handle(404, i18n.__("user not found"), res);
      }
    })
    .catch(function (error) {
      console.log(error);
      errorsHandler.handle(500, error, res);
    });
};

exports.findUser = function (userId) {
  return User.find({where: {user_id: userId}});
};

exports.update = function (req, res, next) {
  let user = req.body;
  let userId = req.user.user.user_id;

  if (req.files.length > 0) {
    user.avatar_image = req.files[0].filename;
  }

  User.update(user, {where: {user_id: userId}, fields: ['full_name', 'email', 'avatar_image']})
    .then(function (user) {
      next();
    })
    .catch(function (error) {
      console.log(error);
      errorsHandler.handle(500, error, res);
    });
};

exports.validateUpdate = (req, res, next) => {
  req.assert('email', i18n.__('Invalid email')).optional().isEmail();
  req.assert('full_name', i18n.__('Invalid name')).notEmpty().withMessage(i18n.__('full name is required'));

  let validationErrors = req.validationErrors();
  if (validationErrors) {
    errorsHandler.handle(400, validationErrors, res);
  } else {
    next();
  }
};

exports.sendUpdateResponse = (req, res) => {
  let userId = req.params.user_id;

  User.findOne({where: {user_id: userId}})
    .then((updatedUser) => {
      res.status(200).send(updatedUser);
    })
    .catch(function (error) {
      console.log(error);
      errorsHandler.handle(500, error, res);
    });
};
