# GitHub Actions Deployment Secrets Setup Guide

## Required Secrets

You need to configure the following secrets in your GitHub repository for automatic deployment.

### Steps to Add Secrets

1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret below

---

## SSH Deployment Secrets

### 1. DEPLOY_HOST
- **What**: IP address or domain of your production server
- **Example**: `192.168.1.100` or `deploy.example.com`
- **Where to get**: Your hosting provider (AWS, DigitalOcean, VPS provider)

### 2. DEPLOY_USER
- **What**: SSH username for the deployment user
- **Example**: `ubuntu` (for AWS EC2), `root` (for some VPS), `admin` (for some systems)
- **Where to get**: Your hosting provider documentation

### 3. DEPLOY_PORT
- **What**: SSH port (usually 22, sometimes changed for security)
- **Example**: `22`
- **Default**: 22
- **Where to get**: Your server's SSH configuration

### 4. DEPLOY_KEY
- **What**: Private SSH key for authentication (multi-line)
- **How to generate**:
  ```bash
  # On your local machine
  ssh-keygen -t ed25519 -f deploy_key -N ""
  
  # The private key is in file: deploy_key
  # The public key is in file: deploy_key.pub
  ```
- **How to set up**:
  ```bash
  # 1. Add public key to your server
  cat deploy_key.pub | ssh user@your-server.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
  
  # 2. Fix permissions
  ssh user@your-server.com "chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
  
  # 3. Copy the PRIVATE key content (deploy_key) to GitHub secret
  cat deploy_key  # Copy entire output to GitHub
  ```
- **Security**:
  - NEVER push `deploy_key` (private) to GitHub
  - Only add `deploy_key.pub` (public) to your server
  - Use ed25519 keys (more secure than RSA)
  - Keep private key secure locally

---

## Optional Secrets (for enhanced CI/CD)

### DOCKER_REGISTRY_PASSWORD (for custom registries)
- If using a private Docker registry instead of GitHub Container Registry
- Your registry password/token

### SLACK_WEBHOOK_URL (for notifications)
- Slack webhook for deployment notifications
- Get from: Slack → Admin → Apps → Custom Integrations

### SENTRY_DSN (for error tracking)
- Sentry project DSN for error monitoring
- Get from: Sentry → Project Settings → Client Keys (DSN)

---

## Local Testing Secrets

Before pushing to GitHub, test your SSH key locally:

```bash
# Test SSH connection
ssh -i deploy_key -p 22 ubuntu@your-server.com "docker -v"

# Should output Docker version if successful
# If it fails, check:
# 1. SSH username is correct
# 2. Server IP/domain is correct
# 3. Port is open (not blocked by firewall)
# 4. Public key is in ~/.ssh/authorized_keys
```

---

## Production Server Setup

On your production server, ensure:

1. **Docker is installed and running**
   ```bash
   sudo systemctl status docker
   ```

2. **Deploy user exists** (or use root)
   ```bash
   sudo useradd -m -s /bin/bash deployer
   ```

3. **SSH key-based auth is enabled** (in /etc/ssh/sshd_config)
   ```bash
   PubkeyAuthentication yes
   PasswordAuthentication no  # For security
   ```

4. **/opt/app directory is writable** by deploy user
   ```bash
   sudo mkdir -p /opt/app
   sudo chown deployer:deployer /opt/app
   ```

---

## Deployment Flow

Once secrets are configured, the workflow:

```
1. You push code to main/Backend branch
2. GitHub Actions triggers
3. Builds Docker image
4. Pushes to GitHub Container Registry (GHCR)
5. Runs health checks on image
6. SSH into your server using DEPLOY_KEY
7. Pulls latest image from GHCR
8. Runs docker-compose up -d (with auto-restart)
9. Applies database migrations
10. Verifies health checks
```

---

## Troubleshooting

### "Permission denied (publickey)" error
- Public key not in server's ~/.ssh/authorized_keys
- SSH user doesn't have ~/.ssh directory
- File permissions wrong (should be 600 for keys, 700 for .ssh)

### "Connection refused" error
- Server is not reachable
- Wrong IP/domain
- Port is blocked by firewall
- SSH service not running on server

### "Deploy fails but SSH works"
- Docker not installed on server
- /opt/app directory not writable
- .env.production file missing
- GitHub Container Registry login failed

### Check workflow logs
- Go to GitHub repo → Actions tab
- Click the failed workflow
- Scroll to see detailed error messages
- Check "Deploy to production" step for SSH errors

---

## Security Best Practices

1. **Use SSH keys with strong passphrases** (if using locally)
2. **Rotate deploy keys periodically**
3. **Use a dedicated deploy user** (not root)
4. **Restrict SSH access by IP** (if possible with your hosting)
5. **Enable firewall rules** (SSH 22, HTTP 80, HTTPS 443 only)
6. **Never commit .env files** or private keys to Git
7. **Use strong database passwords** in .env.production
8. **Enable 2FA on GitHub account**

---

## Testing the Deployment

After setting up secrets:

1. Make a test commit
2. Push to main/Backend branch
3. Watch GitHub Actions → Backend CD workflow
4. Check deployment in real-time
5. Verify via: `ssh user@server curl http://localhost:4000/health/live`

---

## Support

For common issues, check:
- GitHub Actions logs (most detailed)
- Server logs: `docker-compose -f docker-compose.prod.yml logs -f`
- SSH connection locally first
