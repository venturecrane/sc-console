-- ============================================================
-- SEED DATA FOR DEVELOPMENT AND TESTING
-- Silicon Crane API - Test Experiments
--
-- This script is idempotent: running it multiple times will not
-- create duplicate records due to INSERT OR IGNORE statements.
--
-- Creates experiments in various statuses for testing:
-- 1. SC-2026-001: 'launch' status with copy_pack (frontend testing)
-- 2. SC-2026-002: 'run' status with leads and metrics
-- 3. SC-2026-003: 'draft' status (basic experiment)
-- 4. SC-2026-004: 'archive' status (completed experiment)
-- 5. SC-2026-005: 'build' status (priced waitlist)
-- 6. SC-2026-006: 'decide' status (awaiting decision)
-- 7. SC-2026-007: 'preflight' status (planning phase)
-- ============================================================

-- ============================================================
-- EXPERIMENT 1: 'launch' status with copy_pack
-- For frontend landing page testing
-- ============================================================
INSERT OR IGNORE INTO experiments (
  id, name, slug, status, archetype,
  problem_statement, target_audience, value_proposition,
  min_signups, max_spend_cents, max_duration_days,
  copy_pack, creative_brief
) VALUES (
  'SC-2026-001',
  'Accessibility Auditor',
  'accessibility-auditor',
  'launch',
  'waitlist',
  'Small businesses face ADA compliance lawsuits but lack resources for accessibility audits',
  'Small business owners with websites, 10-100 employees, US-based',
  'Automated WCAG 2.1 AA compliance scanning with actionable remediation steps',
  100,
  50000,  -- $500 budget
  14,     -- 2 weeks
  '{"version":1,"headline":"Get Your Website ADA-Compliant in 24 Hours","subheadline":"Free automated accessibility scan with actionable fixes","value_props":["Identify all WCAG 2.1 AA violations","Get step-by-step remediation guide","Avoid costly ADA lawsuits"],"cta_primary":"Get Free Scan","cta_secondary":"Learn More","social_proof":"Used by 500+ small businesses","urgency_hook":"Limited to 50 scans this week","meta_title":"Free Website Accessibility Scan - ADA Compliance Tool","meta_description":"Check your website for ADA compliance issues in 24 hours. Free automated WCAG 2.1 scan with actionable fixes.","og_title":"Get Your Website ADA-Compliant in 24 Hours","og_description":"Free automated accessibility scan with step-by-step fixes","ad_headlines":["Avoid ADA Lawsuits - Get Free Scan","Website Not Accessible? Fix It in 24h","Free Accessibility Audit for Your Site"],"ad_descriptions":["Automated WCAG 2.1 scan with remediation guide. Used by 500+ businesses.","Identify accessibility violations and get step-by-step fixes in 24 hours.","Protect your business from ADA lawsuits. Free scan takes 5 minutes."]}',
  '{"version":1,"image_style":"screenshot","primary_subject":"Website accessibility scanner dashboard","text_overlay":true,"aspect_ratios":["1:1","1.91:1"]}'
);

-- Set launched_at for experiment 1
UPDATE experiments SET launched_at = (strftime('%s', 'now') * 1000) - 86400000
WHERE id = 'SC-2026-001' AND launched_at IS NULL;

