const i18n = require('i18n');
const errorsHandler = require('../utils/errorsHandler');
const notifier = require('../utils/notifier');
const jack = require('../utils/jack_createshipment');
const util = require('util');
const config = require('../config/app_config');
const HashMap = require('hashmap');
const MultiHashMap = require('multi-hashmap').MultiHashMap;

const models = require('../models/index');
const Orders = models.orders;
const Users = models.users;
const OrderLine = models.order_lines;
const OrderTransaction = models.order_transactions;
const Schedule = models.schedules;

const mobileCodesController = require('./mobile_codes');

const Statuses = require('../commons/statuses_const').Statuses;
const Roles = require('../commons/roles_const').Roles;

const NodeGeocoder = require('node-geocoder');

const options = {
  provider: 'google',

  // Optional depending on the providers
  httpAdapter: 'https', // Default
  // apiKey: 'AIzaSyDR92Kwsd2sNh5am2VJ_Q66CGhzr9J6R9E', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);

const CreateOrderRequestValidator = require('./CreateOrderRequestValidator');

exports.createOrder = function (req, res) {
  let input = req.body;
  let orders = input.orders;

  // Validate input
  const errors = CreateOrderRequestValidator.isValid(input);
  console.log('error size: ' + errors.length);
  if (errors.length > 0) {
    errorsHandler.handle(400, errors, res);
    return;
  }

  // TODO: validate if schedule id is within next range

  // TODO: validate if recipes within next schedules

  let scheduleIdSet = new Set();

  let ordersMap = new MultiHashMap('schedule_id', 'order');
  let orderPriceMap = new MultiHashMap('schedule_id', 'price');

  for (let i = 0; i < orders.length; ++i) {
    let ol = orders[i];
    scheduleIdSet.add(ol.schedule_id);
    ordersMap.insert(ol.schedule_id, ol);
  }

  // Calculate price per order/schedule
  for (let scheduleId of scheduleIdSet) {
    let groupedOrdersList = ordersMap.findAll('schedule_id', scheduleId);

    let total_price = 0;

    for (let i = 0; i < groupedOrdersList.length; ++i) {
      let o = groupedOrdersList[i][1];
      let qty = o.quantity;
      total_price += (o.serving_number === 2) ? 59 * qty : 99 * qty;
    }

    orderPriceMap.insert(scheduleId, total_price);
  }


  let user_id = req.user.user.user_id;
  let first_order = null;

  let order_ids = [];

  let findPromises = [];

  for (let scheduleId of scheduleIdSet) {
    let findP = Schedule.findOne({
      where: {
        schedule_id: scheduleId
      }
    });

    findPromises.push(findP);
  }

  Promise.all(findPromises)
    .then((results) => {

      let createOrderPromises = [];

      for (let i = 0; i < results.length; ++i) {
        let scResult = results[i];
        let sc = scResult.get({plain: true});
        let total_price = orderPriceMap.find('schedule_id', sc.schedule_id);
        let delivery_date = sc.schedule_name;

        let delivery_date_iso = delivery_date.toISOString().substring(0, 10);
        console.log('delivery_date: ' + delivery_date_iso);

        let delivery_h = parseInt(input.delivery_time.split(' ')[0].split(':')[0]);
        let delivery_m = 0;

        if (delivery_h === 12) {
          delivery_h = 23;
          delivery_m = 59;
        } else {
          delivery_h = (delivery_h + 12) % 24;
        }

        let t = delivery_date_iso.split("-");
        let delivery_at = new Date(parseInt(t[0]), parseInt(t[1])-1, parseInt(t[2]), delivery_h-3, delivery_m, 0, 0);

        console.log('delivery_at: ' + delivery_at.toISOString());

        let order = {
          user_id: user_id,
          schedule_id: sc.schedule_id,
          status_id: Statuses.NEW,
          address_name: input.address_name,
          address_desc: input.address_desc,
          latitude: input.latitude,
          longitude: input.longitude,
          delivery_time: input.delivery_time,
          delivery_date: delivery_date,
          delivery_at: delivery_at,
          total_price: total_price[1]
        };

        let createOrderP = Orders.create(order);
        createOrderPromises.push(createOrderP);
      }

      return Promise.all(createOrderPromises);
    })
    .then(function (createOrderResults) {

      let orderTransactionPromises = [];

      for (let j = 0; j < createOrderResults.length; ++j) {
        let result = createOrderResults[j];
        let newOrder = result.get({plain: true});
        let groupedOrdersList = ordersMap.findAll('schedule_id', newOrder.schedule_id);

        if (!first_order) {
          first_order = newOrder;
        }

        let orderLinePromises = createOrderLinesPromises(newOrder, groupedOrdersList);
        Promise.all(orderLinePromises);

        orderTransactionPromises.push(OrderTransaction.create({
          order_id: newOrder.order_id,
          status_id: Statuses.NEW
        }));

        order_ids.push(newOrder.order_id);
      }

      return Promise.all(orderTransactionPromises);

    })
    .then(() => {
      return Users.findOne({
        where: {
          user_id: user_id
        }
      });
    })
    .then((user) => {
      mobileCodesController.sendSMS(user.get({plain: true}).mobile, i18n.__('Your order %s has been received', order_ids.toString()));
      notifier.notifyAdminsAndSupervisors(first_order.order_id, getAdminMessage(Statuses.NEW));
      res.status(201).send(first_order);
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};

const createOrderLinesPromises = (newOrder, groupedOrdersList) => {
  let orderLinePromises = [];

  for (let i = 0; i < groupedOrdersList.length; ++i) {
    let ol = groupedOrdersList[i][1];

    let orderLine = {
      order_id: newOrder.order_id,
      user_id: newOrder.user_id,
      recipe_id: ol.recipe_id,
      serving_number: ol.serving_number,
      quantity: ol.quantity,
      price: (ol.serving_number === 2) ? 59 * ol.quantity : 99 * ol.quantity
    };

    let p = OrderLine.create(orderLine);
    orderLinePromises.push(p);
  }

  return orderLinePromises;
};

exports.cancelOrder = function (req, res) {
  let order_id = req.params.order_id;
  let user_id = req.user.user.user_id;

  Orders.update({
    status_id: Statuses.CANCELED
  }, {
    where: {
      order_id: order_id
    }
  })
    .then((result) => {
      return OrderTransaction.create({
        order_id: order_id,
        status_id: Statuses.CANCELED
      });
    })
    .then(() => {
      notifier.notifyOwner(order_id, getMessage(Statuses.CANCELED));
      notifier.notifyAdminsAndSupervisors(order_id, getAdminMessage(Statuses.CANCELED));
      res.status(200).send();
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};

exports.updateJackShipmentStatus = function (req, res) {
  console.log(req.body);

  let status = null;
  let notifiyOwner = false;

  Orders.update({
    jack: JSON.stringify(req.body),
  }, {
    where: {
      jack_id: req.body.id
    }
  })
    .then((r) => {
      let jack_status = req.body.status;
      let jack_sub_status = req.body.sub_status;

      if (jack_status == 'pending') {
        status = Statuses.JACK_PENDING;
      } else if (jack_status == 'accepted') {
        status = Statuses.JACK_ACCEPTED;
      } else if (jack_status == 'started' && jack_sub_status == '') {
        status = Statuses.JACK_ARRIVED_PICKUP;
      } else if (jack_status == 'started' && jack_sub_status == 'out_for_delivery') {
        status = Statuses.JACK_OUT_FOR_DELIVERY;

        notifiyOwner = true;

        Orders.update({
          status_id: Statuses.ON_DELIVERY
        }, {
          where: {
            jack_id: req.body.id
          }
        }).catch((e) => {
          console.log(e);
        });

      } else if (jack_status == 'started' && jack_sub_status == 'metered') {
        status = Statuses.JACK_ARRIVED_DROPFF;
      } else if (jack_status == 'finished') {
        status = Statuses.COMPLETED;

        notifiyOwner = true;

        Orders.update({
          status_id: Statuses.COMPLETED
        }, {
          where: {
            jack_id: req.body.id
          }
        }).catch((e) => {
          console.log(e);
        })

      } else if (jack_status == 'canceled' || jack_status == 'not_accepted') {
        status = Statuses.JACK_CANCELED;

        Orders.update({
          status_id: Statuses.NO_DRIVER
        }, {
          where: {
            jack_id: req.body.id
          }
        }).catch((e) => {
          console.log(e);
        })
      }

      return Orders.findOne({
        where: {
          jack_id: req.body.id
        }
      });
    })
    .then((result) => {
      if (result) {
        let o = result.get({plain: true});

        console.log('order: ' + o);

        notifier.notifyAdminsAndSupervisors(o.order_id, getAdminMessage(status));

        if (notifiyOwner) {
          notifier.notifyOwner(o.order_id, getMessage(status));
        }

        return OrderTransaction.create({
          order_id: o.order_id,
          status_id: status
        });
      } else {
        console.log('no order found');
        res.status(200).send(req.body);
      }
    })
    .then(() => {
      res.status(200).send(req.body);
    })
    .catch((error) => {
      console.log(error);
      errorsHandler.handle(500, error, res);
    });
};

exports.updateOrderStatus = function (req, res) {
  let order_id = req.params.order_id;
  let status_id = req.params.status_id;
  let user_id = req.user.user.user_id;

  if (status_id < Statuses.NEW || status_id > Statuses.COMPLETED) {
    errorsHandler.handle(500, "Invalid order status", res);
    return;
  }

  Orders.update({
    status_id: status_id
  }, {
    where: {
      order_id: order_id
    }
  })
    .then((result) => {
      OrderTransaction.create({
        order_id: order_id,
        status_id: status_id
      });

      return Orders.findOne({
        where: {
          order_id: order_id
        }});

    }).then((userOrder) => {
      let uo = userOrder.get({plain: true});
      return geocoder.reverse({lat: uo.latitude, lon: uo.longitude});
    })
    .then((geoRes) => {
      console.log('GeoRes: ' + util.inspect(geoRes, false, null));

      let address = "";

      if (geoRes && geoRes.length > 0) {
        address = geoRes[0].formattedAddress;
        console.log("Address: " + address);
      }

      if (status_id == Statuses.WAITING_FOR_DELIVERY) {
        // Send request to Jack
        Orders.findOne({
          where: {
            order_id: order_id
          },
          order: [['order_id', 'DESC']],
          include: [
            {
              model: models.order_lines,
              as: 'order_lines'
            },
            {
              model: models.users,
              as: 'user'
            }
          ]
        })
          .then((orderRes) => {
            let allOrders = orderRes.get({plain: true});

            // Get qty, client name and mobile
            let qty = 0;
            for (let i=0; i<allOrders.order_lines.length; ++i) {
              let ol = allOrders.order_lines[i];
              qty += ol.quantity;
            }

            let client_name = allOrders.user.full_name;
            let client_mobile = allOrders.user.mobile;

            jack.send(allOrders, qty, client_name, client_mobile, address)
              .then((shipment) => {
                // Save jack shipment id and status
                Orders.update({
                  jack: JSON.stringify(shipment),
                  jack_id: shipment.id
                }, {
                  where: {
                    order_id: order_id
                  }
                })
                  .then((result) => {
                    res.status(200).send();
                  })
                  .catch((error) => {
                    console.log(error);
                    errorsHandler.handle(500, error, res);
                  });
              })
              .catch((error) => {
                console.log(error);
                errorsHandler.handle(500, error, res);
              });
          })
          .catch((error) => {
            console.log(error);
            errorsHandler.handle(500, error, res);
          });

      } else {
        notifier.notifyOwner(order_id, getMessage(status_id));
        res.status(200).send();
      }

    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};

const getMessage = (status) => {
  console.log('status: ' + status);
  let msg = 'You order has been updated';

  if (status == Statuses.NEW) {
    msg = i18n.__('Your order has been received');
  } else if (status == Statuses.IN_PROGRESS) {
    msg = i18n.__('Your order in progress');
  } else if (status == Statuses.WAITING_FOR_DELIVERY) {
    msg = i18n.__('Your order is ready and waiting for delivery');
  } else if (status == Statuses.ON_DELIVERY) {
    msg = i18n.__('Your order has been out for delivery');
  } else if (status == Statuses.CANCELED) {
    msg = i18n.__('Your order has been canceled');
  } else if (status == Statuses.COMPLETED) {
    msg = i18n.__('Your order delivered successfully');
  } else if (status == Statuses.JACK_PENDING) {
    msg = i18n.__('Your order is pending and waiting jack drivers acceptance');
  } else if (status == Statuses.JACK_ACCEPTED) {
    msg = i18n.__('Your order has been accepted by jack driver');
  } else if (status == Statuses.JACK_ARRIVED_PICKUP) {
    msg = i18n.__('Jack driver arrvied for pickup');
  } else if (status == Statuses.JACK_OUT_FOR_DELIVERY) {
    msg = i18n.__('Jack driver out for delivery');
  } else if (status == Statuses.JACK_ARRIVED_DROPFF) {
    msg = i18n.__('Jack driver reach the client');
  } else if (status == Statuses.JACK_CANCELED) {
    msg = i18n.__('Jack driver has cancelled the order');
  }

  return msg;
};

const getAdminMessage = (status) => {
  console.log('status: ' + status);
  let msg = 'Order has been updated';

  if (status == Statuses.NEW) {
    msg = i18n.__('New order has been created');
  } else if (status == Statuses.IN_PROGRESS) {
    msg = i18n.__('Order in progress');
  } else if (status == Statuses.WAITING_FOR_DELIVERY) {
    msg = i18n.__('Order is ready and waiting for delivery');
  } else if (status == Statuses.ON_DELIVERY) {
    msg = i18n.__('Order has been out for delivery');
  } else if (status == Statuses.CANCELED) {
    msg = i18n.__('Order has been canceled');
  } else if (status == Statuses.COMPLETED) {
    msg = i18n.__('Order delivered successfully');
  } else if (status == Statuses.JACK_PENDING) {
    msg = i18n.__('Order is pending and waiting jack drivers acceptance');
  } else if (status == Statuses.JACK_ACCEPTED) {
    msg = i18n.__('Order has been accepted by jack driver');
  } else if (status == Statuses.JACK_ARRIVED_PICKUP) {
    msg = i18n.__('Jack driver arrvied for pickup');
  } else if (status == Statuses.JACK_OUT_FOR_DELIVERY) {
    msg = i18n.__('Jack driver out for delivery');
  } else if (status == Statuses.JACK_ARRIVED_DROPFF) {
    msg = i18n.__('Jack driver reach the client');
  } else if (status == Statuses.JACK_CANCELED) {
    msg = i18n.__('Jack driver has cancelled the order');
  }

  return msg;
};

exports.getOrders = function (req, res) {
  let user_id = req.user.user.user_id;

  Orders.findAll({
    where: {
      user_id: user_id
    },
    order: [['order_id', 'DESC']],
    include: [
      {
        model: models.order_lines,
        as: 'order_lines',
        include: [
          {
            model: models.recipes,
            as: 'recipe'
          }
        ]
      },
      {
        model: models.statuses,
        as: 'status'
      }
    ]
  })
    .then((orders) => {

      let orderList = [];

      for (let i = 0; i < orders.length; ++i) {
        let order = orders[i].get({plain: true});
        let order_lines = order.order_lines;

        let total_price = 0;

        for (let j = 0; j < order_lines.length; ++j) {
          let ol = order_lines[j];

          delete ol.user_id;
          delete ol.order_id;
          delete ol.updated_at;
          delete ol.created_at;
          delete ol.recipe_id;

          let recipe = ol.recipe;
          delete recipe.ingredients_ar;
          delete recipe.ingredients_en;
          delete recipe.steps_ar;
          delete recipe.steps_en;
          delete recipe.desc_ar;
          delete recipe.desc_en;
          delete recipe.cuisine_id;
          delete recipe.category_id;
          delete recipe.ingredient_image;
          delete recipe.duration;
          delete recipe.calories;
          delete recipe.rating;
          delete recipe.updated_at;
          delete recipe.created_at;
          delete recipe.user_id;

          recipe.title = (i18n.getLocale() === 'en') ? recipe.title_en : recipe.title_ar;
          recipe.subtitle = (i18n.getLocale() === 'en') ? recipe.subtitle_en : recipe.subtitle_ar;

          delete recipe.title_en;
          delete recipe.title_ar;
          delete recipe.subtitle_en;
          delete recipe.subtitle_ar;

          let s3_id = recipe.image;
          recipe.image = config.recipe_image(recipe.recipe_id, s3_id);
          recipe.thumbnail_image = config.recipe_thumbnail(recipe.recipe_id, s3_id);
        }

        orderList.push(order);
      }

      res.status(200).send(orderList);
    })
    .catch((e) => {
      errorsHandler.handle(500, e, res);
    });
};

exports.isOrderOwner = function (req, res, next) {

  if (req.user.user.role_id === Roles.ADMIN) {
    next();
    return;
  }

  req.assert('order_id', i18n.__('order_id is required')).notEmpty().isInt();

  let errors = req.validationErrors();

  if (errors) {
    errorsHandler.handle(400, errors, res);
  } else {
    Orders.find({
      where: {
        order_id: req.params.order_id,
        user_id: req.user.user.user_id
      }
    })
      .then(function (order) {
        if (!order) {
          res.status(401).send(i18n.__('You are not authorized to do this action'));
        } else {
          next();
        }
      })
      .catch(function (error) {
        errorsHandler.handle(500, error, res);
      });
  }
};
