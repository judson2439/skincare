-- ============================================================================
-- SkinAura PRO Row Level Security (RLS) Policies
-- Version: 1.0
-- Description: Security policies for all tables
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_professional_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_step_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_routine_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE skincare_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_skin_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Professionals can read their clients' profiles
CREATE POLICY "Professionals can read client profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_professional_relationships
      WHERE professional_id = auth.uid()
      AND client_id = user_profiles.id
      AND status = 'active'
    )
  );

-- Clients can read their professional's profile
CREATE POLICY "Clients can read professional profile"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_professional_relationships
      WHERE client_id = auth.uid()
      AND professional_id = user_profiles.id
      AND status = 'active'
    )
  );

-- Same policies for profiles table
CREATE POLICY "Users can read own profile (profiles)"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile (profiles)"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile (profiles)"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CLIENT-PROFESSIONAL RELATIONSHIPS POLICIES
-- ============================================================================

-- Professionals can manage relationships
CREATE POLICY "Professionals can manage relationships"
  ON client_professional_relationships FOR ALL
  USING (auth.uid() = professional_id);

-- Clients can view their relationships
CREATE POLICY "Clients can view relationships"
  ON client_professional_relationships FOR SELECT
  USING (auth.uid() = client_id);

-- ============================================================================
-- PROFESSIONAL INVITATIONS POLICIES
-- ============================================================================

-- Professionals can manage their invitations
CREATE POLICY "Professionals can manage invitations"
  ON professional_invitations FOR ALL
  USING (auth.uid() = professional_id);

-- Anyone can read invitations by code (for accepting)
CREATE POLICY "Anyone can read invitations"
  ON professional_invitations FOR SELECT
  USING (true);

-- ============================================================================
-- PROGRESS PHOTOS POLICIES
-- ============================================================================

-- Clients can manage their own photos
CREATE POLICY "Clients can manage own photos"
  ON progress_photos FOR ALL
  USING (auth.uid() = client_id);

-- Professionals can view their clients' photos
CREATE POLICY "Professionals can view client photos"
  ON progress_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_professional_relationships
      WHERE professional_id = auth.uid()
      AND client_id = progress_photos.client_id
      AND status = 'active'
    )
  );

-- ============================================================================
-- PHOTO COMMENTS POLICIES
-- ============================================================================

-- Users can manage their own comments
CREATE POLICY "Users can manage own comments"
  ON photo_comments FOR ALL
  USING (auth.uid() = author_id);

-- Users can read comments on their photos or photos they have access to
CREATE POLICY "Users can read accessible comments"
  ON photo_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM progress_photos
      WHERE progress_photos.id = photo_comments.photo_id
      AND (
        progress_photos.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM client_professional_relationships
          WHERE professional_id = auth.uid()
          AND client_id = progress_photos.client_id
          AND status = 'active'
        )
      )
    )
  );

-- ============================================================================
-- PHOTO ANNOTATIONS POLICIES
-- ============================================================================

-- Users can manage their own annotations
CREATE POLICY "Users can manage own annotations"
  ON photo_annotations FOR ALL
  USING (auth.uid() = author_id);

-- Users can read annotations on accessible photos
CREATE POLICY "Users can read accessible annotations"
  ON photo_annotations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM progress_photos
      WHERE progress_photos.id = photo_annotations.photo_id
      AND (
        progress_photos.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM client_professional_relationships
          WHERE professional_id = auth.uid()
          AND client_id = progress_photos.client_id
          AND status = 'active'
        )
      )
    )
  );

-- ============================================================================
-- TREATMENT PLANS POLICIES
-- ============================================================================

-- Professionals can manage their treatment plans
CREATE POLICY "Professionals can manage treatment plans"
  ON treatment_plans FOR ALL
  USING (auth.uid() = professional_id);

-- Clients can view their treatment plans
CREATE POLICY "Clients can view treatment plans"
  ON treatment_plans FOR SELECT
  USING (auth.uid() = client_id);

-- ============================================================================
-- TREATMENT PLAN MILESTONES POLICIES
-- ============================================================================

