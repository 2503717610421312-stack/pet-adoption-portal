const { query } = require('../config/db');

// Browse pets with dynamic filtering
async function getAllPets(req, res) {
  try {
    const { species, gender, size, status, search, maxAge, sort } = req.query;

    let sql = 'SELECT * FROM pets WHERE 1=1';
    const params = [];
    let i = 1;

    if (species && species !== 'All') {
      sql += ` AND species = $${i++}`;
      params.push(species);
    }

    if (gender && gender !== 'All') {
      sql += ` AND gender = $${i++}`;
      params.push(gender);
    }

    if (size && size !== 'All') {
      sql += ` AND size = $${i++}`;
      params.push(size);
    }

    if (status && status !== 'All') {
      sql += ` AND status = $${i++}`;
      params.push(status);
    }

    if (maxAge && !isNaN(parseInt(maxAge, 10))) {
      sql += ` AND age <= $${i++}`;
      params.push(parseInt(maxAge, 10));
    }

    if (search && search.trim() !== '') {
      sql += ` AND (name ILIKE $${i} OR breed ILIKE $${i} OR description ILIKE $${i})`;
      params.push(`%${search.trim()}%`);
      i++;
    }

    // Sorting
    if (sort === 'age_asc') {
      sql += ' ORDER BY age ASC';
    } else if (sort === 'age_desc') {
      sql += ' ORDER BY age DESC';
    } else if (sort === 'name_asc') {
      sql += ' ORDER BY name ASC';
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    const pets = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: pets.length,
      data: pets
    });
  } catch (error) {
    console.error('getAllPets error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving pets.' });
  }
}

// Get single pet by ID
async function getPetById(req, res) {
  try {
    const { id } = req.params;
    const pets = await query('SELECT * FROM pets WHERE pet_id = $1', [id]);

    if (pets.length === 0) {
      return res.status(404).json({ success: false, message: 'Pet not found.' });
    }

    const pet = pets[0];

    // Optional: check if authenticated user has submitted an application for this pet
    let userApplication = null;
    if (req.user && req.user.userId) {
      const apps = await query(
        'SELECT application_id, status, applied_at FROM adoption_applications WHERE pet_id = $1 AND user_id = $2',
        [id, req.user.userId]
      );
      if (apps.length > 0) {
        userApplication = apps[0];
      }
    }

    return res.status(200).json({
      success: true,
      data: pet,
      userApplication
    });
  } catch (error) {
    console.error('getPetById error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving pet.' });
  }
}

// Create new pet (Admin only)
async function createPet(req, res) {
  try {
    const { name, species, breed, age, gender, size, health_status, description, status } = req.body;

    if (!name || !species || !breed || !age || !gender || !size || !health_status) {
      return res.status(400).json({
        success: false,
        message: 'Name, species, breed, age, gender, size, and health status are required.'
      });
    }

    let imagePath = '/images/pets/default.jpg';
    if (req.file) {
      // multer-storage-cloudinary sets req.file.path to the Cloudinary secure URL
      imagePath = req.file.path;
    } else if (req.body.image_url) {
      imagePath = req.body.image_url;
    }

    const result = await query(
      `INSERT INTO pets (name, species, breed, age, gender, size, health_status, image, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING pet_id`,
      [
        name.trim(),
        species.trim(),
        breed.trim(),
        parseInt(age, 10),
        gender.trim(),
        size.trim(),
        health_status.trim(),
        imagePath,
        description ? description.trim() : null,
        status || 'Available'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Pet profile created successfully!',
      petId: result[0].pet_id
    });
  } catch (error) {
    console.error('createPet error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating pet profile.' });
  }
}

// Update pet (Admin only)
async function updatePet(req, res) {
  try {
    const { id } = req.params;
    const { name, species, breed, age, gender, size, health_status, description, status } = req.body;

    const existing = await query('SELECT * FROM pets WHERE pet_id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Pet not found.' });
    }

    let imagePath = existing[0].image;
    if (req.file) {
      // multer-storage-cloudinary sets req.file.path to the Cloudinary secure URL
      imagePath = req.file.path;
    } else if (req.body.image_url) {
      imagePath = req.body.image_url;
    }

    await query(
      `UPDATE pets
       SET name = $1, species = $2, breed = $3, age = $4, gender = $5,
           size = $6, health_status = $7, image = $8, description = $9, status = $10
       WHERE pet_id = $11`,
      [
        name || existing[0].name,
        species || existing[0].species,
        breed || existing[0].breed,
        age !== undefined ? parseInt(age, 10) : existing[0].age,
        gender || existing[0].gender,
        size || existing[0].size,
        health_status || existing[0].health_status,
        imagePath,
        description !== undefined ? description : existing[0].description,
        status || existing[0].status,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Pet profile updated successfully.'
    });
  } catch (error) {
    console.error('updatePet error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating pet profile.' });
  }
}

// Delete pet (Admin only)
async function deletePet(req, res) {
  try {
    const { id } = req.params;
    const existing = await query('SELECT pet_id FROM pets WHERE pet_id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Pet not found.' });
    }

    await query('DELETE FROM pets WHERE pet_id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Pet removed successfully.'
    });
  } catch (error) {
    console.error('deletePet error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting pet.' });
  }
}

module.exports = {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet
};
