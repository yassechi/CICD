# MojoVelo Frontend — Projet de TP CI/CD

Application Angular servant de **support de cours pour la mise en place d'un pipeline CI/CD**. Elle représente le frontend d'une plateforme de leasing de vélos pour entreprises.

> ⚠️ Ce projet est utilisé à des fins pédagogiques uniquement. Il ne s'agit pas d'un projet de production.

---

## Objectifs pédagogiques

Ce dépôt est conçu pour vous permettre de pratiquer :

- La mise en place d'un pipeline CI/CD (GitHub Actions, GitLab CI, etc.)
- Le linting et les tests automatisés à chaque push
- Le build et la containerisation via Docker
- Le déploiement automatisé d'une Single Page Application

---

## Stack technique

- **Angular 21** + SCSS
- **PrimeNG** + PrimeFlex + PrimeIcons
- **Auth0/angular-jwt** (authentification)
- **Chart.js**
- **Capacitor** (Android)

---

## Prérequis

- Node.js 20+ (npm 11+)
- Angular CLI 21+ *(optionnel — `npx ng` fonctionne aussi)*
- Une instance de l'API MojoVelo en HTTPS *(par défaut `https://localhost:7000`)*

---

## Installation

```bash
npm install
```

---

## Configuration

Les URLs d'API sont définies dans :

- `src/environments/environment.development.ts` → utilisé par `ng serve` (dev)
- `src/environments/environment.ts` → utilisé par `ng build` (prod)

Champs à configurer :

| Champ | Description |
|---|---|
| `urls.coreBase` | Base de l'API principale |
| `urls.coreApi` | Endpoint API principal |
| `urls.legacyApi` | Endpoint API legacy |
| `urls.cmsApi` | Endpoint API CMS |

---

## Commandes

| Commande | Description |
|---|---|
| `npm run start` | Lance le serveur de dev sur `http://localhost:4200` |
| `npm run build` | Compile l'app dans `dist/mojo-velo-angular` |
| `npm test` | Exécute les tests unitaires |

---

## Docker

Le repo inclut un `Dockerfile` et un `nginx.conf` pour servir l'app en mode SPA.

```bash
# Build et lancement du conteneur de dev
docker build --target dev -t mojovelo-frontend:dev .
docker run --rm -p 4200:4200 mojovelo-frontend:dev
```

> 💡 **Piste CI/CD :** intégrez ces commandes dans votre pipeline pour builder et publier une image Docker automatiquement à chaque merge sur `main`.

---

## Capacitor / Android *(optionnel)*

```bash
npm run build
npx cap sync
npx cap open android
```

---

## Idées de pipeline CI/CD à implémenter

Voici quelques étapes classiques à mettre en place sur ce projet :

1. **Install** — `npm ci`
2. **Lint** — `npx ng lint`
3. **Test** — `npm test -- --watch=false --browsers=ChromeHeadless`
4. **Build** — `npm run build`
5. **Docker build & push** — construction et publication de l'image
6. **Deploy** — déploiement automatique sur un environnement cible
