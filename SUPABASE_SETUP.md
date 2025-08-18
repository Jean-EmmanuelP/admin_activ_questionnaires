# Configuration Supabase pour le Questionnaire Médical

## 🚀 Étape 1 : Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre URL de projet et votre clé anon

## 🗄️ Étape 2 : Créer les tables

Exécutez ce SQL dans l'éditeur SQL de Supabase :

```sql
-- Créer la table sections
CREATE TABLE public.sections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Créer la table questions
CREATE TABLE public.questions (
  id SERIAL PRIMARY KEY,
  section_id INTEGER REFERENCES public.sections(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('yesno', 'text', 'select', 'number', 'group', 'message', 'textarea', 'checkbox', 'radio', 'date')),
  options JSONB,
  condition JSONB,
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Créer des index pour les performances
CREATE INDEX idx_sections_order ON public.sections(order_index);
CREATE INDEX idx_questions_section ON public.questions(section_id);
CREATE INDEX idx_questions_parent ON public.questions(parent_id);
CREATE INDEX idx_questions_order ON public.questions(order_index);

-- Activer RLS (Row Level Security)
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Créer des politiques pour permettre l'accès public (à adapter selon vos besoins)
CREATE POLICY "Allow public read access" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.sections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.sections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.sections FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.questions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.questions FOR DELETE USING (true);
```

## 🔑 Étape 3 : Configurer les variables d'environnement

1. Créez un fichier `.env` à la racine de votre projet
2. Ajoutez vos informations Supabase :

```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

## 📊 Étape 4 : Données d'exemple (optionnel)

Exécutez ce SQL pour créer des données d'exemple :

```sql
-- Insérer des sections d'exemple
INSERT INTO public.sections (name, description, order_index) VALUES
('Informations générales', 'Informations de base sur le patient', 1),
('Symptômes', 'Description des symptômes actuels', 2),
('Antécédents', 'Antécédents médicaux', 3);

-- Insérer des questions d'exemple
INSERT INTO public.questions (section_id, text, type, order_index, is_required) VALUES
(1, 'Quel est votre nom ?', 'text', 1, true),
(1, 'Avez-vous des allergies ?', 'yesno', 2, false),
(2, 'Quels symptômes ressentez-vous ?', 'checkbox', 1, true);

-- Insérer des sous-questions d'exemple
INSERT INTO public.questions (section_id, parent_id, text, type, order_index, is_required, condition) VALUES
(1, 2, 'Quelles sont vos allergies ?', 'textarea', 1, true, '{"parent_value": "oui"}');
```

## 🔒 Étape 5 : Sécurité (optionnel)

Si vous voulez restreindre l'accès, modifiez les politiques RLS :

```sql
-- Exemple : permettre l'accès seulement aux utilisateurs authentifiés
DROP POLICY "Allow public read access" ON public.sections;
CREATE POLICY "Allow authenticated read access" ON public.sections FOR SELECT USING (auth.role() = 'authenticated');
```

## ✅ Étape 6 : Tester

1. Lancez votre application : `bun run dev`
2. Vérifiez que les données se chargent
3. Testez la création/modification/suppression

## 🚨 Dépannage

### Erreur "Cannot read properties of undefined"
- Vérifiez que vos variables d'environnement sont correctes
- Vérifiez que les tables existent dans Supabase

### Erreur "permission denied"
- Vérifiez que RLS est configuré correctement
- Vérifiez que les politiques permettent l'accès

### Données qui ne se chargent pas
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez les logs Supabase

## 📱 Interface d'administration

Une fois configuré, vous pourrez :

- ✅ Créer des sections et questions
- ✅ Organiser avec le drag & drop
- ✅ Configurer la logique conditionnelle
- ✅ Gérer les types de questions
- ✅ Sauvegarder automatiquement en base

## 🔗 Liens utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Guide RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Types PostgreSQL](https://www.postgresql.org/docs/current/datatype.html) 