-- Access based on parent treatment plan
CREATE POLICY "Users can access milestones via plan"
  ON treatment_plan_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans
      WHERE treatment_plans.id = treatment_plan_milestones.plan_id
      AND (treatment_plans.professional_id = auth.uid() OR treatment_plans.client_id = auth.uid())
    )
  );

-- ============================================================================
-- TREATMENT PLAN PRODUCTS POLICIES
-- ============================================================================

CREATE POLICY "Users can access plan products via plan"
  ON treatment_plan_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans
      WHERE treatment_plans.id = treatment_plan_products.plan_id
      AND (treatment_plans.professional_id = auth.uid() OR treatment_plans.client_id = auth.uid())
    )
  );

-- ============================================================================
-- TREATMENT PLAN ROUTINES POLICIES
-- ============================================================================

CREATE POLICY "Users can access plan routines via plan"
  ON treatment_plan_routines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans
      WHERE treatment_plans.id = treatment_plan_routines.plan_id
      AND (treatment_plans.professional_id = auth.uid() OR treatment_plans.client_id = auth.uid())
    )
  );

-- ============================================================================
-- TREATMENT PLAN APPOINTMENTS POLICIES
-- ============================================================================

CREATE POLICY "Users can access plan appointments via plan"
  ON treatment_plan_appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans
      WHERE treatment_plans.id = treatment_plan_appointments.plan_id
      AND (treatment_plans.professional_id = auth.uid() OR treatment_plans.client_id = auth.uid())
    )
  );

-- ============================================================================
-- TREATMENT HISTORY POLICIES
-- ============================================================================

-- Professionals can manage treatment history
CREATE POLICY "Professionals can manage treatment history"
  ON treatment_history FOR ALL
  USING (auth.uid() = professional_id);

-- Clients can view their treatment history
CREATE POLICY "Clients can view treatment history"
  ON treatment_history FOR SELECT
  USING (auth.uid() = client_id);

-- ============================================================================
-- ROUTINE TEMPLATES POLICIES
-- ============================================================================

-- Professionals can manage their routines
CREATE POLICY "Professionals can manage routines"
  ON routine_templates FOR ALL
  USING (auth.uid() = professional_id);

-- Clients can view routines assigned to them
CREATE POLICY "Clients can view assigned routines"
  ON routine_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_routine_assignments
      WHERE routine_id = routine_templates.id
      AND client_id = auth.uid()
      AND is_active = true
    )
  );

-- ============================================================================
-- ROUTINE STEPS POLICIES
-- ============================================================================

CREATE POLICY "Users can access routine steps"
  ON routine_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM routine_templates
      WHERE routine_templates.id = routine_steps.routine_id
      AND (
        routine_templates.professional_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM client_routine_assignments
          WHERE routine_id = routine_templates.id
          AND client_id = auth.uid()
          AND is_active = true
        )
      )
    )
  );

-- ============================================================================
-- CLIENT ROUTINE ASSIGNMENTS POLICIES
-- ============================================================================

-- Professionals can manage assignments
CREATE POLICY "Professionals can manage assignments"
  ON client_routine_assignments FOR ALL
  USING (auth.uid() = professional_id);

-- Clients can view their assignments
CREATE POLICY "Clients can view assignments"
  ON client_routine_assignments FOR SELECT
  USING (auth.uid() = client_id);

-- ============================================================================
-- ROUTINE COMPLETIONS POLICIES
-- ============================================================================

-- Users can manage their own completions
CREATE POLICY "Users can manage own completions"
  ON routine_completions FOR ALL
  USING (auth.uid() = user_id);

-- Professionals can view their clients' completions
CREATE POLICY "Professionals can view client completions"
  ON routine_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_professional_relationships
      WHERE professional_id = auth.uid()
      AND client_id = routine_completions.user_id
      AND status = 'active'
    )
  );

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================

-- Anyone can view active global products
CREATE POLICY "Anyone can view global products"
  ON products FOR SELECT
  USING (is_active = true AND is_global = true);

-- Professionals can manage their products
CREATE POLICY "Professionals can manage products"
  ON products FOR ALL
  USING (auth.uid() = professional_id);

