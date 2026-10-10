CREATE TABLE public.admin_login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  ip text,
  user_agent text,
  country text,
  city text,
  aal text,
  suspicious boolean NOT NULL DEFAULT false,
  reasons text[] NOT NULL DEFAULT '{}',
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_login_events TO authenticated;
GRANT ALL ON public.admin_login_events TO service_role;
ALTER TABLE public.admin_login_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read login events" ON public.admin_login_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE INDEX admin_login_events_user_idx ON public.admin_login_events (user_id, created_at DESC);

GRANT SELECT ON public.partner_applications TO authenticated;
CREATE POLICY "partners read own applications" ON public.partner_applications FOR SELECT TO authenticated
USING (lower(email) = lower(coalesce(auth.jwt()->>'email', '')) AND coalesce((auth.jwt()->'user_metadata'->>'email_verified')::boolean, auth.jwt()->>'email' IS NOT NULL));