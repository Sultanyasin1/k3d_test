# 🚀 Komplett guide: Starta din Kubernetes-miljö efter omstart

Den här guiden förutsätter att du har följande installerat lokalt:

- **k3d** (för att hantera ditt Kubernetes-kluster)
- **kubectl** (för att interagera med klustret)
- **argocd** CLI (valfritt, underlättar synkronisering)

Alla projektfiler antas ligga i `~/projects/work/github/argo1/k3d_test`.

---

## 1. Starta ditt k3d-kluster
## 2. Bekräfta att alla noder är redo, man ska se tre noder med status READY:
## 3. Återskapa hemligheter (secrets)
## 4. Vänta på att ArgoCD är redo && Öppna ArgoCD:s webbgränssnitt
## 5. Synkronisera applikation-resurs i ArgoCD.
## 6. Nå din Next.js-applikation

```bash
k3d cluster start pds-deployment-cluster

#optional:
 kubectl get nodes

# Image pull secret för att hämta från GHCR
kubectl apply -f ghcr-secret.yaml -n pds

# Opaque-secret med miljövariabler (om du använder den)
kubectl apply -f secret.yaml -n pds   # eller app-secret.yaml

##optional: make sure argocd up&running then : 
kubectl get pods -n argocd

# 4.port-forwarding: och sen logga in i localhost:8080
kubectl -n argocd port-forward svc/argocd-server 8080:443 

#5. #optional: Synkronisera din applikation
kubectl get application -n argocd

#6. nå nextjs : Port-forward (snabbast) 

kubectl port-forward -n pds service/fe-service 3000:80	http://localhost:3000