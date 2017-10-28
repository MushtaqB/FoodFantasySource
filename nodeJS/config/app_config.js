const winston = require('winston');
const i18n = require('i18n');
const mkdirp = require('mkdirp');
const homedir = require('homedir');
const moment = require('moment');
const fs = require('fs');

let firebase_key = 'AAAAhqCwZsg:APA91bFgkandWbGUPTWaXHvHK2iKhf-4EbkOfbwXKO-VRUTEx2uCVDE3_BObQ4DQgEynf0e3mcDO2sDcAE-rIsZM887N8tivnZKoaOMCZct5uVoq-iBtVwjU2JhmBusfhZOp7nRzEIn4';
let sendgrid_key = '';
let port = 3000;

// for AWS S3
let s3AccessKeyId = '';
let s3SecretKey = '';
let s3BucketName = '';

let jack_api = '';
let jack_app_key = '';
let jack_app_secret = '';

// images path
let imagesDomain = '';
let s3_users_bucket = 'users/';

i18n.configure({
  locales: ['ar', 'en'],
  directory: __dirname + '/locales',
  defaultLocale: 'ar',
  logDebugFn: function (msg) {
    winston.log('debug', msg);
  },
  logWarnFn: function (msg) {
    winston.log('warn', msg);
  }
});

// mysql timestamp format
let timestamp_format = 'YYYY-MM-DD HH:MM:SS';
moment().format(timestamp_format);

let logs_path = homedir() + '/magadeer_logs/logs.log';
mkdirp(logs_path, function (err) {
  if (err) console.log('Creating log file failed: ' + err);
});

let storage_path = homedir() + '/magadeer_storage/';
mkdirp(storage_path, function(err) {
  if(err) console.log('Creating storage folder failed: ' + err);
});

let avatarsUploadPath = storage_path + 'users/';
fs.existsSync(avatarsUploadPath) || fs.mkdirSync(avatarsUploadPath);

let recipesUploadPath = storage_path + 'recipes/';
fs.existsSync(recipesUploadPath) || fs.mkdirSync(recipesUploadPath);

winston.add(winston.transports.File, {filename: logs_path});
winston.level = 'debug';

switch (process.env.NODE_ENV) {
  case 'local':
    firebase_key = "AAAAhqCwZsg:APA91bFgkandWbGUPTWaXHvHK2iKhf-4EbkOfbwXKO-VRUTEx2uCVDE3_BObQ4DQgEynf0e3mcDO2sDcAE-rIsZM887N8tivnZKoaOMCZct5uVoq-iBtVwjU2JhmBusfhZOp7nRzEIn4";
    sendgrid_key = "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";

    s3AccessKeyId = 'AKIAI4AHMM36VWBVCKYQ';
    s3SecretKey = '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';
    s3BucketName = 'magadeerlocal';
    imagesDomain = 'https://s3.eu-central-1.amazonaws.com/magadeerlocal/';

    jack_api = 'https://sandbox.jakapp.co/';
    jack_app_key = '8846-1574-5b77-00fc';
    jack_app_secret = 'd3c6bfcc4c90ad1bd376ec07f134d74e';

    break;
  case 'development':
    firebase_key = "AAAAhqCwZsg:APA91bFgkandWbGUPTWaXHvHK2iKhf-4EbkOfbwXKO-VRUTEx2uCVDE3_BObQ4DQgEynf0e3mcDO2sDcAE-rIsZM887N8tivnZKoaOMCZct5uVoq-iBtVwjU2JhmBusfhZOp7nRzEIn4";
    sendgrid_key = "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";

    s3AccessKeyId = 'AKIAI4AHMM36VWBVCKYQ';
    s3SecretKey = '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';
    s3BucketName = 'magadeerdev';
    imagesDomain = 'https://d29c3pslbshsrp.cloudfront.net/';

    jack_api = 'https://sandbox.jakapp.co/';
    jack_app_key = '8846-1574-5b77-00fc';
    jack_app_secret = 'd3c6bfcc4c90ad1bd376ec07f134d74e';

    break;
  case 'production':
    firebase_key = "AAAAhqCwZsg:APA91bFgkandWbGUPTWaXHvHK2iKhf-4EbkOfbwXKO-VRUTEx2uCVDE3_BObQ4DQgEynf0e3mcDO2sDcAE-rIsZM887N8tivnZKoaOMCZct5uVoq-iBtVwjU2JhmBusfhZOp7nRzEIn4";
    sendgrid_key = "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";

    s3AccessKeyId = 'AKIAI4AHMM36VWBVCKYQ';
    s3SecretKey = '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';
    s3BucketName = 'magadeerprod';
    imagesDomain = 'https://d1h9gesxeulio2.cloudfront.net/';

    jack_api = 'https://corporate.jakapp.co/';
    jack_app_key = '47e1-23ba-bd9b-6b40';
    jack_app_secret = '7a63d5d989a1fe0495ac7c98372ca524';

    break;
  default:
    firebase_key = "AAAAhqCwZsg:APA91bFgkandWbGUPTWaXHvHK2iKhf-4EbkOfbwXKO-VRUTEx2uCVDE3_BObQ4DQgEynf0e3mcDO2sDcAE-rIsZM887N8tivnZKoaOMCZct5uVoq-iBtVwjU2JhmBusfhZOp7nRzEIn4";
    sendgrid_key = "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";

    s3AccessKeyId = 'AKIAI4AHMM36VWBVCKYQ';
    s3SecretKey = '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';
    s3BucketName = 'magadeerdev';
    imagesDomain = 'https://d29c3pslbshsrp.cloudfront.net/';

    break;
}

