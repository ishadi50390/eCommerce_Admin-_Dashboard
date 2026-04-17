import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const OrderItem = sequelize.define("OrderItem", {
  quantity: DataTypes.INTEGER,
});

export default OrderItem;