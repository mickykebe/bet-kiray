CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id INTEGER UNIQUE NOT NULL,
  telegram_user_name TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CONSTRAINT role_values CHECK (role IN ('user', 'admin'))
);

CREATE TABLE house_listing (
  id SERIAL PRIMARY KEY,
  available_for TEXT NOT NULL CONSTRAINT available_for_values CHECK (available_for IN ('Sale', 'Rent')),
  house_type TEXT NOT NULL CONSTRAINT house_type_values CHECK (house_type IN ('Apartment', 'Condominium', 'House', 'Commercial Property', 'House Rooms', 'Guest House')),
  title TEXT NOT NULL,
  description TEXT,
  rooms INTEGER CHECK (rooms > 0),
  bathrooms INTEGER CHECK (bathrooms > 0),
  price TEXT,
  owner INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location TEXT,
  approval_status TEXT NOT NULL CONSTRAINT approval_values CHECK (approval_status IN ('Pending', 'Active', 'Declined', 'Closed')) DEFAULT 'Pending',
  apply_via_telegram boolean DEFAULT FALSE,
  apply_phone_number TEXT,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT require_application_method CHECK (apply_via_telegram IS NOT FALSE OR apply_phone_number IS NOT NULL)
);

CREATE TABLE listing_photo(
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES house_listing(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL
);

CREATE TABLE listing_social_post(
  listing_id INTEGER PRIMARY KEY REFERENCES house_listing(id) ON DELETE CASCADE,
  telegram_message_id INTEGER
);