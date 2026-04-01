# CI/CD Pipeline Guide

This project now includes dedicated GitHub Actions workflows for backend CI and CD.

## Workflow Files

- `.github/workflows/backend-ci.yml`
- `.github/workflows/backend-cd.yml`

## CI: Backend CI

Triggers:

- Pull requests touching `backend/**`
- Pushes to `main` or `Backend` touching `backend/**`

What CI does:

1. Checks out repository
2. Sets up Node.js 22 with npm cache
3. Installs dependencies in `backend/`
4. Generates Prisma client (`npm run prisma:generate`)
5. Runs unit tests (`npm run test:unit`)

CI environment uses safe test defaults for required env vars (`JWT_*`, `DATABASE_URL`, etc.) so schema parsing passes without real secrets.

## CD: Backend CD

Triggers:

- Pushes to `main` or `Backend` touching `backend/**`
- Manual run (`workflow_dispatch`)

What CD does:

1. Checks out repository
2. Logs in to GHCR (`ghcr.io`) using `GITHUB_TOKEN`
3. Builds Docker image from `backend/Dockerfile`
4. Pushes image tags to GHCR:

- `sha-<commit>`
- `latest` (for `main`)
- `backend` (for `Backend` branch)

## Docker Image

Build context: `backend/`

Runtime command:

```bash
node src/server.js
```

Exposed port: `4000`

## Required Repository Settings

1. Ensure GitHub Packages is enabled for repository/organization.
2. Ensure Actions permissions allow `packages: write`.
3. If branch protection is enabled, add `Backend CI` as required status check.

## Optional Production Deployment Stage

Current CD publishes container image. If you want auto-deploy to a server or cloud runtime, add a second job after image publish that pulls the image and deploys to your target (Azure, AWS, GCP, or VM).
