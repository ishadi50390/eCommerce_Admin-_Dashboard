import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Order = sequelize.define("Order", {
  total: DataTypes.FLOAT,
});

export default Order;