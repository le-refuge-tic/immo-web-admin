# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Notifications

Liste minimale des notifications liées aux annonces (lot 8). **Chaque nouvelle fonctionnalité qui
prévient quelqu'un doit compléter ce tableau, dans les README des deux fronts.**
Les alertes sont créées par l'API (`AlertesService.creerAlerte`) ; l'événement socket
`alertes:maj` (raison `nouvelle`) porte leur titre et leur texte, ce qui permet le toast
immédiat dans l'onglet ouvert.

| Événement | Destinataire(s) | Canal | Type d'alerte |
|---|---|---|---|
| Envoi des photos terminé / échoué | auteur | toast (session, gestionnaire d'envois) | — |
| Nouveau bien en attente de validation | admins | alerte + badge « Modération » (temps réel) + toast | `bien_a_valider` |
| Bien approuvé / rejeté (motif) / publié sous conditions / publication retirée (motif) | auteur ; propriétaire lié si l'auteur est un commercial (sans la prime) | alerte + push + toast si connecté ; SMS au commercial auteur | `bien_approuve`, `bien_rejete`, `bien_conditionnel`, `bien_revoque` |
| Bien publié modifié, renvoyé en validation | admins | alerte + toast | `bien_modifie` |
| Modification approuvée / refusée (motif) | auteur de la modification | alerte + toast | `modification_approuvee`, `modification_rejetee` |
| Type de bien changé par un admin | auteur | alerte + toast | `type_bien_change` |
| Brouillon ancien (> 7 jours) | auteur | non câblé (optionnel) | — |

Dans l'administration, les alertes s'ouvrent depuis la cloche de la barre du haut (`src/layout/alertes`).

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
