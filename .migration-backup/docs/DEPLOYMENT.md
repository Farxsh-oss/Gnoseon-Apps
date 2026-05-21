# Deployment Guide

This guide covers how to deploy the Gnōseōn application to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the Gnōseōn application, ensure you have the following:

- Node.js 18+ installed
- Docker and Docker Compose installed
- Git installed
- Access to the target server/environment
- Appropriate permissions for deployment

## Environment Setup

### Environment Variables

Create environment files for each deployment environment:

```bash
# Development
cp .env.example .env.development

# Staging
cp .env.example .env.staging

# Production
cp .env.example .env.production
```

Edit each environment file with appropriate values:

```bash
# Core application settings
NODE_ENV=production
VITE_APP_NAME=Gnōseōn
VITE_APP_VERSION=1.0.0

# Database configuration
VITE_DB_NAME=gnoseon.db
VITE_DB_PATH=./data

# Security settings
VITE_ENCRYPTION_ENABLED=true
VITE_MAX_FILE_SIZE=10485760

# Analytics and monitoring
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com/api
VITE_ERROR_REPORTING_ENDPOINT=https://errors.example.com/api

# Feature flags
VITE_ENABLE_GROUP_CHATS=true
VITE_ENABLE_FILE_SHARING=true
VITE_ENABLE_VOICE_MESSAGES=false
```

### SSL Certificates

For production deployment, obtain SSL certificates:

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# For production, use Let's Encrypt or purchase certificates
```

## Local Development

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Docker Deployment

### Single Container

```bash
# Build Docker image
docker build -t gnoseon-app .

# Run container
docker run -d \
  --name gnoseon-app \
  -p 3000:80 \
  --env-file .env.production \
  gnoseon-app
```

### Multi-Container with Docker Compose

```bash
# Deploy all services
docker-compose -f docker-compose.yml up -d

# Scale services
docker-compose up -d --scale gnoseon-frontend=3

# Update services
docker-compose pull
docker-compose up -d
```

### Production Docker Compose

Create a production-specific compose file:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  gnoseon-frontend:
    image: ghcr.io/your-org/gnoseon:latest
    restart: always
    environment:
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gnoseon.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.gnoseon.tls=true"

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
```

## Production Deployment

### Manual Deployment

1. **Prepare the server:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Deploy the application:**
   ```bash
   # Clone repository
   git clone https://github.com/your-org/gnoseon.git
   cd gnoseon
   
   # Set up environment
   cp .env.production .env
   
   # Deploy
   ./scripts/deploy.sh production
   ```

### Automated Deployment

Use the deployment script:

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production (with confirmation)
./scripts/deploy.sh production

# Skip tests and build
./scripts/deploy.sh staging --skip-tests --skip-build

# Force deploy (ignore uncommitted changes)
./scripts/deploy.sh production --force
```

### Deployment Options

| Option | Description |
|--------|-------------|
| `--skip-tests` | Skip running tests before deployment |
| `--skip-build` | Skip building the application |
| `--force` | Deploy even with uncommitted changes |
| `--no-backup` | Skip creating backup before deployment |

## CI/CD Pipeline

### GitHub Actions

The application includes a comprehensive CI/CD pipeline (`.github/workflows/ci-cd.yml`) that:

1. **Tests:** Runs unit tests, integration tests, and linting
2. **Builds:** Creates production build
3. **Scans:** Performs security audits
4. **Containers:** Builds and pushes Docker images
5. **Deploys:** Automatically deploys to staging/production
6. **Monitors:** Runs performance tests

### Pipeline Triggers

- **Push to `develop`:** Runs tests, builds, deploys to staging
- **Push to `main`:** Runs full pipeline, creates release
- **Pull Request:** Runs tests and security scans
- **Release:** Deploys to production

### Environment Setup

1. **GitHub Secrets:**
   ```yaml
   GITHUB_TOKEN: # Auto-provided
   DOCKER_REGISTRY_TOKEN: # For container registry
   SLACK_WEBHOOK: # For notifications
   LHCI_GITHUB_APP_TOKEN: # For Lighthouse CI
   SNYK_TOKEN: # For security scanning
   ```

2. **Environment Protection:**
   - Production deployment requires approval
   - Staging deployment auto-deploys from develop
   - Tests must pass before deployment

### Local Testing

```bash
# Test GitHub Actions locally
act -j test

