<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { flip } from 'svelte/animate';
  import { dndzone, TRIGGERS, SOURCES, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { questionnaireStore, questionnaireTree } from '$lib/stores/questionnaire';
  import QuestionTreeItem from './QuestionTreeItem.svelte';
  import QuestionForm from './QuestionForm.svelte';
  import QuestionTreeDraggable from './QuestionTreeDraggable.svelte';
  import type { SectionWithQuestions, QuestionWithChildren } from '$lib/supabase';
  import { Plus, ChevronDown, ChevronRight, Folder, RefreshCw, Loader2 } from '@lucide/svelte';

  let showQuestionForm = false;
  let editingQuestion: QuestionWithChildren | null = null;
  let parentQuestion: QuestionWithChildren | null = null;
  let selectedSectionId: number | null = null;
  let expandedSections: Set<number> = new Set();
  let unsubscribe: (() => void) | null = null;
  let isLoading = false;
  let refreshCount = 0;
  let refreshResetTimer: NodeJS.Timeout | null = null;
  let remainingRefreshes = 3;

  onMount(async () => {
    await questionnaireStore.loadData();
    unsubscribe = questionnaireStore.subscribeToChanges();
    
    $questionnaireTree.forEach(section => {
      expandedSections.add(section.id);
    });
    expandedSections = expandedSections;
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
    if (refreshResetTimer) {
      clearTimeout(refreshResetTimer);
    }
  });

  function toggleSection(sectionId: number) {
    if (expandedSections.has(sectionId)) {
      expandedSections.delete(sectionId);
    } else {
      expandedSections.add(sectionId);
    }
    expandedSections = expandedSections;
  }

  function handleAddQuestion(sectionId: number, parent: QuestionWithChildren | null = null) {
    selectedSectionId = sectionId;
    parentQuestion = parent;
    editingQuestion = null;
    showQuestionForm = true;
  }

  function handleEditQuestion(event: CustomEvent<QuestionWithChildren>) {
    editingQuestion = event.detail;
    parentQuestion = null;
    selectedSectionId = event.detail.section_id;
    showQuestionForm = true;
  }

  function handleDeleteQuestion(event: CustomEvent<number>) {
    questionnaireStore.deleteQuestion(event.detail);
  }

  function handleAddChild(event: CustomEvent<QuestionWithChildren>) {
    handleAddQuestion(event.detail.section_id, event.detail);
  }

  async function handleQuestionMove(event: CustomEvent<{questionId: number, newParentId: number | null, newSectionId: number}>) {
    const { questionId, newParentId, newSectionId } = event.detail;
    await questionnaireStore.moveQuestion(questionId, newParentId, newSectionId);
  }

  async function handleAddSection() {
    const name = prompt('Nom de la nouvelle section:');
    if (name) {
      const description = prompt('Description (optionnelle):');
      await questionnaireStore.createSection(name, description || undefined);
    }
  }

  async function handleRefresh() {
    // Vérifier la limitation de taux
    if (remainingRefreshes <= 0) {
      alert('Limite atteinte. Veuillez attendre une minute avant de rafraîchir à nouveau.');
      return;
    }

    // Décrémenter le compteur
    remainingRefreshes--;
    refreshCount++;

    // Si c'est le premier refresh, démarrer le timer de réinitialisation
    if (refreshCount === 1) {
      refreshResetTimer = setTimeout(() => {
        refreshCount = 0;
        remainingRefreshes = 3;
        refreshResetTimer = null;
      }, 60000); // Réinitialiser après 1 minute
    }

    // Effectuer le refresh avec loading
    isLoading = true;
    try {
      await questionnaireStore.loadData();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      alert('Erreur lors du rafraîchissement des données');
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">Éditeur de Questionnaire</h1>
          <div class="flex gap-2">
            <button
              on:click={handleRefresh}
              disabled={isLoading || remainingRefreshes === 0}
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {#if isLoading}
                <Loader2 size={16} class="animate-spin" />
                <span>Chargement...</span>
              {:else}
                <RefreshCw size={16} />
                <span>Actualiser</span>
                {#if remainingRefreshes < 3}
                  <span class="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {remainingRefreshes}
                  </span>
                {/if}
              {/if}
            </button>
            <button
              on:click={handleAddSection}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Nouvelle Section
            </button>
          </div>
        </div>
      </div>

      <div class="divide-y divide-gray-200">
        {#each $questionnaireTree as section (section.id)}
          <div class="section">
            <div class="px-6 py-4 bg-gray-50">
              <div class="flex items-center justify-between">
                <button
                  on:click={() => toggleSection(section.id)}
                  class="flex items-center gap-2 text-left flex-1"
                >
                  {#if expandedSections.has(section.id)}
                    <ChevronDown size={20} />
                  {:else}
                    <ChevronRight size={20} />
                  {/if}
                  <Folder size={20} class="text-gray-500" />
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900">{section.name}</h2>
                    {#if section.description}
                      <p class="text-sm text-gray-600">{section.description}</p>
                    {/if}
                  </div>
                </button>
                <button
                  on:click={() => handleAddQuestion(section.id)}
                  class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
                >
                  <Plus size={16} />
                  Question
                </button>
              </div>
            </div>

            {#if expandedSections.has(section.id)}
              <div class="px-6 py-4">
                {#if section.questions.length > 0}
                  <div class="space-y-1">
                    {#each section.questions as question (question.id)}
                      <QuestionTreeDraggable
                        {question}
                        sectionId={section.id}
                        on:edit={handleEditQuestion}
                        on:delete={handleDeleteQuestion}
                        on:addChild={handleAddChild}
                        on:move={handleQuestionMove}
                      />
                    {/each}
                  </div>
                {:else}
                  <p class="text-gray-500 text-center py-8">
                    Aucune question dans cette section.
                    <button
                      on:click={() => handleAddQuestion(section.id)}
                      class="text-blue-600 hover:underline ml-1"
                    >
                      Ajouter une question
                    </button>
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        {/each}

        {#if $questionnaireTree.length === 0}
          <div class="px-6 py-12 text-center">
            <p class="text-gray-500 mb-4">Aucune section créée.</p>
            <button
              on:click={handleAddSection}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Créer la première section
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

{#if showQuestionForm}
  {#key `${editingQuestion?.id || 'new'}-${parentQuestion?.id || 'none'}-${Date.now()}`}
    <QuestionForm
      question={editingQuestion}
      parentId={parentQuestion?.id || null}
      sectionId={selectedSectionId || $questionnaireTree[0]?.id || 1}
      allQuestions={$questionnaireStore.questions}
      onClose={() => {
        showQuestionForm = false;
        editingQuestion = null;
        parentQuestion = null;
      }}
    />
  {/key}
{/if}

{#if isLoading}
  <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4">
      <Loader2 size={48} class="animate-spin text-blue-600" />
      <p class="text-lg font-medium text-gray-700">Actualisation des questions...</p>
      <p class="text-sm text-gray-500">Veuillez patienter</p>
    </div>
  </div>
{/if}

<style>
  :global(.dragging) {
    opacity: 0.5;
  }
</style>