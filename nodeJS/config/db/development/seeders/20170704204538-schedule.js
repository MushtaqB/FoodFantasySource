
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('schedules', [
      {
        schedule_name: '2017-10-14',
        recipe_ids: JSON.stringify([100, 108, 110, 112, 114, 124, 126, 128, 130]),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        schedule_name: '2017-10-17',
        recipe_ids: JSON.stringify([100, 108, 110, 112, 114, 124, 126, 128, 130]),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        schedule_name: '2017-10-21',
        recipe_ids: JSON.stringify([100, 108, 110, 112, 114, 124, 126]),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        schedule_name: '2017-10-24',
        recipe_ids: JSON.stringify([124, 126, 128, 130, 100, 108, 110]),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        schedule_name: '2017-10-28',
        recipe_ids: JSON.stringify([100, 108, 110, 112, 114, 124, 126]),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        schedule_name: '2017-10-31',
        recipe_ids: JSON.stringify([124, 126, 128, 130, 100, 108, 110]),
        created_at: new Date(),
        updated_at: new Date()
      }

    ], {});
  },

  down: function (queryInterface, Sequelize) {
    /*
     Add reverting commands here.
     Return a promise to correctly handle asynchronicity.

     Example:
     return queryInterface.bulkDelete('Person', null, {});
     */
  }
};
