# MojoVelo - Frontend (Angular)

Frontend Angular de la plateforme de leasing de velos pour entreprises. Cette app consomme l'API CQRS exposee dans le repo `MojoVelo_CQRS`.

**Stack**
- Angular 21 + SCSS
- PrimeNG + PrimeFlex + PrimeIcons
- Auth0/angular-jwt (auth)
- Chart.js
- Capacitor (Android)

**Prerequis**
- Node.js 20+ (npm 11+)
- Angular CLI 21+ (optionnel, `npx ng` fonctionne aussi)
- API MojoVelo en HTTPS (par defaut `https://localhost:7000`)

**Installation**
```powershell
npm install
```

**Configuration**
Les URLs d'API se trouvent ici :
- `src/environments/environment.development.ts` (dev)
- `src/environments/environment.ts` (prod/build)

Champs utilises :
- `urls.coreBase`
- `urls.coreApi`
- `urls.legacyApi`
- `urls.cmsApi`

En dev, `ng serve` utilise `environment.development.ts`. En build, `ng build` utilise `environment.ts`.

**Lancer le front**
```powershell
npm run start
```
App disponible sur `http://localhost:4200`.

**Build**
```powershell
npm run build
```
Sortie : `dist/mojo-velo-angular`.

**Tests**
```powershell
npm test
```

**Capacitor / Android (optionnel)**
```powershell
npm run build
npx cap sync
npx cap open android
```

**Docker (optionnel)**
Le repo contient un `Dockerfile` et `nginx.conf` pour servir l'app en SPA. Pour lancer un conteneur de dev :
```powershell
docker build --target dev -t mojovelo-frontend:dev .
docker run --rm -p 4200:4200 mojovelo-frontend:dev
```
  
