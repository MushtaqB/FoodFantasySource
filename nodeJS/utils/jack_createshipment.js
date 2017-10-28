const request = require('request');
const config = require('../config/app_config');
const i18n = require('i18n');
const crypto = require('crypto');
const util = require('util');
const moment = require('moment');

const jack_api = config.jack_api;
const jack_app_key = config.jack_app_key;
const jack_app_secret = config.jack_app_secret;

exports.send = function (order, quantity, cname, cmobile, address) {
  console.log('=================== Jack Create Shipment ====================');

  const timestamp = Date.now();
  let hash = crypto.createHmac('sha256', jack_app_secret).update(timestamp.toString()).digest('hex');

  let client_mobile = cmobile;
  let client_address = address;
  let client_name = cname;
  let qty = quantity.toString();
  let client_latitude = order.latitude.toString();
  let client_longitude = order.longitude.toString();

  // let order_pickup_date  = order.delivery_date;
  // order_pickup_date = order_pickup_date.toISOString().substring(0, 10);
  // let order_pickup_hour  = order.delivery_time.toString();

  let now = moment().utcOffset(3);
  let formatted = now.format('YYYY-MM-DD HH:mm:ss');
  console.log(formatted);

  let order_pickup_date = formatted.split(' ')[0];
  let t = formatted.split(' ')[1];

  let order_pickup_hour = t.split(':')[0] + ":" + t.split(':')[1];
  console.log('time: ' + order_pickup_hour);
  console.log('date: ' + order_pickup_date);

  // let delivery_h = parseInt(order.delivery_time.split(' ')[0].split(':')[0]);
  // let delivery_m = "00";
  //
  // if (delivery_h === 12) {
  //   delivery_h = 23;
  //   delivery_m = "59";
  // } else {
  //   delivery_h = (delivery_h + 12) % 24;
  // }

  // order_pickup_hour = delivery_h + ":" + delivery_m;

  console.log('order_pickup_date: ' + order_pickup_date);
  console.log('order_pickup_hour: ' + order_pickup_hour);

  let comment = order.notes;
  let total = order.total_price.toString();

  return new Promise((resolve, reject) => {

    const rq = {
      method: 'POST',
      url: jack_api + 'corporate/shippings',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': hash,
        'App-Key': jack_app_key,
        'App-Stamp': timestamp
      },
      body: {
        "order": {
          "comment": comment,
          "description": "",

          "end_location": {
            "address": client_address,
            "address_2": null,
            "latitude": client_latitude,
            "longitude": client_longitude
          },

          "payment_method": "cash_on_recipient",
          "os": "",

          "name": '',
          "phone": '',
          "email": '',

          "pickup_date": order_pickup_date,
          "pickup_hour_text": order_pickup_hour,

          "quantity": qty,
          "act_package_fare": total,

          "recipient_name": client_name,
          "recipient_phone": client_mobile,
          "recipient_email": null,

          "promotion_code": null,

          "requested_cab_types": [
            "economy"
          ],
          "requested_delivery_items": [
            "medium_box"
          ],

          "start_location": {
            "address": 'طريق الأمير محمد بن سعدبن عبدالعزيز ، تقاطع شارع السلمانية ، خلف صيدلية النهدي',
            "address_2": 'مبنى مقادير',
            "latitude": "24.778261184692383",
            "longitude": "46.6160888671875"
          }
        }
      },
      json: true
    };

    console.log('JACK rq: ' + util.inspect(rq.body.order, false, null));

    request(rq, function (err, response, body) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log(body);
        resolve({id: body.id, status: body.status});
      }
    });
  })
};
