const models = require('../models/index');
const Roles = require('../commons/roles_const').Roles;

const fcm = require('./firebaseNotifications');
const apn = require('./apnNotifications');
const i18n = require('i18n');
const User = models.users;
const Order = models.orders;
const NotificationToken = models.device_tokens;
const util = require('util');

exports.notifyAdminsAndSupervisors = function (orderId, msg) {
  console.log("Notify admins and supervisors, msg", msg);

  let order = null;
  let users = [];

  Order.findOne({
    where: {
      order_id: orderId
    }
  })
    .then(function (orderRes) {
      if (orderRes) {
        order = orderRes.get({plain: true});

        // Find users
        return User.all({
          attributes: ['user_id'],
          where: {
            role_id: [Roles.ADMIN, Roles.SUPERVISOR]
          }
        })
      }
    })
    .then(function (users) {
      let data = extractDataMessage(msg, order);
      push(users, data);
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.notifyOwner = function (orderId, msg) {
  console.log("Notify Order Owner orderId", orderId);

  Order.findOne({
    where: {
      order_id: orderId
    }
  })
    .then(function (orderRes) {
      if (orderRes) {
        const order = orderRes.get({plain: true});

        let users = [{user_id: order.user_id}];
        let data = extractDataMessage(msg, order);
        push(users, data);

      } else {
        console.log({message: i18n.__('order not found')});
      }
    })
    .catch((error) => {
      console.log(error);
    })
};

const extractDataMessage = (msg, order) => {
  const data = {
    notification_type: "order_status_update",
    notification_title: msg,
    order_id: order.order_id
  };

  if (order) {
    data.order_id = order.order_id;
    data.user_id = order.user_id;
    data.driver_id = order.driver_id;
    data.status_id = order.status_id;
    data.created_at = order.created_at;
    data.updated_at = order.updated_at;
  }

  return data;
};

const push = (users, message) => {
  let ids = [];
  for (let i = 0; i < users.length; ++i) {
    ids.push(users[i].user_id)
  }

  let androidTokens = [];
  let iOSTokens = [];

  // Get users tokens
  NotificationToken.all({where: {user_id: ids}, raw: true})
    .then((deviceTokens) => {

      // Split device tokens
      for (let i = 0; i < deviceTokens.length; ++i) {
        androidTokens.push(deviceTokens[i].device_token);

        // if (deviceTokens[i].token_type == "IOS") {
        //   iOSTokens.push(deviceTokens[i].device_token);
        // } else {
        //   androidTokens.push(deviceTokens[i].device_token);
        // }
      }

      if (androidTokens.length > 0) {
        fcm.send(androidTokens, message)
          .then((result) => {
            // TODO: get invalid tokens from fcm
            // console.log('Invalid Firebase tokens: ' + result.invalid_tokens);
            // if (result.invalid_tokens.length > 0) {
            //   NotificationToken.destroy({where: {device_token: result.invalid_tokens}});
            // }
          })
          .catch((e) => {
            console.log(e);
          })
      }

      if (iOSTokens.length > 0) {
        apn.send(iOSTokens, message)
          .then((result) => {
            console.log('Invalid APN tokens size: ' + result.invalid_tokens.length);
            if (result.invalid_tokens.length > 0) {
              NotificationToken.destroy({where: {device_token: result.invalid_tokens}});
            }
          })
          .catch((e) => {
            console.log(e);

          })
      }
    })
    .then(() => {
      console.log('Push completed');
    })
    .catch((e) => {
      console.log(e);
    });
};