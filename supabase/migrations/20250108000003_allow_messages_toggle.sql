-- Add messaging toggle and enforce it when starting new threads

ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.users_profile.allow_messages IS
  'If false, the user opts out of receiving new direct messages.';

CREATE OR REPLACE FUNCTION public.rpc_start_thread(
  p_target_user_id UUID,
  p_first_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread_id UUID;
  v_allow_messages BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'CANNOT_MESSAGE_SELF';
  END IF;

  SELECT allow_messages
  INTO v_allow_messages
  FROM public.users_profile
  WHERE id = p_target_user_id;

  IF v_allow_messages IS FALSE THEN
    RAISE EXCEPTION 'TARGET_MESSAGES_DISABLED';
  END IF;

  -- Reuse existing thread if it already exists
  SELECT tp1.thread_id
  INTO v_thread_id
  FROM public.thread_participants tp1
  JOIN public.thread_participants tp2
    ON tp2.thread_id = tp1.thread_id
  WHERE tp1.user_id = auth.uid()
    AND tp2.user_id = p_target_user_id
  LIMIT 1;

  IF v_thread_id IS NULL THEN
    INSERT INTO public.threads (match_id, last_message_at)
    VALUES (NULL, NOW())
    RETURNING id INTO v_thread_id;

    INSERT INTO public.thread_participants (thread_id, user_id)
    VALUES (v_thread_id, auth.uid()),
           (v_thread_id, p_target_user_id);
  END IF;

  IF p_first_message IS NOT NULL AND LENGTH(TRIM(p_first_message)) > 0 THEN
    INSERT INTO public.messages (thread_id, sender_user_id, content)
    VALUES (v_thread_id, auth.uid(), p_first_message);

    UPDATE public.threads
    SET last_message_at = NOW()
    WHERE id = v_thread_id;
  END IF;

  RETURN v_thread_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_start_thread(UUID, TEXT) TO authenticated;
