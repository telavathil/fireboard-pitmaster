# AWS Monthly Cost Estimation (US East - N. Virginia)

To deploy the predictive cooking dashboard on AWS, the monthly costs will vary significantly depending on whether you require a **Production-Grade (High Availability)** setup or a **Budget-Optimized** setup.

---

## 1. Cost Comparison Summary

| AWS Service | Budget-Optimized Setup | Production-Grade (HA) Setup | Key Architectural Difference |
| :--- | :--- | :--- | :--- |
| **AWS ECS Fargate** | ~$18.00 / month | ~$55.00 / month | Single replicas vs. Multi-AZ redundant tasks |
| **Application Load Balancer** | ~$22.50 / month | ~$25.00 / month | Basic routing vs. higher traffic load |
| **Amazon RDS (PostgreSQL)** | ~$14.00 / month (`db.t4g.micro`) | ~$44.00 / month (Aurora Serverless v2, min 0.5 ACU) | Single-AZ DB vs. Serverless Auto-Scaling Multi-AZ |
| **Amazon ElastiCache (Redis)**| ~$12.00 / month (`cache.t4g.micro`) | ~$20.00 / month (Serverless or Multi-AZ) | Single node vs. managed replication & failover |
| **AWS NAT Gateway** | **$0.00** (Tasks in public subnets) | ~$32.40 / month (1 NAT Gateway) | Eliminating NAT Gateway reduces costs drastically |
| **Data Transfer & Storage** | ~$2.00 / month | ~$5.00 / month | Backups, CloudFront egress, logs |
| **Other (Secrets Mgr, Route53)**| ~$1.50 / month | ~$3.00 / month | Number of secrets and domain queries |
| **Estimated Total** | **~$70.00 / month** | **~$184.40 / month** | |

---

## 2. Detailed Breakdown by Service

### A. AWS ECS Fargate (Compute)
* **Budget Setup**:
  * Next.js: 1 task * 0.25 vCPU / 0.5 GB RAM = ~$4.00/mo
  * FastAPI API: 1 task * 0.25 vCPU / 0.5 GB RAM = ~$4.00/mo
  * Celery Worker (Math): 1 task * 0.5 vCPU / 1 GB RAM = ~$8.00/mo
  * Celery Beat (Poller): 1 task * 0.25 vCPU / 0.5 GB RAM = ~$4.00/mo
  * *Note: Subtracting AWS Free Tier if applicable, otherwise total is ~$20.00.*
* **Production Setup**:
  * 2x Next.js tasks (High Availability) = ~$8.00/mo
  * 2x FastAPI tasks = ~$8.00/mo
  * 2x Celery Workers (High CPU for simultaneous cooks) = ~$32.00/mo (0.5 vCPU / 1 GB RAM each)
  * 1x Celery Beat (Active-Passive or Single Task) = ~$4.00/mo
  * Total: ~$52.00/mo

### B. Database (RDS vs. Aurora Serverless)
* **Budget Setup**: Use standard RDS PostgreSQL on `db.t4g.micro` (2 vCPUs, 1GB RAM) with 20GB of GP3 storage. This costs ~$11.50/mo for compute + ~$2.30/mo for storage. Total: **~$14.00/mo**.
* **Production Setup**: Use Aurora Serverless v2 PostgreSQL. Minimum capacity is 0.5 ACUs. 0.5 ACU * $0.12/hr * 730 hours = ~$43.80/mo + storage. Total: **~$45.00 - $55.00/mo** depending on scale.

### C. Cache / Message Broker (ElastiCache Redis)
* **Budget Setup**: A single-node `cache.t4g.micro` Redis instance (0.5 GB RAM). Cost: **~$12.00/mo**.
* **Production Setup**: ElastiCache Serverless (minimum 0.5 GB-hours/hour) or a replicated `cache.t4g.small` Multi-AZ cluster. Cost: **~$20.00 - $30.00/mo**.

### D. The NAT Gateway Cost (Crucial Decision)
* **The Issue**: In standard AWS architecture, containers run in a private subnet and use a NAT Gateway to talk to the internet (e.g., calling the FireBoard Cloud API). A single NAT Gateway costs **~$32.40/mo** just to exist, even with zero traffic.
* **Budget Strategy**: Run the ECS Fargate containers in public subnets with public IPs. Use strict Security Groups so they reject all inbound traffic from the internet except traffic routed through the ALB. Outbound calls to the FireBoard API go directly via the VPC internet gateway for **$0**. *(Note: AWS now charges $0.005/hr per active public IPv4 address, which is ~$3.60/month per active container task).*

---

## 3. Recommended Approach for Launching
To minimize initial costs while keeping a clear path to production:
1. **Start with the Budget-Optimized Setup (~$70/mo)** using public subnets (without NAT Gateways) and `t4g` micro-instances for Redis/PostgreSQL.
2. **As usage scales**, you can seamlessly migrate to Aurora Serverless and scale up your ECS Fargate tasks using Terraform or CloudFormation without any downtime.

---

## 4. Micro-Budget Hosting Options (For Personal Projects, < $10/month)

Since this is a personal project, we can bypass AWS entirely or use free-tier integrations to get the monthly bill down to **$0 to $10/month**.

### Option A: The Single VPS "Docker-Compose" Route (Recommended: ~$5 - $6 / mo)
Instead of renting separate services (ECS, RDS, ElastiCache), you rent one small virtual machine and deploy your entire `docker-compose.yml` stack on it.
* **Hosting Providers**:
  * **Hetzner Cloud (CX22)**: 2 vCPUs, 4 GB RAM, 40 GB NVMe Disk = **~$5.00 / month** (Unbeatable performance-to-cost ratio).
  * **DigitalOcean / Linode**: 1 vCPU, 1 GB RAM, 25 GB SSD = **~$6.00 / month**.
  * **AWS Lightsail**: 1 vCPU, 1 GB RAM, 40 GB SSD = **~$5.00 / month** (first 3 months free).
* **Setup**: Run Next.js, FastAPI, PostgreSQL, and Redis in separate docker containers sharing the local host memory.
* **Pros**: Simple, completely self-contained, predictable billing, easily handled by a $5/mo VM.

### Option B: The "Serverless Hybrid" Route (~$0 - $2 / mo)
By choosing providers with robust free tiers, we can piece together a highly functional stack for almost nothing:
* **Frontend**: Host Next.js on **Vercel** (Hobby Tier) = **$0 / month**.
* **Database**: Host PostgreSQL on **Neon.tech** or **Supabase** (Free Tier) = **$0 / month**.
* **Redis Broker**: Host Redis on **Upstash Redis** (Serverless Free Tier, up to 10,000 commands/day) = **$0 / month**.
* **FastAPI Backend & Poller**: Host on **Render.com** (Free tier web service) or **Fly.io** (Free allowance) = **$0 - $5 / month**.
* **Pros**: Zero maintenance of servers, scaling is handled automatically.
* **Cons**: Render's free tier spins down after 15 minutes of inactivity (causing cold starts on the first request), and background cron jobs are trickier on serverless free tiers.
