<script lang="ts">
  import { onMount } from 'svelte';
  import { QuestionnaireService, type SectionWithQuestions } from '$lib/services/questionnaireService';
  import { createEventDispatcher } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  const dispatch = createEventDispatcher();

  let sections: SectionWithQuestions[] = [];
  let loading = true;
  let error = '';
  let editingSection: number | null = null;
  let editingQuestion: number | null = null;
  let activeTab: 'edit' | 'preview' = 'edit';

  // Fonction pour récupérer les données
  async function loadData() {
    try {
      loading = true;
      sections = await QuestionnaireService.getSectionsWithQuestions();
    } catch (err) {
      error = 'Erreur lors du chargement des données';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // Fonction pour ajouter une section
  async function addSection() {
    try {
      const newSection = await QuestionnaireService.createSection({
        name: 'Nouvelle Section',
        description: '',
        order_index: sections.length
      });

      sections = [...sections, { ...newSection, questions: [] }];
      // Éditer immédiatement la nouvelle section
      editingSection = newSection.id;
    } catch (err) {
      error = 'Erreur lors de la création de la section';
      console.error(err);
    }
  }

  // Fonction pour mettre à jour une section
  async function updateSection(id: number, updates: Partial<SectionWithQuestions>) {
    try {
      const updatedSection = await QuestionnaireService.updateSection(id, updates);
      sections = sections.map(s => s.id === id ? { ...s, ...updatedSection } : s);
      editingSection = null; // Fermer l'édition
    } catch (err) {
      error = 'Erreur lors de la mise à jour de la section';
      console.error(err);
    }
  }

  // Fonction pour supprimer une section
  async function deleteSection(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) return;

    try {
      await QuestionnaireService.deleteSection(id);
      sections = sections.filter(s => s.id !== id);
    } catch (err) {
      error = 'Erreur lors de la suppression de la section';
      console.error(err);
    }
  }

  // Fonction pour ajouter une question
  async function addQuestion(sectionId: number, parentId?: number) {
    try {
      const newQuestion = await QuestionnaireService.createQuestion({
        section_id: sectionId,
        parent_id: parentId,
        text: 'Nouvelle question',
        type: 'text',
        order_index: 0,
        is_required: true
      });

      // Ajouter la question à la bonne section
      sections = sections.map(section => {
        if (section.id === sectionId) {
          if (parentId) {
            // Ajouter comme sous-question
            const updatedQuestions = section.questions.map(q => {
              if (q.id === parentId) {
                return { ...q, children: [...(q.children || []), { ...newQuestion, children: [] }] };
              }
              return q;
            });
            return { ...section, questions: updatedQuestions };
          } else {
            // Ajouter comme question principale
            return { ...section, questions: [...section.questions, { ...newQuestion, children: [] }] };
          }
        }
        return section;
      });

      // Éditer immédiatement la nouvelle question
      editingQuestion = newQuestion.id;
    } catch (err) {
      error = 'Erreur lors de la création de la question';
      console.error(err);
    }
  }

  // Fonction pour mettre à jour une question
  async function updateQuestion(id: number, updates: Partial<any>) {
    try {
      const updatedQuestion = await QuestionnaireService.updateQuestion(id, updates);
      
      // Mettre à jour la question dans l'état local
      sections = sections.map(section => ({
        ...section,
        questions: updateQuestionsRecursively(section.questions, id, updatedQuestion)
      }));

      editingQuestion = null; // Fermer l'édition
    } catch (err) {
      error = 'Erreur lors de la mise à jour de la question';
      console.error(err);
    }
  }

  // Fonction récursive pour mettre à jour les questions
  function updateQuestionsRecursively(questions: any[], id: number, updates: any): any[] {
    return questions.map(q => {
      if (q.id === id) {
        return { ...q, ...updates };
      }
      if (q.children && q.children.length > 0) {
        return { ...q, children: updateQuestionsRecursively(q.children, id, updates) };
      }
      return q;
    });
  }

  // Fonction pour supprimer une question
  async function deleteQuestion(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) return;

    try {
      await QuestionnaireService.deleteQuestion(id);
      
      // Supprimer la question de l'état local
      sections = sections.map(section => ({
        ...section,
        questions: removeQuestionsRecursively(section.questions, id)
      }));
    } catch (err) {
      error = 'Erreur lors de la suppression de la question';
      console.error(err);
    }
  }

  // Fonction récursive pour supprimer les questions
  function removeQuestionsRecursively(questions: any[], id: number): any[] {
    return questions
      .filter(q => q.id !== id)
      .map(q => {
        if (q.children && q.children.length > 0) {
          return { ...q, children: removeQuestionsRecursively(q.children, id) };
        }
        return q;
      });
  }

  // Gestion du drag & drop pour les sections
  function handleSectionDnd(e: CustomEvent) {
    const { items } = e.detail;
    sections = items;
    
    // Mettre à jour l'ordre dans la base de données
    const updates = items.map((section: any, index: number) => ({
      id: section.id,
      order_index: index
    }));
    
    QuestionnaireService.reorderSections(updates).catch(err => {
      console.error('Erreur lors de la réorganisation des sections:', err);
    });
  }

  // Gestion du drag & drop pour les questions
  function handleQuestionDnd(e: CustomEvent, sectionId: number) {
    const { items } = e.detail;
    
    // Mettre à jour l'ordre des questions dans la section
    sections = sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, questions: items };
      }
      return section;
    });

    // Mettre à jour l'ordre dans la base de données
    const updates = items.map((question: any, index: number) => ({
      id: question.id,
      order_index: index
    }));
    
    QuestionnaireService.reorderQuestions(updates).catch(err => {
      console.error('Erreur lors de la réorganisation des questions:', err);
    });
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="questionnaire-admin bg-gray-50 min-h-screen p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">📋 Administration du Questionnaire Médical</h1>
          <p class="text-gray-600 mt-1">
            Gérez facilement les sections et questions du questionnaire partagé
          </p>
        </div>
        <button
          on:click={addSection}
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
        >
          ➕ Nouvelle Section
        </button>
      </div>

      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      {/if}
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button
            on:click={() => activeTab = 'edit'}
            class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'edit' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            ✏️ Édition
          </button>
          <button
            on:click={() => activeTab = 'preview'}
            class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'preview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          >
            👁️ Preview
          </button>
        </nav>
      </div>
    </div>

    <!-- Loading state -->
    {#if loading}
      <div class="text-center py-12">
        <div class="text-gray-500 text-lg">Chargement en cours...</div>
      </div>
    {:else if sections.length === 0}
      <!-- Empty state -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div class="text-gray-400 mb-4 text-8xl">📋</div>
        <h3 class="text-xl font-medium text-gray-900 mb-2">Aucune section créée</h3>
        <p class="text-gray-600 mb-6 text-lg">
          Commencez par créer votre première section pour organiser le questionnaire
        </p>
        <button
          on:click={addSection}
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
        >
          Créer la première section
        </button>
      </div>
    {:else}
      {#if activeTab === 'edit'}
        <!-- Mode Édition -->
        <div
          use:dndzone={{ items: sections }}
          on:consider={handleSectionDnd}
          on:finalize={handleSectionDnd}
          class="space-y-6"
        >
          {#each sections as section (section.id)}
            <div animate:flip={{ duration: 300 }} class="section-container">
              <!-- Section Header -->
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {#if editingSection === section.id}
                  <!-- Mode édition de la section -->
                  <div class="space-y-4">
                    <input
                      bind:value={section.name}
                      placeholder="Nom de la section"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
                    />
                    <textarea
                      bind:value={section.description}
                      placeholder="Description de la section (optionnel)"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                    <div class="flex items-center gap-3">
                      <button
                        on:click={() => updateSection(section.id, { name: section.name, description: section.description })}
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ✅ Sauvegarder
                      </button>
                      <button
                        on:click={() => editingSection = null}
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        ❌ Annuler
                      </button>
                    </div>
                  </div>
                {:else}
                  <!-- Mode affichage de la section -->
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <h3 class="text-xl font-semibold text-gray-900 mb-2">{section.name}</h3>
                      {#if section.description}
                        <p class="text-gray-600 mb-3">{section.description}</p>
                      {/if}
                      <div class="text-sm text-gray-500">
                        📝 {section.questions.length} question(s)
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <button
                        on:click={() => addQuestion(section.id)}
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ➕ Question
                      </button>
                      <button
                        on:click={() => editingSection = section.id}
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        on:click={() => deleteSection(section.id)}
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                {/if}
              </div>

              <!-- Questions -->
              {#if section.questions.length > 0}
                <div class="mt-4 ml-8">
                  <div
                    use:dndzone={{ items: section.questions }}
                    on:consider={(e: CustomEvent) => handleQuestionDnd(e, section.id)}
                    on:finalize={(e: CustomEvent) => handleQuestionDnd(e, section.id)}
                    class="space-y-3"
                  >
                    {#each section.questions as question (question.id)}
                      <div animate:flip={{ duration: 300 }} class="question-container">
                        {#if editingQuestion === question.id}
                          <!-- Mode édition de la question -->
                          <div class="bg-blue-50 rounded-lg border-2 border-blue-200 p-4">
                            <div class="space-y-3">
                              <input
                                bind:value={question.text}
                                placeholder="Texte de la question"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <select
                                bind:value={question.type}
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="text">Texte</option>
                                <option value="textarea">Zone de texte</option>
                                <option value="yesno">Oui/Non</option>
                                <option value="select">Sélection</option>
                                <option value="checkbox">Choix multiple</option>
                                <option value="radio">Choix unique</option>
                                <option value="number">Nombre</option>
                                <option value="date">Date</option>
                              </select>
                              <div class="flex items-center gap-3">
                                <label class="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    bind:checked={question.is_required}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span class="text-sm text-gray-700">Question obligatoire</span>
                                </label>
                              </div>
                              <div class="flex items-center gap-2">
                                <button
                                  on:click={() => updateQuestion(question.id, { 
                                    text: question.text, 
                                    type: question.type, 
                                    is_required: question.is_required 
                                  })}
                                  class="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  ✅ Sauvegarder
                                </button>
                                <button
                                  on:click={() => editingQuestion = null}
                                  class="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                  ❌ Annuler
                                </button>
                              </div>
                            </div>
                          </div>
                        {:else}
                          <!-- Mode affichage de la question -->
                          <div class="bg-white rounded border border-gray-200 p-4">
                            <div class="flex items-center justify-between">
                              <div class="flex-1">
                                <div class="font-medium text-gray-900 text-lg mb-1">{question.text}</div>
                                <div class="text-sm text-gray-600">
                                  📋 Type: {question.type} | 
                                  {question.is_required ? '🔴 Obligatoire' : '🟢 Optionnel'}
                                </div>
                              </div>
                              <div class="flex items-center gap-2">
                                <button
                                  on:click={() => addQuestion(section.id, question.id)}
                                  class="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                                >
                                  ➕ Sous-question
                                </button>
                                <button
                                  on:click={() => editingQuestion = question.id}
                                  class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                >
                                  ✏️ Modifier
                                </button>
                                <button
                                  on:click={() => deleteQuestion(question.id)}
                                  class="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                >
                                  🗑️ Supprimer
                                </button>
                              </div>
                            </div>

                            <!-- Sous-questions -->
                            {#if question.children && question.children.length > 0}
                              <div class="mt-3 ml-6 space-y-2">
                                {#each question.children as child (child.id)}
                                  <div class="bg-gray-50 rounded border border-gray-200 p-3">
                                    {#if editingQuestion === child.id}
                                      <!-- Mode édition de la sous-question -->
                                      <div class="bg-blue-50 rounded-lg border-2 border-blue-200 p-3">
                                        <div class="space-y-3">
                                          <input
                                            bind:value={child.text}
                                            placeholder="Texte de la question"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                          />
                                          <select
                                            bind:value={child.type}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                          >
                                            <option value="text">Texte</option>
                                            <option value="textarea">Zone de texte</option>
                                            <option value="yesno">Oui/Non</option>
                                            <option value="select">Sélection</option>
                                            <option value="checkbox">Choix multiple</option>
                                            <option value="radio">Choix unique</option>
                                            <option value="number">Nombre</option>
                                            <option value="date">Date</option>
                                          </select>
                                          <div class="flex items-center gap-3">
                                            <label class="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                bind:checked={child.is_required}
                                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                              />
                                              <span class="text-xs text-gray-700">Question obligatoire</span>
                                            </label>
                                          </div>
                                          <div class="flex items-center gap-2">
                                            <button
                                              on:click={() => updateQuestion(child.id, { 
                                                text: child.text, 
                                                type: child.type, 
                                                is_required: child.is_required 
                                              })}
                                              class="px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                              ✅ Sauvegarder
                                            </button>
                                            <button
                                              on:click={() => editingQuestion = null}
                                              class="px-3 py-2 bg-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-400 transition-colors"
                                            >
                                              ❌ Annuler
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    {:else}
                                      <!-- Mode affichage de la sous-question -->
                                      <div class="flex items-center justify-between">
                                        <div class="flex-1">
                                          <div class="text-sm font-medium text-gray-900">{child.text}</div>
                                          <div class="text-xs text-gray-600">
                                            📋 Type: {child.type} | 
                                            {child.is_required ? '🔴 Obligatoire' : '🟢 Optionnel'}
                                          </div>
                                        </div>
                                        <div class="flex items-center gap-1">
                                          <button
                                            on:click={() => editingQuestion = child.id}
                                            class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                          >
                                            ✏️ Modifier
                                          </button>
                                          <button
                                            on:click={() => deleteQuestion(child.id)}
                                            class="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                          >
                                            🗑️ Supprimer
                                          </button>
                                        </div>
                                      </div>
                                    {/if}
                                  </div>
                                {/each}
                              </div>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <!-- Mode Preview -->
        <div class="space-y-6">
          {#each sections as section (section.id)}
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-2">{section.name}</h3>
              {#if section.description}
                <p class="text-gray-600 mb-4">{section.description}</p>
              {/if}
              
              {#if section.questions.length > 0}
                <div class="space-y-4">
                  {#each section.questions as question (question.id)}
                    <div class="border-l-4 border-blue-500 pl-4">
                      <div class="mb-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          {question.text}
                          {#if question.is_required}
                            <span class="text-red-500 ml-1">*</span>
                          {/if}
                        </label>
                        
                        <!-- Rendu des différents types de questions -->
                        {#if question.type === 'text'}
                          <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Votre réponse" />
                        {:else if question.type === 'textarea'}
                          <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Votre réponse"></textarea>
                        {:else if question.type === 'yesno'}
                          <div class="flex items-center gap-4">
                            <label class="flex items-center">
                              <input type="radio" name="q_{question.id}" value="oui" class="mr-2" />
                              <span>Oui</span>
                            </label>
                            <label class="flex items-center">
                              <input type="radio" name="q_{question.id}" value="non" class="mr-2" />
                              <span>Non</span>
                            </label>
                          </div>
                        {:else if question.type === 'select'}
                          <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">Sélectionnez une option</option>
                            {#if question.options && question.options.values}
                              {#each question.options.values as option}
                                <option value={option}>{option}</option>
                              {/each}
                            {/if}
                          </select>
                        {:else if question.type === 'checkbox'}
                          <div class="space-y-2">
                            {#if question.options && question.options.values}
                              {#each question.options.values as option}
                                <label class="flex items-center">
                                  <input type="checkbox" value={option} class="mr-2" />
                                  <span>{option}</span>
                                </label>
                              {/each}
                            {/if}
                          </div>
                        {:else if question.type === 'radio'}
                          <div class="space-y-2">
                            {#if question.options && question.options.values}
                              {#each question.options.values as option}
                                <label class="flex items-center">
                                  <input type="radio" name="q_{question.id}" value={option} class="mr-2" />
                                  <span>{option}</span>
                                </label>
                              {/each}
                            {/if}
                          </div>
                        {:else if question.type === 'number'}
                          <input type="number" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Votre réponse" />
                        {:else if question.type === 'date'}
                          <input type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        {/if}
                      </div>

                      <!-- Sous-questions -->
                      {#if question.children && question.children.length > 0}
                        <div class="ml-6 mt-3 space-y-3">
                          {#each question.children as child (child.id)}
                            <div class="border-l-2 border-gray-300 pl-4">
                              <label class="block text-sm font-medium text-gray-700 mb-1">
                                {child.text}
                                {#if child.is_required}
                                  <span class="text-red-500 ml-1">*</span>
                                {/if}
                              </label>
                              
                              <!-- Rendu des sous-questions -->
                              {#if child.type === 'text'}
                                <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Votre réponse" />
                              {:else if child.type === 'textarea'}
                                <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="2" placeholder="Votre réponse"></textarea>
                              {:else if child.type === 'yesno'}
                                <div class="flex items-center gap-4">
                                  <label class="flex items-center">
                                    <input type="radio" name="q_{child.id}" value="oui" class="mr-2" />
                                    <span>Oui</span>
                                  </label>
                                  <label class="flex items-center">
                                    <input type="radio" name="q_{child.id}" value="non" class="mr-2" />
                                    <span>Non</span>
                                  </label>
                                </div>
                              {/if}
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div> 