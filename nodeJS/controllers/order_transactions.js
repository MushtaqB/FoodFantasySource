const i18n = require('i18n');
const models = require('../models/index');
const OrderTransaction = models.order_transactions;
const errorsHandler = require('../utils/errorsHandler');

exports.create = (transaction) => {
  return OrderTransaction.create(transaction);
}

exports.list = (req, response) => {
  console.log("============================= List Order Transactions =====================");
  let orderId = req.query.order_id;

  OrderTransaction.findAll({where: {order_id: orderId}, raw: true, nest: true}).then((result) => {
    response.status(200).send(result);
  }).catch((error) => {
    console.log(error);
    errorsHandler.handle(500, error, response);
  })
};
