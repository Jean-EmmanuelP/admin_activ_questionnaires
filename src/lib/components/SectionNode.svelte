<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SectionNode, QuestionNode } from '$lib/types';
  import QuestionNodeComponent from './QuestionNode.svelte';
  import { ChevronRight, ChevronDown, Edit3, Save, X, Plus, Trash2, Folder } from '@lucide/svelte';

  export let section: SectionNode;
  export let availableQuestions: QuestionNode[] = [];

  const dispatch = createEventDispatcher<{
    updateSection: SectionNode;
    deleteSection: number;
    addQuestion: number;
    updateQuestion: QuestionNode;
    deleteQuestion: number;
    addChildQuestion: number;
  }>();

  let isEditing = false;
  let editedSection: SectionNode;

  $: if (section) {
    editedSection = { ...section };
  }

  function handleSave() {
    dispatch('updateSection', editedSection);
    isEditing = false;
  }

  function handleCancel() {
    editedSection = { ...section };
    isEditing = false;
  }

  function handleDelete() {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) {
      dispatch('deleteSection', section.id);
    }
  }

  function handleAddQuestion() {
    dispatch('addQuestion', section.id);
  }

  function toggleExpand() {
    section.isExpanded = !section.isExpanded;
    section = { ...section };
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
</script>

<div class="section-node border border-gray-200 rounded-lg mb-4 bg-white shadow-sm">
  <div class="flex items-center gap-2 p-4 hover:bg-gray-50 rounded-t-lg transition-colors">
    <!-- Expand/Collapse button -->
    <button
      on:click={toggleExpand}
      class="p-1 hover:bg-gray-200 rounded transition-colors"
    >
      {#if section.isExpanded}
        <ChevronDown size={20} />
      {:else}
        <ChevronRight size={20} />
      {/if}
    </button>

    <!-- Section icon -->
    <Folder size={20} class="text-blue-600" />

    <!-- Section content -->
    <div class="flex-1 min-w-0">
      {#if isEditing}
        <div class="space-y-2">
          <input
            bind:value={editedSection.name}
            placeholder="Nom de la section"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
          />
          <textarea
            bind:value={editedSection.description}
            placeholder="Description de la section (optionnel)"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
          />
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <span class="text-sm text-gray-700">Ordre:</span>
              <input
                type="number"
                bind:value={editedSection.order_index}
                class="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>
          </div>
        </div>
      {:else}
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold text-gray-900">{section.name}</h3>
            <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              Ordre: {section.order_index}
            </span>
          </div>
          {#if section.description}
            <p class="text-gray-600">{section.description}</p>
          {/if}
          <div class="text-sm text-gray-500">
            {section.questions.length} question(s)
          </div>
        </div>
      {/if}
    </div>

    <!-- Action buttons -->
    <div class="flex items-center gap-1">
      {#if isEditing}
        <button
          on:click={handleSave}
          class="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
          title="Sauvegarder"
        >
          <Save size={16} />
        </button>
        <button
          on:click={handleCancel}
          class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Annuler"
        >
          <X size={16} />
        </button>
      {:else}
        <button
          on:click={() => isEditing = true}
          class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          title="Modifier la section"
        >
          <Edit3 size={16} />
        </button>
        <button
          on:click={handleAddQuestion}
          class="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
          title="Ajouter une question"
        >
          <Plus size={16} />
        </button>
        <button
          on:click={handleDelete}
          class="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          title="Supprimer la section"
        >
          <Trash2 size={16} />
        </button>
      {/if}
    </div>
  </div>

  <!-- Questions container -->
  {#if section.isExpanded}
    <div class="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
      {#if section.questions.length === 0}
        <div class="text-center text-gray-500 py-8">
          <p>Aucune question dans cette section</p>
          <button
            on:click={handleAddQuestion}
            class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ajouter la première question
          </button>
        </div>
      {:else}
        <div class="space-y-2">
          {#each section.questions as question (question.id)}
            <QuestionNodeComponent
              question={question}
              level={0}
              {availableQuestions}
              on:update={handleQuestionUpdate}
              on:delete={handleQuestionDelete}
              on:addChild={handleAddChildQuestion}
            />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div> 