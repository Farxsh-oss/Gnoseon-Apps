#!/bin/bash

# Deployment script for Gnōseōn application
# Usage: ./scripts/deploy.sh [environment] [options]

set -e

# Default values
ENVIRONMENT=${1:-staging}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_BUILD=${SKIP_BUILD:-false}
FORCE_DEPLOY=${FORCE_DEPLOY:-false}
BACKUP_BEFORE_DEPLOY=${BACKUP_BEFORE_DEPLOY:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        error "package.json not found. Please run this script from the project root."
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        error "Environment file .env.$ENVIRONMENT not found."
    fi
    
    success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log "Loading environment variables for $ENVIRONMENT..."
    
    # Copy environment file
    cp ".env.$ENVIRONMENT" .env
    
    # Load variables
    export $(grep -v '^#' .env | xargs)
    
    success "Environment variables loaded"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        warning "Skipping tests as requested"
        return
    fi
    
    log "Running tests..."
    
    # Run linting
    npm run lint || error "Linting failed"
    
    # Run type checking
    npm run type-check || error "Type checking failed"
    
    # Run unit tests
    npm run test:ci || error "Unit tests failed"
    
    success "All tests passed"
}

# Build application
build_application() {
    if [ "$SKIP_BUILD" = "true" ]; then
        warning "Skipping build as requested"
        return
    fi
    
    log "Building application..."
    
    # Clean previous build
    rm -rf dist/
    
    # Build application
    npm run build || error "Build failed"
    
    success "Application built successfully"
}

# Create backup
create_backup() {
    if [ "$BACKUP_BEFORE_DEPLOY" = "false" ]; then
        warning "Skipping backup as requested"
        return
    fi
    
    log "Creating backup..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup current deployment if it exists
    if docker-compose ps | grep -q "gnoseon-frontend.*Up"; then
        log "Backing up current deployment..."
        
        # Backup database
        docker-compose exec postgres pg_dump -U gnoseon gnoseon > "$BACKUP_DIR/database.sql"
        
        # Backup application files
        cp -r dist/ "$BACKUP_DIR/" 2>/dev/null || true
        
        # Backup configuration
        cp .env "$BACKUP_DIR/"
        cp docker-compose.yml "$BACKUP_DIR/"
        
        success "Backup created at $BACKUP_DIR"
    else
        warning "No running deployment found, skipping backup"
    fi
}

# Deploy application
deploy_application() {
    log "Deploying application to $ENVIRONMENT..."
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose down || true
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose pull
    
    # Build new images
    log "Building new images..."
    docker-compose build
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if ! check_health; then
        error "Services are not healthy. Rolling back..."
        rollback
    fi
    
    success "Application deployed successfully"
}

# Check service health
check_health() {
    log "Checking service health..."
    
    # Check frontend
    if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
        error "Frontend health check failed"
    fi
    
    # Check backend if it exists
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log "Backend health check passed"
    fi
    
    # Check database
    if docker-compose exec postgres pg_isready -U gnoseon > /dev/null 2>&1; then
        log "Database health check passed"
    else
        error "Database health check failed"
    fi
    
    success "All services are healthy"
    return 0
}

# Rollback deployment
rollback() {
    log "Rolling back deployment..."
    
    # Get the latest backup
    LATEST_BACKUP=$(ls -t backups/ | head -n 1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error "No backup found for rollback"
    fi
    
    log "Rolling back to backup: $LATEST_BACKUP"
    
    # Restore database
    if [ -f "backups/$LATEST_BACKUP/database.sql" ]; then
        docker-compose exec -T postgres psql -U gnoseon gnoseon < "backups/$LATEST_BACKUP/database.sql"
    fi
    
    # Restore application files
    if [ -d "backups/$LATEST_BACKUP/dist" ]; then
        cp -r "backups/$LATEST_BACKUP/dist" .
    fi
    
    # Restart services
    docker-compose restart
    
    success "Rollback completed"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Send notification
send_notification() {
    local status=$1
    local message="Deployment to $ENVIRONMENT $status"
    
    log "Sending notification: $message"
    
    # Send to Slack if webhook is configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" || warning "Failed to send Slack notification"
    fi
    
    # Send email if configured (you would need to implement this)
    # send_email "$message"
}

# Main deployment flow
main() {
    log "Starting deployment to $ENVIRONMENT environment..."
    
    # Check if force deploy is enabled
    if [ "$FORCE_DEPLOY" = "false" ]; then
        # Check if there are uncommitted changes
        if [ -n "$(git status --porcelain)" ]; then
            error "There are uncommitted changes. Please commit or stash them first."
        fi
        
        # Check if we're on the right branch
        if [ "$ENVIRONMENT" = "production" ] && [ "$(git branch --show-current)" != "main" ]; then
            error "Production deployment can only be done from main branch."
        fi
        
        if [ "$ENVIRONMENT" = "staging" ] && [ "$(git branch --show-current)" != "develop" ]; then
            error "Staging deployment can only be done from develop branch."
        fi
    fi
    
    # Run deployment steps
    check_prerequisites
    load_environment
    run_tests
    build_application
    create_backup
    deploy_application
    cleanup
    
    # Send success notification
    send_notification "completed successfully"
    
    success "Deployment to $ENVIRONMENT completed successfully!"
}

# Handle script interruption
trap 'error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
