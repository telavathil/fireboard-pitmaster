.PHONY: help test up down logs clean shell fast-forward

# Default target when running just 'make'
help:
	@echo "FireBoard Pitmaster Makefile Commands:"
	@echo "  make test          Build the backend image and run the pytest suite inside Docker"
	@echo "  make up            Build and start all services (FastAPI, Redis, Stoker, Pit Boss) in foreground"
	@echo "  make up-d          Build and start all services in detached background mode"
	@echo "  make down          Stop all running docker-compose containers"
	@echo "  make logs          Follow output logs for all running services"
	@echo "  make clean         Remove temporary test database files and cache"
	@echo "  make shell         Open an interactive bash shell in the backend container"
	@echo "  make fast-forward  Drive a real simulated cook to completion at accelerated speed,"
	@echo "                     to validate the dashboard UX against genuine telemetry."
	@echo "                     Pass args via ARGS, e.g.: make fast-forward ARGS=\"--target-c 95 --meat pork\""

# Run tests inside Docker
test:
	docker build -t pitmaster-backend ./backend && docker run --rm pitmaster-backend pytest

# Start docker-compose in foreground
up:
	docker-compose up --build

# Start docker-compose in background
up-d:
	docker-compose up --build -d

# Stop docker-compose
down:
	docker-compose down

# Follow logs
logs:
	docker-compose logs -f

# Clean temporary test files and databases
clean:
	rm -f backend/test_*.db test_*.db docs/research/local.db
	docker-compose down -v

# Interactive shell for debugging inside the backend
shell:
	docker build -t pitmaster-backend ./backend && docker run -it --rm pitmaster-backend /bin/bash

# Drive a real simulated cook to completion at accelerated speed
fast-forward:
	backend/scripts/fast_forward_cook.sh $(ARGS)
