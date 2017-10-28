const errorsHandler = require('../utils/errorsHandler');
const Statuses = require('../commons/statuses_const').Statuses;
const models = require('../models/index');
const Orders = models.orders;
const i18n = require('i18n');
const moment = require('moment');

exports.getOrders = (req, response) => {
  console.log("=============================== Dashboard List Orders =====================");

  let statusId = req.query.status_id;
  let delivery_at = req.query.delivery_at;  // Full date format GMT
  let delivery_date = req.query.delivery_date;
  let userId = req.query.user_id;
  let pageNumber = req.query.page_number ? parseInt(req.query.page_number) : 0;
  let pageSize = (req.query.page_size && req.query.page_size < 50) ? parseInt(req.query.page_size) : 20;
  let offset = pageNumber * pageSize;

  let orderBy = [
    ["delivery_at", "ASC"],
      // [models.order_lines, 'id', 'DESC'],
      [{model: models.order_transactions, as: 'transactions'}, 'id', 'DESC']
  ];

  let where = {};

  if (statusId) {
    where.status_id = parseInt(statusId);
  }

  if (userId) {
    where.user_id = userId;
  }

  if (delivery_at) {
    where.delivery_at = delivery_at;
  }

  if (delivery_date) {
    where.delivery_date = delivery_date;
  }

  let options = {
    where: where,
    offset: offset,
    limit: pageSize,
    include: [
      {
        model: models.statuses,
        as: 'status'
      },
      {
        model: models.order_lines,
        as: 'order_lines',
        include: [
          {
            model: models.recipes,
            attributes: ['title_ar', 'title_en'],
            as: 'recipe'
          }
        ]
      },
      {
        model: models.order_transactions,
        as: 'transactions',
        include: [
          {
            model: models.statuses,
            as: 'status'
          }
        ]
      },
      {
        model: models.users,
        as: 'user',
      }
    ],
    order: orderBy,
  };

  Orders.findAll(options)
    .then((result) => {

      const all = result.map((r) => {
        r.jack = JSON.parse(r.jack);
        return r.toJSON();
      });

      response.status(200).send(all);
    })
    .catch((error) => {
      console.log(error);
      errorsHandler.handle(500, error, response);
    });
};


exports.getOrdersForPrinting = (date) => {

  let now = moment().utcOffset(3);
  let formatted = now.format('YYYY-MM-DD');
  console.log(formatted);

  let delivery_date = formatted;

  if (date) {
    delivery_date = date;
  }

  console.log(delivery_date);

  let orderBy = [
    ["delivery_at", "ASC"]
  ];

  let where = {
    status_id: {
      $ne: Statuses.CANCELED
    }
  };

  if (delivery_date) {
    where.delivery_date = delivery_date;
  }

  let options = {
    where: where,
    include: [
      {
        model: models.statuses,
        as: 'status'
      },
      {
        model: models.order_lines,
        as: 'order_lines',
        include: [
          {
            model: models.recipes,
            attributes: ['title_ar', 'title_en'],
            as: 'recipe'
          }
        ]
      },
      {
        model: models.users,
        as: 'user',
      }
    ],
    order: orderBy,
  };

  return Orders.findAll(options);
};