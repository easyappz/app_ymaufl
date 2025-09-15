"use strict";
const mongoose = require('mongoose');
const Order = require('@src/models/Order');
const Courier = require('@src/models/Courier');
const User = require('@src/models/User');

const ALLOWED_STATUSES = ['new', 'assigned', 'picked_up', 'delivered', 'canceled'];
const STATUS_TRANSITIONS = {
  new: ['assigned', 'canceled'],
  assigned: ['picked_up', 'canceled'],
  picked_up: ['delivered'],
  delivered: [],
  canceled: [],
};

function isAdminOrDispatcher(role) {
  return role === 'admin' || role === 'dispatcher';
}

async function getCourierIdByUserId(userId) {
  const courier = await Courier.findOne({ user: userId }).select('_id');
  return courier ? courier._id : null;
}

function parsePagination(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildSort(query) {
  const allowed = ['createdAt', 'price', 'status', 'number', 'customerName'];
  const sortBy = allowed.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortDir = query.sortDir === 'asc' ? 1 : -1;
  return { [sortBy]: sortDir };
}

exports.list = async (req, res) => {
  try {
    const { status, courierId, q, createdFrom, createdTo } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const sort = buildSort(req.query);

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (createdFrom || createdTo) {
      filter.createdAt = {};
      if (createdFrom) filter.createdAt.$gte = new Date(createdFrom);
      if (createdTo) filter.createdAt.$lte = new Date(createdTo);
    }

    if (q) {
      const rx = new RegExp(q, 'i');
      filter.$or = [{ number: rx }, { customerName: rx }];
    }

    if (req.user?.role === 'courier') {
      const ownCourierId = await getCourierIdByUserId(req.user.id);
      if (!ownCourierId) {
        return res.status(403).json({ error: 'Forbidden', details: 'Courier profile not found for current user' });
      }
      filter.courier = ownCourierId;
    } else if (courierId) {
      if (!mongoose.isValidObjectId(courierId)) {
        return res.status(400).json({ error: 'Bad Request', details: 'Invalid courierId' });
      }
      filter.courier = courierId;
    }

    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate({ path: 'courier', populate: { path: 'user', model: User, select: 'fullName phone role' } })
        .populate({ path: 'createdBy', select: 'fullName phone role' })
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    return res.status(500).json({ error: 'Orders list failed', details: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Bad Request', details: 'Invalid id' });
    }

    const order = await Order.findById(id)
      .populate({ path: 'courier', populate: { path: 'user', model: User, select: 'fullName phone role' } })
      .populate({ path: 'createdBy', select: 'fullName phone role' });

    if (!order) {
      return res.status(404).json({ error: 'Not Found', details: 'Order not found' });
    }

    if (req.user?.role === 'courier') {
      const ownCourierId = await getCourierIdByUserId(req.user.id);
      if (!ownCourierId || String(order.courier?._id) !== String(ownCourierId)) {
        return res.status(403).json({ error: 'Forbidden', details: 'Courier can only access own orders' });
      }
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: 'Get order failed', details: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!isAdminOrDispatcher(role)) {
      return res.status(403).json({ error: 'Forbidden', details: 'Only admin|dispatcher can create orders' });
    }

    const { number, customerName, customerPhone, addressFrom, addressTo, price, notes, courierId } = req.body || {};

    const required = { number, customerName, customerPhone, addressFrom, addressTo, price };
    for (const [key, val] of Object.entries(required)) {
      if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
        return res.status(400).json({ error: 'Validation error', details: `Field ${key} is required` });
      }
    }

    if (isNaN(Number(price))) {
      return res.status(400).json({ error: 'Validation error', details: 'price must be a number' });
    }

    let courier = null;
    let status = 'new';

    if (courierId) {
      if (!mongoose.isValidObjectId(courierId)) {
        return res.status(400).json({ error: 'Validation error', details: 'Invalid courierId' });
      }
      courier = await Courier.findById(courierId);
      if (!courier) {
        return res.status(404).json({ error: 'Not Found', details: 'Courier not found' });
      }
      status = 'assigned';
    }

    const data = {
      number: String(number).trim(),
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      addressFrom: String(addressFrom).trim(),
      addressTo: String(addressTo).trim(),
      price: Number(price),
      notes: notes ? String(notes) : '',
      createdBy: req.user.id,
      courier: courier ? courier._id : null,
      status,
    };

    const order = await Order.create(data);

    const populated = await Order.findById(order._id)
      .populate({ path: 'courier', populate: { path: 'user', model: User, select: 'fullName phone role' } })
      .populate({ path: 'createdBy', select: 'fullName phone role' });

    return res.status(201).json(populated);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Conflict', details: 'Order number must be unique' });
    }
    return res.status(500).json({ error: 'Create order failed', details: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!isAdminOrDispatcher(role)) {
      return res.status(403).json({ error: 'Forbidden', details: 'Only admin|dispatcher can update orders' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Bad Request', details: 'Invalid id' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Not Found', details: 'Order not found' });
    }

    const allowed = ['number', 'customerName', 'customerPhone', 'addressFrom', 'addressTo', 'price', 'notes'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'price') {
          if (isNaN(Number(req.body[key]))) {
            return res.status(400).json({ error: 'Validation error', details: 'price must be a number' });
          }
          order[key] = Number(req.body[key]);
        } else {
          order[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
        }
      }
    }

    // Do not allow changing status or courier here

    await order.save();

    const populated = await Order.findById(order._id)
      .populate({ path: 'courier', populate: { path: 'user', model: User, select: 'fullName phone role' } })
      .populate({ path: 'createdBy', select: 'fullName phone role' });

    return res.json(populated);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Conflict', details: 'Order number must be unique' });
    }
    return res.status(500).json({ error: 'Update order failed', details: err.message });
  }
};

