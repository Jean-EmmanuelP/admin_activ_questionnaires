export interface Section {
  id: number;
  name: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  section_id: number;
  parent_id?: number;
  text: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'yes_no' | 'number' | 'date';
  options?: any[];
  condition?: {
    parent_question_id: number;
    parent_answer: string | boolean | number;
    next_question_id?: number;
    skip_to_question_id?: number;
  };
  order_index: number;
  is_required: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionNode extends Question {
  children: QuestionNode[];
  isExpanded?: boolean;
  isEditing?: boolean;
  level: number;
}

export interface SectionNode extends Section {
  questions: QuestionNode[];
  isExpanded?: boolean;
  isEditing?: boolean;
}

export interface TreeData {
  sections: SectionNode[];
} 