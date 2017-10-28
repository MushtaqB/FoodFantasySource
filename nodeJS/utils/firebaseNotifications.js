const request = require('request');
const config = require('../config/app_config');
const i18n = require('i18n');
const util = require('util');

const key = config.firebase_key;

exports.send = function (receivers, data) {
  console.log('=================== Push Firebase Notification ====================');

  return new Promise((resolve, reject) => {
    if (typeof receivers == "string") {
      receivers = [receivers];
    }

    console.log('data: ' + util.inspect(data, false, null));

    const options = {
      method: 'POST',
      url: 'https://fcm.googleapis.com/fcm/send',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=' + key
      },
      body: {
        "registration_ids": receivers,
        "priority": "high",
        "data": data,
        "notification": {
          "title": i18n.__('magadeer'), //data.notification_title,
          "body": data.notification_title
        }
      },
      json: true
    };

    console.log('options: ' + util.inspect(options, false, null));


    request(options, function (err, response, body) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log(body);
        resolve();
      }
    });
  })
};
