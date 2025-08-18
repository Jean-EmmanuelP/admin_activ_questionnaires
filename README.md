# Administration Questionnaire Médical

Interface d'administration complète pour gérer un questionnaire médical partagé, construite avec Svelte 5 et Supabase.

## 🚀 Fonctionnalités

- **Gestion des sections** : Créer, modifier, supprimer des sections
- **Gestion des questions** : Questions hiérarchiques avec sous-questions
- **Logique conditionnelle** : Questions qui s'affichent selon les réponses
- **Drag & Drop** : Réorganisation intuitive des sections et questions
- **Types de questions** : Texte, sélection, oui/non, nombre, date, etc.
- **Interface responsive** : Design moderne avec Tailwind CSS
- **Persistance Supabase** : Sauvegarde automatique en base de données

## 🛠️ Technologies

- **Frontend** : Svelte 5 + TypeScript
- **Styling** : Tailwind CSS
- **Base de données** : Supabase (PostgreSQL)
- **Drag & Drop** : svelte-dnd-action
- **Animations** : Svelte transitions

## 📋 Structure de la base de données

### Table `sections`
- `id` : Identifiant unique
- `name` : Nom de la section
- `description` : Description optionnelle
- `order_index` : Ordre d'affichage
- `created_at` / `updated_at` : Timestamps

### Table `questions`
- `id` : Identifiant unique
- `section_id` : Référence vers la section
- `parent_id` : Référence vers la question parent (pour sous-questions)
- `text` : Texte de la question
- `type` : Type de question (text, select, yesno, etc.)
- `options` : Options JSONB pour les questions à choix
- `condition` : Logique conditionnelle JSONB
- `order_index` : Ordre dans la section
- `is_required` : Question obligatoire ou non
- `notes` : Notes additionnelles

## ⚙️ Configuration

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

### 2. Installation des dépendances

```bash
bun install
```

### 3. Lancement de l'application

```bash
bun run dev
```

## 🎯 Utilisation

### Créer une section
1. Cliquez sur "Nouvelle Section"
2. Modifiez le nom et la description
3. Sauvegardez

### Ajouter une question
1. Dans une section, cliquez sur "+ Question"
2. Choisissez le type de question
3. Configurez les options et conditions si nécessaire

### Créer une sous-question
1. Sur une question existante, cliquez sur "+ Sous-question"
2. La sous-question sera liée à la question parent

### Logique conditionnelle
1. Sur une question, configurez la condition
2. Exemple : "Si la réponse à la question X est 'Oui', afficher cette question"

### Réorganiser
1. Utilisez le drag & drop pour réorganiser les sections
2. Réorganisez les questions dans chaque section
3. L'ordre est automatiquement sauvegardé

## 🔧 Développement

### Structure des composants

```
src/lib/components/
├── QuestionnaireAdmin.svelte    # Composant principal
├── JsonEditor.svelte           # Éditeur JSON pour options/conditions
└── services/
    └── questionnaireService.ts # Service CRUD Supabase
```

### Ajouter un nouveau type de question

1. Mettez à jour le type `DBQuestion.type` dans `types.ts`
2. Ajoutez la logique d'affichage dans le composant
3. Mettez à jour l'éditeur d'options si nécessaire

## 📱 Responsive Design

L'interface s'adapte automatiquement aux différentes tailles d'écran :
- **Desktop** : Affichage complet avec toutes les options
- **Tablet** : Interface adaptée avec navigation simplifiée
- **Mobile** : Interface tactile optimisée

## 🚨 Gestion des erreurs

- **Validation des données** : Vérification avant sauvegarde
- **Gestion des erreurs réseau** : Messages d'erreur explicites
- **Rollback automatique** : Annulation des modifications en cas d'erreur

## 🔒 Sécurité

- **Authentification Supabase** : Gestion des utilisateurs
- **Permissions** : Contrôle d'accès aux données
- **Validation** : Vérification côté client et serveur

## 📈 Performance

- **Lazy loading** : Chargement progressif des données
- **Optimistic updates** : Mise à jour immédiate de l'interface
- **Debouncing** : Limitation des appels API

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
# activ
