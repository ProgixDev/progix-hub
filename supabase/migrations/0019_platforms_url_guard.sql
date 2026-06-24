-- progixHub — defense-in-depth for spec 015 (appsec P2). The action validates that invite_url /
-- video_url are http(s), but the columns are plain text; a future direct write could persist a
-- dangerous scheme (javascript:, data:) that feature ③ would render into an href. Enforce http(s)
-- (or null) at the DB so stored URLs are safe to render downstream.
alter table public.platforms
  add constraint platforms_invite_url_http
    check (invite_url is null or invite_url ~* '^https?://'),
  add constraint platforms_video_url_http
    check (video_url is null or video_url ~* '^https?://');
