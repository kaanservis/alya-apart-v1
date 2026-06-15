-- ALYA APART - Admin users & permissions (Phase 24)
-- Safe to re-run where noted.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager', 'reception', 'housekeeping')),
  active BOOLEAN NOT NULL DEFAULT true,
  can_view_prices BOOLEAN NOT NULL DEFAULT false,
  can_edit_prices BOOLEAN NOT NULL DEFAULT false,
  can_view_reports BOOLEAN NOT NULL DEFAULT false,
  can_delete_reservations BOOLEAN NOT NULL DEFAULT false,
  can_change_dates BOOLEAN NOT NULL DEFAULT false,
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  can_manage_website BOOLEAN NOT NULL DEFAULT false,
  can_view_customer_tc BOOLEAN NOT NULL DEFAULT false,
  can_upload_photos BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_username_unique UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (lower(username));

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- No direct anon access; all operations go through SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS "Anon users direct access" ON public.users;

CREATE OR REPLACE FUNCTION public.user_to_json(u public.users)
RETURNS json
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT json_build_object(
    'id', u.id,
    'username', u.username,
    'role', u.role,
    'active', u.active,
    'can_view_prices', u.can_view_prices,
    'can_edit_prices', u.can_edit_prices,
    'can_view_reports', u.can_view_reports,
    'can_delete_reservations', u.can_delete_reservations,
    'can_change_dates', u.can_change_dates,
    'can_manage_users', u.can_manage_users,
    'can_manage_website', u.can_manage_website,
    'can_view_customer_tc', u.can_view_customer_tc,
    'can_upload_photos', u.can_upload_photos,
    'created_at', u.created_at
  );
$$;

CREATE OR REPLACE FUNCTION public.assert_super_admin(p_caller_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_caller_id AND active = true AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Bu işlem için Super Admin yetkisi gerekir.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.authenticate_admin(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM public.users
  WHERE lower(username) = lower(trim(p_username))
    AND active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Kullanıcı adı veya şifre hatalı.');
  END IF;

  IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', true, 'user', public.user_to_json(v_user));
  END IF;

  RETURN json_build_object('success', false, 'error', 'Kullanıcı adı veya şifre hatalı.');
END;
$$;

CREATE OR REPLACE FUNCTION public.list_admin_users(p_caller_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows json;
BEGIN
  PERFORM public.assert_super_admin(p_caller_id);

  SELECT coalesce(json_agg(public.user_to_json(u) ORDER BY u.created_at), '[]'::json)
  INTO v_rows
  FROM public.users u;

  RETURN json_build_object('success', true, 'users', v_rows);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_admin_user(
  p_caller_id uuid,
  p_username text,
  p_password text,
  p_role text,
  p_active boolean,
  p_can_view_prices boolean,
  p_can_edit_prices boolean,
  p_can_view_reports boolean,
  p_can_delete_reservations boolean,
  p_can_change_dates boolean,
  p_can_manage_users boolean,
  p_can_manage_website boolean,
  p_can_view_customer_tc boolean,
  p_can_upload_photos boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
BEGIN
  PERFORM public.assert_super_admin(p_caller_id);

  IF trim(p_username) = '' OR length(trim(p_password)) < 4 THEN
    RETURN json_build_object('success', false, 'error', 'Geçerli kullanıcı adı ve en az 4 karakter şifre gerekir.');
  END IF;

  INSERT INTO public.users (
    username,
    password_hash,
    role,
    active,
    can_view_prices,
    can_edit_prices,
    can_view_reports,
    can_delete_reservations,
    can_change_dates,
    can_manage_users,
    can_manage_website,
    can_view_customer_tc,
    can_upload_photos
  ) VALUES (
    trim(p_username),
    crypt(p_password, gen_salt('bf')),
    p_role,
    coalesce(p_active, true),
    coalesce(p_can_view_prices, false),
    coalesce(p_can_edit_prices, false),
    coalesce(p_can_view_reports, false),
    coalesce(p_can_delete_reservations, false),
    coalesce(p_can_change_dates, false),
    coalesce(p_can_manage_users, false),
    coalesce(p_can_manage_website, false),
    coalesce(p_can_view_customer_tc, false),
    coalesce(p_can_upload_photos, false)
  )
  RETURNING * INTO v_user;

  RETURN json_build_object('success', true, 'user', public.user_to_json(v_user));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Bu kullanıcı adı zaten kayıtlı.');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_user(
  p_caller_id uuid,
  p_user_id uuid,
  p_username text,
  p_password text,
  p_role text,
  p_active boolean,
  p_can_view_prices boolean,
  p_can_edit_prices boolean,
  p_can_view_reports boolean,
  p_can_delete_reservations boolean,
  p_can_change_dates boolean,
  p_can_manage_users boolean,
  p_can_manage_website boolean,
  p_can_view_customer_tc boolean,
  p_can_upload_photos boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_target public.users%ROWTYPE;
BEGIN
  PERFORM public.assert_super_admin(p_caller_id);

  SELECT * INTO v_target FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Kullanıcı bulunamadı.');
  END IF;

  IF v_target.role = 'super_admin' AND p_caller_id = p_user_id AND p_active = false THEN
    RETURN json_build_object('success', false, 'error', 'Kendi hesabınızı devre dışı bırakamazsınız.');
  END IF;

  UPDATE public.users
  SET
    username = trim(p_username),
    password_hash = CASE
      WHEN p_password IS NOT NULL AND length(trim(p_password)) >= 4 THEN crypt(p_password, gen_salt('bf'))
      ELSE password_hash
    END,
    role = p_role,
    active = coalesce(p_active, true),
    can_view_prices = coalesce(p_can_view_prices, false),
    can_edit_prices = coalesce(p_can_edit_prices, false),
    can_view_reports = coalesce(p_can_view_reports, false),
    can_delete_reservations = coalesce(p_can_delete_reservations, false),
    can_change_dates = coalesce(p_can_change_dates, false),
    can_manage_users = coalesce(p_can_manage_users, false),
    can_manage_website = coalesce(p_can_manage_website, false),
    can_view_customer_tc = coalesce(p_can_view_customer_tc, false),
    can_upload_photos = coalesce(p_can_upload_photos, false)
  WHERE id = p_user_id
  RETURNING * INTO v_user;

  RETURN json_build_object('success', true, 'user', public.user_to_json(v_user));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Bu kullanıcı adı zaten kayıtlı.');
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_admin_user(p_caller_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target public.users%ROWTYPE;
BEGIN
  PERFORM public.assert_super_admin(p_caller_id);

  IF p_caller_id = p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Kendi hesabınızı silemezsiniz.');
  END IF;

  SELECT * INTO v_target FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Kullanıcı bulunamadı.');
  END IF;

  IF v_target.role = 'super_admin' THEN
    RETURN json_build_object('success', false, 'error', 'Super Admin hesabı silinemez.');
  END IF;

  DELETE FROM public.users WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_admin(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_users(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_user(uuid, text, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_user(uuid, uuid, text, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_admin_user(uuid, uuid) TO anon, authenticated;

INSERT INTO public.users (
  username,
  password_hash,
  role,
  active,
  can_view_prices,
  can_edit_prices,
  can_view_reports,
  can_delete_reservations,
  can_change_dates,
  can_manage_users,
  can_manage_website,
  can_view_customer_tc,
  can_upload_photos
)
SELECT
  'kaan',
  crypt('31009', gen_salt('bf')),
  'super_admin',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE lower(username) = 'kaan'
);
