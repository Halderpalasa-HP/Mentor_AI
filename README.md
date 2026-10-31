# Mentor IT — une IA pour débuter en informatique

Un assistant en ligne de commande qui accompagne les personnes débutant en informatique. Il répond simplement, explique les notions étape par étape et propose de petits exercices. Le projet reste volontairement minimal : pas d’interface graphique, de compte utilisateur ni de base de données.

Idée du projet

L’utilisateur pose une question dans le terminal, par exemple : « C’est quoi une variable ? » ou « Pourquoi mon code TypeScript affiche une erreur ? ». Gemma répond comme un mentor patient : elle adapte ses explications aux débutants, donne des exemples faciles à tester et encourage l’utilisateur à réfléchir plutôt que de faire tout le travail à sa place.

## Fonctionnalités de la première version

- Conversation avec l’IA depuis le terminal.

- Explications adaptées aux débutants, avec des exemples simples.

- Commande `/aide` pour afficher les commandes disponibles.

- Commande `/sujet <thème>` pour obtenir une mini-leçon sur un sujet.

- Commande `/quitter` pour fermer le programme.

Pour garder le projet simple, la première version ne conserve pas les conversations après la fermeture et ne nécessite pas de compte.

## Technologies

- **TypeScript** et **Node.js** pour le programme en ligne de commande.

- **Gemma** pour générer les réponses, via Ollama et son API locale.

- **readline/promises** de Node.js pour lire les questions dans le terminal.

## Prérequis

- Node.js (version récente avec prise en charge de TypeScript, ou utiliser `tsx`).

- npm.

- Ollama installé et en cours d’exécution.

- Le modèle Gemma téléchargé dans Ollama. Exemple :

```bash
ollama pull gemma3:1b
```

Le modèle peut être changé selon les ressources disponibles sur votre ordinateur.

## Installation

```bash
mkdir mentor-it
cd mentor-it
npm init -y
npm install ollama
npm install -D typescript tsx @types/node
```

Ajouter ensuite un script de lancement dans `package.json` :

```json
{
  "scripts": {
    "dev": "tsx src/index.ts"
  }
}
```

Créer le dossier et le fichier d’entrée :

```bash
mkdir src
```

## Utilisation prévue

Quand le programme est prêt, le lancer avec :

```bash
npm run dev
```

Exemple de session :

```
Bienvenue dans Mentor IT ! Pose une question ou tape /aide.

Vous > C’est quoi une boucle ?
Mentor > Une boucle permet de répéter des instructions... Voici un petit exemple...

Vous > /sujet HTML
Mentor > HTML sert à structurer le contenu d’une page web...

Vous > /quitter
À bientôt ! Continue à apprendre pas à pas.
```

## Comportement du mentor

Le prompt envoyé à Gemma doit lui demander de :

1. répondre en français, avec des mots simples ;

1. supposer que la personne est débutante, sans la juger ;

1. expliquer une notion à la fois et définir les termes techniques ;

1. donner un petit exemple concret quand c’est utile ;

1. proposer une question ou un exercice pour vérifier la compréhension ;

1. signaler clairement quand une réponse est incertaine.

## Structure de fichiers suggérée

```
mentor-it/
├── src/
│   └── index.ts       # boucle de discussion et commandes terminal
├── package.json
└── README.md
```

## Plan de réalisation

1. Lire une question dans le terminal et reconnaître `/aide` et `/quitter`.

1. Envoyer les autres questions à Gemma via Ollama.

1. Afficher la réponse de Gemma dans le terminal.

1. Ajouter `/sujet` et améliorer le prompt du mentor.

1. Tester avec quelques questions de débutant et ajuster les explications.

## Périmètre de la démo

Le but est de montrer un parcours de question-réponse utile et compréhensible, pas de créer une plateforme complète. Les réponses sont générées par un modèle d’IA : elles peuvent contenir des erreurs. Il faut encourager les utilisateurs à tester le code et à vérifier les informations importantes.
