<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { QuestionNode } from '$lib/types';
  import { Plus, X, GripVertical } from '@lucide/svelte';

  export let question: QuestionNode;

  const dispatch = createEventDispatcher<{
    update: QuestionNode;
  }>();

  let showEditor = false;
  let options = [...(question.options || [])];

  function addOption() {
    options = [...options, `Option ${options.length + 1}`];
  }

  function removeOption(index: number) {
    options = options.filter((_, i) => i !== index);
  }

  function updateOption(index: number, value: string) {
    options[index] = value;
    options = [...options];
  }

  function saveOptions() {
    const updatedQuestion = {
      ...question,
      options: options.length > 0 ? options : undefined
    };
    dispatch('update', updatedQuestion);
    showEditor = false;
  }

  function cancelEdit() {
    options = [...(question.options || [])];
    showEditor = false;
  }

  function needsOptions() {
    return ['select', 'radio', 'checkbox'].includes(question.type);
  }
</script>

<div class="options-editor">
  {#if needsOptions()}
    {#if !showEditor}
      <button
        on:click={() => showEditor = true}
        class="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        {question.options && question.options.length > 0 
          ? `Modifier les options (${question.options.length})` 
          : 'Ajouter des options'}
      </button>
    {:else}
      <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-gray-900">
            Options pour {question.type === 'select' ? 'sélection' : question.type === 'radio' ? 'choix unique' : 'choix multiple'}
          </h4>
          <button
            on:click={() => showEditor = false}
            class="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {#if options.length === 0}
          <div class="text-center text-gray-500 py-4">
            <p>Aucune option définie</p>
            <button
              on:click={addOption}
              class="mt-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Ajouter la première option
            </button>
          </div>
        {:else}
          <div class="space-y-2">
            {#each options as option, index (index)}
              <div class="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                <div class="text-gray-400 cursor-move">
                  <GripVertical size={16} />
                </div>
                <input
                  type="text"
                  value={option}
                  on:input={(e) => updateOption(index, e.currentTarget.value)}
                  placeholder="Texte de l'option"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  on:click={() => removeOption(index)}
                  class="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="Supprimer cette option"
                >
                  <X size={16} />
                </button>
              </div>
            {/each}
          </div>

          <button
            on:click={addOption}
            class="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Ajouter une option
          </button>
        {/if}

        <!-- Boutons d'action -->
        <div class="flex items-center gap-2 pt-2">
          <button
            on:click={saveOptions}
            class="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sauvegarder
          </button>
          <button
            on:click={cancelEdit}
            class="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors"
          >
            Annuler
          </button>
        </div>

        <!-- Aperçu -->
        {#if options.length > 0}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="text-sm text-blue-800">
              <strong>Aperçu :</strong> {options.length} option(s) définie(s)
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div> 