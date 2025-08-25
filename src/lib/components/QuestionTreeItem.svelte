<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { QuestionWithChildren } from '$lib/supabase';
  import { ChevronRight, ChevronDown, Edit, Trash, Plus, GripVertical } from '@lucide/svelte';
  
  export let question: QuestionWithChildren;
  export let level: number = 0;
  export let expanded: boolean = true;
  
  const dispatch = createEventDispatcher();
  
  let isExpanded = expanded;
  
  function toggleExpand() {
    isExpanded = !isExpanded;
  }
  
  function handleEdit() {
    dispatch('edit', question);
  }
  
  function handleDelete() {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${question.text}" et toutes ses sous-questions ?`)) {
      dispatch('delete', question.id);
    }
  }
  
  function handleAddChild() {
    dispatch('addChild', question);
  }
  
  function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      yesno: 'Oui/Non',
      text: 'Texte',
      textarea: 'Texte long',
      select: 'Liste',
      checkbox: 'Cases',
      radio: 'Radio',
      number: 'Nombre',
      date: 'Date',
      group: 'Groupe',
      message: 'Message'
    };
    return labels[type] || type;
  }
</script>

<div
  class="question-item"
  data-question-id={question.id}
  style="margin-left: {level * 24}px"
>
  <div class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg group">
    <button
      class="drag-handle cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600"
      aria-label="Déplacer"
    >
      <GripVertical size={16} />
    </button>
    
    <button
      on:click={toggleExpand}
      class="text-gray-400 hover:text-gray-600 transition-colors"
      disabled={!question.children?.length}
    >
      {#if question.children?.length}
        {#if isExpanded}
          <ChevronDown size={16} />
        {:else}
          <ChevronRight size={16} />
        {/if}
      {:else}
        <div class="w-4" />
      {/if}
    </button>
    
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-900 truncate">
          {question.text}
        </span>
        <span class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
          {getTypeLabel(question.type)}
        </span>
        {#if question.is_required}
          <span class="text-xs text-red-500">*</span>
        {/if}
        {#if question.condition}
          <span class="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
            Conditionnel
          </span>
        {/if}
      </div>
      {#if question.notes}
        <p class="text-xs text-gray-500 mt-1">{question.notes}</p>
      {/if}
    </div>
    
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        on:click={handleAddChild}
        class="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
        title="Ajouter une sous-question"
      >
        <Plus size={16} />
      </button>
      <button
        on:click={handleEdit}
        class="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Modifier"
      >
        <Edit size={16} />
      </button>
      <button
        on:click={handleDelete}
        class="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Supprimer"
      >
        <Trash size={16} />
      </button>
    </div>
  </div>
  
  {#if isExpanded && question.children?.length}
    <div class="children">
      {#each question.children as child (child.id)}
        <svelte:self
          question={child}
          level={level + 1}
          expanded={isExpanded}
          on:edit
          on:delete
          on:addChild
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .question-item {
    transition: transform 0.2s ease;
  }
  
  .question-item.dragging {
    opacity: 0.5;
  }
  
  .question-item.drag-over {
    background-color: #eff6ff;
    border-radius: 0.5rem;
  }
</style>