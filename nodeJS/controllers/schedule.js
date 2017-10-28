const i18n = require('i18n');
const errorsHandler = require('../utils/errorsHandler');
const moment = require('moment');

const models = require('../models/index');
const Schedules = models.schedules;

exports.updateSchedule = function (req, res) {
  let schedule_name = req.body.schedule_name;
  let recipe_ids = req.body.recipe_ids;

  let schedule = {
    schedule_name: schedule_name,
    recipe_ids: recipe_ids
  };

  console.log(schedule);

  Schedules.findOne({
    where: {
      schedule_name: schedule_name
    }
  })
    .then((r) => {
      if (r) {
        return Schedules.update(schedule, {
          where: {
            schedule_name: schedule_name
          }})
      } else {
        return Schedules.create(schedule);
      }
    })
  // Schedules.upsert(schedule, {schedule_name: schedule_name})
    .then(function (result) {
      res.status(200).send();
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};

exports.getNextSchedules = function (req, res) {

  let now = moment().utcOffset(3);
  let date = now.format('YYYY-MM-DD');
  console.log(date);


  Schedules.findAll({
    where: {
      schedule_name: {
        $gte: date
      }
    }
  })
    .then(function (results) {
      res.status(200).send(results);
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};

exports.deleteSchedule = function (req, res) {
  let schedule_name = req.body.schedule_name;

  Schedules.destroy({
    where: {
      schedule_name: schedule_name
    }
  })
    .then(function () {
      res.status(200).send();
    })
    .catch(function (error) {
      errorsHandler.handle(500, error, res);
    });
};