-- ============================================================
-- EXPERIMENT 2: 'run' status with leads and metrics
-- Active experiment with real-looking data
-- ============================================================
INSERT OR IGNORE INTO experiments (
  id, name, slug, status, archetype,
  problem_statement, target_audience, value_proposition,
  min_signups, max_spend_cents, max_duration_days,
  copy_pack, kill_criteria
) VALUES (
  'SC-2026-002',
  'AI Content Calendar',
  'ai-content-calendar',
  'run',
  'waitlist',
  'Content creators struggle to maintain consistent posting schedules across platforms',
  'Solo content creators and small marketing teams, 1-5 people',
  'AI-powered content calendar that generates and schedules posts automatically',
  50,
  100000,  -- $1,000 budget
  21,      -- 3 weeks
  '{"version":1,"headline":"Your AI Content Team, 24/7","subheadline":"Generate a month of social posts in minutes","value_props":["AI writes platform-optimized content","Auto-schedule to best posting times","Manage all platforms in one place"],"cta_primary":"Join Waitlist","cta_secondary":"See Demo","social_proof":"1,200+ creators on the waitlist","meta_title":"AI Content Calendar - Automate Your Social Media","meta_description":"Let AI generate and schedule your social media content. Join 1,200+ creators.","og_title":"Your AI Content Team, 24/7","og_description":"Generate a month of social posts in minutes","ad_headlines":["AI Writes Your Social Posts","Never Miss a Posting Day","Content Calendar on Autopilot"],"ad_descriptions":["Generate a month of content in minutes. AI-powered scheduling.","Join 1,200+ creators using AI to manage social media.","Platform-optimized posts, auto-scheduled to best times."]}',
  '{"version":1,"rules":[{"metric":"cpl_cents","operator":"gt","threshold":2000,"label":"CPL exceeds $20"},{"metric":"cvr_bp","operator":"lt","threshold":200,"label":"CVR below 2%"}]}'
);

-- Set launched_at for experiment 2 (5 days ago)
UPDATE experiments SET launched_at = (strftime('%s', 'now') * 1000) - 432000000
WHERE id = 'SC-2026-002' AND launched_at IS NULL;

-- Insert leads for experiment 2
INSERT OR IGNORE INTO leads (experiment_id, email, name, status, utm_source, utm_medium, utm_campaign)
VALUES
  ('SC-2026-002', 'alice@example.com', 'Alice Johnson', 'new', 'facebook', 'paid', 'ai-content-jan'),
  ('SC-2026-002', 'bob@example.com', 'Bob Smith', 'qualified', 'google', 'cpc', 'ai-content-jan'),
  ('SC-2026-002', 'carol@example.com', 'Carol Davis', 'new', 'facebook', 'paid', 'ai-content-jan'),
  ('SC-2026-002', 'david@example.com', 'David Wilson', 'new', 'instagram', 'organic', NULL),
  ('SC-2026-002', 'eva@example.com', 'Eva Martinez', 'qualified', 'google', 'cpc', 'ai-content-jan'),
  ('SC-2026-002', 'frank@example.com', 'Frank Brown', 'new', 'twitter', 'organic', NULL),
  ('SC-2026-002', 'grace@example.com', 'Grace Lee', 'new', 'facebook', 'paid', 'ai-content-jan'),
  ('SC-2026-002', 'henry@example.com', 'Henry Taylor', 'scheduled', 'linkedin', 'paid', 'ai-content-b2b');

-- Insert metrics for experiment 2 (last 5 days)
INSERT OR IGNORE INTO metrics_daily (experiment_id, date, source, impressions, clicks, sessions, conversions, spend_cents, revenue_cents, ctr_bp, cvr_bp, cpl_cents, roas_bp)
VALUES
  ('SC-2026-002', date('now', '-5 days'), 'facebook', 5000, 150, 120, 3, 2500, 0, 300, 250, 833, NULL),
  ('SC-2026-002', date('now', '-4 days'), 'facebook', 5500, 180, 145, 4, 2750, 0, 327, 276, 688, NULL),
  ('SC-2026-002', date('now', '-3 days'), 'facebook', 4800, 140, 110, 2, 2400, 0, 292, 182, 1200, NULL),
  ('SC-2026-002', date('now', '-2 days'), 'facebook', 6000, 200, 160, 5, 3000, 0, 333, 313, 600, NULL),
  ('SC-2026-002', date('now', '-1 days'), 'facebook', 5200, 165, 130, 3, 2600, 0, 317, 231, 867, NULL),
  ('SC-2026-002', date('now', '-5 days'), 'google', 3000, 90, 75, 2, 1800, 0, 300, 267, 900, NULL),
  ('SC-2026-002', date('now', '-4 days'), 'google', 3200, 100, 82, 2, 1920, 0, 313, 244, 960, NULL),
  ('SC-2026-002', date('now', '-3 days'), 'google', 2800, 80, 65, 1, 1680, 0, 286, 154, 1680, NULL),
  ('SC-2026-002', date('now', '-2 days'), 'google', 3500, 110, 90, 3, 2100, 0, 314, 333, 700, NULL),
  ('SC-2026-002', date('now', '-1 days'), 'google', 3100, 95, 78, 2, 1860, 0, 306, 256, 930, NULL);

