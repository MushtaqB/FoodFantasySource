const apn = require('apn');
const homedir = require('homedir');
const configs = require('../config/app_config');
const bundleId = configs.bundleId;
const isProduction = configs.isProduction;
const util = require('util');
const cerrificate = configs.apnCertificate;
const passphrase = configs.passphrase;

exports.send = (deviceTokens, payload) => {
  console.log("============================ APN Called =======================");

  return new Promise( (resolve, reject) => {
    let options = {
      pfx: cerrificate,
      passphrase: passphrase,
      production: true // Set to true if sending a notification to a production iOS app
    };

    let apnProvider = new apn.Provider(options);

    let notification = new apn.Notification();
    notification.alert = payload.notification_title;
    notification.topic = bundleId;
    notification.payload = payload;

    console.log('>>>>>>>>> Push APN notification' + util.inspect(notification, false, null));

    apnProvider.send(notification, deviceTokens).then( (result) => {
      console.log('APN result:', util.inspect(result, false, null));

      let invalid_tokens = [];
      let devices = result.failed;

      for (let i=0; i<devices.length; ++i) {
        let device = devices[i].device;
        invalid_tokens.push(device);
      }

      result.invalid_tokens = invalid_tokens;

      apnProvider.shutdown();

      resolve(result);
    });
  })
};
