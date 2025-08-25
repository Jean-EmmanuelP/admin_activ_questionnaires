<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  import { questionnaireStore } from '$lib/stores/questionnaire';
  import type { DBQuestion, QuestionWithChildren } from '$lib/supabase';
  import { generateCondition } from '$lib/utils/questionnaire';
  import { X, Save, Plus } from '@lucide/svelte';

  export let question: QuestionWithChildren | null = null;
  export let parentId: number | null = null;
  export let sectionId: number;
  export let allQuestions: DBQuestion[] = [];
  export let onClose: () => void;

  const validationSchema = yup.object({
    text: yup.string().required('Le texte de la question est requis'),
    type: yup.string().oneOf(['yesno', 'text', 'select', 'number', 'group', 'message', 'textarea', 'checkbox', 'radio', 'date']).required(),
    is_required: yup.boolean(),
    notes: yup.string().nullable()
  });

  // Calculer les valeurs initiales
  function getInitialValues() {
    let conditionType: 'none' | 'simple' | 'custom' = 'none';
    let conditionParentValue = '';
    let conditionAction: 'show' | 'hide' = 'show';
    let selectOptions: string[] = [];
    
    if (question?.condition) {
      if (question.condition.parent_value) {
        conditionType = 'simple';
        conditionParentValue = question.condition.parent_value;
        conditionAction = question.condition.action || 'show';
      } else {
        conditionType = 'custom';
      }
    }
    
    if (question?.options?.values) {
      selectOptions = question.options.values;
    }
    
    return {
      text: question?.text || '',
      type: question?.type || 'yesno',
      options: question?.options || null,
      condition: question?.condition || null,
      parent_id: question?.parent_id || parentId,
      section_id: question?.section_id || sectionId,
      is_required: question?.is_required ?? true,
      notes: question?.notes || '',
      order_index: question?.order_index || 0,
      conditionType,
      conditionParentValue,
      conditionAction,
      selectOptions
    };
  }

  const { form, errors, state, handleChange, handleSubmit } = createForm({
    initialValues: getInitialValues(),
    validationSchema,
    onSubmit: async (values) => {
      try {
        let condition = null;
        if (values.conditionType === 'simple' && values.conditionParentValue) {
          condition = generateCondition(values.conditionParentValue, values.conditionAction as 'show' | 'hide');
        } else if (values.conditionType === 'custom' && values.condition) {
          condition = values.condition;
        }

        let options = null;
        if (values.type === 'select' || values.type === 'checkbox' || values.type === 'radio') {
          options = { values: values.selectOptions.filter((opt: string) => opt.trim() !== '') };
        }

        const questionData = {
          text: values.text,
          type: values.type,
          options,
          condition,
          parent_id: values.parent_id || undefined,
          section_id: values.section_id,
          is_required: values.is_required,
          notes: values.notes,
          order_index: values.order_index
        };

        if (question) {
          await questionnaireStore.updateQuestion(question.id, questionData);
        } else {
          const maxOrder = allQuestions
            .filter(q => q.parent_id === values.parent_id && q.section_id === values.section_id)
            .reduce((max, q) => Math.max(max, q.order_index), -1);
          
          await questionnaireStore.createQuestion({
            ...questionData,
            order_index: maxOrder + 1
          });
        }
        
        onClose();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
    }
  });


  function addSelectOption() {
    $form.selectOptions = [...$form.selectOptions, ''];
  }

  function removeSelectOption(index: number) {
    $form.selectOptions = $form.selectOptions.filter((_, i) => i !== index);
  }

  function updateSelectOption(index: number, value: string) {
    $form.selectOptions = $form.selectOptions.map((opt, i) => i === index ? value : opt);
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center">
  <!-- Backdrop with blur -->
  <button 
    class="absolute inset-0 bg-black/30 backdrop-blur-sm"
    on:click={() => onClose()}
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    aria-label="Close modal"
  ></button>
  
  <!-- Modal content -->
  <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 z-10">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">
        {question ? 'Modifier la question' : 'Nouvelle question'}
      </h2>
      <button
        type="button"
        on:click={() => onClose()}
        class="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={24} />
      </button>
    </div>

    <form on:submit={handleSubmit} class="space-y-6">
      <div>
        <label for="text" class="block text-sm font-medium text-gray-700 mb-1">
          Texte de la question
        </label>
        <textarea
          id="text"
          bind:value={$form.text}
          on:change={handleChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Entrez le texte de la question"
        ></textarea>
        {#if $errors.text}
          <p class="mt-1 text-sm text-red-600">{$errors.text}</p>
        {/if}
      </div>

      <div>
        <label for="type" class="block text-sm font-medium text-gray-700 mb-1">
          Type de question
        </label>
        <select
          id="type"
          bind:value={$form.type}
          on:change={handleChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="yesno">Oui/Non</option>
          <option value="text">Texte court</option>
          <option value="textarea">Texte long</option>
          <option value="select">Liste déroulante</option>
          <option value="checkbox">Cases à cocher</option>
          <option value="radio">Boutons radio</option>
          <option value="number">Nombre</option>
          <option value="date">Date</option>
          <option value="group">Groupe</option>
          <option value="message">Message informatif</option>
        </select>
      </div>

      {#if $form.type === 'select' || $form.type === 'checkbox' || $form.type === 'radio'}
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-1">
            Options
          </div>
          <div class="space-y-2">
            {#each $form.selectOptions as option, index}
              <div class="flex gap-2">
                <input
                  type="text"
                  value={option}
                  on:input={(e) => updateSelectOption(index, e.currentTarget.value)}
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Option {index + 1}"
                />
                <button
                  type="button"
                  on:click={() => removeSelectOption(index)}
                  class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            {/each}
            <button
              type="button"
              on:click={addSelectOption}
              class="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
            >
              <Plus size={20} />
              Ajouter une option
            </button>
          </div>
        </div>
      {/if}

      {#if $form.parent_id || parentId}
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-1">
            Condition d'affichage
          </div>
          <div class="space-y-3">
            <div class="flex gap-3">
              <label class="flex items-center">
                <input
                  type="radio"
                  bind:group={$form.conditionType}
                  value="none"
                  class="mr-2"
                />
                Aucune condition
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  bind:group={$form.conditionType}
                  value="simple"
                  class="mr-2"
                />
                Condition simple
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  bind:group={$form.conditionType}
                  value="custom"
                  class="mr-2"
                />
                Condition personnalisée
              </label>
            </div>

            {#if $form.conditionType === 'simple'}
              <div class="pl-6 space-y-3">
                <div class="flex gap-3 items-center">
                  <span class="text-sm">Afficher si la réponse parent est</span>
                  <input
                    type="text"
                    bind:value={$form.conditionParentValue}
                    class="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="oui"
                  />
                </div>
                <div class="flex gap-3 items-center">
                  <span class="text-sm">Action</span>
                  <select
                    bind:value={$form.conditionAction}
                    class="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="show">Afficher</option>
                    <option value="hide">Masquer</option>
                  </select>
                </div>
              </div>
            {/if}

            {#if $form.conditionType === 'custom'}
              <div class="pl-6">
                <textarea
                  bind:value={$form.condition}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows="4"
                  placeholder={`{"parent_value": "oui", "action": "show"}`}
                ></textarea>
                <p class="mt-1 text-xs text-gray-500">
                  Format JSON pour des conditions complexes
                </p>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <div>
        <label for="parent_id" class="block text-sm font-medium text-gray-700 mb-1">
          Question parent
        </label>
        <select
          id="parent_id"
          bind:value={$form.parent_id}
          on:change={handleChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={null}>Aucune (question racine)</option>
          {#each allQuestions.filter(q => q.id !== question?.id) as q}
            <option value={q.id}>{q.text}</option>
          {/each}
        </select>
      </div>

      <div class="flex items-center">
        <input
          type="checkbox"
          id="is_required"
          bind:checked={$form.is_required}
          on:change={handleChange}
          class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="is_required" class="text-sm font-medium text-gray-700">
          Question obligatoire
        </label>
      </div>

      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
          Notes (optionnel)
        </label>
        <textarea
          id="notes"
          bind:value={$form.notes}
          on:change={handleChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
          placeholder="Notes additionnelles, emojis, liens..."
        ></textarea>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          on:click={() => onClose()}
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={$state.isSubmitting}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save size={20} />
          {$state.isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  </div>
</div>