exports.assign = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!isAdminOrDispatcher(role)) {
      return res.status(403).json({ error: 'Forbidden', details: 'Only admin|dispatcher can assign couriers' });
    }

    const { id } = req.params;
    const { courierId } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Bad Request', details: 'Invalid id' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Not Found', details: 'Order not found' });
    }

    if (courierId === null || courierId === undefined || courierId === '') {
      order.courier = null;
      // do not auto-change status on unassign
    } else {
      if (!mongoose.isValidObjectId(courierId)) {
        return res.status(400).json({ error: 'Validation error', details: 'Invalid courierId' });
      }
      const courier = await Courier.findById(courierId);
      if (!courier) {
        return res.status(404).json({ error: 'Not Found', details: 'Courier not found' });
      }
      order.courier = courier._id;
      if (order.status === 'new') {
        order.status = 'assigned';
      }
    }

    await order.save();

    const populated = await Order.findById(order._id)
      .populate({ path: 'courier', populate: { path: 'user', model: User, select: 'fullName phone role' } })
      .populate({ path: 'createdBy', select: 'fullName phone role' });

    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ error: 'Assign courier failed', details: err.message });
  }
};

exports.status = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Bad Request', details: 'Invalid id' });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Validation error', details: 'Invalid status value' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Not Found', details: 'Order not found' });
    }

    // Role-based permissions
    const role = req.user?.role;
    if (role === 'courier') {
      const ownCourierId = await getCourierIdByUserId(req.user.id);
      if (!ownCourierId || String(order.courier) !== String(ownCourierId)) {
        return res.status(403).json({ error: 'Forbidden', details: 'Courier can change status only for own orders' });
      }
      const allowedForCourier = {
        assigned: ['picked_up'],
        picked_up: ['delivered'],
      };
      const next = allowedForCourier[order.status] || [];
      if (!next.includes(status)) {
        return res.status(400).json({ error: 'Invalid transition', details: `Courier cannot change status from ${order.status} to ${status}` });
      }
    } else if (!isAdminOrDispatcher(role)) {
      return res.status(403).json({ error: 'Forbidden', details: 'Only admin|dispatcher|courier can change status' });
    } else {
      // for admin/dispatcher validate general transitions
      const next = STATUS_TRANSITIONS[order.status] || [];
      if (!next.includes(status)) {
        return res.status(400).json({ error: 'Invalid transition', details: `Cannot change status from ${order.status} to ${status}` });
      }
    }

    order.status = status;
    await order.save();

    const populated = await Order.findById(order._id)
      .populate({ path: 'courier', populate: { path: 'user', model: User, select: 'fullName phone role' } })
      .populate({ path: 'createdBy', select: 'fullName phone role' });

    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ error: 'Change status failed', details: err.message });
  }
};

exports.stats = async (req, res) => {
  try {
    const { createdFrom, createdTo, courierId } = req.query;

    const match = {};
    if (createdFrom || createdTo) {
      match.createdAt = {};
      if (createdFrom) match.createdAt.$gte = new Date(createdFrom);
      if (createdTo) match.createdAt.$lte = new Date(createdTo);
    }

    if (req.user?.role === 'courier') {
      const ownCourierId = await getCourierIdByUserId(req.user.id);
      if (!ownCourierId) {
        return res.status(403).json({ error: 'Forbidden', details: 'Courier profile not found for current user' });
      }
      match.courier = ownCourierId;
    } else if (courierId) {
      if (!mongoose.isValidObjectId(courierId)) {
        return res.status(400).json({ error: 'Bad Request', details: 'Invalid courierId' });
      }
      match.courier = new mongoose.Types.ObjectId(courierId);
    }

    const totalPromise = Order.countDocuments(match);

    const byStatusPromise = Order.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, priceSum: { $sum: '$price' } } },
    ]);

    const byCourierPromise = Order.aggregate([
      { $match: match },
      { $group: { _id: '$courier', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $lookup: { from: 'couriers', localField: '_id', foreignField: '_id', as: 'courier' } },
      { $unwind: { path: '$courier', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'courier.user', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, courierId: '$_id', count: 1, courierName: '$user.fullName' } },
    ]);

    const [total, byStatusRaw, byCourier] = await Promise.all([totalPromise, byStatusPromise, byCourierPromise]);

    const byStatus = { new: 0, assigned: 0, picked_up: 0, delivered: 0, canceled: 0 };
    const byStatusPrice = { new: 0, assigned: 0, picked_up: 0, delivered: 0, canceled: 0 };
    for (const row of byStatusRaw) {
      byStatus[row._id] = row.count;
      byStatusPrice[row._id] = row.priceSum || 0;
    }

    return res.json({
      range: {
        from: createdFrom || null,
        to: createdTo || null,
      },
      total,
      byStatus,
      byStatusPrice,
      byCourier,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Stats aggregation failed', details: err.message });
  }
};