# Test deployment locally
act -j deploy-staging
```

## Monitoring

### Health Checks

The application includes health checks:

```bash
# Application health
curl http://localhost:3000/health

# Database health
docker-compose exec postgres pg_isready -U gnoseon

# Service status
docker-compose ps
```

### Metrics and Logging

1. **Prometheus Metrics:**
   - Application metrics at `http://localhost:9090`
   - Custom metrics for performance, errors, usage

2. **Grafana Dashboard:**
   - Pre-configured dashboards at `http://localhost:3001`
   - Default credentials: admin/admin

3. **Log Aggregation:**
   - Application logs in `logs/` directory
   - Nginx logs for HTTP requests
   - Database logs for SQL queries

### Performance Monitoring

```bash
# Run Lighthouse CI
npm run lighthouse

# Check performance metrics
curl http://localhost:9090/api/v1/query?query=gnoseon_request_duration

# View error rates
curl http://localhost:9090/api/v1/query?query=gnoseon_error_rate
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear build cache
npm run clean
rm -rf node_modules
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### 2. Docker Issues
```bash
# Check Docker status
sudo systemctl status docker

# Reset Docker
docker system prune -a
docker volume prune
```

#### 3. Database Issues
```bash
# Check database connection
docker-compose exec postgres psql -U gnoseon -d gnoseon

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### 4. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Generate new certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

#### 5. Performance Issues
```bash
# Check resource usage
docker stats

# Analyze bundle size
npm run build:analyze

# Profile memory
node --inspect dist/main.js
```

### Debug Mode

Enable debug logging:

```bash
# Set debug mode
export DEBUG=true
export LOG_LEVEL=debug

# Run with debug
npm run dev
```

### Rollback

If deployment fails, rollback automatically:

```bash
# Manual rollback
./scripts/deploy.sh --rollback

# Or use backup
docker-compose down
cp backups/latest/dist .
docker-compose up -d
```

### Support

For additional support:

1. Check the [FAQ](FAQ.md)
2. Review [GitHub Issues](https://github.com/your-org/gnoseon/issues)
3. Contact the development team
4. Check monitoring dashboards

## Security Considerations

### Production Security

1. **Environment Variables:**
   - Never commit sensitive data to version control
   - Use environment-specific configuration files
   - Rotate secrets regularly

2. **Network Security:**
   - Use HTTPS in production
   - Configure firewall rules
   - Enable rate limiting

3. **Container Security:**
   - Use non-root users in containers
   - Scan images for vulnerabilities
   - Update base images regularly

4. **Database Security:**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups

### Security Headers

The application includes security headers:

```nginx
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'..." always;
```

### Monitoring Security

Regularly monitor:

- Error rates and patterns
- Unusual traffic patterns
- Failed authentication attempts
- Resource usage anomalies

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Update dependencies
   - Check security advisories
   - Review logs for issues

2. **Monthly:**
   - Update base Docker images
   - Rotate secrets
   - Performance optimization

3. **Quarterly:**
   - Security audit
   - Performance review
   - Capacity planning

### Backup Strategy

1. **Database:**
   - Daily automated backups
   - Weekly full backups
   - Store backups off-site

2. **Application:**
   - Version control for code
   - Configuration backups
   - Asset backups

### Scaling

When scaling the application:

1. **Horizontal Scaling:**
   ```bash
   # Scale frontend
   docker-compose up -d --scale gnoseon-frontend=3
   
   # Add load balancer
   docker-compose up -d nginx
   ```

2. **Vertical Scaling:**
   - Increase container resources
   - Optimize database performance
   - Add caching layers

---

For more information, see the [API Documentation](API.md) or contact the development team.
