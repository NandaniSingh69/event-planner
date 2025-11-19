const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['accepted', 'declined', 'maybe'], default: 'maybe' }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  dateTime: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  invitees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  rsvps: [rsvpSchema],
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
