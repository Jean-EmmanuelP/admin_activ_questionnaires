<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { QuestionNode } from '$lib/types';
  import { X, Plus, ArrowRight } from '@lucide/svelte';

  export let question: QuestionNode;
  export let availableQuestions: QuestionNode[] = [];

  const dispatch = createEventDispatcher<{
    update: QuestionNode;
  }>();

  let showEditor = false;
  let condition = question.condition || {
    parent_question_id: 0,
    parent_answer: '',
    next_question_id: undefined,
    skip_to_question_id: undefined
  };

  function saveCondition() {
    const updatedQuestion = {
      ...question,
      condition: condition.parent_question_id ? condition : undefined
    };
    dispatch('update', updatedQuestion);
    showEditor = false;
  }

  function removeCondition() {
    const updatedQuestion = {
      ...question,
      condition: undefined
    };
    dispatch('update', updatedQuestion);
    showEditor = false;
  }

  function getQuestionText(id: number) {
    const q = availableQuestions.find(q => q.id === id);
    return q ? q.text.substring(0, 50) + (q.text.length > 50 ? '...' : '') : 'Question inconnue';
  }

  function getAnswerOptions() {
    const parentQuestion = availableQuestions.find(q => q.id === condition.parent_question_id);
    if (!parentQuestion) return [];

    switch (parentQuestion.type) {
      case 'yes_no':
        return ['Oui', 'Non'];
      case 'select':
      case 'radio':
        return parentQuestion.options || [];
      case 'checkbox':
        return parentQuestion.options || [];
      default:
        return [];
    }
  }
</script>

<div class="condition-editor">
  {#if !showEditor}
    <button
      on:click={() => showEditor = true}
      class="text-sm text-blue-600 hover:text-blue-800 underline"
    >
      {question.condition ? 'Modifier la condition' : 'Ajouter une condition'}
    </button>
  {:else}
    <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-gray-900">Condition de logique</h4>
        <button
          on:click={() => showEditor = false}
          class="text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Question parent -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Si la réponse à cette question :
          </label>
          <select
            bind:value={condition.parent_question_id}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={0}>Sélectionner une question</option>
            {#each availableQuestions.filter(q => q.id !== question.id) as q}
              <option value={q.id}>{q.text.substring(0, 60)}...</option>
            {/each}
          </select>
        </div>

        <!-- Réponse attendue -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Est égale à :
          </label>
          {#if condition.parent_question_id}
            <select
              bind:value={condition.parent_answer}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner une réponse</option>
              {#each getAnswerOptions() as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          {:else}
            <input
              type="text"
              bind:value={condition.parent_answer}
              placeholder="Entrez la réponse attendue"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          {/if}
        </div>
      </div>

      <!-- Action -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span>Alors :</span>
          <ArrowRight size={16} />
          <span class="font-medium">Afficher cette question</span>
        </div>
      </div>

      <!-- Boutons d'action -->
      <div class="flex items-center gap-2 pt-2">
        <button
          on:click={saveCondition}
          class="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sauvegarder
        </button>
        {#if question.condition}
          <button
            on:click={removeCondition}
            class="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Supprimer la condition
          </button>
        {/if}
        <button
          on:click={() => showEditor = false}
          class="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors"
        >
          Annuler
        </button>
      </div>

      <!-- Aperçu de la condition -->
      {#if condition.parent_question_id && condition.parent_answer}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="text-sm text-blue-800">
            <strong>Condition :</strong> Si la question "{getQuestionText(condition.parent_question_id)}" 
            a pour réponse "{condition.parent_answer}", alors cette question sera affichée.
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div> 