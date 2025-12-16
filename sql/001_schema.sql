-- ============================================================================
-- SkinAura PRO Database Schema
-- Version: 1.0
-- Description: Complete database schema for the SkinAura PRO application
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('client', 'professional')) DEFAULT 'client',
  avatar_url TEXT,
  skin_type TEXT,
  concerns TEXT[],
  business_name TEXT,
  license_number TEXT,
  professional_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (alias/alternative to user_profiles for some queries)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('client', 'professional')) DEFAULT 'client',
  avatar_url TEXT,
  skin_type TEXT,
  concerns TEXT[],
  business_name TEXT,
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLIENT-PROFESSIONAL RELATIONSHIPS
-- ============================================================================

-- Relationships between clients and professionals
CREATE TABLE IF NOT EXISTS client_professional_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, professional_id)
);

-- Professional invitations to clients
CREATE TABLE IF NOT EXISTS professional_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  client_name TEXT,
  invitation_code TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')) DEFAULT 'pending',
  accepted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROGRESS PHOTOS
-- ============================================================================

-- Progress photos uploaded by clients
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  notes TEXT,
  skin_analysis JSONB,
  tags TEXT[],
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on progress photos
CREATE TABLE IF NOT EXISTS photo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES progress_photos(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Annotations on progress photos
CREATE TABLE IF NOT EXISTS photo_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES progress_photos(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  annotation_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TREATMENT PLANS
-- ============================================================================

-- Treatment plans created by professionals
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  goals TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones within treatment plans
CREATE TABLE IF NOT EXISTS treatment_plan_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products in treatment plans
CREATE TABLE IF NOT EXISTS treatment_plan_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_brand TEXT,
  product_category TEXT,
  usage_instructions TEXT,
  priority TEXT CHECK (priority IN ('essential', 'recommended', 'optional')) DEFAULT 'recommended',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routines in treatment plans
CREATE TABLE IF NOT EXISTS treatment_plan_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  routine_name TEXT NOT NULL,
  routine_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments in treatment plans
CREATE TABLE IF NOT EXISTS treatment_plan_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  appointment_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TREATMENT HISTORY
-- ============================================================================

-- Treatment history records
CREATE TABLE IF NOT EXISTS treatment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  treatment_type TEXT NOT NULL,
  treatment_date DATE NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  products_used TEXT[],
  before_photo_url TEXT,
  after_photo_url TEXT,
  results TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROUTINES
-- ============================================================================

-- Routine templates created by professionals
CREATE TABLE IF NOT EXISTS routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  routine_type TEXT CHECK (routine_type IN ('morning', 'evening', 'weekly', 'custom')) DEFAULT 'morning',
  skin_types TEXT[],
  concerns TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Steps within routines
CREATE TABLE IF NOT EXISTS routine_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routine_templates(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  product_category TEXT,
  product_recommendation TEXT,
  tips TEXT,
  is_optional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products linked to routine steps
CREATE TABLE IF NOT EXISTS routine_step_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_step_id UUID NOT NULL REFERENCES routine_steps(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routine_step_id, product_id)
);

-- Routines assigned to clients
CREATE TABLE IF NOT EXISTS client_routine_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routine_templates(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine completions by clients
CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  routine_type TEXT CHECK (routine_type IN ('morning', 'evening')) NOT NULL,
  products_used TEXT[],
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, completion_date, routine_type)
);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

-- Product catalog
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  description TEXT,
  ingredients TEXT[],
  skin_types TEXT[],
  concerns TEXT[],
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  purchase_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product recommendations from professionals to clients
CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  notes TEXT,
  priority TEXT CHECK (priority IN ('essential', 'recommended', 'optional')) DEFAULT 'recommended',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(professional_id, client_id, product_id)
);

-- Products used by clients
CREATE TABLE IF NOT EXISTS client_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  description TEXT,
  image_url TEXT,
  purchase_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- GAMIFICATION
-- ============================================================================

-- User gamification stats
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Bronze',
  total_routines_completed INTEGER DEFAULT 0,
  last_completion_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_name)
);

-- ============================================================================
-- CHALLENGES
-- ============================================================================

-- Skincare challenges created by professionals
CREATE TABLE IF NOT EXISTS skincare_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK (challenge_type IN ('weekly', 'monthly', 'custom')) DEFAULT 'weekly',
  duration_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal_description TEXT NOT NULL,
  daily_requirement TEXT,
  bonus_points INTEGER DEFAULT 100,
  badge_name TEXT,
  badge_description TEXT,
  max_participants INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES skincare_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  days_completed INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);

-- Daily progress for challenges
CREATE TABLE IF NOT EXISTS challenge_daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES skincare_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, progress_date)
);

-- ============================================================================
-- DAILY SKIN CHECK-INS
-- ============================================================================

-- Daily skin check-ins by clients
CREATE TABLE IF NOT EXISTS daily_skin_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  skin_rating INTEGER CHECK (skin_rating >= 1 AND skin_rating <= 10),
  hydration_level TEXT CHECK (hydration_level IN ('dry', 'normal', 'oily', 'combination')),
  concerns TEXT[],
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, checkin_date)
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Notification preferences for users
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  routine_reminders BOOLEAN DEFAULT TRUE,
  appointment_reminders BOOLEAN DEFAULT TRUE,
  challenge_updates BOOLEAN DEFAULT TRUE,
  professional_messages BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  reminder_time TIME DEFAULT '08:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Professional notification settings
CREATE TABLE IF NOT EXISTS professional_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  new_client_notifications BOOLEAN DEFAULT TRUE,
  appointment_notifications BOOLEAN DEFAULT TRUE,
  photo_upload_notifications BOOLEAN DEFAULT TRUE,
  checkin_notifications BOOLEAN DEFAULT TRUE,
  challenge_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Client notifications
CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder', 'message')) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLIENT NOTES
-- ============================================================================

-- Notes about clients (by professionals)
CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT CHECK (note_type IN ('general', 'treatment', 'follow-up', 'concern', 'progress')) DEFAULT 'general',
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_professional_id ON user_profiles(professional_id);

-- Progress photos indexes
CREATE INDEX IF NOT EXISTS idx_progress_photos_client_id ON progress_photos(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_taken_at ON progress_photos(taken_at);

-- Treatment plans indexes
CREATE INDEX IF NOT EXISTS idx_treatment_plans_professional_id ON treatment_plans(professional_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_client_id ON treatment_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);

-- Routine indexes
CREATE INDEX IF NOT EXISTS idx_routine_templates_professional_id ON routine_templates(professional_id);
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_id ON routine_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_completions_date ON routine_completions(completion_date);

-- Challenge indexes
CREATE INDEX IF NOT EXISTS idx_skincare_challenges_professional_id ON skincare_challenges(professional_id);
CREATE INDEX IF NOT EXISTS idx_skincare_challenges_dates ON skincare_challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_client_notifications_client_id ON client_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_read ON client_notifications(read);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_professional_id ON products(professional_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_client_products_client_id ON client_products(client_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_photos_updated_at
  BEFORE UPDATE ON progress_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_templates_updated_at
  BEFORE UPDATE ON routine_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
