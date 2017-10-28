const express = require('express');
const router = express.Router();
const errorsHandler = require('../utils/errorsHandler');

const dashboardController = require('../controllers/dashboard');
const authController = require('../controllers/auth');
const driversController = require('../controllers/user');
const orderTransactionsController = require('../controllers/order_transactions');
const orderController = require('../controllers/order');
const scheduleController = require('../controllers/schedule');

const add_recipes = require('../scripts/add_recipes');

const fs = require("fs");
const PDFDocument = require('pdfkit');

const gm = require('gm').subClass({imageMagick: true});
const ArabicReshaper = require('arabic-reshaper');
const request = require('request');
const moment = require('moment');
const MultiHashMap = require('multi-hashmap').MultiHashMap;

router.route('/orders')
  .get(authController.authenticate,
    authController.isAdminOrSupervisor,
    dashboardController.getOrders);

router.route('/orders/:order_id/:status_id')
  .put(authController.authenticate,
    orderController.isOrderOwner,
    orderController.updateOrderStatus);

router.route('/schedules')
  .get(authController.authenticate,
    authController.isAdminOrSupervisor,
    scheduleController.getNextSchedules)
  .post(authController.authenticate,
    authController.isAdminOrSupervisor,
    scheduleController.updateSchedule)
  .delete(authController.authenticate,
    authController.isAdminOrSupervisor,
    scheduleController.deleteSchedule);

router.route('/orders/webhook-url')
  .post(orderController.updateJackShipmentStatus);

router.route('/recipes/seed')
  .get(authController.authenticate,
    authController.isAdminOrSupervisor,
    add_recipes.seedRecipes);

