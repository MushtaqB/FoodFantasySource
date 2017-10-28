const https = require('https');

const key = "3e27a515";
const secret = "6091bb77eb716fe0";
const adminPhone = "+966547771884";
let adminNotified = false;

const send = function (phoneNumber, message, callback) {

  if (process.env.NODE_ENV === 'local') {
    callback(200);
    return;
  }

  const data = JSON.stringify({
    api_key: key,
    api_secret: secret,
    to: phoneNumber,
    from: 'Magadeer',
    text: message
  });

  const options = {
    host: 'rest.nexmo.com',
    path: '/sms/json',
    port: 443,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options);

  req.write(data);
  req.end();

  let responseData = '';

  req.on('response', function (res) {
    callback(res.statusCode);

    res.on('data', function (chunk) {
      responseData += chunk;
    });

    res.on('end', function () {
      // console.log(responseData);
      checkBalance(responseData);
    });
  });
};

const checkBalance = function (responseData) {
  const jsonDate = JSON.parse(responseData);
  const remainingBalance = jsonDate.messages[0]["remaining-balance"];
  if (remainingBalance < 2) {
    if (!adminNotified) {
      const message = "SMS Balance is low: remainingBalance \n please recharge :)";
      send(adminPhone, message, function () {
      });
      adminNotified = true;
    }
  } else {
    adminNotified = false;
  }
};

exports.send = send;
