# Mentor IT — une IA pour débuter en informatique

Un assistant avec une interface conversationnelle dans le terminal qui accompagne les personnes débutant en informatique. Il répond simplement, explique les notions étape par étape et propose de petits exercices. Le projet reste volontairement minimal : pas d’interface graphique, de compte utilisateur ni de base de données.

## Idée du projet

L’utilisateur pose une question dans le terminal, par exemple : « C’est quoi une variable ? » ou « Pourquoi mon code TypeScript affiche une erreur ? ». Gemma répond comme un mentor patient : elle adapte ses explications aux débutants, donne des exemples faciles à tester et encourage l’utilisateur à réfléchir plutôt que de faire tout le travail à sa place.

## Fonctionnalités de la première version

- Conversation avec l’IA depuis le terminal.

- Interface de discussion claire : message de bienvenue, zone de saisie, réponses séparées et commandes faciles à retenir.

- Explications adaptées aux débutants, avec des exemples simples.

- Commande `/aide` pour afficher les commandes disponibles.

- Commande `/sujet <thème>` pour obtenir une mini-leçon sur un sujet.

- Commande `/quitter` pour fermer le programme.

Pour garder le projet simple, la première version ne conserve pas les conversations après la fermeture et ne nécessite pas de compte. L’interface est une interface textuelle (TUI) dans le terminal, et non un site web.

## Technologies

- **TypeScript** et **Node.js** pour le programme en ligne de commande.

- **Gemma** pour générer les réponses, via Ollama et son API locale.

- **readline/promises** de Node.js pour lire les questions dans le terminal.

- **Chalk** (facultatif) pour ajouter des couleurs et améliorer la lisibilité.

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

### Interface de conversation

Au démarrage, l’application affiche un petit accueil expliquant quoi faire. L’utilisateur écrit sa question après l’invite `Vous >`, puis la réponse s’affiche sous `Mentor >`. L’interface doit rester lisible et rassurante : texte simple, lignes aérées, et indication visible quand l’IA prépare sa réponse. Les couleurs sont facultatives afin que le programme reste utilisable dans tous les terminaux.

Exemple de session :

```
====================================
   Bienvenue dans Mentor IT !
Ton mentor pour apprendre l’informatique
====================================
Pose une question, ou tape /aide pour voir les options.

Vous >

Vous > C’est quoi une boucle ?
Mentor > Une boucle permet de répéter des instructions. Par exemple, elle peut afficher les nombres de 1 à 5 sans écrire cinq fois la même ligne.

Veux-tu un autre exemple ou un petit exercice ?

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
│   └── index.ts       # interface de discussion et commandes terminal
├── package.json
└── README.md
```

## Plan de réalisation

1. Afficher l’accueil et lire les questions dans l’interface du terminal.

1. Envoyer les autres questions à Gemma via Ollama.

1. Afficher clairement la réponse, avec un indicateur pendant la génération.

1. Reconnaître `/aide`, `/sujet` et `/quitter`.

1. Tester avec quelques questions de débutant et ajuster les explications.

## Périmètre de la démo

Le but est de montrer un parcours de question-réponse utile et compréhensible, pas de créer une plateforme complète. Les réponses sont générées par un modèle d’IA : elles peuvent contenir des erreurs. Il faut encourager les utilisateurs à tester le code et à vérifier les informations importantes.
