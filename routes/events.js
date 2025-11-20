const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// Create a new event (protected)
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, dateTime, location, invitees } = req.body;

    const event = new Event({
      title,
      description,
      dateTime,
      location,
      organizer: req.user.id,
      invitees,
    });

    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get events where user is organizer or invited (protected)
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [{ organizer: req.user.id }, { invitees: req.user.id }],
    }).populate('organizer', 'name email').populate('invitees', 'name email');

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Update an event (only organizer)
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Authorization check - only organizer can update
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    // Update event fields from request body if provided
    const { title, description, dateTime, location, invitees } = req.body;

    event.title = title || event.title;
    event.description = description || event.description;
    event.dateTime = dateTime || event.dateTime;
    event.location = location || event.location;
    event.invitees = invitees || event.invitees;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an event (only organizer)
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Authorization check - only organizer can delete
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update RSVP status (protected)
router.put('/:id/rsvp', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is invited
    if (!event.invitees.some(inviteeId => inviteeId.toString() === req.user.id)) {
      return res.status(403).json({ message: 'You are not invited to this event' });
    }

    const { status } = req.body; // expected values: 'accepted', 'declined', 'maybe'
    if (!['accepted', 'declined', 'maybe'].includes(status)) {
      return res.status(400).json({ message: 'Invalid RSVP status' });
    }

    // Find RSVP for user or create new
    const rsvpIndex = event.rsvps.findIndex(rsvp => rsvp.user.toString() === req.user.id);

    if (rsvpIndex >= 0) {
      // Update existing RSVP
      event.rsvps[rsvpIndex].status = status;
    } else {
      // Add new RSVP
      event.rsvps.push({ user: req.user.id, status });
    }

    await event.save();
    res.json({ message: 'RSVP updated successfully', rsvps: event.rsvps });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Add a comment
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if user is organizer or invitee
    const userId = req.user.id;
    if (
      event.organizer.toString() !== userId &&
      !event.invitees.some(inv => inv.toString() === userId)
    ) {
      return res.status(403).json({ message: 'Not authorized to comment on this event' });
    }

    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    event.comments.push({ user: userId, message });
    await event.save();

    res.status(201).json({ message: 'Comment added', comments: event.comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all comments for an event
router.get('/:id/comments', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('comments.user', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    res.json(event.comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
module.exports = router;
