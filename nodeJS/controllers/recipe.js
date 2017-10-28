const i18n = require('i18n');
const errorsHandler = require('../utils/errorsHandler');
const idGenerator = require('../utils/id_generator');
const util = require('util');

const models = require('../models/index');
const Recipes = models.recipes;
const Schedules = models.schedules;

const Categories = require('../commons/categories_const').Categories;
const Statuses = require('../commons/statuses_const').Statuses;
const config = require('../config/app_config');

const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

exports.findRecipes = function (req, res) {

  let output = {
    recipes: [],
    schedules: []
  };

  let set = new Set();

  let today = new Date();
  today.setHours(0, 0, 0, 0);

  Schedules.findAll({
    limit: 7,
    where: {
      schedule_name: {
        gt: today
      }
    },
    order: [['schedule_name', 'ASC']]
  })
    .then((schedules) => {
      for (let i = 0; i < schedules.length; ++i) {
        let schedule = schedules[i].get({plain: true});
        let ids = JSON.parse(schedule.recipe_ids);

        for (let j = 0; j < ids.length; ++j) {
          set.add(ids[j]);
        }

        output.schedules.push({
          schedule_id: schedule.schedule_id,
          schedule_name: schedule.schedule_name,
          schedule_title: i18n.__('delivery list for today'),
          schedule_subtitle: null,
          recipe_ids: ids
        })
      }

      let list = Array.from(set);

      return Recipes.findAll({
        where: {
          recipe_id: list
        },
        include: [
          {model: models.cuisines, as: 'cuisine'}
        ]
      })
    })
    .then((recipes) => {
      for (let i = 0; i < recipes.length; ++i) {
        let recipe = recipes[i].toJSON();
        fillRecipeImages(recipe);
        output.recipes.push(recipe);
      }

      res.status(200).send(output);
    })
    .catch((e) => {
      errorsHandler.handle(500, e, res);
    });
};

fillRecipeImages = function (recipe) {
  let ingredient_s3_id = recipe.ingredient_image;
  let image_s3_id = recipe.image;

  recipe.ingredient_image = config.recipe_ingredient(recipe.recipe_id, ingredient_s3_id);

  recipe.image = config.recipe_image(recipe.recipe_id, image_s3_id);
  recipe.thumbnail_image = config.recipe_thumbnail(recipe.recipe_id, image_s3_id);

  for (let j = 0; j < recipe.steps.length; ++j) {
    recipe.steps[j].step_image = config.recipe_step(recipe.recipe_id, recipe.steps[j].step_image);
  }

  recipe.price = {
    for_two: 59,
    for_four: 99
  };
};

exports.getRecipeDetails = function (req, res) {
  let recipeId = req.params.recipe_id;

  Recipes.findOne({
    where: {recipe_id: recipeId},
    include: [
      {model: models.cuisines, as: 'cuisine'}
    ]
  })
    .then((recipe) => {

      if (recipe === null) {
        res.status(400).send();
        return;
      }

      let r = recipe.toJSON();
      fillRecipeImages(r);
      res.status(200).send(r);
    })
    .catch(function (error) {
      console.log(error);
      errorsHandler.handle(500, error, res);
    });
};

exports.sendUpdateResponse = (req, res) => {
  let recipeId = req.params.recipe_id;

  Recipes.findOne({where: {recipe_id: recipeId}})
    .then((recipe) => {
      res.status(200).send(recipe);
    })
    .catch(function (error) {
      console.log(error);
      errorsHandler.handle(500, error, res);
    });
};

exports.isRecipeExist = (req, res, next) => {
  let recipeId = req.params.recipe_id;

  Recipes.findOne({where: {recipe_id: recipeId}})
    .then((recipe) => {
      if (recipe) {
        next();
      } else {
        errorsHandler.handle(400, "Not valid recipe", res);
      }
    })
    .catch(function (error) {
      console.log(error);
      errorsHandler.handle(500, error, res);
    });
};

exports.isValidTruckForAdd = function (req, res, next) {
  console.log(req.body);

  req.assert('category_id', i18n.__('category id is required')).notEmpty().isInt();
  req.assert('truck_services', i18n.__('services is required')).isJSON();
  req.assert('truck_name_ar', i18n.__('truck name in Arabic is required')).notEmpty();
  req.assert('truck_name_en', i18n.__('truck name in English is required')).notEmpty();
  req.assert('truck_desc_ar', i18n.__('truck description in Arabic is required')).notEmpty();
  req.assert('truck_desc_en', i18n.__('truck description in English is required')).notEmpty();
  req.assert('truck_address_ar', i18n.__('truck address in Arabic is required')).notEmpty();
  req.assert('truck_address_en', i18n.__('truck address in English is required')).notEmpty();
  // req.assert('city_id', i18n.__('city_id is required')).notEmpty().isInt();
  req.assert('truck_gps_latitude', i18n.__('latitude is required')).notEmpty();
  req.assert('truck_gps_longitude', i18n.__('longitude is required')).notEmpty();
  req.assert('truck_mobile', i18n.__('mobile is required')).notEmpty();

  var errors = req.validationErrors();

  var mobile_validation_error = {param: "truck_mobile", msg: i18n.__("Invalid mobile")};
  var truck_services_error = {param: "truck_services", msg: i18n.__('services is required')};

  try {
    var mobileObj = phoneUtil.parse(req.body.truck_mobile);
  } catch (exception) {
    if (errors)
      errors.push(mobile_validation_error);
    else
      errors = [mobile_validation_error];

    errorsHandler.handle(400, errors, res);
  }

  if (!phoneUtil.isValidNumber(mobileObj)) {
    if (errors)
      errors.push(mobile_validation_error);
    else
      errors = [mobile_validation_error];
  }

  var services = JSON.parse(req.body.truck_services);

  console.log('services: ' + services);
  console.log('services length: ' + services.length);

  if (services.length <= 0) {
    if (errors)
      errors.push(truck_services_error);
    else
      errors = [truck_services_error];
  }

  if (errors) {
    errorsHandler.handle(400, errors, res);
  } else {
    next();
  }
};

