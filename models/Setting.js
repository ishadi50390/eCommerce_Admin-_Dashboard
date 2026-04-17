import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Setting = sequelize.define("Setting", {
  key: DataTypes.STRING,
  value: DataTypes.STRING,
});

export default Setting;