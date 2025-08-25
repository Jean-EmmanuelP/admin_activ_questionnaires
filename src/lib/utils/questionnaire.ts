import type { DBSection, DBQuestion, SectionWithQuestions, QuestionWithChildren } from '$lib/supabase';

export function buildQuestionnaireTree(
  sections: DBSection[], 
  questions: DBQuestion[]
): SectionWithQuestions[] {
  return sections
    .sort((a, b) => a.order_index - b.order_index)
    .map(section => {
      const sectionQuestions = questions.filter(q => q.section_id === section.id);
      return {
        ...section,
        questions: buildQuestionTree(sectionQuestions)
      };
    });
}

export function buildQuestionTree(
  questions: DBQuestion[], 
  parentId: number | null = null
): QuestionWithChildren[] {
  return questions
    .filter(q => q.parent_id === parentId || (parentId === null && !q.parent_id))
    .sort((a, b) => a.order_index - b.order_index)
    .map(question => ({
      ...question,
      children: buildQuestionTree(questions, question.id)
    }));
}

export function generateCondition(parentValue: string, action: 'show' | 'hide' = 'show') {
  return {
    parent_value: parentValue,
    action
  };
}

export function evaluateCondition(
  condition: any,
  parentAnswer?: string
): boolean {
  if (!condition) return true;
  
  if (condition.parent_value) {
    const shouldShow = parentAnswer === condition.parent_value;
    return condition.action === 'hide' ? !shouldShow : shouldShow;
  }
  
  if (condition.if && condition.if.parent_value) {
    const matches = parentAnswer === condition.if.parent_value;
    return condition.then === 'show' ? matches : !matches;
  }
  
  return true;
}

export function flattenQuestions(questions: QuestionWithChildren[]): QuestionWithChildren[] {
  const flat: QuestionWithChildren[] = [];
  
  function traverse(items: QuestionWithChildren[]) {
    for (const item of items) {
      flat.push(item);
      if (item.children?.length) {
        traverse(item.children);
      }
    }
  }
  
  traverse(questions);
  return flat;
}

export function findQuestionById(
  questions: QuestionWithChildren[],
  id: number
): QuestionWithChildren | undefined {
  for (const question of questions) {
    if (question.id === id) return question;
    if (question.children?.length) {
      const found = findQuestionById(question.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function updateQuestionInTree(
  questions: QuestionWithChildren[],
  updatedQuestion: QuestionWithChildren
): QuestionWithChildren[] {
  return questions.map(q => {
    if (q.id === updatedQuestion.id) {
      return { ...updatedQuestion, children: q.children };
    }
    if (q.children?.length) {
      return {
        ...q,
        children: updateQuestionInTree(q.children, updatedQuestion)
      };
    }
    return q;
  });
}

export function removeQuestionFromTree(
  questions: QuestionWithChildren[],
  questionId: number
): QuestionWithChildren[] {
  return questions
    .filter(q => q.id !== questionId)
    .map(q => ({
      ...q,
      children: q.children ? removeQuestionFromTree(q.children, questionId) : []
    }));
}