-- Create the users table for Supabase Auth integration
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  "firstName" VARCHAR,
  "lastName" VARCHAR,
  "profileImageUrl" VARCHAR,
  "profileColor" VARCHAR DEFAULT 'blue',
  verified BOOLEAN DEFAULT false,
  "verificationToken" VARCHAR,
  "phoneNumber" VARCHAR,
  "dateOfBirth" DATE,
  "idVerified" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create the households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  "inviteCode" VARCHAR(8) UNIQUE NOT NULL,
  "createdBy" VARCHAR REFERENCES users(id) NOT NULL,
  "rentAmount" DECIMAL(10, 2),
  "rentDueDay" INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create household members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "householdId" UUID REFERENCES households(id),
  "userId" VARCHAR REFERENCES users(id),
  role VARCHAR DEFAULT 'member',
  "joinedAt" TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Create policies for households
CREATE POLICY "Household members can view their household" ON households
  FOR SELECT USING (
    id IN (
      SELECT "householdId" FROM household_members 
      WHERE "userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can create households" ON households
  FOR INSERT WITH CHECK (auth.uid()::text = "createdBy");

-- Create policies for household members
CREATE POLICY "Household members can view members" ON household_members
  FOR SELECT USING (
    "householdId" IN (
      SELECT "householdId" FROM household_members 
      WHERE "userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can join households" ON household_members
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");