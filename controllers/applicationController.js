const { query } = require('../config/db');

// Submit an adoption application (Adopter)
async function submitApplication(req, res) {
  try {
    const userId = req.user.userId;
    const { pet_id, occupation, house_type, pet_experience, family_members, reason } = req.body;

    if (!pet_id) {
      return res.status(400).json({ success: false, message: 'Pet ID is required.' });
    }

    // 1. Verify pet exists and is available
    const pets = await query('SELECT * FROM pets WHERE pet_id = $1', [pet_id]);
    if (pets.length === 0) {
      return res.status(404).json({ success: false, message: 'Pet not found.' });
    }

    const pet = pets[0];
    if (pet.status === 'Adopted') {
      return res.status(400).json({
        success: false,
        message: 'This pet has already been adopted and is no longer available.'
      });
    }

    // 2. Check if user already applied for this pet
    const existing = await query(
      `SELECT application_id, status FROM adoption_applications
       WHERE user_id = $1 AND pet_id = $2 AND status = 'Pending'`,
      [userId, pet_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending application for this pet.'
      });
    }

    // 3. Insert application
    const result = await query(
      `INSERT INTO adoption_applications
       (user_id, pet_id, occupation, house_type, pet_experience, family_members, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
       RETURNING application_id`,
      [
        userId,
        pet_id,
        occupation || 'Not specified',
        house_type || 'Apartment',
        pet_experience || 'None',
        parseInt(family_members, 10) || 1,
        reason || 'Loving home'
      ]
    );

    // 4. Send instant confirmation notification to user
    await query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, 'info')`,
      [
        userId,
        `Your adoption application for ${pet.name} (${pet.breed}) has been received! Our staff will review your submission soon.`
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Adoption application submitted successfully!',
      applicationId: result[0].application_id
    });
  } catch (error) {
    console.error('submitApplication error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting application.' });
  }
}

// Get applications of the logged in user
async function getMyApplications(req, res) {
  try {
    const userId = req.user.userId;

    const applications = await query(
      `SELECT
        a.application_id,
        a.pet_id,
        a.occupation,
        a.house_type,
        a.pet_experience,
        a.family_members,
        a.reason,
        a.status,
        a.applied_at,
        a.reviewed_at,
        a.admin_notes,
        p.name AS pet_name,
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.age AS pet_age,
        p.gender AS pet_gender,
        p.image AS pet_image,
        p.status AS pet_current_status
       FROM adoption_applications a
       JOIN pets p ON a.pet_id = p.pet_id
       WHERE a.user_id = $1
       ORDER BY a.applied_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('getMyApplications error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving applications.' });
  }
}

// Get all applications (Admin only)
async function getAllApplications(req, res) {
  try {
    const { status, petId, userId } = req.query;

    let sql = `
      SELECT
        a.application_id,
        a.user_id,
        a.pet_id,
        a.occupation,
        a.house_type,
        a.pet_experience,
        a.family_members,
        a.reason,
        a.status,
        a.applied_at,
        a.reviewed_at,
        a.admin_notes,
        u.full_name AS applicant_name,
        u.email AS applicant_email,
        u.phone AS applicant_phone,
        u.address AS applicant_address,
        p.name AS pet_name,
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.image AS pet_image,
        p.status AS pet_current_status
      FROM adoption_applications a
      JOIN users u ON a.user_id = u.user_id
      JOIN pets p ON a.pet_id = p.pet_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (status && status !== 'All') {
      sql += ` AND a.status = $${i++}`;
      params.push(status);
    }

    if (petId) {
      sql += ` AND a.pet_id = $${i++}`;
      params.push(petId);
    }

    if (userId) {
      sql += ` AND a.user_id = $${i++}`;
      params.push(userId);
    }

    sql += ' ORDER BY a.applied_at DESC';

    const applications = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('getAllApplications error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving applications.' });
  }
}

// Update application status: Approve / Reject (Admin only)
async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved, Rejected, or Pending.' });
    }

    // 1. Fetch current application
    const apps = await query(
      `SELECT a.*, p.name AS pet_name, u.full_name, u.email
       FROM adoption_applications a
       JOIN pets p ON a.pet_id = p.pet_id
       JOIN users u ON a.user_id = u.user_id
       WHERE a.application_id = $1`,
      [id]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const application = apps[0];

    // 2. Update application status
    await query(
      `UPDATE adoption_applications
       SET status = $1, reviewed_at = NOW(), admin_notes = $2
       WHERE application_id = $3`,
      [status, admin_notes || null, id]
    );

    // 3. State transition logic
    if (status === 'Approved') {
      // Pet becomes 'Adopted'
      await query(`UPDATE pets SET status = 'Adopted' WHERE pet_id = $1`, [application.pet_id]);

      // Notify the approved adopter
      await query(
        `INSERT INTO notifications (user_id, message, type)
         VALUES ($1, $2, 'success')`,
        [
          application.user_id,
          `🎉 Great news! Your adoption application for ${application.pet_name} has been APPROVED! Our adoption counselor will reach out to finalize the adoption handover.`
        ]
      );

      // Auto-reject other pending applications for the same pet
      const otherApps = await query(
        `SELECT application_id, user_id FROM adoption_applications
         WHERE pet_id = $1 AND application_id != $2 AND status = 'Pending'`,
        [application.pet_id, id]
      );

      for (const other of otherApps) {
        await query(
          `UPDATE adoption_applications
           SET status = 'Rejected', reviewed_at = NOW(), admin_notes = 'Adopted by another applicant'
           WHERE application_id = $1`,
          [other.application_id]
        );
        await query(
          `INSERT INTO notifications (user_id, message, type)
           VALUES ($1, $2, 'warning')`,
          [
            other.user_id,
            `We appreciate your interest in adopting ${application.pet_name}. Another family was selected for this pet, but we encourage you to browse our other wonderful animals in need of a home!`
          ]
        );
      }
    } else if (status === 'Rejected') {
      // Notify the applicant
      const rejectionMsg = admin_notes
        ? `Your adoption application for ${application.pet_name} was not approved. Shelter note: "${admin_notes}". Feel free to apply for other pets or contact us with questions.`
        : `Your adoption application for ${application.pet_name} was not approved at this time. Please contact our shelter for further information.`;

      await query(
        `INSERT INTO notifications (user_id, message, type)
         VALUES ($1, $2, 'danger')`,
        [application.user_id, rejectionMsg]
      );
    }

    return res.status(200).json({
      success: true,
      message: `Application marked as ${status}. Notifications and pet status updated.`
    });
  } catch (error) {
    console.error('updateApplicationStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating application status.' });
  }
}

module.exports = {
  submitApplication,
  getMyApplications,
  getAllApplications,
  updateApplicationStatus
};
