<script lang="ts">
  import { onMount } from 'svelte';
  import TreeView from './TreeView.svelte';
  import type { TreeData, SectionNode, QuestionNode } from '$lib/types';

  let treeData: TreeData = { sections: [] };
  let nextSectionId = 1;
  let nextQuestionId = 1;

  // Données d'exemple pour tester
  onMount(() => {
    // Créer des données d'exemple
    treeData = {
      sections: [
        {
          id: nextSectionId++,
          name: 'Informations générales',
          description: 'Informations de base sur le patient',
          order_index: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          questions: [
            {
              id: nextQuestionId++,
              section_id: 1,
              text: 'Quel est votre nom ?',
              type: 'text',
              order_index: 1,
              is_required: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              children: [],
              level: 0
            },
            {
              id: nextQuestionId++,
              section_id: 1,
              text: 'Avez-vous des allergies ?',
              type: 'yes_no',
              order_index: 2,
              is_required: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              children: [
                {
                  id: nextQuestionId++,
                  section_id: 1,
                  parent_id: 2,
                  text: 'Quelles sont vos allergies ?',
                  type: 'textarea',
                  order_index: 1,
                  is_required: true,
                  condition: {
                    parent_question_id: 2,
                    parent_answer: 'Oui'
                  },
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  children: [],
                  level: 1
                }
              ],
              level: 0
            }
          ],
          isExpanded: true
        },
        {
          id: nextSectionId++,
          name: 'Symptômes',
          description: 'Description des symptômes actuels',
          order_index: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          questions: [
            {
              id: nextQuestionId++,
              section_id: 2,
              text: 'Quels symptômes ressentez-vous ?',
              type: 'checkbox',
              options: ['Fièvre', 'Toux', 'Fatigue', 'Douleurs musculaires'],
              order_index: 1,
              is_required: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              children: [],
              level: 0
            }
          ],
          isExpanded: false
        }
      ]
    };
  });

  function handleAddSection() {
    const newSection: SectionNode = {
      id: nextSectionId++,
      name: 'Nouvelle Section',
      description: '',
      order_index: treeData.sections.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: [],
      isExpanded: true
    };
    
    treeData.sections = [...treeData.sections, newSection];
  }

  function handleUpdateSection(event: CustomEvent<SectionNode>) {
    const updatedSection = event.detail;
    treeData.sections = treeData.sections.map(s => 
      s.id === updatedSection.id ? updatedSection : s
    );
  }

  function handleDeleteSection(event: CustomEvent<number>) {
    const sectionId = event.detail;
    treeData.sections = treeData.sections.filter(s => s.id !== sectionId);
  }

  function handleAddQuestion(event: CustomEvent<number>) {
    const sectionId = event.detail;
    const newQuestion: QuestionNode = {
      id: nextQuestionId++,
      section_id: sectionId,
      text: 'Nouvelle question',
      type: 'text',
      order_index: 1,
      is_required: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      children: [],
      level: 0
    };

    treeData.sections = treeData.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          questions: [...section.questions, newQuestion]
        };
      }
      return section;
    });
  }

  function handleUpdateQuestion(event: CustomEvent<QuestionNode>) {
    const updatedQuestion = event.detail;
    
    treeData.sections = treeData.sections.map(section => ({
      ...section,
      questions: section.questions.map(q => 
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    }));
  }

  function handleDeleteQuestion(event: CustomEvent<number>) {
    const questionId = event.detail;
    
    treeData.sections = treeData.sections.map(section => ({
      ...section,
      questions: section.questions.filter(q => q.id !== questionId)
    }));
  }

  function handleAddChildQuestion(event: CustomEvent<number>) {
    const parentQuestionId = event.detail;
    const newChildQuestion: QuestionNode = {
      id: nextQuestionId++,
      section_id: 0, // Sera défini lors de la mise à jour
      parent_id: parentQuestionId,
      text: 'Sous-question',
      type: 'text',
      order_index: 1,
      is_required: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      children: [],
      level: 0
    };

    // Trouver la section parent et ajouter l'enfant
    treeData.sections = treeData.sections.map(section => ({
      ...section,
      questions: section.questions.map(q => {
        if (q.id === parentQuestionId) {
          newChildQuestion.section_id = section.id;
          newChildQuestion.level = q.level + 1;
          return {
            ...q,
            children: [...(q.children || []), newChildQuestion]
          };
        }
        return q;
      })
    }));
  }

  // Récupérer toutes les questions pour les conditions
  $: allQuestions = treeData.sections.flatMap(section => 
    section.questions.flatMap(q => [q, ...(q.children || [])])
  );
</script>

<div class="question-tree-manager">
  <TreeView
    data={treeData}
    on:addSection={handleAddSection}
    on:updateSection={handleUpdateSection}
    on:deleteSection={handleDeleteSection}
    on:addQuestion={handleAddQuestion}
    on:updateQuestion={handleUpdateQuestion}
    on:deleteQuestion={handleDeleteQuestion}
    on:addChildQuestion={handleAddChildQuestion}
  />
</div>

<style>
  .question-tree-manager {
    min-height: 100vh;
  }
</style> 