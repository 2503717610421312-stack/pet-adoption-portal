const { query } = require('../config/db');

// Get all notifications for current user
async function getUserNotifications(req, res) {
  try {
    const userId = req.user.userId;
    const notifications = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('getUserNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
}

// Get unread notification count
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.userId;
    const rows = await query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    return res.status(200).json({
      success: true,
      unreadCount: rows[0] ? parseInt(rows[0].count, 10) : 0
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    return res.status(500).json({ success: false, message: 'Server error counting notifications.' });
  }
}

// Mark single notification as read
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2',
      [id, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating notification.' });
  }
}

// Mark all notifications as read
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.userId;
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating notifications.' });
  }
}

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
