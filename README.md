# Mentor IT

Une interface de discussion pour apprendre l'informatique à son rythme. Le
backend Node.js envoie les questions à Gemma via l’API Google AI Studio ; aucune
conversation n'est enregistrée à la fermeture de l'onglet.

## Prérequis

- Node.js 20 ou plus récent
- Une clé API [Google AI Studio](https://aistudio.google.com/apikey)

Le backend utilise le modèle Gemma `gemma-4-26b-a4b-it` via l’API Gemini.

## Configurer la clé API

Copie le fichier d'exemple dans un fichier `.env` local :

```powershell
Copy-Item .env.example .env
```

Ajoute ta clé uniquement dans `.env`, à la place de la valeur d'exemple :



Ne colle jamais la clé dans le code ou dans le chat. Le fichier `.env` est
ignoré par Git ; seul `.env.example`, sans clé réelle, est versionné.

## Démarrer l'application

Installe les dépendances puis démarre le serveur API et l'interface :

```powershell
npm install
npm run dev
```

Ouvre l'adresse locale affichée par Vite. Le serveur API démarre sur le port
`3001` et le navigateur le contacte via le proxy Vite. En production, lance
`npm run build`, puis `npm start` pour servir le frontend et le backend.

Le backend refuse les questions sans clé configurée, limite la taille de
l'historique et applique une limite de requêtes. Il ne conserve aucune donnée.
Les requêtes sont transmises à Google et au modèle configuré.

## Commandes de discussion

- `/aide` affiche les commandes disponibles.
- `/sujet HTML` demande une mini-leçon sur le thème choisi.
- `/quitter` termine la discussion en cours.
- `Entrée` envoie le message et `Maj + Entrée` ajoute une nouvelle ligne.
- Le bouton en haut à droite permet de basculer entre le mode clair et le mode
  sombre ; le thème choisi est conservé dans le navigateur.

Les réponses sont générées par un modèle d'IA : teste le code et vérifie les
informations importantes.
