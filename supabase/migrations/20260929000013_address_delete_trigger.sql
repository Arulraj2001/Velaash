-- 013: Address Delete Trigger - Reassign Default Address on Deletion
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- When a customer's default address is deleted, this trigger automatically
-- promotes the customer's most recent remaining address to be the default.
CREATE OR REPLACE FUNCTION public.handle_delete_default_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_id uuid;
BEGIN
  IF OLD.is_default = true THEN
    -- Find the most recently created remaining address for this customer
    SELECT id INTO v_next_id
    FROM public.addresses
    WHERE customer_id = OLD.customer_id
      AND id <> OLD.id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_next_id IS NOT NULL THEN
      UPDATE public.addresses
      SET is_default = true
      WHERE id = v_next_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_delete_reassign_default_address ON public.addresses;
CREATE TRIGGER on_delete_reassign_default_address
  AFTER DELETE ON public.addresses
  FOR EACH ROW
  WHEN (OLD.is_default = true)
  EXECUTE FUNCTION public.handle_delete_default_address();
