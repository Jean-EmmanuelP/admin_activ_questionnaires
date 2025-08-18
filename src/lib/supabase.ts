import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config';

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Types pour la base de données
export interface DBSection {
  id: number;
  name: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DBQuestion {
  id: number;
  section_id: number;
  parent_id?: number;
  text: string;
  type: 'yesno' | 'text' | 'select' | 'number' | 'group' | 'message' | 'textarea' | 'checkbox' | 'radio' | 'date';
  options?: any;
  condition?: any;
  order_index: number;
  is_required: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SectionWithQuestions extends DBSection {
  questions: QuestionWithChildren[];
}

export interface QuestionWithChildren extends DBQuestion {
  children: QuestionWithChildren[];
} 