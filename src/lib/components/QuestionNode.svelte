<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { QuestionNode } from '$lib/types';
  import ConditionEditor from './ConditionEditor.svelte';
  import OptionsEditor from './OptionsEditor.svelte';
  import { ChevronRight, ChevronDown, Edit3, Save, X, Plus, Trash2 } from '@lucide/svelte';

  export let question: QuestionNode;
  export let level: number = 0;
  export let availableQuestions: QuestionNode[] = [];

  const dispatch = createEventDispatcher<{
    update: QuestionNode;
    delete: number;
    addChild: number;
    toggleExpand: void;
  }>();

  let isEditing = false;
  let editedQuestion: QuestionNode;

  $: if (question) {
    editedQuestion = { ...question };
  }

  function handleSave() {
    dispatch('update', editedQuestion);
    isEditing = false;
  }

  function handleCancel() {
    editedQuestion = { ...question };
    isEditing = false;
  }

  function handleDelete() {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      dispatch('delete', question.id);
    }
  }

  function handleAddChild() {
    dispatch('addChild', question.id);
  }

  function toggleExpand() {
    dispatch('toggleExpand');
  }

  function handleConditionUpdate(event: CustomEvent<QuestionNode>) {
    dispatch('update', event.detail);
  }

  function handleOptionsUpdate(event: CustomEvent<QuestionNode>) {
    dispatch('update', event.detail);
  }

  function getConditionText() {
    if (!question.condition) return '';
    return `Si ${question.condition.parent_answer} → Question ${question.condition.next_question_id || 'suivante'}`;
  }

  function getTypeLabel(type: string) {
    const labels = {
      text: 'Texte',
      textarea: 'Zone de texte',
      select: 'Sélection',
      radio: 'Choix unique',
      checkbox: 'Choix multiple',
      yes_no: 'Oui/Non',
      number: 'Nombre',
      date: 'Date'
    };
    return labels[type as keyof typeof labels] || type;
  }
</script>

<div class="question-node" style="margin-left: {level * 20}px">
  <div class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
    <!-- Expand/Collapse button for questions with children -->
    {#if question.children && question.children.length > 0}
      <button
        on:click={toggleExpand}
        class="p-1 hover:bg-gray-200 rounded transition-colors"
      >
        {#if question.isExpanded}
          <ChevronDown size={16} />
        {:else}
          <ChevronRight size={16} />
        {/if}
      </button>
    {:else}
      <div class="w-6"></div>
    {/if}

    <!-- Question content -->
    <div class="flex-1 min-w-0">
      {#if isEditing}
        <div class="space-y-3">
          <input
            bind:value={editedQuestion.text}
            placeholder="Texte de la question"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            bind:value={editedQuestion.type}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="text">Texte</option>
            <option value="textarea">Zone de texte</option>
            <option value="select">Sélection</option>
            <option value="radio">Choix unique</option>
            <option value="checkbox">Choix multiple</option>
            <option value="yes_no">Oui/Non</option>
            <option value="number">Nombre</option>
            <option value="date">Date</option>
          </select>
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                bind:checked={editedQuestion.is_required}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Obligatoire</span>
            </label>
          </div>
          <textarea
            bind:value={editedQuestion.notes}
            placeholder="Notes (optionnel)"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
          />
        </div>
      {:else}
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-900">{question.text}</span>
            <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {getTypeLabel(question.type)}
            </span>
            {#if question.is_required}
              <span class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                Obligatoire
              </span>
            {/if}
          </div>
          {#if question.condition}
            <div class="text-sm text-gray-600 bg-yellow-50 px-2 py-1 rounded">
              {getConditionText()}
            </div>
          {/if}
          {#if question.notes}
            <div class="text-sm text-gray-500 italic">{question.notes}</div>
          {/if}
          
          <!-- Éditeurs intégrés -->
          <div class="flex items-center gap-4 text-sm">
            <ConditionEditor 
              {question} 
              {availableQuestions}
              on:update={handleConditionUpdate}
            />
            <OptionsEditor 
              {question}
              on:update={handleOptionsUpdate}
            />
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
          title="Modifier"
        >
          <Edit3 size={16} />
        </button>
        <button
          on:click={handleAddChild}
          class="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
          title="Ajouter une sous-question"
        >
          <Plus size={16} />
        </button>
        <button
          on:click={handleDelete}
          class="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          title="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      {/if}
    </div>
  </div>

  <!-- Children questions -->
  {#if question.isExpanded && question.children && question.children.length > 0}
    <div class="children-container">
      {#each question.children as childQuestion (childQuestion.id)}
        <svelte:self
          question={childQuestion}
          level={level + 1}
          {availableQuestions}
          on:update={(e: CustomEvent<QuestionNode>) => dispatch('update', e.detail)}
          on:delete={(e: CustomEvent<number>) => dispatch('delete', e.detail)}
          on:addChild={(e: CustomEvent<number>) => dispatch('addChild', e.detail)}
          on:toggleExpand
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .question-node {
    border-left: 2px solid transparent;
  }

  .question-node:hover {
    border-left-color: #e5e7eb;
  }

  .children-container {
    border-left: 2px solid #f3f4f6;
    margin-left: 10px;
  }
</style> 