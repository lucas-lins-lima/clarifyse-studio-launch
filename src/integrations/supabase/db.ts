// Re-export supabase client cast to `any` to bypass strict type checking
// for tables not yet in the auto-generated types.ts.
// Once migrations are applied and types are regenerated, revert these
// imports back to '@/integrations/supabase/client'.

import { googleDriveAdapter } from '@/integrations/supabase/google-adapter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = googleDriveAdapter as any;