-- ============================================================
-- EXPERIMENT 3: 'draft' status
-- New experiment just being set up
-- ============================================================
INSERT OR IGNORE INTO experiments (
  id, name, slug, status, archetype,
  problem_statement, target_audience
) VALUES (
  'SC-2026-003',
  'Invoice Automation SaaS',
  'invoice-automation',
  'draft',
  'priced_waitlist',
  'Freelancers spend hours each month creating and tracking invoices',
  'Freelancers and solopreneurs billing clients, US-based'
);

-- ============================================================
-- EXPERIMENT 4: 'archive' status
-- Completed experiment with decision
-- ============================================================
INSERT OR IGNORE INTO experiments (
  id, name, slug, status, archetype,
  problem_statement, target_audience, value_proposition,
  min_signups, max_spend_cents,
  copy_pack
) VALUES (
  'SC-2026-004',
  'Pet Health Tracker',
  'pet-health-tracker',
  'archive',
  'waitlist',
  'Pet owners forget vet appointments and struggle to track pet health history',
  'Pet owners, primarily dog and cat, suburban households',
  'Mobile app to track pet health records, vaccinations, and vet appointments',
  200,
  75000,  -- $750 budget
  '{"version":1,"headline":"Never Miss Another Vet Visit","subheadline":"Track your pet''s health in one simple app","value_props":["Vaccination reminders","Vet appointment scheduling","Health history at your fingertips"],"cta_primary":"Get Early Access","meta_title":"Pet Health Tracker App","meta_description":"Track your pet''s health, vaccinations, and vet appointments.","og_title":"Never Miss Another Vet Visit","og_description":"Track your pet''s health in one simple app","ad_headlines":["Pet Health Made Simple","Track Pet Vaccinations","Vet Reminders That Work"],"ad_descriptions":["Keep your pet healthy with smart reminders.","Track health records and never miss a vet visit.","Join pet owners who stay on top of pet health."]}'
);

-- Set timestamps for archived experiment
UPDATE experiments
SET launched_at = (strftime('%s', 'now') * 1000) - 2592000000,  -- 30 days ago
    decided_at = (strftime('%s', 'now') * 1000) - 604800000     -- 7 days ago
WHERE id = 'SC-2026-004' AND launched_at IS NULL;

-- Insert decision memo for archived experiment
INSERT OR IGNORE INTO decision_memos (experiment_id, decision, confidence_pct, rationale, key_metrics, author)
SELECT 'SC-2026-004', 'KILL', 75,
  'CPL consistently above threshold at $25. Target audience shows low willingness to pay for pet health tracking when free alternatives exist. Recommend pivoting to veterinary clinic B2B model or abandoning.',
  '{"total_signups":45,"total_spend_cents":65000,"cpl_cents":1444,"cvr_bp":180}',
  'PM Team'
WHERE NOT EXISTS (SELECT 1 FROM decision_memos WHERE experiment_id = 'SC-2026-004');

-- ============================================================
-- EXPERIMENT 5: 'build' status
-- Priced waitlist in development
-- ============================================================
INSERT OR IGNORE INTO experiments (
  id, name, slug, status, archetype,
  problem_statement, target_audience, value_proposition,
  min_signups, max_spend_cents, price_cents,
  stripe_price_id, stripe_product_id
) VALUES (
  'SC-2026-005',
  'Email Template Studio',
  'email-template-studio',
  'build',
  'priced_waitlist',
  'Marketers spend hours designing email templates that don''t convert well',
  'Email marketers at SMBs, 100-500 employee companies',
  'AI-designed email templates optimized for conversions, delivered weekly',
  30,
  40000,  -- $400 budget
  4900,   -- $49 price
  'price_test_123',
  'prod_test_456'
);

