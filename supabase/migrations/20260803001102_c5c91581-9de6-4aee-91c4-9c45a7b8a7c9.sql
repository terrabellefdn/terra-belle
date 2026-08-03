GRANT UPDATE (duration_ms) ON public.page_views TO anon, authenticated;

CREATE POLICY "visitor records time spent"
ON public.page_views
FOR UPDATE
TO anon, authenticated
USING (created_at > now() - interval '6 hours')
WITH CHECK (created_at > now() - interval '6 hours');