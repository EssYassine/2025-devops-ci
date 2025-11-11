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

### 🐋 2. Configuration de Docker Compose
