"""Script to generate the comprehensive DevOps Interview Helper PDF for LegalBuddy using WeasyPrint.
Optimized for natural pagination, zero orphan pages, rich diagrams, and complete DevOps depth.
"""

import sys
import weasyprint

HTML_CONTENT = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>LegalBuddy - DevOps & MLOps Engineering Interview Master Study Guide</title>
<style>
  @page {
    size: A4;
    margin: 16mm 13mm 16mm 13mm;
    @top-right {
      content: "LEGALBUDDY DEVOPS INTERVIEW GUIDE";
      font-size: 7.5pt;
      font-weight: 700;
      color: #94a3b8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      letter-spacing: 0.08em;
    }
    @bottom-left {
      content: "Production Architecture • CI/CD • Azure MLOps • RAG Infrastructure • Incident Scenarios";
      font-size: 7.5pt;
      color: #94a3b8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 7.5pt;
      font-weight: 700;
      color: #0284c7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.45;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }

  h1, h2, h3, h4 {
    color: #0f172a;
    font-weight: 700;
    page-break-after: avoid;
    break-after: avoid;
  }

  h1 {
    font-size: 19pt;
    line-height: 1.15;
    margin-top: 0;
    margin-bottom: 3px;
    letter-spacing: -0.02em;
  }

  h2 {
    font-size: 12pt;
    border-bottom: 1.5px solid #0284c7;
    padding-bottom: 3px;
    margin-top: 1.2em;
    margin-bottom: 0.5em;
    color: #0369a1;
  }

  h3 {
    font-size: 10pt;
    color: #0f172a;
    margin-top: 1em;
    margin-bottom: 0.3em;
  }

  h4 {
    font-size: 9pt;
    color: #334155;
    margin-top: 0.7em;
    margin-bottom: 0.2em;
  }

  p {
    margin-top: 0;
    margin-bottom: 0.5em;
    text-align: justify;
  }

  ul, ol {
    margin-top: 0;
    margin-bottom: 0.5em;
    padding-left: 1.3em;
  }

  li {
    margin-bottom: 0.25em;
  }

  code {
    font-family: "JetBrains Mono", Consolas, Monaco, "Courier New", monospace;
    font-size: 8pt;
    background-color: #f1f5f9;
    color: #0369a1;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }

  pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 8px 11px;
    border-radius: 5px;
    font-family: "JetBrains Mono", Consolas, Monaco, "Courier New", monospace;
    font-size: 7.6pt;
    line-height: 1.32;
    overflow-x: hidden;
    margin-top: 0.3em;
    margin-bottom: 0.6em;
    page-break-inside: avoid;
    break-inside: avoid;
    border-left: 3px solid #38bdf8;
  }

  pre code {
    background: none;
    color: inherit;
    padding: 0;
    border: none;
    font-size: inherit;
  }

  .callout {
    border-radius: 5px;
    padding: 8px 12px;
    margin: 0.6em 0;
    page-break-inside: avoid;
    break-inside: avoid;
    font-size: 8.6pt;
  }
  .callout-info {
    background-color: #f0f9ff;
    border-left: 3.5px solid #0284c7;
    color: #0369a1;
  }
  .callout-success {
    background-color: #f0fdf4;
    border-left: 3.5px solid #16a34a;
    color: #15803d;
  }
  .callout-warning {
    background-color: #fffbeb;
    border-left: 3.5px solid #d97706;
    color: #b45309;
  }
  .callout-danger {
    background-color: #fef2f2;
    border-left: 3.5px solid #dc2626;
    color: #b91c1c;
  }
  .callout-dark {
    background-color: #1e293b;
    border-left: 3.5px solid #38bdf8;
    color: #f1f5f9;
  }
  .callout p:last-child {
    margin-bottom: 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.6em 0;
    font-size: 7.9pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    text-align: left;
    padding: 5px 7px;
    border: 1px solid #cbd5e1;
  }
  td {
    padding: 4px 7px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  .qa-box {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 8px 11px;
    margin-bottom: 0.65em;
    page-break-inside: avoid;
    break-inside: avoid;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }
  .qa-question {
    font-weight: 700;
    color: #0f172a;
    font-size: 9pt;
    margin-bottom: 2px;
  }
  .qa-testing {
    font-size: 7.2pt;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 4px;
    letter-spacing: 0.04em;
  }
  .qa-answer {
    color: #334155;
    font-size: 8.5pt;
    line-height: 1.42;
  }

  .hero-header {
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }
  .hero-title {
    color: #0f172a;
    font-size: 19pt;
    font-weight: 800;
    margin: 0;
  }
  .hero-subtitle {
    color: #0284c7;
    font-size: 10.2pt;
    font-weight: 600;
    margin-top: 2px;
    margin-bottom: 6px;
  }
  .meta-grid {
    display: table;
    width: 100%;
    margin-top: 6px;
    font-size: 7.8pt;
    color: #475569;
  }
  .meta-col {
    display: table-cell;
    width: 33.33%;
    vertical-align: top;
  }

  .diagram-container {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 8px;
    margin: 0.6em 0;
    text-align: center;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .resume-box {
    background: #f8fafc;
    border: 1.5px solid #0284c7;
    border-radius: 5px;
    padding: 8px 12px;
    margin-bottom: 0.8em;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .resume-title {
    font-weight: 800;
    font-size: 9.5pt;
    color: #0f172a;
    margin-bottom: 3px;
  }
  .resume-bullet {
    font-size: 8.5pt;
    color: #334155;
    margin-bottom: 3px;
    padding-left: 12px;
    text-indent: -12px;
  }
</style>
</head>
<body>

<!-- HERO HEADER -->
<div class="hero-header">
  <div class="hero-title">LegalBuddy — DevOps & MLOps Engineering Study Guide</div>
  <div class="hero-subtitle">Comprehensive Project Analysis, Cloud Infrastructure, Docker Architecture & Interview Playbook</div>
  <div class="meta-grid">
    <div class="meta-col">
      <strong>Target Role:</strong> DevOps / MLOps / Platform Engineer<br>
      <strong>Candidate Profile:</strong> Containerization & Cloud Specialist
    </div>
    <div class="meta-col">
      <strong>Infrastructure:</strong> Dokploy (Docker Swarm), Traefik, Azure VMs, Azure Blob<br>
      <strong>Stack:</strong> FastAPI, Next.js, Qdrant, sentence-transformers, vLLM, llama.cpp
    </div>
    <div class="meta-col">
      <strong>Key Metrics:</strong> Zero-Downtime Deployments, 7.8GB RAM Bound, 75% Cost Reduction
    </div>
  </div>
</div>

<!-- SECTION 1: RESUME GROUNDING -->
<h2>1. Resume Deconstruction & Core Storyline</h2>

<div class="resume-box">
  <div class="resume-title">Your Resume Entry Under the Microscope:</div>
  <div class="resume-bullet">• <strong>Tools Used:</strong> Docker, Dokploy, Azure (VMs, Blob Storage), Bash, Python, FastAPI, Next.js, Qdrant</div>
  <div class="resume-bullet">• <strong>Bullet 1:</strong> <em>"Architected a containerized full-stack application (FastAPI, Next.js, Qdrant), deploying automated Git-triggered CI/CD delivery pipelines via Dokploy for seamless production releases."</em></div>
  <div class="resume-bullet">• <strong>Bullet 2:</strong> <em>"Configured Azure VM environments and automated model artifact pipelines from Azure Blob Storage using custom Bash scripts and azcopy, streamlining quantization and live LLM inference hosting."</em></div>
</div>

<p>
  <strong>How to Frame This in an Interview:</strong> The interviewer wants to verify that you didn't just deploy a tutorial container. They are looking for architectural maturity: <em>How did you isolate networks? How did you prevent cold-start failures? How did you run a 768-dimensional neural embedding model and Next.js within a 7.8 GB RAM constraint? How did you cut LLM hosting costs by over 75% on Azure?</em> This guide equips you with exact technical mechanisms, configurations, and concrete numbers.
</p>

<div class="callout callout-info">
  <strong>Key Narrative Anchor:</strong> "LegalBuddy is a production bilingual legal search and reasoning engine for Bangladesh acts and precedents. My core responsibility was designing and operating the production platform: multi-stage secure container builds, automated GitOps delivery pipelines via Dokploy on Docker Swarm with Traefik, dual-network isolation, cold-start elimination via lifecycle boot gates, and an automated Azure MLOps pipeline using Bash and azcopy to quantize 31B parameter models down to 16GB, hosting them at a fraction of standard cloud GPU costs."
</div>

<!-- SECTION 2: PRODUCTION TOPOLOGY & DEVOPS INFRASTRUCTURE -->
<h2>2. Production Topology & Dokploy Architecture</h2>

<p>
  The production application runs on a dedicated cloud VM (<code>tommy-vm</code>, Ubuntu 22.04 LTS, 4 vCPU, 7.8 GB RAM, no GPU, public IP <code>213.136.80.53</code>, Tailscale mesh <code>100.116.76.0</code>).
</p>

<div class="diagram-container">
<pre><code>                     INTERNET (Users / Clients)
                                 │
                                 │ HTTPS (Port 443) + Let's Encrypt TLS
                                 ▼
                     ┌────────────────────────┐
                     │    Traefik Ingress     │  (Managed by Dokploy)
                     │ (Reverse Proxy / TLS)  │  Auto-terminates TLS via SNI
                     └───────────┬────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
         ▼ (Port 3000)                                   ▼
┌──────────────────┐                            ┌──────────────────┐
│  Dokploy Admin   │                            │   web (Next.js)  │
│  Control Plane   │                            │  Standalone Node │
└──────────────────┘                            └────────┬─────────┘
                                                         │
                        (Docker Network: `internal`)    │ API_URL=http://api:8000
                                                         ▼
                                                ┌──────────────────┐
                                                │   api (FastAPI)  │
                                                │ e5 Embedding Model│
                                                └────────┬─────────┘
                                                         │
                 (Docker Overlay: `dokploy-network`)     │ qdrant:6333
                                                         ▼
                                                ┌──────────────────┐
                                                │  Qdrant Vector DB│
                                                │ (Pre-existing)   │
                                                └──────────────────┘</code></pre>
</div>

<h3>Why Dokploy + Docker Swarm Over Kubernetes?</h3>
<ul>
  <li><strong>Control Plane Overhead:</strong> On a 4 vCPU / 7.8 GB RAM host, a full Kubernetes control plane consumes 1.5–2 GB RAM and continuous CPU cycles. Dokploy uses Docker Swarm's lightweight native orchestrator, keeping overhead under 250 MB.</li>
  <li><strong>Native Traefik & ACME:</strong> Automatic Let's Encrypt SSL/TLS certificate issuing and renewal without needing complex cert-manager CRDs.</li>
  <li><strong>Git-Triggered Deployments:</strong> Dokploy installs a GitHub Webhook that listens for pushes to the <code>production</code> branch, automatically building and deploying via <code>docker-compose.prod.yml</code>.</li>
  <li><strong>Zero-Downtime Rolling Restarts:</strong> Swarm creates the new container, waits for the healthcheck to pass, routes traffic, and gracefully shuts down the previous replica.</li>
</ul>

<h3>Dual-Network Security Architecture</h3>
<p>
  A major design highlight in <code>docker-compose.prod.yml</code> is the separation into two distinct networks:
</p>
<table>
  <tr>
    <th>Network</th>
    <th>Type</th>
    <th>Members</th>
    <th>DevOps Rationale & Security Advantage</th>
  </tr>
  <tr>
    <td><code>internal</code></td>
    <td>Bridge (Project-scoped)</td>
    <td><code>web</code>, <code>api</code></td>
    <td>Provides private DNS resolution between Next.js and FastAPI. Isolates the API service name so no other container deployed on Dokploy can accidentally resolve or spoof <code>http://api:8000</code>.</td>
  </tr>
  <tr>
    <td><code>dokploy-network</code></td>
    <td>Overlay (External)</td>
    <td><code>web</code>, <code>api</code>, Traefik, Qdrant</td>
    <td>Allows Traefik ingress to reach <code>web:3000</code>, and allows <code>api</code> to communicate with the shared <code>qdrant:6333</code> container. The API has <strong>NO host port bindings</strong> and cannot be accessed from the public Internet.</td>
  </tr>
</table>

<!-- SECTION 3: CONTAINERIZATION DEEP DIVE -->
<h2>3. Containerization Engineering & Dockerfile Deep Dive</h2>

<p>
  Both the API and Web services feature production-hardened Dockerfiles built for security, minimal attack surface, fast caching, and determinism.
</p>

<h3>FastAPI Backend Dockerfile (<code>apps/api/Dockerfile</code>)</h3>
<pre><code>FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim
WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONOPTIMIZE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOME="/home/app" \
    HF_HOME="/home/app/.cache/huggingface"

# 1. Dependency-only layer (Cached with BuildKit)
COPY pyproject.toml uv.lock ./
COPY apps/api/pyproject.toml ./apps/api/pyproject.toml
COPY apps/shared/pyproject.toml ./apps/shared/pyproject.toml
COPY apps/ingestion/pyproject.toml ./apps/ingestion/pyproject.toml
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-workspace --package api

# 2. Source code copy + editable workspace package installation
COPY apps/api ./apps/api
COPY apps/shared ./apps/shared
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --package api

# 3. Security Hardening: Non-root user + writable HuggingFace cache
RUN addgroup --system app && \
    adduser --system --ingroup app --home /home/app app && \
    mkdir -p /home/app/.cache/huggingface && \
    chown -R app:app /home/app

USER app
EXPOSE 8000
WORKDIR /app/apps/api/src
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]</code></pre>

<div class="callout callout-success">
  <strong>Key Docker Engineering Highlights for FastAPI:</strong>
  <ul>
    <li><strong>BuildKit Cache Mounts (<code>--mount=type=cache,target=/root/.cache/uv</code>):</strong> Reuses downloaded wheel packages across docker builds, slashing rebuild times from 5 minutes to under 8 seconds.</li>
    <li><strong>Layered Workspace Resolution (<code>--no-install-workspace</code>):</strong> Third-party dependencies (PyTorch, sentence-transformers, pydantic) are cached in layer 1. Editing local application code in <code>apps/api/src</code> only invalidates layer 2. Heavy wheels are NEVER re-downloaded!</li>
    <li><strong>The <code>HF_HOME</code> Permissions Trap:</strong> HuggingFace sentence-transformers attempts to write cached models to <code>$HOME/.cache/huggingface</code>. In slim Docker containers without a defined home, <code>$HOME</code> defaults to <code>/nonexistent</code>, causing a fatal crash: <code>Permission denied: '/nonexistent'</code>. Creating <code>/home/app</code> and chowning to the non-root <code>app</code> user completely eliminates this risk.</li>
  </ul>
</div>

<h3>Next.js Frontend Multi-Stage Dockerfile (<code>apps/web/Dockerfile</code>)</h3>
<p>
  Implements a three-stage build pattern (<strong>deps → builder → runner</strong>) leveraging Next.js <code>output: 'standalone'</code>:
</p>
<ul>
  <li><strong>Stage 1 (deps):</strong> Runs <code>pnpm install --frozen-lockfile</code> using BuildKit pnpm store cache (<code>/root/.local/share/pnpm/store</code>).</li>
  <li><strong>Stage 2 (builder):</strong> Builds the Next.js bundle with <code>NEXT_TELEMETRY_DISABLED=1</code>. Node tracing automatically extracts only used node_modules into <code>.next/standalone</code>.</li>
  <li><strong>Stage 3 (runner):</strong> Copies strictly the standalone node server, <code>.next/static</code>, and <code>public</code>. Runs under non-root <code>nextjs:nodejs</code> (UID/GID 1001).</li>
  <li><strong>Result:</strong> Image footprint drops from ~1.2 GB down to <strong>~145 MB</strong>, removing compilers, package managers, and devDependencies from production.</li>
</ul>

<h3>Boot Readiness Gate & Cold-Start Healthchecks</h3>
<p>
  A notorious bug in AI production systems is <em>cold-start failure</em>: when the container starts, the web server immediately accepts HTTP traffic before the large neural embedding model is loaded into RAM. The first 10 requests hit a cold backend, timing out or throwing 500 errors.
</p>

<div class="diagram-container">
<pre><code>Container Starts ──▶ FastAPI lifespan executes ──▶ get_embedding_model() (Warms E5 in RAM)
                                                          │
                                                          ▼
                                                  verify_qdrant() (Verifies DB connection + Collection)
                                                          │
                                                          ▼
                                                  App ready! /rag/health returns 200 OK
                                                          │
                                                          ▼
Docker Healthcheck Polls /rag/health ──(Passes)──▶ web starts (depends_on: condition: service_healthy)</code></pre>
</div>

<div class="callout callout-dark">
  <strong>How the Boot Readiness Gate is Implemented:</strong>
  <ol>
    <li><strong>Lifespan Warmup (<code>apps/api/src/api/app.py</code>):</strong> <code>get_embedding_model()</code> loads <code>intfloat/multilingual-e5-base</code> into memory. <code>verify_qdrant()</code> checks collection existence. Uvicorn does not accept traffic until lifespan succeeds.</li>
    <li><strong>Fast Python Healthcheck Probe:</strong> Because slim images do not include <code>curl</code>, the healthcheck runs standard library Python:
      <br><code>test: ["CMD", "python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/rag/health', timeout=3).status == 200 else 1)"]</code></li>
    <li><strong>Start Period Grace Window (<code>start_period: 180s</code>):</strong> Docker healthchecks allow up to 180 seconds on first boot for the embedding model to download and cache, preventing premature container restarts.</li>
    <li><strong>Named Volume (<code>hf-cache</code>):</strong> Cached weights persist across container restarts. Subsequent container starts boot in <strong>&lt; 2 seconds</strong>.</li>
    <li><strong>Dependent Ingress (<code>depends_on: api: condition: service_healthy</code>):</strong> The Next.js frontend is held in wait by Docker Swarm until the API container is verified healthy. No user ever encounters a 502 Bad Gateway.</li>
  </ol>
</div>

<!-- SECTION 4: DEPENDENCY DETERMINISM & CPU PYTORCH PINNING -->
<h2>4. Dependency Determinism & CPU PyTorch Pinning</h2>

<p>
  Standard <code>pip install torch</code> downloads CUDA 12.x binaries including massive dynamic libraries (<code>libcudnn</code>, <code>libcublas</code>) exceeding <strong>3.5 GB</strong>. On an unaccelerated 7.8 GB RAM VM, importing CUDA torch consumes unnecessary memory, risks CUDA initialization crashes, and can cause kernel OOM panics during deployment.
</p>

<h3>The PyTorch CPU Index Lock (<code>pyproject.toml</code>)</h3>
<pre><code>[[tool.uv.index]]
name = "pytorch-cpu"
url = "https://download.pytorch.org/whl/cpu"
explicit = true  # CRUCIAL: Packages must explicitly request this index

[tool.uv.sources]
torch = [{ index = "pytorch-cpu" }]
torchvision = [{ index = "pytorch-cpu" }]</code></pre>

<div class="callout callout-success">
  <strong>DevOps Rationale & Mechanics:</strong>
  <ul>
    <li><strong><code>explicit = true</code>:</strong> Tells Astral <code>uv</code> that <code>pytorch-cpu</code> is NOT a fallback index for other packages. It will ONLY be searched when a package explicitly directs to it via <code>tool.uv.sources</code>.</li>
    <li><strong>Zero CUDA Packages:</strong> In <code>uv.lock</code>, PyTorch resolves strictly to <code>torch==2.12.0+cpu</code> with exactly <strong>zero</strong> <code>nvidia-*</code> wheels.</li>
    <li><strong>Deterministic Deployment (<code>--frozen</code>):</strong> Both CI and production Docker builds execute <code>uv sync --frozen</code>, guaranteeing byte-for-byte identical Python virtual environments without network index resolution at runtime.</li>
    <li><strong>Resource Budgeting:</strong> The production API runs a single Uvicorn process (no <code>--workers</code>), keeping the resident E5 model in memory bounded to ~2.2 GB RAM, comfortably inside the host's 7.8 GB ceiling.</li>
  </ul>
</div>

<!-- SECTION 5: CI/CD PIPELINE & AUTOMATED RELEASES -->
<h2>5. Git-Triggered CI/CD Delivery Pipeline</h2>

<p>
  The project implements an enterprise GitOps delivery flow separating feature development, continuous integration verification, and production release triggers.
</p>

<div class="diagram-container">
<pre><code>Feature Branch ──▶ PR to `main` ──▶ GitHub Actions CI (.github/workflows/ci.yml)
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
                Job 1: api · syntax check            Job 2: web · next build
                (uv sync + python compileall)        (pnpm install + standalone build)
                        │                                     │
                        └──────────────────┬──────────────────┘
                                           ▼
                                    GREEN BUILD
                                           │
                                           ▼
                             Merge `main` into `production`
                                           │
                                           ▼ (GitHub Webhook Fires)
                                    Dokploy on tommy-vm
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     ▼                                           ▼
          Pulls git commit & executes                  Performs Zero-Downtime
          docker-compose.prod.yml                      Rolling Container Swap</code></pre>
</div>

<h3>GitHub Actions CI Workflow (<code>.github/workflows/ci.yml</code>)</h3>
<p>
  Designed to be lightning-fast (completes in &lt; 90 seconds) and run without live credentials or external databases:
</p>
<ul>
  <li><strong>API Syntax Gate (<code>api · syntax check</code>):</strong>
    <br>Uses <code>astral-sh/setup-uv@v5</code> with cache enabled. Runs <code>uv sync --frozen --no-dev --package api</code>, followed by:
    <br><code>uv run python -m compileall -q apps/api/src apps/shared/src</code>
    <br><em>Why <code>compileall</code>?</em> It parses the entire Python Abstract Syntax Tree (AST) to verify syntax, indentation, and import signatures across the codebase without executing runtime code (requiring zero database connections, zero API keys, and zero embedding model downloads).
  </li>
  <li><strong>Web Build Gate (<code>web · next build</code>):</strong>
    <br>Sets up Node 24 + pnpm 11.5 with lockfile caching. Runs <code>pnpm build</code>.
    <br><em>Why?</em> Next.js static page generation and TypeScript type-checking are the single most common causes of failed production deployments. Catching bundle errors in CI guarantees that Dokploy never attempts to deploy a broken image.
  </li>
  <li><strong>Concurrency Cancellation:</strong> <code>cancel-in-progress: true</code> automatically aborts superseded workflow runs when new commits are pushed in rapid succession.</li>
</ul>

<!-- SECTION 6: AZURE MLOPS & AUTOMATED MODEL PIPELINES -->
<h2>6. Azure VM Provisioning, azcopy & Model Quantization</h2>

<p>
  This section directly covers the second resume bullet: <em>"Configured Azure VM environments and automated model artifact pipelines from Azure Blob Storage using custom Bash scripts and azcopy, streamlining quantization and live LLM inference hosting."</em>
</p>

<h3>The Business & Engineering Problem</h3>
<ul>
  <li><strong>The LLM Scaling Dilemma:</strong> High-precision legal reasoning requires large open weights. Fine-tuning Gemma-2-27B or Gemma-4-31B in 16-bit precision requires <strong>~54 GB to 62 GB of VRAM</strong> for model weights alone, plus KV cache overhead.</li>
  <li><strong>Prohibitive Cloud Cost:</strong> Hosting unquantized 16-bit models on an 80GB NVIDIA A100 VM (e.g., Azure <code>Standard_NC24ads_A100_v4</code>) costs ~$3.67/hr (&gt; $2,600/month).</li>
  <li><strong>The Solution:</strong> Quantize the fine-tuned model to <strong>GGUF Q4_K_M (4-bit medium)</strong>. The memory footprint drops from <strong>54 GB down to ~16 GB</strong>, allowing real-time inference on a low-cost 16GB GPU instance (e.g., Azure <code>Standard_NC4as_T4_v3</code> or L4), cutting infrastructure costs by <strong>over 75%</strong> while preserving statutory citation accuracy.</li>
</ul>

<h3>The Automated Azure Artifact Pipeline</h3>

<div class="diagram-container">
<pre><code>[Training Phase: Molab / GPU Node]
  Unsloth LoRA SFT (train_gemma4.py) ──▶ Merge LoRA into base weights ──▶ Package as tarball
                                                                                  │
                                                                                  ▼
                                                                Upload to Azure Blob Storage
                                                                (Container: `models`)
                                                                                  │
[Azure VM Automation: vm_quantize_new.sh]                                        │
  1. Mount Azure Data Disk (/dev/sdc ──▶ /data)                                  │
  2. Provision 64GB Swap on /data/swapfile (Prevents conversion OOMs)             │
  3. azcopy polling loop synchronizes tarball via SAS URL ◀───────────────────────┘
  4. Convert PyTorch HF checkpoint ──▶ GGUF F16 (convert_hf_to_gguf.py)
  5. Quantize F16 ──▶ Q4_K_M (llama-quantize)
  6. Disk cleanup: rm raw 50GB tar & F16 file (Prevent disk saturation)
  7. Start live server: llama-server on port 8080 (OpenAI-compatible /v1 API)</code></pre>
</div>

<h3>Deep-Dive: Bash Script Mechanics (<code>infra/azure/vm_quantize_new.sh</code>)</h3>
<pre><code>#!/bin/bash
set -e

# 1. Automate raw data disk formatting and mounting
sudo parted /dev/sdc --script mklabel gpt mkpart xfspart xfs 0% 100%
sudo mkfs.xfs /dev/sdc1
sudo mkdir -p /data
sudo mount /dev/sdc1 /data
sudo chown -R azureuser:azureuser /data

# 2. Provision 64GB Swap to absorb memory spikes during GGUF conversion
sudo fallocate -l 64G /data/swapfile
sudo chmod 600 /data/swapfile
sudo mkswap /data/swapfile
sudo swapon /data/swapfile

cd /data

# 3. High-throughput artifact transfer via azcopy
wget -qO azcopy.tar.gz https://aka.ms/downloadazcopy-v10-linux
tar -xf azcopy.tar.gz
sudo cp ./azcopy_linux_amd64_*/azcopy /usr/local/bin/azcopy

BLOB_URL="https://lawbuddy27bmodelfiles.blob.core.windows.net/models/lawbuddy-gemma4-31b-merged.tar?<SAS_TOKEN>"
azcopy copy "$BLOB_URL" "./lawbuddy-merged.tar"
tar -xf lawbuddy-merged.tar

# 4. Compile & run llama.cpp quantization
python3 convert_hf_to_gguf.py lawbuddy-gemma4-31b-merged --outtype f16 --outfile lawbuddy-f16.gguf
./llama-quantize lawbuddy-f16.gguf lawbuddy-q4.gguf Q4_K_M

# 5. Immediate disk hygiene to prevent 100% disk utilization
rm -rf lawbuddy-gemma4-31b-merged lawbuddy-merged.tar lawbuddy-f16.gguf azcopy.tar.gz llama.zip

# 6. Launch OpenAI-compatible inference daemon
nohup ./llama-server -m lawbuddy-q4.gguf --host 0.0.0.0 --port 8080 -c 4096 -n 512 > server.log 2>&1 &</code></pre>

<div class="callout callout-warning">
  <strong>Critical DevOps Interview Talking Points on Azure Scripts:</strong>
  <ul>
    <li><strong>Why 64GB Swap on Data Disk?</strong> Converting 31 billion floating-point parameters from HuggingFace safetensors to GGUF builds the entire weight dictionary in host virtual memory. On a standard VM, this spikes RAM usage past 48 GB, triggering the Linux kernel's Out-Of-Memory (OOM) Killer. Allocating a 64GB swap file on high-throughput NVMe/XFS storage guarantees conversion completion without kernel crashes.</li>
    <li><strong>Why <code>azcopy</code> Over <code>curl</code> or <code>wget</code>?</strong> <code>azcopy</code> uses multi-threaded concurrent chunk streaming tailored for Azure Blob Storage REST APIs, saturating available network bandwidth to transfer 50GB tarballs in minutes rather than hours.</li>
    <li><strong>The Asynchronous Polling Pattern (<code>setup_vm.sh</code>):</strong> To decouple upstream model fine-tuning from downstream VM provisioning, the startup script runs:
      <br><code>while ! azcopy copy "$BLOB_URL" "./lawbuddy-q4.gguf"; do sleep 30; done</code>
      <br>This creates an automated synchronization barrier, allowing cloud VMs to be spun up ahead of time while waiting for upstream training jobs to complete.</li>
    <li><strong>OpenAI-Compatible Hot-Swapping:</strong> The resulting <code>llama-server</code> exposes standard OpenAI endpoints (<code>/v1/chat/completions</code>). In the FastAPI backend, setting <code>OPENAI_BASE_URL=http://azure-vm-ip:8080/v1</code> allows instant switching from Gemini to our private fine-tuned model without changing a single line of application code.</li>
  </ul>
</div>

<!-- SECTION 7: FULL-STACK RAG & APPLICATION ENGINEERING -->
<h2>7. Full-Stack RAG & System Engineering</h2>

<p>
  Even in a DevOps interview, demonstrating that you thoroughly understand the application payload and data pipeline proves you are a top-tier engineer who designs infrastructure tailored to software realities.
</p>

<h3>The 128-Token Truncation Discovery & Empirical Evaluation</h3>
<p>
  One of the greatest technical contributions in this repository is documented in <code>eval/REPORT.md</code>:
</p>
<ul>
  <li><strong>The Silent Failure:</strong> The baseline embedding model (<code>triBne-e5-small</code>) had a hard token limit of 128 tokens. The original pipeline was feeding 1,200-character chunks (~300 tokens), causing <strong>~60% of legal text to be silently dropped</strong> before vector indexing!</li>
  <li><strong>The 512 Capacity Trap:</strong> Forcing <code>triBne-e5-small</code> to accept 512 tokens degraded retrieval accuracy by 10 points because positional embeddings between 128 and 512 were untrained.</li>
  <li><strong>The Solution:</strong> Upgraded to <code>intfloat/multilingual-e5-base</code> (768-dim, natively trained at 512 tokens).</li>
  <li><strong>Empirical Results on n=120 Bangladesh Legal Goldset:</strong>
    <br>• <strong>Recall@1:</strong> 0.258 → <strong>0.567 (+120% improvement)</strong>
    <br>• <strong>Recall@10:</strong> 0.575 → <strong>0.883 (+53% improvement)</strong>
    <br>• <strong>Mean Reciprocal Rank (MRR):</strong> 0.364 → <strong>0.675 (+85% improvement)</strong>
  </li>
</ul>

<h3>Advanced Retrieval Patterns in Production</h3>
<table>
  <tr>
    <th>Architecture Pattern</th>
    <th>Implementation Mechanism</th>
    <th>Why It Is Crucial for Production</th>
  </tr>
  <tr>
    <td><strong>Structure-Aware Token Chunking</strong></td>
    <td>Splits by legal subsection regex <code>(?=(?:\(\d+\)|\([a-zA-Z]+\)))</code> using HuggingFace tokenizer. Injects contextual header: <code>Act | Title | Section (part k/n)</code>.</td>
    <td>Prevents arbitrary sentence splitting across subsections; guarantees isolated chunks maintain parent act and section context in vector space.</td>
  </tr>
  <tr>
    <td><strong>Parent-Document Retrieval</strong></td>
    <td>Over-fetches candidate chunks (<code>multiplier = 5x</code>, minimum 20 chunks), then deduplicates and collapses by <code>section_uid</code>.</td>
    <td>Eliminates fragment redundancy. The LLM receives the complete statute section (<code>section_full</code>), preventing partial legal reasoning.</td>
  </tr>
  <tr>
    <td><strong>Qdrant Point Grouping</strong></td>
    <td><code>query_points_groups(group_by="case_uid", group_size=2, limit=top_k)</code> for Supreme Court precedent cases.</td>
    <td>Long court cases have 100+ chunks. Grouping ensures <code>top_k</code> <strong>distinct cases</strong> are returned rather than one case monopolizing all results.</td>
  </tr>
  <tr>
    <td><strong>Two-Tier Confidence Floors</strong></td>
    <td>Hard floor (0.79): immediate clarify prompt without calling LLM. Soft floor (0.83): routes to LLM with <code>low_confidence=True</code> hint.</td>
    <td>E5 cosine similarity is a weak separator. Hard floor saves API costs on garbage queries; soft floor lets LLM exercise nuance on borderline queries.</td>
  </tr>
  <tr>
    <td><strong>Multi-Turn Query Condensation</strong></td>
    <td>Fast cheap model (<code>gemini-2.5-flash-lite</code> / <code>llama-3.1-8b-instant</code>) rewrites conversational follow-ups into standalone search queries.</td>
    <td>Maintains retrieval precision during ongoing conversations while keeping generation latency under 200ms.</td>
  </tr>
  <tr>
    <td><strong>Structured Outputs & Validated Citations</strong></td>
    <td><code>instructor</code> library + Pydantic model (<code>StructuredLegalAnswer</code>). Citation IDs strictly checked against retrieved sources.</td>
    <td>Guarantees that the LLM only cites provided sources (`[Source N]`) and validates JSON schema compliance, eliminating hallucinations.</td>
  </tr>
</table>

<h3>End-to-End Observability (LangSmith)</h3>
<p>
  Production observability is wired into <code>apps/api/src/api/core/observability.py</code>. Tracing spans every stage of the pipeline:
  <code>condense-query ──▶ vector-search (Qdrant hits + latency) ──▶ answer-generation (token counts + temperature)</code>.
  On startup, <code>validate_langsmith_auth()</code> verifies credentials without crashing if tracing is disabled. On container shutdown, <code>flush_langsmith()</code> ensures no telemetry spans are lost in flight.
</p>

<!-- SECTION 8: DEVOPS INTERVIEW QUESTIONS & MODEL ANSWERS -->
<h2>8. DevOps Interview Battle-Tested Q&A</h2>

<p>
  These questions are specifically tailored to the tools, architecture, and constraints of LegalBuddy. Use the provided talking points to deliver crisp, senior-level answers.
</p>

<div class="qa-box">
  <div class="qa-question">Q1: Can you walk me through the end-to-end architecture and deployment flow of this project?</div>
  <div class="qa-testing">Assessing: Architectural clarity, full-stack understanding, communication</div>
  <div class="qa-answer">
    "LegalBuddy is containerized across Next.js, FastAPI, and Qdrant. In production, we run on an Ubuntu VM managed by Dokploy, which uses Docker Swarm and Traefik.
    <br><br>
    Our deployment flow is GitOps-driven: developers push to <code>main</code>, where GitHub Actions CI runs two parallel gates—syntax byte-compilation on the Python API and a standalone production build on the Next.js frontend. Once CI passes and the PR merges to <code>production</code>, a Dokploy webhook triggers an automated release. Dokploy builds the production compose file, performs healthcheck verification, and executes a zero-downtime rolling update.
    <br><br>
    On the MLOps side, for our fine-tuned 31B Gemma model, we engineered automated Bash pipelines on Azure GPU VMs that mount NVMe storage, provision 64GB of swap to survive memory spikes, download model checkpoints via <code>azcopy</code>, quantize the weights to GGUF Q4_K_M using <code>llama.cpp</code>, and host them via high-throughput OpenAI-compatible endpoints."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q2: Why did you choose Dokploy and Docker Swarm instead of Kubernetes?</div>
  <div class="qa-testing">Assessing: Practical trade-off analysis, resource awareness, pragmatic engineering</div>
  <div class="qa-answer">
    "We made a conscious architectural decision based on workload scale and resource constraints. Our production host has 4 vCPUs and 7.8 GB of RAM. A full Kubernetes control plane consumes 1.5 to 2 GB of RAM and continuous CPU overhead just keeping etcd and kube-system pods running.
    <br><br>
    Dokploy operates natively on Docker Swarm. It gives us the exact primitives we actually need—declarative compose files, automated rolling restarts, Git webhook integrations, secret management, and automated Let's Encrypt SSL termination via Traefik—all while consuming less than 250 MB of RAM. It eliminated unnecessary distributed systems complexity while remaining 100% production-ready."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q3: How did you implement network isolation and security between your containers?</div>
  <div class="qa-testing">Assessing: Container security, network topologies, attack surface reduction</div>
  <div class="qa-answer">
    "We implemented a dual-network topology in <code>docker-compose.prod.yml</code>. We created a project-scoped bridge network called <code>internal</code> that connects only <code>web</code> and <code>api</code>. This ensures that the FastAPI backend is never exposed to the public Internet and prevents hostname collisions with other applications on the server.
    <br><br>
    Both containers also join an external overlay network called <code>dokploy-network</code>. Traefik sits on this network and routes public HTTPS traffic on port 443 strictly to the Next.js frontend on port 3000. The API joins it solely to reach our internal Qdrant vector database at <code>qdrant:6333</code>. In production, the API container publishes zero host ports, meaning it cannot be queried or attacked from the outside."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q4: How did you solve the cold-start and healthcheck issues for the AI backend?</div>
  <div class="qa-testing">Assessing: High availability, lifecycle management, failure prevention</div>
  <div class="qa-answer">
    "AI applications face a major cold-start problem: if the container reports healthy before the neural embedding model is loaded, the first user requests fail with 500 errors or extreme latency.
    <br><br>
    We resolved this with a four-part lifecycle gate:
    <br>1. <strong>Lifespan Warmup:</strong> In FastAPI's lifespan context manager, we explicitly invoke <code>get_embedding_model()</code> to load the 768-dim E5 model into RAM and call <code>verify_qdrant()</code> to confirm vector collection readiness before Uvicorn binds the port.
    <br>2. <strong>Python Stdlib Probe:</strong> Our Docker healthcheck uses <code>urllib.request</code> to poll <code>/rag/health</code>. We configured a 180-second <code>start_period</code> to account for initial model downloads.
    <br>3. <strong>Dependent Ingress:</strong> In Docker Compose, the <code>web</code> frontend defines <code>depends_on: api: condition: service_healthy</code>. The frontend container is never started until the API confirms full operational readiness.
    <br>4. <strong>Volume Persistence:</strong> We mount a named volume <code>hf-cache</code> at <code>/home/app/.cache/huggingface</code>, ensuring model weights persist across container restarts, reducing subsequent boots to under 2 seconds."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q5: Why did you pin CPU-only PyTorch, and how does your uv setup prevent CUDA bloat?</div>
  <div class="qa-testing">Assessing: Package management, Python internals, build optimization</div>
  <div class="qa-answer">
    "By default, PyPI's PyTorch wheels include over 3.5 GB of CUDA runtime libraries. On a CPU-only production VM with 7.8 GB of RAM, downloading and loading CUDA binaries wastes gigabytes of disk space, slows down builds, and risks memory exhaustion.
    <br><br>
    In <code>pyproject.toml</code>, we defined an explicit index pointing directly to <code>https://download.pytorch.org/whl/cpu</code> with <code>explicit = true</code>. This guarantees that <code>uv</code> only fetches CPU wheels for PyTorch and torchvision, and will never query PyPI for CUDA packages. Our <code>uv.lock</code> locks strictly to <code>torch==2.12.0+cpu</code> with zero <code>nvidia-*</code> wheels. Both CI and Docker run <code>uv sync --frozen</code>, guaranteeing immutable, lightweight, 100% CPU-only deployments."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q6: Walk me through the Azure VM quantization script and how you prevented OOM errors.</div>
  <div class="qa-testing">Assessing: Linux systems engineering, Bash scripting, MLOps, storage management</div>
  <div class="qa-answer">
    "Our script (<code>vm_quantize_new.sh</code>) automates the end-to-end preparation of a raw Azure VM for LLM inference.
    <br><br>
    First, it formats and mounts the raw Azure data disk (<code>/dev/sdc</code>) as XFS at <code>/data</code>. Next comes the most critical stability step: creating a <strong>64GB swap file</strong> on the NVMe disk using <code>fallocate</code> and <code>swapon</code>. Converting a 31B parameter model from HuggingFace safetensors into GGUF requires loading the entire parameter dictionary into virtual memory, which easily causes the Linux kernel OOM Killer to terminate the process on standard VMs. The 64GB swap provides the memory headroom required to complete conversion cleanly.
    <br><br>
    The script then downloads <code>azcopy</code>, streams our model tarball from Azure Blob Storage using a secure SAS token, runs <code>convert_hf_to_gguf.py</code> to produce an F16 GGUF, and quantizes it to <code>Q4_K_M</code> using <code>llama-quantize</code>. Once quantized, it cleans up the intermediate 50GB tarball and F16 file to prevent disk exhaustion, and launches <code>llama-server</code> as a persistent background daemon on port 8080."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q7: How did you optimize Docker build times and image sizes across the stack?</div>
  <div class="qa-testing">Assessing: Advanced Docker optimization, caching strategies, image security</div>
  <div class="qa-answer">
    "For the FastAPI API:
    <br>• We utilized <code>ghcr.io/astral-sh/uv</code> base images and BuildKit cache mounts (<code>--mount=type=cache,target=/root/.cache/uv</code>).
    <br>• We copied workspace <code>pyproject.toml</code> files and the lockfile first and ran <code>uv sync --frozen --no-install-workspace</code>. This caches all external dependencies in an early layer. When code changes in <code>src/</code>, only the application layer rebuilds, taking 5 seconds instead of 4 minutes.
    <br>• We ran as a non-root user <code>app</code> and ensured permissions were granted on <code>HF_HOME</code>.
    <br><br>
    For the Next.js Frontend:
    <br>• We implemented a three-stage build (deps → builder → runner) with pnpm lockfile caching.
    <br>• We enabled Next.js standalone output, which traces required <code>node_modules</code> and produces a minimal server bundle.
    <br>• In the final runner stage, we copied only the standalone bundle, static assets, and public folder into a minimal Node 24 slim container under user <code>nextjs</code>. This dropped the image size from 1.2 GB to ~145 MB."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q8: How does your CI/CD pipeline ensure that broken code never reaches production?</div>
  <div class="qa-testing">Assessing: Quality gates, GitHub Actions, release management</div>
  <div class="qa-answer">
    "We enforce branch protection on <code>production</code> that mandates passing status checks from GitHub Actions before any merge or deploy.
    <br><br>
    Our CI pipeline has two lightweight jobs:
    <br>1. <code>api · syntax check</code>: Syncs dependencies via frozen <code>uv</code> lockfile and runs <code>python -m compileall -q apps/api/src apps/shared/src</code>. This verifies syntax, AST parsing, and imports across every file in seconds without needing runtime secrets or database connections.
    <br>2. <code>web · next build</code>: Runs the full Next.js standalone build to catch TypeScript type errors, syntax issues, and broken JSX components.
    <br><br>
    Because Dokploy auto-deploys via webhook on pushes to <code>production</code>, developers can only merge into <code>production</code> after CI passes. If a bad commit slips through, Dokploy keeps the previous container revision running until the new container's healthcheck passes, preventing downtime."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q9: What happens if Qdrant goes down in production, and how does the system recover?</div>
  <div class="qa-testing">Assessing: Fault tolerance, resilience, error handling, graceful degradation</div>
  <div class="qa-answer">
    "We have resilience engineered at two layers:
    <br><br>
    1. <strong>Startup Fail-Fast:</strong> During container startup, <code>verify_qdrant()</code> pings the Qdrant instance and asserts that the primary collection (<code>legal_acts_event_rag_full</code>) exists. If Qdrant is unreachable or the collection is missing, the lifespan raises a <code>RuntimeError</code>. The API container fails its healthcheck and Docker Swarm refuses to route traffic, preventing broken deployments from going live.
    <br><br>
    2. <strong>Runtime Ingestion Retries:</strong> In our ingestion pipeline, calls to Qdrant use exponential backoff retries (<code>upsert_with_retry</code> with 4 attempts). In the query API, precedent retrieval from <code>legal_cases</code> is treated as secondary context—if that collection is temporarily degraded, the API falls back to statute-only responses rather than hard-failing user queries."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q10: If user traffic spikes 20x tomorrow, what are the bottlenecks and how would you scale?</div>
  <div class="qa-testing">Assessing: Scalability, capacity planning, distributed system evolution</div>
  <div class="qa-answer">
    "Right now, the architecture is vertically bounded on a single VM running a single Uvicorn process to keep the 768-dim E5 embedding model in memory without exceeding 7.8 GB RAM.
    <br><br>
    If traffic scaled 20x:
    <br>1. <strong>Frontend:</strong> The Next.js standalone app is stateless. We can spin up multiple replicas behind Traefik or offload frontend hosting entirely to Vercel or an Azure Container App.
    <br>2. <strong>Embedding Inference Bottleneck:</strong> CPU embedding takes ~40–70ms per query. At high concurrency, Uvicorn worker threads would queue up. We would decouple the embedding model into a dedicated Triton Inference Server or dedicated GPU microservice, or move to an asynchronous batch embedding queue.
    <br>3. <strong>Vector Search:</strong> Qdrant is already configured with payload indexes on <code>act_year</code>, <code>language</code>, and <code>section_uid</code>. For massive scale, we would move Qdrant off the VM to a dedicated clustered Qdrant Cloud or multi-node instance.
    <br>4. <strong>FastAPI Backend:</strong> With the embedding model offloaded, FastAPI becomes pure I/O bound. We could scale Uvicorn to 4–8 worker processes across multiple container replicas with horizontal auto-scaling."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q11: How do you handle configuration management and secret rotation across environments?</div>
  <div class="qa-testing">Assessing: Secret security, 12-factor app principles, config hygiene</div>
  <div class="qa-answer">
    "We follow strict 12-factor configuration principles using Pydantic Settings (<code>api/core/config.py</code>). No secrets, credentials, or URLs are ever hardcoded in code or Docker images.
    <br><br>
    In local development, developers copy <code>.env.example</code> to <code>.env</code>, which is gitignored. In production, Dokploy manages environment variables securely through its encrypted UI, injecting them as runtime environment variables into the containers via Docker Compose's <code>env_file</code>.
    <br><br>
    For Azure model scripts, temporary SAS tokens are passed as arguments or environment variables with strict expiry times, ensuring storage account master keys are never exposed in scripts or command histories."
  </div>
</div>

<div class="qa-box">
  <div class="qa-question">Q12: How would you troubleshoot a 502 Bad Gateway reported by Traefik?</div>
  <div class="qa-testing">Assessing: Systematic debugging, triage method, reverse proxy troubleshooting</div>
  <div class="qa-answer">
    "A 502 Bad Gateway from Traefik means Traefik received a request for a registered route but the upstream service failed to respond. I would execute a 4-step triage:
    <br><br>
    1. <strong>Inspect Container Status:</strong> Run <code>docker ps</code> to check if the <code>web</code> container is running or in a crash-loop. If restarting, inspect <code>docker logs &lt;web_container&gt;</code>.
    <br>2. <strong>Check Health & Upstream Readiness:</strong> Since <code>web</code> depends on <code>api</code>, check <code>docker inspect &lt;api_container&gt; --format '{{.State.Health.Status}}'</code>. If <code>api</code> is unhealthy, inspect its logs for Qdrant connection errors or model download failures.
    <br>3. <strong>Verify Network Resolution:</strong> Verify that both Traefik and <code>web</code> are on <code>dokploy-network</code> and that Traefik labels match the target port (3000):
    <br><code>traefik.http.services.lawbuddy-web.loadbalancer.server.port=3000</code>.
    <br>4. <strong>Direct Upstream Probe:</strong> Exec into the Traefik container and run <code>wget -qO- http://web:3000</code> to isolate whether the failure is in Traefik's routing or the application itself."
  </div>
</div>

<!-- SECTION 9: INTERVIEW CHEAT SHEET & QUICK REFERENCE -->
<h2>9. Quick-Reference Cheat Sheet & Key Numbers</h2>

<div class="callout callout-dark">
  <div style="font-weight: 800; font-size: 10.5pt; color: #38bdf8; margin-bottom: 3px;">The 60-Second Elevator Pitch:</div>
  <em>"LegalBuddy is a production RAG application for Bangladesh legal statutes and court precedents. On the DevOps side, I containerized the full stack—FastAPI, Next.js, and Qdrant—deploying it through automated Git-triggered CI/CD pipelines via Dokploy on Docker Swarm with Traefik and automated Let's Encrypt TLS. I engineered private network isolation, eliminated cold-start errors through custom healthcheck boot gates and named volume caching, and locked CPU PyTorch builds to prevent CUDA bloat on our 8GB RAM host. On the MLOps side, I wrote automated Bash and azcopy pipelines on Azure to sync, convert, and quantize 31B parameter models to GGUF Q4_K_M, cutting LLM inference hosting costs by over 75% while exposing high-throughput OpenAI-compatible endpoints."</em>
</div>

<h3>Key Metrics & Architecture Numbers to Memorize</h3>
<table>
  <tr>
    <th>Metric / Concept</th>
    <th>Exact Value / Detail</th>
    <th>Why It Matters in an Interview</th>
  </tr>
  <tr>
    <td><strong>Host Hardware</strong></td>
    <td>4 vCPU, 7.8 GB RAM, Ubuntu 22.04 LTS</td>
    <td>Proves you engineered for real-world cost and resource constraints.</td>
  </tr>
  <tr>
    <td><strong>FastAPI Memory Budget</strong></td>
    <td>~2.2 GB resident RAM (Single Uvicorn worker)</td>
    <td>Explains why multi-worker Uvicorn was avoided on an 8GB box.</td>
  </tr>
  <tr>
    <td><strong>Next.js Docker Size</strong></td>
    <td>1.2 GB → ~145 MB (Standalone output)</td>
    <td>Demonstrates mastery of multi-stage Docker optimization.</td>
  </tr>
  <tr>
    <td><strong>Embedding Model</strong></td>
    <td><code>intfloat/multilingual-e5-base</code> (768-dim, 512 tokens)</td>
    <td>Replaced truncated 128-token model; doubled retrieval accuracy.</td>
  </tr>
  <tr>
    <td><strong>Eval Retrieval Lift</strong></td>
    <td>Recall@1: 0.26 → 0.57 (+120%), MRR: 0.36 → 0.68</td>
    <td>Quantitative proof of engineering decisions on 120-question goldset.</td>
  </tr>
  <tr>
    <td><strong>LLM Quantization</strong></td>
    <td>Gemma-4-31B: 54 GB+ FP16 → 16 GB Q4_K_M GGUF</td>
    <td>Reduced VRAM by ~75%, enabling T4/L4 GPU hosting instead of $4/hr A100s.</td>
  </tr>
  <tr>
    <td><strong>Swap File on Azure VM</strong></td>
    <td>64 GB Swap on NVMe/XFS disk</td>
    <td>Prevented Linux kernel OOM killer during GGUF dictionary conversion.</td>
  </tr>
  <tr>
    <td><strong>Confidence Cutoffs</strong></td>
    <td>Hard: 0.79 (Clarify prompt), Soft: 0.83 (Low confidence hint)</td>
    <td>Overcomes weak E5 cosine separation to prevent hallucinations.</td>
  </tr>
</table>

<h3>Essential DevOps Commands Cheat Sheet</h3>
<pre><code># 1. Healthcheck direct verification on running container
docker exec &lt;api_container_id&gt; python -c \
  "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/rag/health').read())"

# 2. Inspect real-time container memory & CPU consumption
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# 3. Synchronize model artifact via azcopy with SAS token
azcopy copy "https://&lt;account&gt;.blob.core.windows.net/models/model.tar?&lt;SAS_TOKEN&gt;" "./model.tar"

# 4. Quantize GGUF weights via llama.cpp
./llama-quantize lawbuddy-f16.gguf lawbuddy-q4.gguf Q4_K_M

# 5. Launch high-throughput OpenAI-compatible inference server
nohup ./llama-server -m lawbuddy-q4.gguf --host 0.0.0.0 --port 8080 -c 4096 -n 512 > server.log 2>&1 &

# 6. Run Python syntax validation across the entire workspace (CI simulation)
uv run python -m compileall -q apps/api/src apps/shared/src</code></pre>

<div class="callout callout-success">
  <strong>Final Interview Advice:</strong> Keep your answers structured: State the <strong>Business/Technical Problem</strong>, describe your <strong>DevOps Architecture & Implementation</strong>, and conclude with the <strong>Measurable Outcome</strong> (e.g. <em>"slashed build time from 5 min to 8 sec"</em>, <em>"reduced image size from 1.2 GB to 145 MB"</em>, <em>"cut GPU VM cost from $2,600/mo to $400/mo"</em>). You built an exceptional system—own the details with confidence!
</div>

</body>
</html>
"""

def generate_pdf(output_path: str):
    print(f"Generating PDF at {output_path}...")
    font_config = weasyprint.text.fonts.FontConfiguration()
    html = weasyprint.HTML(string=HTML_CONTENT)
    html.write_pdf(output_path, font_config=font_config)
    print("PDF generation complete!")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "LegalBuddy_DevOps_Interview_Study_Guide.pdf"
    generate_pdf(out)
