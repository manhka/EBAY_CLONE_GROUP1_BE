const mongoose = require('mongoose');

const db = {};

db.User = require('./User');
db.Address = require('./Address');
db.Bid = require('./Bid');
db.Cart = require('./Cart');
db.Category = require('./Category');
db.Coupon = require('./Coupon');
db.Dispute = require('./Dispute');
db.Feedback = require('./Feedback');
db.Inventory = require('./Inventory');
db.Message = require('./Message');
db.Order = require('./Order');
db.OrderItem = require('./OrderItem');
db.Payment = require('./Payment');
db.Product = require('./Product');
db.ReturnRequest = require('./ReturnRequest');
db.Review = require('./Review');
db.ShippingInfo = require('./ShippingInfo');
db.Store = require('./Store');

module.exports = db;