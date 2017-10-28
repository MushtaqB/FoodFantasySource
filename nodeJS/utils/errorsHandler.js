const winston = require('winston');
const i18n = require('i18n');

exports.handle = function (status, errors, res) {
  let message;

  if (status === 400) {
    message = i18n.__("Invalid input");
  } else if (status === 401) {
    message = i18n.__("Unauthorized");
  } else if (status === 404) {
    message = i18n.__("Not found");
  } else if (status === 500) {
    message = i18n.__("Internal server error");
    winston.log("debug", errors);
  }

  res.status(status).send({message: message, errors: errors});
};
