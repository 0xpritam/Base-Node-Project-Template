'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      this.hasMany(models.Ticket, {
        foreignKey: 'bookingId',
        onDelete: 'CASCADE'
      });
    }
  }
  Booking.init({
    flightId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM,
      values: ['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED'],
      defaultValue: 'PENDING',
      allowNull: false
    },
    noOfSeats: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    passengers: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancelReason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};
