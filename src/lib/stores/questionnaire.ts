import { writable, derived, get } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { DBSection, DBQuestion, SectionWithQuestions, QuestionWithChildren } from '$lib/supabase';
import { buildQuestionnaireTree } from '$lib/utils/questionnaire';

interface QuestionnaireState {
  sections: DBSection[];
  questions: DBQuestion[];
  loading: boolean;
  error: string | null;
  selectedQuestion: QuestionWithChildren | null;
  editMode: 'create' | 'edit' | null;
}

function createQuestionnaireStore() {
  const { subscribe, set, update } = writable<QuestionnaireState>({
    sections: [],
    questions: [],
    loading: false,
    error: null,
    selectedQuestion: null,
    editMode: null
  });

  async function loadData() {
    update(state => ({ ...state, loading: true, error: null }));
    
    try {
      const [sectionsResult, questionsResult] = await Promise.all([
        supabase.from('sections').select('*').order('order_index'),
        supabase.from('questions').select('*').order('order_index')
      ]);

      if (sectionsResult.error) throw sectionsResult.error;
      if (questionsResult.error) throw questionsResult.error;

      update(state => ({
        ...state,
        sections: sectionsResult.data || [],
        questions: questionsResult.data || [],
        loading: false
      }));
    } catch (error) {
      update(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
    }
  }

  async function createSection(name: string, description?: string) {
    const maxOrder = await supabase
      .from('sections')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1);
    
    const newOrder = maxOrder.data?.[0]?.order_index ?? -1;
    
    const { data, error } = await supabase
      .from('sections')
      .insert({
        name,
        description,
        order_index: newOrder + 1,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    update(state => ({
      ...state,
      sections: [...state.sections, data]
    }));
    
    return data;
  }

  async function updateSection(id: number, updates: Partial<DBSection>) {
    const { data, error } = await supabase
      .from('sections')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    update(state => ({
      ...state,
      sections: state.sections.map(s => s.id === id ? data : s)
    }));
    
    return data;
  }

  async function deleteSection(id: number) {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    update(state => ({
      ...state,
      sections: state.sections.filter(s => s.id !== id),
      questions: state.questions.filter(q => q.section_id !== id)
    }));
  }

  async function createQuestion(question: Omit<DBQuestion, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('questions')
      .insert({
        ...question,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    update(state => ({
      ...state,
      questions: [...state.questions, data],
      selectedQuestion: null,
      editMode: null
    }));
    
    return data;
  }

  async function updateQuestion(id: number, updates: Partial<DBQuestion>) {
    const { data, error } = await supabase
      .from('questions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    update(state => ({
      ...state,
      questions: state.questions.map(q => q.id === id ? data : q),
      selectedQuestion: null,
      editMode: null
    }));
    
    return data;
  }

  async function deleteQuestion(id: number) {
    const questionsToDelete = [id];
    const findChildren = (parentId: number) => {
      const children = get({ subscribe }).questions.filter(q => q.parent_id === parentId);
      children.forEach(child => {
        questionsToDelete.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(id);
    
    const { error } = await supabase
      .from('questions')
      .delete()
      .in('id', questionsToDelete);

    if (error) throw error;
    
    update(state => ({
      ...state,
      questions: state.questions.filter(q => !questionsToDelete.includes(q.id)),
      selectedQuestion: null
    }));
  }

  async function reorderQuestions(sectionId: number, questionIds: number[]) {
    const updates = questionIds.map((id, index) => ({
      id,
      order_index: index,
      updated_at: new Date().toISOString()
    }));

    for (const update of updates) {
      await supabase
        .from('questions')
        .update({
          order_index: update.order_index,
          updated_at: update.updated_at
        })
        .eq('id', update.id);
    }

    await loadData();
  }

  async function moveQuestion(questionId: number, newParentId: number | null, newSectionId: number) {
    const { error } = await supabase
      .from('questions')
      .update({
        parent_id: newParentId,
        section_id: newSectionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId);

    if (error) throw error;
    
    await loadData();
  }

  function selectQuestion(question: QuestionWithChildren | null, mode: 'create' | 'edit' | null = null) {
    update(state => ({
      ...state,
      selectedQuestion: question,
      editMode: mode
    }));
  }

  function subscribeToChanges() {
    const sectionsChannel = supabase
      .channel('sections-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sections' }, () => {
        loadData();
      })
      .subscribe();

    const questionsChannel = supabase
      .channel('questions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      sectionsChannel.unsubscribe();
      questionsChannel.unsubscribe();
    };
  }

  return {
    subscribe,
    loadData,
    createSection,
    updateSection,
    deleteSection,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    moveQuestion,
    selectQuestion,
    subscribeToChanges
  };
}

export const questionnaireStore = createQuestionnaireStore();

export const questionnaireTree = derived(
  questionnaireStore,
  $store => buildQuestionnaireTree($store.sections, $store.questions)
);