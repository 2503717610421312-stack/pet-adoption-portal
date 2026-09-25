-- =================================================================
-- PET ADOPTION PORTAL SEED DATA (PostgreSQL / Supabase)
-- Default Admin: admin@pawhaven.com / admin123
-- Default Adopter: sarah@example.com / user123
-- =================================================================

-- Seed Users
INSERT INTO users (user_id, full_name, email, phone, address, password, role) VALUES
(1, 'Administrator', 'admin@pawhaven.com', '+1 (555) 019-2834', '100 Animal Rescue Blvd, Suite 400', '$2a$10$9pVt.Ne5MCIXlfGs4aNLiefDWEAztd5MHqZgV0Go8Q0WtpUms4o0q', 'Admin'),
(2, 'Sarah Jenkins', 'sarah@example.com', '+1 (555) 432-8765', '742 Evergreen Terrace, Springfield', '$2a$10$B.p5vnVfQMWHnNwt8VHBFOh3yADEUk6KgtvdQQxii3FE8o.maPdim', 'User'),
(3, 'Alex Mercer', 'alex@example.com', '+1 (555) 891-2345', '124 Conch Street, Pacific City', '$2a$10$B.p5vnVfQMWHnNwt8VHBFOh3yADEUk6KgtvdQQxii3FE8o.maPdim', 'User')
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- Reset sequence so next auto-id doesn't clash
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

-- Seed Pets
INSERT INTO pets (pet_id, name, species, breed, age, gender, size, health_status, image, description, status) VALUES
(1, 'Bailey', 'Dog', 'Golden Retriever', 2, 'Male', 'Large', 'Fully Vaccinated, Neutered, Microchipped', '/images/pets/dog-golden.jpg', 'Friendly, energetic Golden Retriever who loves swimming and fetch. Great with kids and other pets.', 'Available'),
(2, 'Luna', 'Cat', 'British Shorthair', 1, 'Female', 'Medium', 'Vaccinated, Spayed, Dewormed', '/images/pets/cat-british.jpg', 'Calm and affectionate companion who loves sunbathing on windowsills and gentle chin scratches.', 'Available'),
(3, 'Barnaby', 'Rabbit', 'Holland Lop', 1, 'Male', 'Small', 'Vet Checked, Healthy, Neutered', '/images/pets/rabbit-lop.jpg', 'Curious and friendly bunny with trademark floppy ears. Litter-trained and loves fresh greens.', 'Available'),
(4, 'Sunny', 'Bird', 'Cockatiel', 2, 'Male', 'Small', 'Healthy, Wings Clipped, Active', '/images/pets/bird-cockatiel.jpg', 'Chirpy and whistling songbird. Loves interacting with family members and perching on shoulders.', 'Available'),
(5, 'Max', 'Dog', 'German Shepherd', 3, 'Male', 'Large', 'Fully Vaccinated, Trained, Neutered', '/images/pets/dog-shepherd.jpg', 'Loyal, intelligent protector with basic obedience training. Best for an active household with a yard.', 'Available'),
(6, 'Cleo', 'Cat', 'Persian', 2, 'Female', 'Medium', 'Vaccinated, Spayed, Groomed', '/images/pets/cat-persian.jpg', 'Majestic long-haired beauty with a gentle, serene personality. Enjoys quiet indoor environments.', 'Available'),
(7, 'Bella', 'Dog', 'Beagle', 1, 'Female', 'Medium', 'Vaccinated, Microchipped', '/images/pets/dog-beagle.jpg', 'Playful hound dog with endless curiosity and a sweet disposition. Friendly with all visitors.', 'Adopted'),
(8, 'Pip', 'Bird', 'Budgerigar', 1, 'Female', 'Small', 'Vet Checked, Healthy', '/images/pets/bird-budgie.jpg', 'Vibrant blue and white budgie who loves musical chimes and eating millet treats.', 'Available')
ON CONFLICT (pet_id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('pets_pet_id_seq', (SELECT MAX(pet_id) FROM pets));

-- Seed Applications
INSERT INTO adoption_applications (application_id, user_id, pet_id, occupation, house_type, pet_experience, family_members, reason, status, applied_at, reviewed_at, admin_notes) VALUES
(1, 2, 7, 'Software Engineer', 'Own Single Family Home with Fenced Yard', 'Had dogs during childhood for over 10 years.', 3, 'Looking to provide a loving permanent home for Bella. She will have continuous company.', 'Approved', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', 'Home inspection verified; ideal environment.'),
(2, 2, 1, 'Software Engineer', 'Own Single Family Home with Fenced Yard', 'Previous retriever owner, active hiker.', 3, 'We fell in love with Bailey and want to make him a cherished member of our family.', 'Pending', NOW() - INTERVAL '12 hours', NULL, NULL),
(3, 3, 2, 'Graphic Designer', 'Apartment (Pet Friendly)', 'Owned cats for 5 years in college.', 1, 'Looking for an affectionate indoor feline companion while working remotely.', 'Pending', NOW() - INTERVAL '6 hours', NULL, NULL)
ON CONFLICT (application_id) DO UPDATE SET application_id = EXCLUDED.application_id;

SELECT setval('adoption_applications_application_id_seq', (SELECT MAX(application_id) FROM adoption_applications));

-- Seed Notifications
INSERT INTO notifications (notification_id, user_id, message, type, is_read, created_at) VALUES
(1, 2, 'Welcome to PawHaven! Your account has been registered successfully.', 'info', TRUE, NOW() - INTERVAL '4 days'),
(2, 2, 'Congratulations! Your adoption application for Bella (Beagle) has been APPROVED by the shelter staff.', 'success', FALSE, NOW() - INTERVAL '1 day'),
(3, 2, 'Your adoption application for Bailey (Golden Retriever) has been received and is currently under review.', 'info', FALSE, NOW() - INTERVAL '12 hours'),
(4, 3, 'Welcome to PawHaven! Explore our available pets and find your perfect companion.', 'info', FALSE, NOW() - INTERVAL '1 day')
ON CONFLICT (notification_id) DO UPDATE SET notification_id = EXCLUDED.notification_id;

SELECT setval('notifications_notification_id_seq', (SELECT MAX(notification_id) FROM notifications));
