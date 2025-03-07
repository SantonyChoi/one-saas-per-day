import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 생성 (서버 측에서 사용)
export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
