-- Disable legacy like/pass RPCs now that messaging is open

REVOKE EXECUTE ON FUNCTION public.rpc_like_user(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rpc_pass_user(UUID) FROM authenticated;

DROP FUNCTION IF EXISTS public.rpc_like_user(UUID);
DROP FUNCTION IF EXISTS public.rpc_pass_user(UUID);