-- ============================================================================
-- PRODUCT RECOMMENDATIONS POLICIES
-- ============================================================================

-- Professionals can manage recommendations
CREATE POLICY "Professionals can manage recommendations"
  ON product_recommendations FOR ALL
  USING (auth.uid() = professional_id);

-- Clients can view their recommendations
CREATE POLICY "Clients can view recommendations"
  ON product_recommendations FOR SELECT
  USING (auth.uid() = client_id);

-- ============================================================================
-- CLIENT PRODUCTS POLICIES
-- ============================================================================

-- Clients can manage their products
CREATE POLICY "Clients can manage own products"
  ON client_products FOR ALL
  USING (auth.uid() = client_id);

-- Professionals can view their clients' products
CREATE POLICY "Professionals can view client products"
  ON client_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_professional_relationships
      WHERE professional_id = auth.uid()
      AND client_id = client_products.client_id
      AND status = 'active'
    )
  );

-- ============================================================================
-- GAMIFICATION POLICIES
-- ============================================================================

-- Users can manage their own gamification stats
CREATE POLICY "Users can manage own gamification"
  ON user_gamification FOR ALL
  USING (auth.uid() = user_id);

-- Users can manage their own badges
CREATE POLICY "Users can manage own badges"
  ON user_badges FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHALLENGES POLICIES
-- ============================================================================

-- Anyone can view active challenges
CREATE POLICY "Anyone can view active challenges"
  ON skincare_challenges FOR SELECT
  USING (is_active = true);

-- Professionals can manage their challenges
CREATE POLICY "Professionals can manage challenges"
  ON skincare_challenges FOR ALL
  USING (auth.uid() = professional_id);

-- ============================================================================
-- CHALLENGE PARTICIPANTS POLICIES
-- ============================================================================

-- Users can manage their own participation
CREATE POLICY "Users can manage own participation"
  ON challenge_participants FOR ALL
  USING (auth.uid() = user_id);

-- Anyone can view participants (for leaderboards)
CREATE POLICY "Anyone can view participants"
  ON challenge_participants FOR SELECT
  USING (true);

-- ============================================================================
-- CHALLENGE DAILY PROGRESS POLICIES
-- ============================================================================

-- Users can manage their own progress
CREATE POLICY "Users can manage own progress"
  ON challenge_daily_progress FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- DAILY SKIN CHECKINS POLICIES
-- ============================================================================

-- Clients can manage their own checkins
CREATE POLICY "Clients can manage own checkins"
  ON daily_skin_checkins FOR ALL
  USING (auth.uid() = client_id);

-- Professionals can view their clients' checkins
CREATE POLICY "Professionals can view client checkins"
  ON daily_skin_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_professional_relationships
      WHERE professional_id = auth.uid()
      AND client_id = daily_skin_checkins.client_id
      AND status = 'active'
    )
  );

-- ============================================================================
-- NOTIFICATION PREFERENCES POLICIES
-- ============================================================================

-- Users can manage their own preferences
CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage professional notification settings"
  ON professional_notification_settings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- PUSH SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Users can manage their own subscriptions
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- CLIENT NOTIFICATIONS POLICIES
-- ============================================================================

-- Clients can manage their own notifications
CREATE POLICY "Clients can manage own notifications"
  ON client_notifications FOR ALL
  USING (auth.uid() = client_id);

-- Professionals can create notifications for their clients
CREATE POLICY "Professionals can create client notifications"
  ON client_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_professional_relationships
      WHERE professional_id = auth.uid()
      AND client_id = client_notifications.client_id
      AND status = 'active'
    )
  );

-- ============================================================================
-- CLIENT NOTES POLICIES
-- ============================================================================

-- Professionals can manage their notes
CREATE POLICY "Professionals can manage client notes"
  ON client_notes FOR ALL
  USING (auth.uid() = professional_id);

-- Clients can view non-private notes about them
CREATE POLICY "Clients can view non-private notes"
  ON client_notes FOR SELECT
  USING (auth.uid() = client_id AND is_private = false);