-- ============================================================
-- EXPERIMENT 6: 'decide' status
-- Awaiting go/kill decision
-- ============================================================
INSERT OR IGNORE INTO experiments (
  id, name, slug, status, archetype,
  problem_statement, target_audience, value_proposition,
  min_signups, max_spend_cents, max_duration_days,
  copy_pack, kill_criteria
) VALUES (
  'SC-2026-006',
  'Meeting Notes AI',
  'meeting-notes-ai',
  'decide',
  'waitlist',
  'Professionals lose important action items from meetings due to poor note-taking',
  'Remote workers and hybrid teams, tech companies',
  'AI that joins your meetings, takes notes, and creates action items automatically',
  75,
  80000,  -- $800 budget
  14,
  '{"version":1,"headline":"Never Take Meeting Notes Again","subheadline":"AI assistant that captures everything","value_props":["Auto-join any video call","Smart action item extraction","Searchable meeting archive"],"cta_primary":"Join Beta","meta_title":"AI Meeting Notes - Never Miss an Action Item","meta_description":"AI joins your meetings and captures notes automatically.","og_title":"Never Take Meeting Notes Again","og_description":"AI assistant that captures everything","ad_headlines":["AI Takes Your Meeting Notes","Capture Every Action Item","Meeting Notes on Autopilot"],"ad_descriptions":["AI joins calls and creates smart summaries.","Never miss an action item again.","Join professionals using AI for meetings."]}',
  '{"version":1,"rules":[{"metric":"cpl_cents","operator":"gt","threshold":1500,"label":"CPL exceeds $15"},{"metric":"total_spend_cents","operator":"gte","threshold":80000,"label":"Budget exhausted"}]}'
);

-- Set timestamps for decide experiment
UPDATE experiments
SET launched_at = (strftime('%s', 'now') * 1000) - 1209600000,  -- 14 days ago
    decided_at = (strftime('%s', 'now') * 1000)                  -- just now
WHERE id = 'SC-2026-006' AND launched_at IS NULL;

-- Insert metrics for experiment 6
INSERT OR IGNORE INTO metrics_daily (experiment_id, date, source, impressions, clicks, sessions, conversions, spend_cents, revenue_cents, ctr_bp, cvr_bp, cpl_cents, roas_bp)
VALUES
  ('SC-2026-006', date('now', '-14 days'), 'facebook', 8000, 280, 220, 8, 4000, 0, 350, 364, 500, NULL),
  ('SC-2026-006', date('now', '-13 days'), 'facebook', 8500, 300, 240, 9, 4250, 0, 353, 375, 472, NULL),
  ('SC-2026-006', date('now', '-12 days'), 'facebook', 9000, 320, 255, 10, 4500, 0, 356, 392, 450, NULL),
  ('SC-2026-006', date('now', '-11 days'), 'facebook', 8200, 290, 230, 8, 4100, 0, 354, 348, 513, NULL),
  ('SC-2026-006', date('now', '-10 days'), 'facebook', 8800, 310, 248, 9, 4400, 0, 352, 363, 489, NULL),
  ('SC-2026-006', date('now', '-9 days'), 'facebook', 9200, 330, 265, 11, 4600, 0, 359, 415, 418, NULL),
  ('SC-2026-006', date('now', '-8 days'), 'facebook', 8600, 305, 245, 9, 4300, 0, 355, 367, 478, NULL),
  ('SC-2026-006', date('now', '-7 days'), 'facebook', 9100, 325, 260, 10, 4550, 0, 357, 385, 455, NULL),
  ('SC-2026-006', date('now', '-6 days'), 'facebook', 8400, 295, 235, 8, 4200, 0, 351, 340, 525, NULL),
  ('SC-2026-006', date('now', '-5 days'), 'facebook', 8900, 315, 250, 10, 4450, 0, 354, 400, 445, NULL),
  ('SC-2026-006', date('now', '-4 days'), 'facebook', 9300, 335, 268, 11, 4650, 0, 360, 410, 423, NULL),
  ('SC-2026-006', date('now', '-3 days'), 'facebook', 8700, 308, 247, 9, 4350, 0, 354, 364, 483, NULL),
  ('SC-2026-006', date('now', '-2 days'), 'facebook', 9400, 340, 272, 12, 4700, 0, 362, 441, 392, NULL),
  ('SC-2026-006', date('now', '-1 days'), 'facebook', 8100, 285, 228, 8, 4050, 0, 352, 351, 506, NULL);

