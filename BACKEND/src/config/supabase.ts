import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://kzlmnbqpcefsnbzomgim.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_jb-CyipUEMoJxjuLMw1iVg_CS123yEt';

export const supabase = createClient(supabaseUrl, supabaseKey);

