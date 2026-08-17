-- 1) Remove client-writable analytics updates (duration is written server-side now)
DROP POLICY IF EXISTS "visitor records time spent" ON public.page_views;
REVOKE UPDATE ON public.page_views FROM anon, authenticated;

-- 2) Replace always-true INSERT policies with validated ones
DROP POLICY IF EXISTS "anyone log view" ON public.page_views;
CREATE POLICY "anyone log view" ON public.page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(path) BETWEEN 1 AND 500
    AND (referrer IS NULL OR length(referrer) <= 500)
    AND (user_agent IS NULL OR length(user_agent) <= 500)
    AND (session_id IS NULL OR length(session_id) <= 80)
    AND view_key IS NOT NULL AND length(view_key) BETWEEN 6 AND 120
    AND is_bot = false
    AND duration_ms IS NULL
  );

DROP POLICY IF EXISTS "anyone can send a message" ON public.contact_messages;
CREATE POLICY "anyone can send a message" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND length(name) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 200
    AND email LIKE '%_@_%.__%'
    AND (organization IS NULL OR length(organization) <= 160)
    AND length(topic) BETWEEN 1 AND 60
    AND length(message) BETWEEN 1 AND 5000
  );

DROP POLICY IF EXISTS "anyone can submit" ON public.partner_applications;
CREATE POLICY "anyone can submit" ON public.partner_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND length(scope_kind) BETWEEN 1 AND 40
    AND length(vertical_slug) BETWEEN 1 AND 80
    AND (project_id IS NULL OR length(project_id) <= 80)
    AND (project_name IS NULL OR length(project_name) <= 160)
    AND length(name) BETWEEN 1 AND 120
    AND length(organization) BETWEEN 1 AND 160
    AND length(email) BETWEEN 3 AND 200
    AND email LIKE '%_@_%.__%'
    AND (role IS NULL OR length(role) <= 120)
    AND length(contribution) BETWEEN 1 AND 2000
    AND length(message) BETWEEN 1 AND 5000
  );

-- 3) Owner-only profile creation
CREATE POLICY "own profile insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4) Lock down SECURITY DEFINER / trigger functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- has_role must stay callable by authenticated because RLS policies evaluate it,
-- but it now only answers for the caller's own identity.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
  END;
$function$;