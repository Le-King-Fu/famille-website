-- Enable Row Level Security on all public tables
-- This blocks direct PostgREST/Supabase API access via the anon key
-- while allowing full access via the service_role key (used by Prisma server-side)

-- ==================== ENABLE RLS ====================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvitationCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventRsvp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventHiddenFrom" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Album" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Photo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PersonTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PhotoComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ForumCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Topic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TopicRead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reply" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReplyHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameScore" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- ==================== SERVICE ROLE POLICIES ====================
-- Grant full access to the service_role (used by Prisma via SUPABASE_SERVICE_ROLE_KEY)
-- The postgres role (used by Prisma via DATABASE_URL) bypasses RLS as table owner

CREATE POLICY "service_role_all" ON "User"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "SecurityQuestion"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "SecurityAttempt"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "InvitationCode"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "Event"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "EventRsvp"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "EventHiddenFrom"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "Album"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "Photo"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "PersonTag"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "PhotoComment"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "ForumCategory"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "Topic"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "TopicRead"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "Reply"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "ReplyHistory"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "GameScore"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "Notification"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "Reaction"
  FOR ALL USING ((select current_setting('role')) = 'service_role');

CREATE POLICY "service_role_all" ON "_prisma_migrations"
  FOR ALL USING ((select current_setting('role')) = 'service_role');