const s3_confgis = {
  path: 'images/',
  region: 'eu-central-1',
  acl: 'public-read',
  accessKeyId: s3AccessKeyId,
  secretAccessKey: s3SecretKey
};

const s3_avatar_options = {
  aws: s3_confgis,

  cleanup: {
    versions: true,
    original: true
  },

  original: {
    awsImageAcl: 'public-read',
    awsImageExpires: 31536000,
    awsImageMaxAge: 31536000
  },

  versions: [
    {
      maxHeight: 480,
      maxWidth: 480,
      aspect: '1:1',
      format: 'jpeg',
      suffix: '-thumb1',
      awsImageExpires: 31536000,
      awsImageMaxAge: 31536000
    }
  ]
};

const s3_recipe_configs = {
  aws: s3_confgis,

  cleanup: {
    versions: true,
    original: true
  },

  original: {
    awsImageAcl: 'public-read',
    awsImageExpires: 31536000,
    awsImageMaxAge: 31536000
  },

  versions: [
    {
      maxHeight: 280,
      maxWidth: 280,
      aspect: '1:1',
      format: 'jpeg',
      suffix: '-thumb1',
      awsImageExpires: 31536000,
      awsImageMaxAge: 31536000
    },
    {
      maxHeight: 420,
      maxWidth: 420,
      aspect: '1:1',
      format: 'jpeg',
      suffix: '-thumb2',
      awsImageExpires: 31536000,
      awsImageMaxAge: 31536000
    },
    {
      maxHeight: 750,
      maxWidth: 750,
      aspect: '1:1',
      format: 'jpeg',
      suffix: '-large1',
      awsImageExpires: 31536000,
      awsImageMaxAge: 31536000
    }]
};

const s3_step_configs = {
  aws: s3_confgis,

  cleanup: {
    versions: true,
    original: true
  },

  original: {
    awsImageAcl: 'public-read',
    awsImageExpires: 31536000,
    awsImageMaxAge: 31536000
  },

  versions: [
    {
      maxHeight: 1110,
      maxWidth: 1110,
      format: 'jpeg',
      suffix: '-large1',
      awsImageExpires: 31536000,
      awsImageMaxAge: 31536000
    },
    {
      maxHeight: 470,
      format: 'jpeg',
      suffix: '-large2',
      // quality: 80,
      aspect: '3:2!h',
      awsImageExpires: 31536000,
      awsImageMaxAge: 31536000
    },
    {
      maxWidth: 780,
      aspect: '3:2!h',
      format: 'jpeg',
      suffix: '-medium',
      awsImageExpires: 31536000,
      awsImageMaxAge: 31536000
    },
    {
      maxWidth: 320,
      aspect: '16:9!h',
      format: 'jpeg',
      suffix: '-small'
    }]
};

const s3_ingredient_configs = {
  aws: s3_confgis,

  cleanup: {
    versions: true,
    original: true
  },

  original: {
    awsImageAcl: 'public-read',
    awsImageExpires: 31536000,
    awsImageMaxAge: 31536000
  },

  versions: [
    {
      maxHeight: 1110,
      maxWidth: 1110,
      format: 'png',
      suffix: '-large1',
      awsImageExpires: 31536000,
      awsImageMaxAge: 31536000
    },
    {
      maxHeight: 470,
      format: 'png',
      suffix: '-large2',
      // quality: 80,
      aspect: '3:2!h',
      awsImageExpires: 31536000,
      awsImageMaxAge: 31536000
    },
    {
      maxWidth: 780,
      aspect: '3:2!h',
      format: 'png',
      suffix: '-medium',
      awsImageExpires: 31536000,
      awsImageMaxAge: 31536000
    },
    {
      maxWidth: 320,
      aspect: '16:9!h',
      format: 'png',
      suffix: '-small'
    }]
};

exports.recipe_step = function (recipe_id, imageName) {
  return imagesDomain + recipe_id + '/' + imageName + '-large2.jpeg';
};

exports.recipe_ingredient = function (recipe_id, imageName) {
  return imagesDomain + recipe_id + '/' + imageName + '-large2.png';
};

exports.recipe_image = function (recipe_id, imageName) {
  return imagesDomain + recipe_id + '/' + imageName + '-large1.jpeg';
};

exports.recipe_thumbnail = function (recipe_id, imageName) {
  return imagesDomain + recipe_id + '/' + imageName + '-thumb1.jpeg';
};

exports.getAvatarThumbUrl = (imageName) => {
  return imagesDomain + s3_users_bucket + imageName + '-thumb1.jpeg';
};

exports.activation_email_subject = "Magadeer email Activation";

exports.moment = moment;
exports.firebase_key = firebase_key;
exports.sendgrid_key = sendgrid_key;
exports.port = port;
exports.storage_path = storage_path;
exports.avatarsUploadPath = avatarsUploadPath;
exports.recipesUploadPath = recipesUploadPath;
exports.s3BucketName = s3BucketName;
exports.s3_users_bucket = s3_users_bucket;
exports.s3_avatar_options = s3_avatar_options;
exports.s3_recipe_configs = s3_recipe_configs;
exports.s3_step_configs = s3_step_configs;
exports.s3_ingredient_configs = s3_ingredient_configs;
exports.jack_api = jack_api;
exports.jack_app_key = jack_app_key;
exports.jack_app_secret = jack_app_secret;



