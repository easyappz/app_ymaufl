"use strict";

const mongoose = require('mongoose');
const Courier = require('@src/models/Courier');
const User = require('@src/models/User');

// Helpers
const parseBoolean = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
  }
  return undefined;
};

const toNumberOrUndefined = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

exports.list = async (req, res) => {
  try {
    const {
      q,
      city,
      isAvailable,
      ratingFrom,
      ratingTo,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const ratingGte = toNumberOrUndefined(ratingFrom);
    const ratingLte = toNumberOrUndefined(ratingTo);

    const match = {};
    if (city) match.city = city;

    const isAvail = parseBoolean(isAvailable);
    if (typeof isAvail !== 'undefined') match.isAvailable = isAvail;

    if (typeof ratingGte !== 'undefined' || typeof ratingLte !== 'undefined') {
      match.rating = {};
      if (typeof ratingGte !== 'undefined') match.rating.$gte = ratingGte;
      if (typeof ratingLte !== 'undefined') match.rating.$lte = ratingLte;
    }

    const sortFields = {
      createdAt: 'createdAt',
      rating: 'rating',
      fullName: 'user.fullName',
      city: 'city',
      isAvailable: 'isAvailable',
    };
    const sortField = sortFields[sortBy] || 'createdAt';
    const sortOrder = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;

    const userOr = [];
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), 'i');
      userOr.push({ 'user.fullName': rx });
      userOr.push({ 'user.phone': rx });
    }

    const pipeline = [
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: Object.keys(match).length || userOr.length ? { $and: [ match, userOr.length ? { $or: userOr } : {} ].filter(Boolean) } : {} },
      { $sort: { [sortField]: sortOrder, _id: 1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                city: 1,
                isAvailable: 1,
                rating: 1,
                vehicleType: 1,
                notes: 1,
                createdAt: 1,
                updatedAt: 1,
                user: {
                  _id: '$user._id',
                  fullName: '$user.fullName',
                  phone: '$user.phone',
                  role: '$user.role',
                  isActive: '$user.isActive',
                },
              },
            },
          ],
          total: [ { $count: 'count' } ],
        },
      },
    ];

    const result = await Courier.aggregate(pipeline);
    const items = (result[0]?.data) || [];
    const total = (result[0]?.total?.[0]?.count) || 0;

    return res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list couriers', details: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid courier id', details: 'Provided id is not a valid ObjectId' });
    }

    const doc = await Courier.findById(id)
      .populate({ path: 'user', select: '_id fullName phone role isActive' })
      .lean();

    if (!doc) {
      return res.status(404).json({ error: 'Courier not found', details: `Courier with id ${id} does not exist` });
    }

    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get courier', details: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      userId,
      fullName,
      phone,
      email,
      city,
      isAvailable,
      rating,
      vehicleType,
      notes,
    } = req.body || {};

    let user;

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user id', details: 'userId is not a valid ObjectId' });
      }
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found', details: `User with id ${userId} does not exist` });
      }
    } else {
      if (!fullName || !phone) {
        return res.status(400).json({ error: 'Validation error', details: 'fullName and phone are required if userId is not provided' });
      }
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({ error: 'Phone already in use', details: `User with phone ${phone} already exists` });
      }
      user = await User.create({ fullName, phone, email: email || undefined, role: 'courier', isActive: true });
    }

    const existingCourier = await Courier.findOne({ user: user._id });
    if (existingCourier) {
      return res.status(409).json({ error: 'Courier already exists', details: `Courier profile for user ${String(user._id)} already exists` });
    }

    const doc = await Courier.create({
      user: user._id,
      city: city || '',
      isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
      rating: typeof rating === 'number' ? Math.max(0, Math.min(5, rating)) : 0,
      vehicleType: vehicleType || 'other',
      notes: notes || '',
    });

    const created = await Courier.findById(doc._id)
      .populate({ path: 'user', select: '_id fullName phone role isActive' })
      .lean();

    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create courier', details: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid courier id', details: 'Provided id is not a valid ObjectId' });
    }

    const body = req.body || {};
    const courier = await Courier.findById(id).populate('user');

    if (!courier) {
      return res.status(404).json({ error: 'Courier not found', details: `Courier with id ${id} does not exist` });
    }

    // Update user fields if provided
    if (body.user && typeof body.user === 'object') {
      const { fullName, phone, email } = body.user;
      if (typeof fullName === 'string' && fullName.trim()) {
        courier.user.fullName = fullName.trim();
      }
      if (typeof phone === 'string' && phone.trim()) {
        const duplicate = await User.findOne({ phone: phone.trim(), _id: { $ne: courier.user._id } });
        if (duplicate) {
          return res.status(409).json({ error: 'Phone already in use', details: `User with phone ${phone} already exists` });
        }
        courier.user.phone = phone.trim();
      }
      if (typeof email === 'string') {
        courier.user.email = email.trim();
      }
      await courier.user.save();
    }

    // Update courier fields
    const allowedCourierFields = ['city', 'isAvailable', 'rating', 'vehicleType', 'notes'];
    for (const key of allowedCourierFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        if (key === 'rating') {
          const r = Number(body[key]);
          if (!Number.isFinite(r)) {
            return res.status(400).json({ error: 'Validation error', details: 'rating must be a number' });
          }
          courier.rating = Math.max(0, Math.min(5, r));
        } else {
          courier[key] = body[key];
        }
      }
    }

    await courier.save();

    const updated = await Courier.findById(courier._id)
      .populate({ path: 'user', select: '_id fullName phone role isActive' })
      .lean();

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update courier', details: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid courier id', details: 'Provided id is not a valid ObjectId' });
    }

    const courier = await Courier.findById(id).populate('user');
    if (!courier) {
      return res.status(404).json({ error: 'Courier not found', details: `Courier with id ${id} does not exist` });
    }

    const doHard = String(hard || '').toLowerCase() === 'true';

    if (doHard) {
      // Hard delete logic: remove the courier document and deactivate the linked user.
      // We do NOT delete the user record to preserve audit/history, but we mark it inactive.
      await Courier.deleteOne({ _id: courier._id });
      if (courier.user) {
        courier.user.isActive = false;
        await courier.user.save();
      }
      return res.json({ id: String(id), deleted: true, mode: 'hard', userDeactivated: !!courier.user });
    }

    // Soft delete logic: mark user as inactive and courier as unavailable.
    courier.isAvailable = false;
    await courier.save();

    if (courier.user) {
      courier.user.isActive = false;
      await courier.user.save();
    }

    return res.json({ id: String(id), deleted: true, mode: 'soft' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove courier', details: err.message });
  }
};
