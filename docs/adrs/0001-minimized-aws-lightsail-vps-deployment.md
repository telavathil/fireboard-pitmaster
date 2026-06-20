# 1. Minimized AWS Deployment via Single AWS Lightsail VPS

## Status

Accepted

## Context

Deploying a multi-service containerized application (Next.js, FastAPI, Celery, Redis, PostgreSQL) on standard AWS enterprise architecture (ECS Fargate, RDS PostgreSQL, ElastiCache Redis, NAT Gateways, and ALBs) incurs high monthly costs (estimating ~$180/mo). For a single-user personal project, this is not cost-effective. We need an infrastructure setup within the AWS ecosystem that minimizes costs to under $10/month while remaining compatible with standard containerized local development.

## Decision

We will deploy the entire application stack using Multi-Container Docker Compose on a single **AWS Lightsail VPS** (1 vCPU, 1 GB or 2 GB RAM). 
* All application components (FastAPI, Next.js, Celery Worker, Celery Beat, Redis) will run as containerized services on the same virtual machine.
* To prevent Out-Of-Memory (OOM) faults on a 1 GB/2 GB instance, strict Docker memory limits will be applied to each service.

## Consequences

* **Pros**:
  * Reduces monthly AWS infrastructure costs to a flat **$5.00/mo** (1GB RAM) or **$10.00/mo** (2GB RAM).
  * Keeps the entire deployment pipeline simple: git clone and run `docker-compose up -d`.
  * The production environment matches local development perfectly.
* **Cons**:
  * Single point of failure (no automatic Multi-AZ scaling).
  * Resource contention if mathematical model tasks spike CPU usage (handled by limiting worker concurrency to 1).
  * Outbound internet access runs via a public IP, requiring strict security group constraints on open ports to prevent direct database or Redis exposure.
