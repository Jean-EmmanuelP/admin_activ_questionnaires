import { supabase, type DBSection, type DBQuestion, type SectionWithQuestions } from '$lib/supabase';

export class QuestionnaireService {
  // Récupérer toutes les sections avec leurs questions
  static async getSectionsWithQuestions(): Promise<SectionWithQuestions[]> {
    try {
      // Récupérer toutes les sections
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('order_index');

      if (sectionsError) throw sectionsError;

      // Récupérer toutes les questions
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .order('order_index');

      if (questionsError) throw questionsError;

      // Organiser les questions en hiérarchie
      const questionsMap = new Map<number, QuestionWithChildren>();
      const rootQuestions: QuestionWithChildren[] = [];

      // Créer un map de toutes les questions
      questions.forEach(q => {
        questionsMap.set(q.id, { ...q, children: [] });
      });

      // Organiser la hiérarchie
      questions.forEach(q => {
        if (q.parent_id) {
          const parent = questionsMap.get(q.parent_id);
          if (parent) {
            parent.children.push(questionsMap.get(q.id)!);
          }
        } else {
          rootQuestions.push(questionsMap.get(q.id)!);
        }
      });

      // Associer les questions aux sections
      return sections.map(section => ({
        ...section,
        questions: rootQuestions.filter(q => q.section_id === section.id)
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des sections:', error);
      throw error;
    }
  }

  // Créer une nouvelle section
  static async createSection(section: Omit<DBSection, 'id' | 'created_at' | 'updated_at'>): Promise<DBSection> {
    try {
      const { data, error } = await supabase
        .from('sections')
        .insert([section])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la section:', error);
      throw error;
    }
  }

  // Mettre à jour une section
  static async updateSection(id: number, updates: Partial<DBSection>): Promise<DBSection> {
    try {
      const { data, error } = await supabase
        .from('sections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la section:', error);
      throw error;
    }
  }

  // Supprimer une section
  static async deleteSection(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression de la section:', error);
      throw error;
    }
  }

  // Créer une nouvelle question
  static async createQuestion(question: Omit<DBQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<DBQuestion> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([question])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la question:', error);
      throw error;
    }
  }

  // Mettre à jour une question
  static async updateQuestion(id: number, updates: Partial<DBQuestion>): Promise<DBQuestion> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la question:', error);
      throw error;
    }
  }

  // Supprimer une question
  static async deleteQuestion(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression de la question:', error);
      throw error;
    }
  }

  // Réorganiser l'ordre des sections
  static async reorderSections(sections: { id: number; order_index: number }[]): Promise<void> {
    try {
      const updates = sections.map(section => ({
        id: section.id,
        order_index: section.order_index,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('sections')
        .upsert(updates);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la réorganisation des sections:', error);
      throw error;
    }
  }

  // Réorganiser l'ordre des questions
  static async reorderQuestions(questions: { id: number; order_index: number }[]): Promise<void> {
    try {
      const updates = questions.map(question => ({
        id: question.id,
        order_index: question.order_index,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('questions')
        .upsert(updates);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la réorganisation des questions:', error);
      throw error;
    }
  }
}

// Type helper pour la hiérarchie des questions
export interface QuestionWithChildren extends DBQuestion {
  children: QuestionWithChildren[];
} 