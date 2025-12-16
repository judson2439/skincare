-- ============================================================================
-- SkinAura PRO Seed Data
-- Version: 1.0
-- Description: Sample data for development and testing
-- ============================================================================

-- Note: This file contains sample data for development purposes.
-- Do not run in production without reviewing and modifying the data.

-- ============================================================================
-- SAMPLE PRODUCTS (Global catalog)
-- ============================================================================

INSERT INTO products (name, brand, category, description, ingredients, skin_types, concerns, price, is_active, is_global)
VALUES
  ('Gentle Foaming Cleanser', 'CeraVe', 'Cleanser', 'A gentle, non-irritating cleanser that removes dirt and oil without disrupting the skin barrier.', ARRAY['Ceramides', 'Hyaluronic Acid', 'Niacinamide'], ARRAY['normal', 'dry', 'sensitive'], ARRAY['dryness', 'sensitivity'], 14.99, true, true),
  
  ('Hydrating Facial Toner', 'Paula''s Choice', 'Toner', 'Alcohol-free toner that hydrates and preps skin for the next steps in your routine.', ARRAY['Hyaluronic Acid', 'Glycerin', 'Aloe Vera'], ARRAY['all'], ARRAY['dryness', 'dullness'], 24.00, true, true),
  
  ('Vitamin C Serum 20%', 'Timeless', 'Serum', 'Powerful antioxidant serum that brightens skin and reduces signs of aging.', ARRAY['L-Ascorbic Acid', 'Vitamin E', 'Ferulic Acid'], ARRAY['normal', 'oily', 'combination'], ARRAY['dark spots', 'aging', 'dullness'], 24.95, true, true),
  
  ('Hyaluronic Acid Serum', 'The Ordinary', 'Serum', 'Multi-molecular hyaluronic acid serum for deep hydration.', ARRAY['Hyaluronic Acid', 'Vitamin B5'], ARRAY['all'], ARRAY['dryness', 'fine lines'], 8.90, true, true),
  
  ('Niacinamide 10% + Zinc 1%', 'The Ordinary', 'Serum', 'Targets blemishes, enlarged pores, and uneven skin tone.', ARRAY['Niacinamide', 'Zinc PCA'], ARRAY['oily', 'combination', 'acne-prone'], ARRAY['acne', 'large pores', 'oiliness'], 6.50, true, true),
  
  ('Retinol 0.5%', 'Paula''s Choice', 'Treatment', 'Anti-aging retinol treatment that reduces wrinkles and improves skin texture.', ARRAY['Retinol', 'Vitamin C', 'Vitamin E'], ARRAY['normal', 'oily', 'combination'], ARRAY['aging', 'wrinkles', 'uneven texture'], 34.00, true, true),
  
  ('Daily Moisturizing Lotion', 'CeraVe', 'Moisturizer', 'Lightweight, oil-free moisturizer with ceramides and hyaluronic acid.', ARRAY['Ceramides', 'Hyaluronic Acid', 'MVE Technology'], ARRAY['normal', 'oily', 'combination'], ARRAY['dryness', 'sensitivity'], 15.99, true, true),
  
  ('Ultra Facial Cream', 'Kiehl''s', 'Moisturizer', 'Rich, 24-hour hydrating cream for all skin types.', ARRAY['Squalane', 'Glacial Glycoprotein', 'Olive Fruit Oil'], ARRAY['all'], ARRAY['dryness', 'dehydration'], 32.00, true, true),
  
  ('Mineral Sunscreen SPF 50', 'EltaMD', 'Sunscreen', 'Broad-spectrum mineral sunscreen that''s gentle on sensitive skin.', ARRAY['Zinc Oxide', 'Titanium Dioxide', 'Niacinamide'], ARRAY['all'], ARRAY['sun protection', 'sensitivity'], 36.00, true, true),
  
  ('Chemical Exfoliant AHA 30% + BHA 2%', 'The Ordinary', 'Exfoliant', 'Weekly exfoliating treatment for brighter, smoother skin.', ARRAY['Glycolic Acid', 'Salicylic Acid', 'Lactic Acid'], ARRAY['normal', 'oily'], ARRAY['dullness', 'texture', 'acne'], 9.80, true, true),
  
  ('Azelaic Acid Suspension 10%', 'The Ordinary', 'Treatment', 'Brightening treatment that targets uneven skin tone and blemishes.', ARRAY['Azelaic Acid'], ARRAY['all'], ARRAY['hyperpigmentation', 'acne', 'rosacea'], 8.90, true, true),
  
  ('Centella Recovery Cream', 'Dr. Jart+', 'Moisturizer', 'Soothing cream with centella asiatica for irritated or damaged skin.', ARRAY['Centella Asiatica', 'Madecassoside', 'Panthenol'], ARRAY['sensitive', 'dry'], ARRAY['sensitivity', 'redness', 'irritation'], 48.00, true, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE BADGE DEFINITIONS (for reference)
-- ============================================================================

-- These are the badges that can be earned in the application:
-- 1. First Step - Complete your first routine
-- 2. Week Warrior - Maintain a 7-day streak
-- 3. Consistency Queen - Maintain a 14-day streak
-- 4. Skincare Devotee - Maintain a 30-day streak
-- 5. Glow Getter - Complete 50 routines
-- 6. Radiance Master - Complete 100 routines
-- Plus any custom badges from completed challenges

-- ============================================================================
-- SAMPLE LEVEL THRESHOLDS (for reference)
-- ============================================================================

-- Gamification levels:
-- Bronze: 0 points
-- Silver: 500 points
-- Gold: 1500 points
-- Platinum: 3000 points
-- Diamond: 5000 points

-- Points system:
-- Routine completion: 50 points base
-- Streak bonus: 10% per streak day
-- Challenge daily progress: 15 points
-- Challenge completion: Varies (default 100 points)
