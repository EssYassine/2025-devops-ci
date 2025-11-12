# TP DevOps / Docker – Documentation du laboratoire

> **Environnement :**
> - Hôte : Ubuntu 22.04.3 (machine virtuelle)
> - Auteur : *Yassine Essaouri*
> - Cours : *M1 Cybersécurité – DevOps / Docker*
> - Dépôt de base : [Anthony-Jhoiro/2025-devops-ci](https://github.com/Anthony-Jhoiro/2025-devops-ci)

&nbsp;


## ⚙️ Configuration initiale
Avant de commencer :

```bash
sudo apt update
sudo apt install docker.io git -y
sudo systemctl enable --now docker
git clone https://github.com/Anthony-Jhoiro/2025-devops-ci.git
cd 2025-devops-ci
```
Vérification :
```bash
docker --version
git --version
```

&nbsp;

## Partie 1 – configuration Docker
### 🐋 1. Création d'un fichier Dockerfile
#### Objectif :

Créer un Dockerfile pour l’application React / Vite, capable de :

- Installer les dépendances (`pnpm`)

- Lancer l’application en développement

- Tourner en non-root user

#### Contraintes :

- **Port exposé :** `3000`

- **Utilisateur non-root** pour exécuter l’application


- Le conteneur doit être exécutable avec une seule commande `docker run`

#### Dockerfile initial :

Fichier : `Dockerfile`
```dockerfile
# 1. Image de base Node.js
FROM node:20-alpine

# 2. Définir le répertoire de travail
WORKDIR /app

# 3. Installer pnpm globalement
RUN npm install -g pnpm

# 4. Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# 5. Installer les dépendances
RUN pnpm install --frozen-lockfile

# 6. Copier le code source
COPY . .

# 7. Créer un utilisateur non-root
RUN adduser -D appuser

# 8. Donner la propriété du dossier /app à appuser
RUN chown -R appuser:appuser /app

# 9. Switch à l'utilisateur non-root
USER appuser

# 10. Exposer le port
EXPOSE 3000

# 11. Commande pour démarrer l'application
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
```

#### Construction et exécution du conteneur :
```bash
# Construire l'image Docker
docker build -t devops-ci .

# Lancer le conteneur et mapper le port 3000
docker run -it -p 3000:3000 devops-ci
```

#### Résultat attendu :
Le conteneur démarre et affiche dans les logs :
```bash
> todo-app@ dev /app
> vite dev --port 3000 --host 0.0.0.0

VITE v7.1.12  ready in 3207 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```
- L’application est accessible sur le navigateur à http://localhost:3000
- Les fichiers sont exécutés par l’utilisat **non-root**

#### Remarques :

- Les erreurs `EACCES` étaient dues à des permissions insuffisantes dans `/app` → corrigé avec `chown -R appuser:appuser /app`.
- Le paramètre `--host 0.0.0.0` est nécessaire pour que Vite soit accessible depuis l’extérieur du conteneur.
- Cette version est pour **développement**. La version production sera optimisée avec un **multi-stage build** et un serveur léger (`nginx`) par la suite.

&nbsp;

### 🐋 2. Configuration Docker – Multi-Stage Build
#### Contexte :

L’application front-end (Vite / React) fonctionne désormais dans un conteneur Docker pour le développement (`devops-ci`).

Nous allons maintenant créer une image de production plus légère et sécurisée, en utilisant un multi-stage build.

#### Objectif :

Créer une **image Docker optimisée** pour la production :

- Réduire la taille de l’image finale

- Ne pas inclure les dépendances de développement

- Servir le build React/Vite via Nginx

- Ne pas tourner en root

#### Étape 1 – Création du Dockerfile de production :
À la racine du projet :
```bash
nano Dockerfile.prod
```

Fichier : `Dockerfile.prod`

```dockerfile
# =========================
# Étape 1 : Build de l’application
# =========================
FROM node:20-alpine AS builder

# Créer un utilisateur non-root
RUN adduser -D appuser

# Définir le répertoire de travail
WORKDIR /app

# Installer pnpm (en root)
RUN npm install -g pnpm

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances (sans cache)
RUN pnpm install --frozen-lockfile

# Copier tout le projet
COPY . .

# Construire le projet (Vite)
RUN pnpm run build


# =========================
# Étape 2 : Image de production (Nginx)
# =========================
FROM nginx:alpine

# Copier le build du frontend vers Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Lancer Nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Étape 2 – Construction de l’image :

```bash
docker build -t devops-ci-prod -f Dockerfile.prod .
```

Cette commande :

- Utilise le **Dockerfile.prod**

- Construit l’application dans une image temporaire `builder`

- Copie uniquement les fichiers du dossier `dist` dans l’image finale basée sur `nginx:alpine`

#### Étape 3 – Lancement du conteneur :

```bash
docker run -d -p 8080:80 devops-ci-prod
```

Vérification :

```bash
docker ps
```

Accéder à l’application :
👉 http://localhost:8080

#### Points importants :

- Stage 1 - builder
    
    - Contient tout le code source + dépendances

    - Compile le frontend Vite/React

    - Ne sera pas inclus dans l’image finale

- Stage 2 – production
    
    - Image légère basée sur `nginx:alpine` (~20 Mo)

    - Contient uniquement les fichiers compilés (`dist`)

    - Sert l’application avec Nginx

    - Aucun node_modules ni fichier source inclus

- Sécurité / non-root
    
    - Nginx dans l’image Alpine tourne déjà comme utilisateur non-root par défaut

    - Aucun utilisateur root n’exécute le serveur

- Résumé 
    | Étape          | Image utilisée   | Rôle                                   | Contenu final              |
    | -------------- | ---------------- | -------------------------------------- | -------------------------- |
    | 1️⃣ Builder    | `node:20-alpine` | Compilation du code source             | supprimé après build       |
    | 2️⃣ Production | `nginx:alpine`   | Sert uniquement les fichiers statiques | ✅ plus légère et sécurisée |

#### Avantages du multi-stage build :

- Image finale beaucoup plus **légère**

- Code source et dépendances de développement **non exposés**

- Plus **rapide à déployer**

- Compatible avec CI/CD et conteneurisation complète

&nbsp;
