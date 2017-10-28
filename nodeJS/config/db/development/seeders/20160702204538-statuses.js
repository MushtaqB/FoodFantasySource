'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('statuses', [
      {
        status_id: 0,
        status_name_en: 'New',
        status_name_ar: 'جديد',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 1,
        status_name_en: 'In progress',
        status_name_ar: 'قيد التجهيز',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 2,
        status_name_en: 'Waiting for delivery',
        status_name_ar: 'بانتظار التوصيل',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 3,
        status_name_en: 'No Driver',
        status_name_ar: 'لا يوجد سائق',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 4,
        status_name_en: 'On delivery',
        status_name_ar: 'قيد التوصيل',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 5,
        status_name_en: 'Canceled',
        status_name_ar: 'ملغي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 6,
        status_name_en: 'Completed',
        status_name_ar: 'منتهي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 7,
        status_name_en: 'JACK PENDING',
        status_name_ar: 'JACK PENDING',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 8,
        status_name_en: 'JACK ACCEPTED',
        status_name_ar: 'JACK ACCEPTED',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 9,
        status_name_en: 'JACK ARRIVED PICKUP',
        status_name_ar: 'JACK ARRIVED PICKUP',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 10,
        status_name_en: 'JACK OUT FOR DELIVERY',
        status_name_ar: 'JACK OUT FOR DELIVERY',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 11,
        status_name_en: 'JACK ARRIVED DROPFF',
        status_name_ar: 'JACK ARRIVED DROPFF',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        status_id: 11,
        status_name_en: 'JACK CANCELED',
        status_name_ar: 'JACK CANCELED',
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
