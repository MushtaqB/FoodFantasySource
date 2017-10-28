const express = require('express');
const multer = require('multer');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const i18n = require('i18n');
const expressValidator = require('express-validator');
const compression = require('compression');
const passport = require('passport');
const helmet = require('helmet');
const limit = require('express-better-ratelimit');

const appConfig = require('./config/app_config');
const s3Uploder = require('./utils/s3Uploader');

const authController = require('./controllers/auth');
const userController = require('./controllers/user');
const mobileCodesController = require('./controllers/mobile_codes');
const recipeController = require('./controllers/recipe');
const bundleController = require('./controllers/bundle');
const uploadController = require('./controllers/upload');
const deviceTokenController = require('./controllers/device_tokens');
const dashboard = require('./routes/dashboard');

const categoryController = require('./controllers/category');
const cuisineController = require('./controllers/cuisine');
const orderController = require('./controllers/order');

const app = express();

app.use(helmet());
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(methodOverride());
app.use(expressValidator());
app.use(i18n.init);
app.set('view engine', 'pug');

app.use(passport.initialize());

// Sync models
const models = require("./models");
models.sequelize.sync({force: false})
  .then(function () {
    console.log('sql models created successfully!');
  })
  .catch(function (error) {
    console.log('Error: ' + error);
  });


app.all('/*', function(req, res, next) {

  const accept = req.get("accept-language");
  console.log("accept-language: " + accept);

  if (accept) {
    i18n.setLocale(accept);
  }

  res.header("Content-Type", "application/json; charset=utf-8");
  next();

});

app.get('/', function(req, res, next) {
  res.send({ message: 'Welcome to Magadeer API'});
});

const mobileCodeLimiter = limit({
  duration: 1000 * 60, //1 minute
  max: 5
});

const router = express.Router();

router.route('/users')
  .post(mobileCodeLimiter, authController.isValidMobileNumber, authController.sendSMS);

router.route('/users/:user_id')
  .get(authController.authenticate,
    userController.getById,
    authController.authorize)
  .put(authController.authenticate,
    authController.authorize,
    uploadController.uploadFiles,
    userController.validateUpdate,
    userController.update,
    s3Uploder.uploadAvatar,
    userController.sendUpdateResponse);

router.route('/auth')
  .post(authController.isValidSMSActivationCode, authController.isValidMobileNumber,
    mobileCodesController.verifySMSCode, userController.deletePendingUser, mobileCodesController.setUsed,
    authController.login)
  .delete(authController.authenticate, authController.logout);

router.route('/device_tokens')
  .post(authController.authenticate,
    deviceTokenController.validate,
    deviceTokenController.create);

router.route('/recipes')
  .post(recipeController.findRecipes);

router.route('/recipes/:recipe_id')
  .get(authController.authenticate,
    recipeController.getRecipeDetails)
  .put(authController.authenticate,
    authController.hasRecipeOwnerPerm,
    recipeController.isRecipeExist,
    uploadController.uploadFiles,
    s3Uploder.uploadRecipeImages,
    recipeController.sendUpdateResponse);

router.route('/recipes/:recipe_id/steps/:step_id')
  .put(authController.authenticate,
    authController.hasRecipeOwnerPerm,
    recipeController.isRecipeExist,
    uploadController.uploadFiles,
    s3Uploder.uploadStepImage,
    recipeController.sendUpdateResponse);

router.route('/recipes/:recipe_id/steps')
  .put(authController.authenticate,
    authController.hasRecipeOwnerPerm,
    recipeController.isRecipeExist,
    uploadController.uploadFiles,
    s3Uploder.uploadAllStepsImages,
    recipeController.sendUpdateResponse);

router.route('/categories')
  .get(categoryController.getAll);

router.route('/cuisines')
  .get(cuisineController.getAll);

router.route('/orders')
  .get(authController.authenticate, orderController.getOrders)
  .post(authController.authenticate, orderController.createOrder);

router.route('/orders/:order_id')
  .delete(authController.authenticate, orderController.isOrderOwner, orderController.cancelOrder);

// install router in api/v1
app.use('/api/v1', router);
app.use('/api/v1' + '/dashboard', dashboard);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  console.error(err.stack);

  res.status(err.status || 500);

  res.send({
    error_message: err.message
  });
});

module.exports = app;
