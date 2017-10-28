var config = require('../config/app_config');
var moment = config.moment;
var Chance = require('chance');
var util = require('util');
var HashUtil = require('hash-util');
var models = require('../models/index');
var Token = models.tokens;

chance = new Chance();

exports.findToken = function (token) {
  return Token.findOne({where: {access_token: token, expire_at: { $gt: Date.now() } }});
};

exports.createToken = function(userId) {
  return Token.create({
    access_token: generateToken(userId),
    user_id: userId,
    expire_at: moment().add(12, 'months')
  });
};

exports.deleteToken = function(token) {
  return Token.destroy({where: {access_token: token}});
};

function generateToken(userId) {
  var randomKey = chance.string({length: 10});
  var timestamp = Date.now().valueOf();
  return encodeToken(userId, randomKey, timestamp);
}

function encodeToken(userId, randomKey, timestamp) {
  var value = util.format("%s|%s|%s", randomKey, userId, timestamp);
  return HashUtil.sha256(value);
}
