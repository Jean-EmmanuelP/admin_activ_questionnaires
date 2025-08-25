<script lang="ts">
  import { goto } from '$app/navigation';
  import { FileQuestion, Settings } from '@lucide/svelte';
</script>

<svelte:head>
  <title>Questionnaire Médical</title>
  <meta name="description" content="Système de gestion de questionnaires médicaux avec hiérarchie illimitée" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  <div class="max-w-4xl w-full">
    <div class="text-center mb-12">
      <h1 class="text-5xl font-bold text-gray-900 mb-4">
        Questionnaire Médical
      </h1>
      <p class="text-xl text-gray-600">
        Système de gestion avec hiérarchie illimitée de questions
      </p>
    </div>
    
    <div class="flex justify-center">
      <button
        on:click={() => goto('/admin')}
        class="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer group"
      >
        <div class="flex flex-col items-center">
          <Settings size={48} class="text-green-600 mb-4 group-hover:rotate-90 transition-transform" />
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">Administration</h2>
          <p class="text-gray-600 text-center">
            Gérer les questions, créer des sous-questions et configurer les conditions
          </p>
        </div>
      </button>
    </div>
    
    <div class="mt-12 bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-3">Fonctionnalités principales</h3>
      <ul class="space-y-2 text-gray-600">
        <li class="flex items-start">
          <span class="text-green-500 mr-2">✓</span>
          <span>Hiérarchie illimitée de questions et sous-questions</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-500 mr-2">✓</span>
          <span>Conditions "Si/Alors" pour l'affichage conditionnel</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-500 mr-2">✓</span>
          <span>Drag & drop pour réorganiser les questions entre niveaux</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-500 mr-2">✓</span>
          <span>Support de multiples types de questions</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-500 mr-2">✓</span>
          <span>Synchronisation en temps réel avec Supabase</span>
        </li>
      </ul>
    </div>
  </div>
</div>
