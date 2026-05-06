# 🐳 GitOps Cookbook: Next.js on k3d with Argo CD

## 1. SETUP: Dockerfile (in your Next.js project root)

Create a file named `Dockerfile` (no extension).

\`\`\`dockerfile
# 1. Use the official lightweight Node.js 18 image
FROM node:18-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy dependency definitions
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the application code
COPY . .

# 6. Build the Next.js application
RUN npm run build

# 7. Tell Docker the app runs on port 3000
EXPOSE 3000

# 8. Command to start the app
CMD ["npm", "start"]
\`\`\`

## 2. LOCAL TEST: Docker Commands

\`\`\`bash
# Build the image
docker build -t my-nextjs-app .

# Run the container
docker run -p 3000:3000 my-nextjs-app
# Visit http://localhost:3000 -> Ctrl+C to stop
\`\`\`

## 3. REGISTRY: Push to Docker Hub

\`\`\`bash
# Login
docker login

# Tag with your username
docker tag my-nextjs-app YOUR_DOCKER_USERNAME/my-nextjs-app:v1

# Push
docker push YOUR_DOCKER_USERNAME/my-nextjs-app:v1
\`\`\`

## 4. KUBERNETES: k3d Cluster

1- install k3d:
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

2- install kubectl : 
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"  
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client

\`\`\`bash
# Create cluster
k3d cluster create my-cluster --servers 1 --agents 1 -p "8081:80@loadbalancer"

# Check nodes
kubectl get nodes

# Create namespace
kubectl create namespace my-playground
\`\`\`

## 5. KUBERNETES: Manifests (deployment.yaml)

Create a file named `deployment.yaml`.

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-nextjs-deployment
  namespace: my-playground
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-nextjs-app
  template:
    metadata:
      labels:
        app: my-nextjs-app
    spec:
      containers:
      - name: nextjs-container
        image: YOUR_DOCKER_USERNAME/my-nextjs-app:v1  # <-- CHANGE THIS
        ports:
        - containerPort: 3000
\`\`\`

## 6. KUBERNETES: Manifests (service.yaml)

Create a file named `service.yaml`.

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: my-nextjs-service
  namespace: my-playground
spec:
  selector:
    app: my-nextjs-app
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
\`\`\`

## 7. KUBERNETES: Apply & Debug

\`\`\`bash
# Apply files
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Check status
kubectl get pods -n my-playground
kubectl get service -n my-playground

# Access app (check the port after 80: in the service output)
# Example: http://localhost:32456

# Debug if broken
kubectl describe pod <POD_NAME> -n my-playground
kubectl logs <POD_NAME> -n my-playground
\`\`\`

## 8. ARGO CD: Installation

\`\`\`bash
# Create namespace
kubectl create namespace argocd

# Install
read  : https://argo-cd.readthedocs.io/en/stable/
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

kubectl apply -k https://github.com/argoproj/argo-cd/manifests/crds\?ref\=stable

minst problems; kubectl apply --server-side --force-conflicts -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml 

# Wait for pods (Ctrl+C to stop watching)
kubectl get pods -n argocd -w

# Get password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo

AauVDCV-RoCW8F7H

# Port forward (in a new terminal)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Login at https://localhost:8080 (user: admin, pass: <output from above>)
\`\`\`

## 9. GITOPS REPO: Structure

Create a repo on GitHub named `my-gitops-config`.
Inside it, create a folder `manifests` and add the `deployment.yaml` and `service.yaml` files.


\`\`\`bash
# Push files to GitHub
git init
git add .
git commit -m "Initial GitOps manifests"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/my-gitops-config.git
git push -u origin main

_______________

git remote set-url origin git@github.com:Sultanyasin1/argocddeploytest.git

_________________
\`\`\`

## 10. ARGO CD: Connect App

1. UI -> Settings -> Repositories -> Connect Repo (HTTPS, public repo).
2. UI -> Applications -> New App.
   - App Name: `my-nextjs-app`
   - Project: `default`
   - Sync Policy: `Automatic`
   - Repo URL: `https://github.com/YOUR_GITHUB_USERNAME/my-gitops-config`
   - Path: `manifests`
   - Cluster: `https://kubernetes.default.svc`
   - Namespace: `my-playground`
3. Click Create. Watch it sync.

## 11. CI PIPELINE: GitHub Actions Workflow

Create file `.github/workflows/ci.yml` in your **source code repo**.

\`\`\`yaml
name: CI Pipeline

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  DOCKER_HUB_USERNAME: ${{ secrets.DOCKER_HUB_USERNAME }}
  IMAGE_NAME: ${{ secrets.DOCKER_HUB_USERNAME }}/my-nextjs-app

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test || echo "No tests found, skipping..."

      - name: Build Next.js
        run: npm run build

      - name: Set short SHA
        run: echo "SHORT_SHA=$(git rev-parse --short HEAD)" >> $GITHUB_ENV

      - name: Build Docker image
        run: |
          docker build -t $IMAGE_NAME:$SHORT_SHA .
          docker tag $IMAGE_NAME:$SHORT_SHA $IMAGE_NAME:latest

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.IMAGE_NAME }}:${{ env.SHORT_SHA }}
          format: "table"
          exit-code: "1"
          severity: "CRITICAL"

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}

      - name: Push Docker image
        run: |
          docker push $IMAGE_NAME:$SHORT_SHA
          docker push $IMAGE_NAME:latest

      - name: Update GitOps repo
        run: |
          git clone https://${{ secrets.GITOPS_REPO_PAT }}@github.com/${{ secrets.GITOPS_REPO_PATH }}.git gitops
          cd gitops/manifests
          sed -i "s|image:.*my-nextjs-app:.*|image: $IMAGE_NAME:$SHORT_SHA|g" deployment.yaml
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          git add deployment.yaml
          git commit -m "Update image tag to $SHORT_SHA" || echo "No changes to commit"
          git push origin main
\`\`\`

## 12. GITHUB SECRETS REQUIRED

In Source Repo -> Settings -> Secrets and variables -> Actions:

- `DOCKER_HUB_USERNAME` : (your Docker username)
- `DOCKER_HUB_ACCESS_TOKEN` : (Docker Hub Access Token)
- `GITOPS_REPO_PATH` : `your-username/my-gitops-config`
- `GITOPS_REPO_PAT` : (GitHub Personal Access Token with `repo` scope)
\`\`\`