<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TreeData, SectionNode, QuestionNode } from '$lib/types';
  import SectionNodeComponent from './SectionNode.svelte';
  import { Plus, Settings, Eye, EyeOff } from '@lucide/svelte';

  export let data: TreeData;

  const dispatch = createEventDispatcher<{
    updateSection: SectionNode;
    deleteSection: number;
    addSection: void;
    addQuestion: number;
    updateQuestion: QuestionNode;
    deleteQuestion: number;
    addChildQuestion: number;
  }>();

  let showConditions = true;
  let showNotes = true;
  let showMetadata = false;

  // Récupérer toutes les questions pour les conditions
  $: allQuestions = data.sections.flatMap(section => 
    section.questions.flatMap(q => [q, ...(q.children || [])])
  );

  function handleAddSection() {
    dispatch('addSection');
  }

  function handleSectionUpdate(event: CustomEvent<SectionNode>) {
    dispatch('updateSection', event.detail);
  }

  function handleSectionDelete(event: CustomEvent<number>) {
    dispatch('deleteSection', event.detail);
  }

  function handleAddQuestion(event: CustomEvent<number>) {
    dispatch('addQuestion', event.detail);
  }

  function handleQuestionUpdate(event: CustomEvent<QuestionNode>) {
    dispatch('updateQuestion', event.detail);
  }

  function handleQuestionDelete(event: CustomEvent<number>) {
    dispatch('deleteQuestion', event.detail);
  }

  function handleAddChildQuestion(event: CustomEvent<number>) {
    dispatch('addChildQuestion', event.detail);
  }

  function expandAll() {
    data.sections = data.sections.map(section => ({
      ...section,
      isExpanded: true,
      questions: section.questions.map(q => ({ ...q, isExpanded: true }))
    }));
  }

  function collapseAll() {
    data.sections = data.sections.map(section => ({
      ...section,
      isExpanded: false,
      questions: section.questions.map(q => ({ ...q, isExpanded: false }))
    }));
  }

  function sortSections() {
    data.sections.sort((a, b) => a.order_index - b.order_index);
    data.sections = [...data.sections];
  }
</script>

<div class="tree-view bg-gray-50 min-h-screen p-6">
  <!-- Header -->
  <div class="max-w-7xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestionnaire de Questions</h1>
          <p class="text-gray-600 mt-1">
            Gérez vos sections et questions avec une interface intuitive
          </p>
        </div>
        <button
          on:click={handleAddSection}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Nouvelle Section
        </button>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <button
            on:click={expandAll}
            class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Tout développer
          </button>
          <button
            on:click={collapseAll}
            class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Tout réduire
          </button>
          <button
            on:click={sortSections}
            class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Trier par ordre
          </button>
        </div>

        <div class="flex items-center gap-4 ml-auto">
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              bind:checked={showConditions}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Conditions</span>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                bind:checked={showNotes}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Notes</span>
            </label>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              bind:checked={showMetadata}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Métadonnées</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Tree Content -->
    <div class="space-y-4">
      {#if data.sections.length === 0}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div class="text-gray-400 mb-4">
            <Settings size={48} class="mx-auto" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune section créée</h3>
          <p class="text-gray-600 mb-4">
            Commencez par créer votre première section pour organiser vos questions
          </p>
          <button
            on:click={handleAddSection}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer la première section
          </button>
        </div>
      {:else}
        {#each data.sections as section (section.id)}
          <SectionNodeComponent
            {section}
            availableQuestions={allQuestions}
            on:updateSection={handleSectionUpdate}
            on:deleteSection={handleSectionDelete}
            on:addQuestion={handleAddQuestion}
            on:updateQuestion={handleQuestionUpdate}
            on:deleteQuestion={handleQuestionDelete}
            on:addChildQuestion={handleAddChildQuestion}
          />
        {/each}
      {/if}
    </div>

    <!-- Summary -->
    {#if data.sections.length > 0}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
        <div class="flex items-center justify-between text-sm text-gray-600">
          <span>
            Total: {data.sections.length} section(s), 
            {data.sections.reduce((acc, s) => acc + s.questions.length, 0)} question(s)
          </span>
          <span class="text-xs">
            Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
          </span>
        </div>
      </div>
    {/if}
  </div>
</div> 