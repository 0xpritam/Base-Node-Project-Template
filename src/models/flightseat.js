'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FlightSeat extends Model {
    static associate(models) {
      this.belongsTo(models.Flight, {
        foreignKey: 'flightId',
        as: 'flightDetail'
      });
      this.belongsTo(models.Seat, {
        foreignKey: 'seatId',
        as: 'seatDetail'
      });
    }
  }
  FlightSeat.init({
    flightId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    seatId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('AVAILABLE', 'HELD', 'BOOKED'),
      defaultValue: 'AVAILABLE',
      allowNull: false
    },
    reservedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'FlightSeat',
    indexes: [
      {
        fields: ['flightId']
      },
      {
        fields: ['bookingId']
      },
      {
        fields: ['flightId', 'status']
      }
    ]
  });
  return FlightSeat;
};
