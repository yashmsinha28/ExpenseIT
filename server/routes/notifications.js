const express = require('express');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Store connected SSE clients
// Map of userId -> Array of Response objects
const clients = new Map();

// Helper to push an event to a specific user's connected SSE clients
const sendSSEToUser = (userId, eventType, data) => {
  const userClients = clients.get(userId.toString());
  if (userClients && userClients.length > 0) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    userClients.forEach(res => {
      // res.write can throw if client disconnected ungracefully
      try {
        res.write(message);
      } catch (err) {
        console.error('Error writing SSE to client', err);
      }
    });
  }
};

// Expose the trigger function so other routes (like expenses) can create and push notifications
router.triggerNotification = async (userId, title, message, type = 'info') => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
    });
    sendSSEToUser(userId, 'new_notification', notification);
    return notification;
  } catch (err) {
    console.error('Failed to trigger notification:', err);
  }
};

// @route   GET /api/notifications/stream
// @desc    Subscribe to real-time notifications (SSE endpoint)
// @access  Private (uses query token since EventSource doesn't support headers)
router.get('/stream', async (req, res) => {
  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE connection

  // Authenticate from query param token (since EventSource in browser can't send Auth headers easily)
  const token = req.query.token;
  let userId = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      return res.status(401).end(); // Unauthorized
    }
  } else {
    return res.status(401).end();
  }

  // Add client to the map
  if (!clients.has(userId)) {
    clients.set(userId, []);
  }
  clients.get(userId).push(res);

  // Send initial ping to confirm connection
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'SSE connected' })}\n\n`);

  // Remove client on connection close
  req.on('close', () => {
    const userClients = clients.get(userId) || [];
    const newClients = userClients.filter(client => client !== res);
    if (newClients.length === 0) {
      clients.delete(userId);
    } else {
      clients.set(userId, newClients);
    }
  });
});

// All routes below this use standard Bearer token header authentication
router.use(protect);

// @route   GET /api/notifications
// @desc    Get all notifications for the user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    // Also get unread count
    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

// @route   PUT /api/notifications/read
// @desc    Mark all notifications as read
// @access  Private
router.put('/read', async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a specific notification as read
// @access  Private
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
});

module.exports = router;