-- Insert leads for experiment 6
INSERT OR IGNORE INTO leads (experiment_id, email, name, status, utm_source)
SELECT 'SC-2026-006', 'user' || value || '@example.com', 'Test User ' || value, 'new', 'facebook'
FROM (
  WITH RECURSIVE cnt(value) AS (
    SELECT 1 UNION ALL SELECT value + 1 FROM cnt WHERE value < 80
  )
  SELECT value FROM cnt
) WHERE NOT EXISTS (SELECT 1 FROM leads WHERE experiment_id = 'SC-2026-006' AND email = 'user1@example.com');

-- ============================================================
-- EXPERIMENT 7: 'preflight' status
-- In planning phase
-- ============================================================
INSERT OR IGNORE INTO experiments (
  id, name, slug, status, archetype,
  problem_statement, target_audience
) VALUES (
  'SC-2026-007',
  'Fitness Meal Planner',
  'fitness-meal-planner',
  'preflight',
  'content_magnet',
  'Fitness enthusiasts struggle to plan meals that align with their workout goals',
  'Gym-goers aged 25-40, interested in nutrition and meal prep'
);

-- ============================================================
-- Insert some events for tracking
-- ============================================================
INSERT OR IGNORE INTO event_log (experiment_id, event_type, event_data, session_id, visitor_id)
VALUES
  ('SC-2026-001', 'page_view', '{"page":"/accessibility-auditor"}', 'sess_001', 'visitor_001'),
  ('SC-2026-001', 'form_start', '{"form":"waitlist"}', 'sess_001', 'visitor_001'),
  ('SC-2026-002', 'page_view', '{"page":"/ai-content-calendar"}', 'sess_002', 'visitor_002'),
  ('SC-2026-002', 'form_start', '{"form":"waitlist"}', 'sess_002', 'visitor_002'),
  ('SC-2026-002', 'generate_lead', '{"email":"alice@example.com"}', 'sess_002', 'visitor_002');

-- ============================================================
-- Insert a learning memo for the running experiment
-- ============================================================
INSERT OR IGNORE INTO learning_memos (
  experiment_id, week_number, week_start, week_end,
  observations, hypotheses, actions_taken, next_week_plan,
  metrics_snapshot, author
)
SELECT
  'SC-2026-002',
  1,
  date('now', '-7 days'),
  date('now', '-1 days'),
  'CTR performing above benchmark at 3.1%. CVR slightly below target at 2.6%. Facebook outperforming Google on volume but similar efficiency.',
  'Audience is interested but landing page may have friction. Consider simplifying the signup form.',
  'Reduced form fields from 5 to 3. Added social proof above fold.',
  'Monitor CVR impact of form changes. Consider testing new headline variants.',
  '{"impressions":25700,"clicks":835,"sessions":670,"conversions":17,"spend_cents":13250,"ctr_bp":325,"cvr_bp":254,"cpl_cents":779}',
  'PM Team'
WHERE NOT EXISTS (SELECT 1 FROM learning_memos WHERE experiment_id = 'SC-2026-002' AND week_number = 1);

-- ============================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- ============================================================
-- SELECT id, name, status, archetype FROM experiments ORDER BY id;
-- SELECT experiment_id, COUNT(*) as lead_count FROM leads GROUP BY experiment_id;
-- SELECT experiment_id, date, source, impressions, clicks FROM metrics_daily ORDER BY experiment_id, date;
