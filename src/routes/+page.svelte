<script lang="ts">
  import QuestionnaireAdmin from '$lib/components/QuestionnaireAdmin.svelte';
</script>

<svelte:head>
  <title>Administration Questionnaire Médical</title>
  <meta name="description" content="Interface d'administration du questionnaire médical avec Supabase" />
</svelte:head>

<main>
  <QuestionnaireAdmin />
</main>

<style>
  main {
    min-height: 100vh;
  }
</style>
