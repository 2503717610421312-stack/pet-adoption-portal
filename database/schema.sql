-- =================================================================
-- PET ADOPTION PORTAL - PostgreSQL Schema (Supabase)
-- =================================================================

-- Table 1: Users
CREATE TABLE IF NOT EXISTS users (
  user_id   SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email     VARCHAR(100) NOT NULL UNIQUE,
  phone     VARCHAR(20),
  address   TEXT,
  password  VARCHAR(255) NOT NULL,
  role      VARCHAR(10) NOT NULL DEFAULT 'User' CHECK (role IN ('User', 'Admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Pets
CREATE TABLE IF NOT EXISTS pets (
  pet_id        SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  species       VARCHAR(50) NOT NULL,
  breed         VARCHAR(100) NOT NULL,
  age           INT NOT NULL,
  gender        VARCHAR(20) NOT NULL,
  size          VARCHAR(30) NOT NULL,
  health_status VARCHAR(100) NOT NULL,
  image         VARCHAR(255) DEFAULT '/images/pets/default.jpg',
  description   TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Adopted')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Adoption Applications
CREATE TABLE IF NOT EXISTS adoption_applications (
  application_id SERIAL PRIMARY KEY,
  user_id        INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  pet_id         INT NOT NULL REFERENCES pets(pet_id) ON DELETE CASCADE,
  occupation     VARCHAR(100),
  house_type     VARCHAR(100),
  pet_experience TEXT,
  family_members INT DEFAULT 1,
  reason         TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  applied_at     TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at    TIMESTAMPTZ,
  admin_notes    TEXT
);

-- Table 4: Notifications
CREATE TABLE IF NOT EXISTS notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message         TEXT NOT NULL,
  type            VARCHAR(10) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger')),
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
