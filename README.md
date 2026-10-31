# Mentor IT

Une interface de discussion locale pour apprendre l'informatique à son rythme.
Les questions sont envoyées à [Ollama](https://ollama.com/) sur le même ordinateur.
Aucune conversation n'est enregistrée à la fermeture de l'onglet.

## Prérequis

- Node.js 20 ou plus récent
- Ollama installé et lancé
- Un modèle Gemma, par exemple `gemma3:1b`

```powershell
ollama pull gemma3:1b
```

## Démarrer l'application

Dans le dossier du projet :

```powershell
npm install
npm run dev
```

Ouvre ensuite l'adresse locale affichée dans le terminal. La première connexion
vérifie les modèles disponibles dans Ollama ; il est également possible d'en
sélectionner un autre depuis l'interface.

Le bouton en haut à droite permet de basculer entre le mode clair et le mode
sombre. Le thème choisi est conservé dans le navigateur.

## Commandes de discussion

- `/aide` affiche les commandes disponibles.
- `/sujet HTML` demande une mini-leçon sur le thème choisi.
- `/quitter` termine la discussion en cours.
- `Entrée` envoie le message et `Maj + Entrée` ajoute une nouvelle ligne.

Les réponses sont générées par un modèle d'IA : teste le code et vérifie les
informations importantes.
