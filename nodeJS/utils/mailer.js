const request = require('request');
const config = require('../config/app_config');
const key = config.sendgrid_key;

exports.send = function (sendTo, subject, contentText) {
  var mail = {
    "personalizations": [
      {
        "to": [
          {
            "email": sendTo
          }
        ],
        "subject": subject
      }
    ],
    "from": {
      "email": "truckilapp@gmail.com"
    },
    "content": [
      {
        "type": "text/plain",
        "value": contentText
      }
    ]
  };

  var requestContent = {
    method: 'POST',
    url: 'https://api.sendgrid.com/v3/mail/send',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key
    },
    body: mail,
    json: true
  };

  request(requestContent, function (err, response, body) {
    console.log('-------- response', response.statusCode);
    if (err) {
      console.log('------- error ', err);
    } else {
      console.log('----- body ', body);
    }
  })
};
