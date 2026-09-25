const { query } = require('../config/db');

// Get executive KPI stats for Admin Dashboard
async function getDashboardStats(req, res) {
  try {
    const [totalUsersRow] = await query(`SELECT COUNT(*) AS total FROM users WHERE role = 'User'`);
    const [totalPetsRow] = await query('SELECT COUNT(*) AS total FROM pets');
    const [availPetsRow] = await query(`SELECT COUNT(*) AS total FROM pets WHERE status = 'Available'`);
    const [adoptedPetsRow] = await query(`SELECT COUNT(*) AS total FROM pets WHERE status = 'Adopted'`);

    const [totalAppsRow] = await query('SELECT COUNT(*) AS total FROM adoption_applications');
    const [pendingAppsRow] = await query(`SELECT COUNT(*) AS total FROM adoption_applications WHERE status = 'Pending'`);
    const [approvedAppsRow] = await query(`SELECT COUNT(*) AS total FROM adoption_applications WHERE status = 'Approved'`);
    const [rejectedAppsRow] = await query(`SELECT COUNT(*) AS total FROM adoption_applications WHERE status = 'Rejected'`);

    // Recent 5 applications
    const recentApps = await query(
      `SELECT
        a.application_id,
        a.status,
        a.applied_at,
        u.full_name AS applicant_name,
        u.email AS applicant_email,
        p.name AS pet_name,
        p.species AS pet_species,
        p.image AS pet_image
       FROM adoption_applications a
       JOIN users u ON a.user_id = u.user_id
       JOIN pets p ON a.pet_id = p.pet_id
       ORDER BY a.applied_at DESC
       LIMIT 5`
    );

    // Species breakdown
    const speciesDistribution = await query(
      'SELECT species, COUNT(*) as count FROM pets GROUP BY species'
    );

    // Parse counts (pg returns strings for COUNT aggregates)
    const toInt = (row) => (row ? parseInt(row.total, 10) : 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: toInt(totalUsersRow),
        totalPets: toInt(totalPetsRow),
        availablePets: toInt(availPetsRow),
        adoptedPets: toInt(adoptedPetsRow),
        totalApplications: toInt(totalAppsRow),
        pendingApplications: toInt(pendingAppsRow),
        approvedApplications: toInt(approvedAppsRow),
        rejectedApplications: toInt(rejectedAppsRow)
      },
      recentApplications: recentApps,
      speciesDistribution
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving dashboard statistics.' });
  }
}

// Get all registered users (Admin only)
async function getAllUsers(req, res) {
  try {
    const users = await query(
      `SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        u.role,
        u.created_at,
        COUNT(a.application_id) AS total_applications,
        SUM(CASE WHEN a.status = 'Approved' THEN 1 ELSE 0 END) AS approved_adoptions
       FROM users u
       LEFT JOIN adoption_applications a ON u.user_id = a.user_id
       GROUP BY u.user_id
       ORDER BY u.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving users.' });
  }
}

module.exports = {
  getDashboardStats,
  getAllUsers
};