router.route('/print')
  .get(function (req, res) {

    let orders = null;

    let date = req.query.date;
    let boxes = [];

    dashboardController.getOrdersForPrinting(date)
      .then((result) => {
        const all = result.map((r) => {
          r.jack = JSON.parse(r.jack);
          return r.toJSON();
        });

        orders = all;
        console.log('orders size: ' + orders.length);

        let promises = [];

        let orderLinesMap = new MultiHashMap('order_id', 'order_line');
        let orderMap = new MultiHashMap('order_id', 'order');
        let ordersSet = new Set();

        for (let i = 0; i < orders.length; ++i) {
          let o = all[i];
          for (let j=0; j<o.order_lines.length; ++j) {
            let ol = o.order_lines[j].toJSON();
            orderLinesMap.insert(o.order_id, ol);
            orderMap.insert(o.order_id, o);
            ordersSet.add(o.order_id);
          }
        }

        console.log('orders set size: ' + ordersSet.size);

        for (let orderId of ordersSet) {
          let orderLines = orderLinesMap.findAll('order_id', orderId);

          console.log('order lines size: ' + orderLines.length);

          let total_box_count = Math.ceil(orderLines.length /2);
          let o = orderMap.find('order_id', orderId)[1];

          let name = o.user.full_name;

          if (!name) {
            name = "";
          }

          let arabic = /[\u0600-\u06FF]/;
          if (arabic.test(name)) {
            name = ArabicReshaper.convertArabic(name).split("").reverse().join("");
          }

          let delivery_date = o.delivery_date;
          delivery_date = moment(delivery_date).format('DD/MM');

          for (let i = 0; i < orderLines.length; i+=2) {
            let ol1 = orderLines[i][1];
            let ol2 = null;
            let recipe_2_title = null;
            let recipe_2_serving = null;

            console.log('order line id: ' + ol1.id);

            let r = ol1.recipe.toJSON();
            let recipe_1_title = r.title;
            let recipe_1_serving = ol1.serving_number === 2 ? 'شخصين' : 'عائلية';
            console.log(recipe_1_title);

            if (i+1 !== orderLines.length) {
              ol2 = orderLines[i+1][1];
              let r2 = ol2.recipe.toJSON();
              recipe_2_title = r2.title;
              recipe_2_serving = ol2.serving_number === 2 ? 'شخصين' : 'عائلية';
              console.log(recipe_2_title);
            }

            let box = {
              order_id: o.order_id.toString(),
              order_line_id: ol1.id,
              location: o.latitude + ',' + o.longitude,
              full_name: name,
              mobile: o.user.mobile.replace('+9665', '05'),
              delivery_date: delivery_date,
              delivery_time: o.delivery_time,
              box_count: (i/2) + 1 + "/" + total_box_count,
              price: o.total_price + " SAR",
              recipe_1: ArabicReshaper.convertArabic(recipe_1_title).split("").reverse().join(""),
              recipe_1_serving: ArabicReshaper.convertArabic(recipe_1_serving).split("").reverse().join(""),
              recipe_2: '',
              recipe_2_serving: ''
            };

            if (ol2) {
              box.recipe_2 = ArabicReshaper.convertArabic(recipe_2_title).split("").reverse().join("");
              box.recipe_2_serving = ArabicReshaper.convertArabic(recipe_2_serving).split("").reverse().join("")
            }

            boxes.push(box);
          }
        }

        console.log('boxes size: ' + boxes.length);

        for (let b=0; b<boxes.length; ++b) {
          let box = boxes[b];
          let p = downloadQR(box.location, box.order_line_id);
          promises.push(p);
        }

        return Promise.all(promises);
      })
      .then((QRs) => {

        console.log('QRs size: ' + QRs);

        for (let q=0; q<QRs.length; ++q) {
          let qr = QRs[q];
          for (let i=0; i<boxes.length; ++i) {
            console.log('check ' + boxes[i].order_line_id + ' === ' + qr.order_line_id);
            if (boxes[i].order_line_id === qr.order_line_id) {
              boxes[i].image_path = qr.image_path;
            }
          }
        }

        let promises = [];

        for (let b=0; b<boxes.length; ++b) {
          let box = boxes[b];
          let p = generateImage(box);
          promises.push(p);
        }

        return Promise.all(promises);
      })
      .then((results) => {

        if (results != null && results.length > 0) {

          let pdfFile = '/tmp/' + date + '.pdf';
          let pdfStream = fs.createWriteStream(pdfFile);
          let doc = new PDFDocument({size: [1698, 1700]});

          for (let i=0; i<results.length; ++i) {
            doc.image(results[i].image_path, 0, 0);

            if (i+1 !== results.length) {
              doc.addPage();
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-type', 'application/pdf');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-disposition', 'attachment; filename=output.pdf');

          doc.pipe(pdfStream);
          doc.end();

          pdfStream.addListener('finish', function () {
            res.download(pdfFile);
          });
        } else {
          res.status(200).send();
        }
      })
      .catch((error) => {
        console.log(error);
        errorsHandler.handle(500, error, res);
      });


    //
    // gm(request('https://api.qrserver.com/v1/create-qr-code/?size=540x540&data=ahmed'))
    //   .command('composite')
    //   // .out('-geometry', '+900+800') // offset
    //   .write("./print/output.jpg", function (err) {
    //     if (!err) {
    //       console.log('done');
    //     }
    //   });

  });

const downloadQR = (location, order_line_id) => {
  console.log('downloadQR order line id: ' + order_line_id);

  let map_url = 'http://maps.google.com/maps?q=' + location;
  let url = 'https://api.qrserver.com/v1/create-qr-code/?size=540x540&data=' + map_url;
  let path = '/tmp/' + order_line_id + '_qr.jpg';

  console.log('downloadQR path: ' + path);

  return new Promise((resolve, reject) => {
    request(url, {encoding: 'binary'}, function (error, response, body) {
      fs.writeFile(path, body, 'binary', function (err) {
        if (err) {
          reject(err);
        } else {
          console.log('downloadQR url: ' + url);
          resolve({url: url, image_path: path, order_line_id: order_line_id});
        }
      });
    });
  });
};

const generateImage = (box) => {
  console.log('generateImage');
  console.log('generateImage image_path: ' + box.image_path);

  return new Promise((resolve, reject) => {
    console.log('gm generate Image');

    gm('./print/original.jpg')
      .fill('#FFFFFF')
      .font("./print/FFHekaya-Light.otf", 150)
      .drawText(80, 140, "#" + box.order_id)
      .fill('#000000')
      .drawText(80, 315, box.box_count)
      .font("./print/sky-bold.ttf", 70)

      .drawText(70, 612, box.recipe_1)
      .font("./print/sky.ttf", 60)
      .drawText(70, 712, box.recipe_1_serving)
      .font("./print/sky-bold.ttf", 70)
      .drawText(70, 855, box.recipe_2)
      .font("./print/sky.ttf", 60)
      .drawText(70, 955, box.recipe_2_serving)

      .font("./print/sky-bold.ttf", 80)
      .drawText(50, 1250, box.price)
      .drawText(950, 300, box.full_name)
      .drawText(950, 450, box.mobile)
      .font("./print/sky.ttf", 60)
      .drawText(900, 600, box.delivery_date)
      .drawText(900, 750, box.delivery_time)
      .font("./print/sky-bold.ttf", 65)
      .draw([`image over 1000,870 0,0 "${box.image_path}"`])
      .write("/tmp/" + box.order_line_id + ".jpg", function (err) {
        if (!err) {
          console.log('done');
          resolve({order_line_id: box.order_line_id, image_path: "/tmp/" + box.order_line_id + ".jpg"});
        } else {
          reject(err);
        }
      });
  });
};

module.exports = router;