exports.addTruck = function (req, res) {
  var user_id = req.user.user.user_id;
  var files = req.files;
  var truck_images = [];
  var truck_logo = null;

  if (files) {
    var images = files['image'];
    var logo = files['logo'];

    if (images && images.length > 0) {
      images.forEach(function (image) {
        truck_images.push({
          image_id: idGenerator.generateId(),
          mime_type: image.mimetype,
          image_name: image.filename,
          url: ''
        });
      })
    }

    console.log('logo: ' + logo[0]);

    if (logo) {
      truck_logo = '';
    }
  }

  console.log('image urls: ' + truck_images);

  var truck = {
    user_id: user_id,
    status_id: 2,
    category_id: Categories.FOOD,
    truck_name_en: req.body.truck_name_en,
    truck_name_ar: req.body.truck_name_ar,
    truck_desc_en: req.body.truck_desc_en,
    truck_desc_ar: req.body.truck_desc_ar,
    truck_address_ar: req.body.truck_address_ar,
    truck_address_en: req.body.truck_address_en,
    truck_gps_latitude: req.body.truck_gps_latitude,
    truck_gps_longitude: req.body.truck_gps_longitude,
    truck_mobile: req.body.truck_mobile,
    truck_images: JSON.stringify(truck_images),
    truck_logo: truck_logo
  };

  Recipes.create(truck)
    .then(function (result) {

      var services_ids = JSON.parse(req.body.truck_services);

      services_ids.forEach(function (id) {
        var truck_service = {
          recipe_id: result.recipe_id,
          service_id: id
        };
        //
        // TruckServices.create(truck_service)
        //   .catch(function (error) {
        //     errorsHandler.handle(500, error, res);
        //   });
      });

      result.reload({
        include: [
          {model: models.bundles, as: 'bundles'},
          {model: models.categories, as: 'category'},
          {model: models.services, as: 'services'},
          {model: models.statuses, as: 'status'}
        ]
      }).then(function (t) {
        var addedTruck = t.get({plain: true});
        addedTruck.truck_images = JSON.parse(addedTruck.truck_images);
        res.status(201).send(addedTruck);
      }).catch(function (error) {
        errorsHandler.handle(500, error, res);
      })
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};

exports.updateTruckLocation = function (req, res) {
  req.assert('truck_gps_latitude', i18n.__('latitude is required')).notEmpty();
  req.assert('truck_gps_longitude', i18n.__('longitude is required')).notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    errorsHandler.handle(400, errors, res);
  } else {
    Recipes.update(
      {
        truck_gps_latitude: req.body.truck_gps_latitude,
        truck_gps_longitude: req.body.truck_gps_longitude
      },
      {where: {truck_id: req.params.id}}
    ).then(function (truck) {
      res.status(200).send();
    }).catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
  }
};

exports.updateTruckStatus = function (req, res) {
  req.assert('status_id', i18n.__('status id is required')).isInt();

  var errors = req.validationErrors();

  var status_id_error = {param: "status_id", msg: i18n.__('status id is required')};

  if ((req.body.status_id != Statuses.OPEN && req.body.status_id != Statuses.CLOSED) ||
    req.body.status_id > Statuses.CLOSED) {
    if (errors)
      errors.push(status_id_error);
    else
      errors = [status_id_error];
  }

  if (errors) {
    errorsHandler.handle(400, errors, res);
  } else {
    Recipes.update(
      {
        status_id: req.body.status_id
      },
      {where: {truck_id: req.params.id}}
    ).then(function (truck) {
      res.status(200).send();
    }).catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
  }
};

exports.getMyTrucks = function (req, res) {
  Recipes.findAll({
    where: {
      user_id: req.user.user.user_id
    },
    include: [
      {model: models.bundles, as: 'bundles'},
      {model: models.categories, as: 'category'},
      {model: models.services, as: 'services'},
      {model: models.statuses, as: 'status'}
    ]
  }).then(function (result) {
    result.forEach(function (truck) {
      truck.truck_images = JSON.parse(truck.truck_images);
      truck.bundles.forEach(function (bundle) {
        bundle.bundle_images = JSON.parse(bundle.bundle_images);
      });
      truck.services.forEach(function (service) {
        service.service_icon = '';
      });
    });

    res.status(200).send(result);

  }).catch(function (error) {
    errorsHandler.handle(500, error, res);
  })
};

exports.isTruckOwner = function (req, res, next) {
  req.assert('id', i18n.__('truck id is required')).notEmpty().isInt();
  var errors = req.validationErrors();
  if (errors) {
    errorsHandler.handle(400, errors, res);
  } else {
    Recipes.find({where: {truck_id: req.params.id, user_id: req.user.user.user_id}})
      .then(function (truck) {
        if (!truck) {
          res.status(401).send(i18n.__('You are not authorized to do this action'));
        } else {
          next();
        }
      }).catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
  }
};
