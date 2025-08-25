<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { flip } from 'svelte/animate';
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import type { QuestionWithChildren } from '$lib/supabase';
  import { ChevronRight, ChevronDown, Edit, Trash, Plus, GripVertical } from '@lucide/svelte';
  
  export let question: QuestionWithChildren;
  export let sectionId: number;
  export let level: number = 0;
  export let parentId: number | null = null;
  
  const dispatch = createEventDispatcher();
  
  let isExpanded = true;
  let childrenItems = question.children || [];
  
  $: childrenItems = question.children || [];
  
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
  
  function handleDndConsider(e: CustomEvent) {
    childrenItems = e.detail.items;
  }
  
  async function handleDndFinalize(e: CustomEvent) {
    childrenItems = e.detail.items;
    
    for (let i = 0; i < childrenItems.length; i++) {
      const child = childrenItems[i];
      if (child.parent_id !== question.id || child.order_index !== i) {
        dispatch('move', {
          questionId: child.id,
          newParentId: question.id,
          newSectionId: sectionId
        });
      }
    }
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
  
  function transformDraggedElement(element: HTMLElement) {
    element.classList.add('dragging');
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
      disabled={!childrenItems.length}
    >
      {#if childrenItems.length}
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
      <div class="flex items-center gap-2 flex-wrap">
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
        {#if level > 0}
          <span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
            Niveau {level + 1}
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
  
  {#if isExpanded && childrenItems.length > 0}
    <div 
      class="children ml-4 border-l-2 border-gray-200"
      use:dndzone={{
        items: childrenItems,
        flipDurationMs: 300,
        dragDisabled: false,
        dropTargetStyle: { backgroundColor: '#eff6ff', borderRadius: '0.5rem' },
        transformDraggedElement,
        type: `questions-${question.id}`
      }}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
    >
      {#each childrenItems as child (child.id)}
        <div animate:flip={{ duration: 300 }}>
          {#if !child[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
            <svelte:self
              question={child}
              {sectionId}
              level={level + 1}
              parentId={question.id}
              on:edit
              on:delete
              on:addChild
              on:move
            />
          {:else}
            <div 
              class="h-8 bg-blue-100 border-2 border-blue-300 border-dashed rounded-lg mx-2 my-1"
              style="margin-left: {(level + 1) * 24}px"
            ></div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
  
  {#if isExpanded && childrenItems.length === 0 && level < 5}
    <div 
      class="ml-4 border-l-2 border-gray-200"
      use:dndzone={{
        items: [],
        flipDurationMs: 300,
        dragDisabled: false,
        dropTargetStyle: { backgroundColor: '#f3f4f6', borderRadius: '0.5rem', minHeight: '2rem' },
        transformDraggedElement,
        type: `questions-${question.id}`
      }}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
    >
      <div class="text-xs text-gray-400 italic p-2" style="margin-left: {(level + 1) * 24}px">
        Glissez une question ici pour en faire une sous-question
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.dragging) {
    opacity: 0.5;
  }
  
  .question-item {
    transition: all 0.2s ease;
  }
  
  .children {
    padding-left: 0.5rem;
    margin-top: 0.25rem;
  }
</style>