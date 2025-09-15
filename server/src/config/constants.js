"use strict";

const JWT_SECRET = "easyappz-courier-management-secret-please-change";
const JWT_EXPIRES_IN = "7d";
const NODE_ENV = process.env.NODE_ENV || "development";

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  NODE_ENV,
};
