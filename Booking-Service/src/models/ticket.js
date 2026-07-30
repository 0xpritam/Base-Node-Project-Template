'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
      this.belongsTo(models.Booking, {
        foreignKey: 'bookingId'
      });
      this.belongsTo(models.Passenger, {
        foreignKey: 'passengerId'
      });
    }
  }
  Ticket.init({
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    passengerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    seatId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    seatNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pnr: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Ticket',
  });
  return Ticket;
};
