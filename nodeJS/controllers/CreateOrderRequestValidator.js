"use strict";

const i18n = require('i18n');
const validator = require('validator');

class CreateOrderRequestValidator {

  static isValid(input) {

    let orders = input.orders;

    let errors =  [];

    let quantity = 0;

    if (!Array.isArray(orders)) {
      console.log('length: ' + orders.length);
      errors.push({param: "order", msg: i18n.__('order is not valid')});
      return errors;
    }

    for (let i=0; i<orders.length; ++i) {

      let recipeInput = orders[i];

      if (validator.isEmpty(recipeInput.schedule_id + '')) {
        errors.push({param: "schedule_id", msg: i18n.__('schedule_id is required')})
      }

      if (validator.isEmpty(recipeInput.recipe_id + '') || !validator.isInt(recipeInput.recipe_id + '')) {
        errors.push({param: "recipe_id", msg: i18n.__('recipe_id is required')})
      }

      if (validator.isEmpty(recipeInput.serving_number + '') || !validator.isInt(recipeInput.serving_number + '')) {
        errors.push({param: "serving_number", msg: i18n.__('serving_number is required')})
      }

      if (validator.isEmpty(recipeInput.quantity + '') || !validator.isInt(recipeInput.quantity + '')) {
        errors.push({param: "quantity", msg: i18n.__('quantity is required')})
      }

      quantity += recipeInput.quantity;
    }

    if (quantity <= 0 || quantity > 8) {
      errors.push({param: "quantity", msg: i18n.__('quantity should be 2-8')})
    }

    if (validator.isEmpty(input.latitude + '') || !validator.isDecimal(input.latitude + '')) {
      errors.push({param: "latitude", msg: i18n.__('latitude is required')})
    }

    if (validator.isEmpty(input.longitude + '') || !validator.isDecimal(input.longitude + '')) {
      errors.push({param: "longitude", msg: i18n.__('longitude is required')})
    }

    if (validator.isEmpty(input.delivery_time + '')) {
      errors.push({param: "delivery_time", msg: i18n.__('delivery_time is required')})
    }

    return errors;
  }
}

module.exports = CreateOrderRequestValidator;
