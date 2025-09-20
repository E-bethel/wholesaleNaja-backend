const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  iconUrl: { type: String }, // optional UI support
});

module.exports = mongoose.model('Category', categorySchema);
