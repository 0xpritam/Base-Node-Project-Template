'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add index on userId
    await queryInterface.addIndex('Bookings', ['userId'], {
      name: 'bookings_user_id_idx'
    });

    // Add index on flightId
    await queryInterface.addIndex('Bookings', ['flightId'], {
      name: 'bookings_flight_id_idx'
    });

    // Add composite index on (status, createdAt) for recovery worker sweeps
    await queryInterface.addIndex('Bookings', ['status', 'createdAt'], {
      name: 'bookings_status_created_at_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Bookings', 'bookings_user_id_idx');
    await queryInterface.removeIndex('Bookings', 'bookings_flight_id_idx');
    await queryInterface.removeIndex('Bookings', 'bookings_status_created_at_idx');
  }
};
