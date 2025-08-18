<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: any = {};
  export let title: string = 'Éditeur JSON';
  export let placeholder: string = '{}';

  const dispatch = createEventDispatcher<{
    update: any;
  }>();

  let showEditor = false;
  let jsonValue = JSON.stringify(value, null, 2);
  let error = '';

  function handleSave() {
    try {
      const parsed = JSON.parse(jsonValue);
      dispatch('update', parsed);
      showEditor = false;
      error = '';
    } catch (e) {
      error = 'JSON invalide';
    }
  }

  function handleCancel() {
    jsonValue = JSON.stringify(value, null, 2);
    showEditor = false;
    error = '';
  }

  function getPreviewText() {
    if (!value || Object.keys(value).length === 0) {
      return 'Aucune configuration';
    }
    return JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '');
  }
</script>

<div class="json-editor">
  {#if !showEditor}
    <button
      on:click={() => showEditor = true}
      class="text-sm text-blue-600 hover:text-blue-800 underline"
    >
      {title}
    </button>
    {#if value && Object.keys(value).length > 0}
      <div class="text-xs text-gray-600 mt-1">
        {getPreviewText()}
      </div>
    {/if}
  {:else}
    <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-gray-900">{title}</h4>
        <button
          on:click={handleCancel}
          class="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          Configuration JSON
        </label>
        <textarea
          bind:value={jsonValue}
          placeholder={placeholder}
          class="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
        {#if error}
          <div class="text-red-600 text-sm">{error}</div>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        <button
          on:click={handleSave}
          class="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          💾 Sauvegarder
        </button>
        <button
          on:click={handleCancel}
          class="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  {/if}
</div> 