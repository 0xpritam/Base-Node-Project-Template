'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FlightSeats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      flightId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Flights',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      seatId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Seats',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      bookingId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('AVAILABLE', 'HELD', 'BOOKED'),
        defaultValue: 'AVAILABLE',
        allowNull: false
      },
      reservedUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique composite constraint on (flightId, seatId)
    await queryInterface.addConstraint('FlightSeats', {
      fields: ['flightId', 'seatId'],
      type: 'unique',
      name: 'unique_flight_seat_constraint'
    });

    // Add indexes
    await queryInterface.addIndex('FlightSeats', ['flightId'], {
      name: 'flight_seats_flight_id_idx'
    });
    await queryInterface.addIndex('FlightSeats', ['bookingId'], {
      name: 'flight_seats_booking_id_idx'
    });
    await queryInterface.addIndex('FlightSeats', ['flightId', 'status'], {
      name: 'flight_seats_flight_id_status_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('FlightSeats');
  }
};
