-- ==============================================================================
-- MOTION NODE EDITS - HELPER SQL SNIPPETS
-- ==============================================================================

-- 1. PROMOTE A USER TO ADMIN:
-- Replace 'your-user-email@example.com' with the email of the user you want to be Admin
UPDATE public.profiles
SET role = 'admin', status = 'approved'
WHERE email = 'your-user-email@example.com';

-- 2. APPROVE AN EDITOR:
-- Replace 'editor@example.com' with the editor's email
UPDATE public.profiles
SET role = 'editor', status = 'approved', editor_title = 'Senior Video Editor'
WHERE email = 'editor@example.com';

-- 3. APPROVE A CLIENT:
-- Replace 'client@example.com' with the client's email
UPDATE public.profiles
SET role = 'client', status = 'approved', company_name = 'Acme Productions'
WHERE email = 'client@example.com';

-- 4. VIEW ALL USERS AND ROLES:
SELECT id, full_name, email, role, status, editor_title, company_name, created_at
FROM public.profiles
ORDER BY created_at DESC;
