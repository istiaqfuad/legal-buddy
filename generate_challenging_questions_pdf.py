"""Script to generate the Challenging DevOps & MLOps Interview Questions PDF for LegalBuddy using WeasyPrint.
Covers senior/staff-level grilling questions, war room production incidents, trade-off defenses, and hardware math.
"""

import sys
import weasyprint

HTML_CONTENT = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>LegalBuddy - Advanced DevOps & MLOps Grilling & Challenging Interview Questions</title>
<style>
  @page {
    size: A4;
    margin: 16mm 13mm 16mm 13mm;
    @top-right {
      content: "LEGALBUDDY DEVOPS GRILLING PLAYBOOK";
      font-size: 7.5pt;
      font-weight: 700;
      color: #94a3b8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      letter-spacing: 0.08em;
    }
    @bottom-left {
      content: "Challenging DevOps/MLOps Questions • Production Incidents • Architectural Grills";
      font-size: 7.5pt;
      color: #94a3b8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 7.5pt;
      font-weight: 700;
      color: #dc2626;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.45;
    font-size: 8.8pt;
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
    border-bottom: 1.5px solid #dc2626;
    padding-bottom: 3px;
    margin-top: 1.3em;
    margin-bottom: 0.5em;
    color: #b91c1c;
  }

  h3 {
    font-size: 10pt;
    color: #0f172a;
    margin-top: 0.9em;
    margin-bottom: 0.3em;
  }

  p {
    margin-top: 0;
    margin-bottom: 0.45em;
    text-align: justify;
  }

  ul, ol {
    margin-top: 0;
    margin-bottom: 0.45em;
    padding-left: 1.3em;
  }

  li {
    margin-bottom: 0.2em;
  }

  code {
    font-family: "JetBrains Mono", Consolas, Monaco, "Courier New", monospace;
    font-size: 7.9pt;
    background-color: #f1f5f9;
    color: #b91c1c;
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
    font-size: 7.5pt;
    line-height: 1.32;
    overflow-x: hidden;
    margin-top: 0.3em;
    margin-bottom: 0.5em;
    page-break-inside: avoid;
    break-inside: avoid;
    border-left: 3px solid #f87171;
  }

  pre code {
    background: none;
    color: inherit;
    padding: 0;
    border: none;
    font-size: inherit;
  }

  .badge {
    display: inline-block;
    padding: 1.5px 6px;
    font-size: 6.8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 3px;
    margin-right: 4px;
    vertical-align: middle;
  }
  .badge-red { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .badge-purple { background-color: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
  .badge-amber { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
  .badge-blue { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

  .callout {
    border-radius: 5px;
    padding: 8px 12px;
    margin: 0.6em 0;
    page-break-inside: avoid;
    break-inside: avoid;
    font-size: 8.5pt;
  }
  .callout-danger {
    background-color: #fef2f2;
    border-left: 3.5px solid #dc2626;
    color: #991b1b;
  }
  .callout-dark {
    background-color: #1e293b;
    border-left: 3.5px solid #f87171;
    color: #f1f5f9;
  }
  .callout-info {
    background-color: #f0f9ff;
    border-left: 3.5px solid #0284c7;
    color: #0369a1;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5em 0;
    font-size: 7.8pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  th {
    background-color: #f8fafc;
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
    background-color: #fcfdfe;
  }

  .qa-card {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 9px 12px;
    margin-bottom: 0.75em;
    page-break-inside: avoid;
    break-inside: avoid;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }
  .qa-header {
    margin-bottom: 5px;
  }
  .qa-title {
    font-weight: 800;
    color: #0f172a;
    font-size: 9.3pt;
    line-height: 1.25;
  }
  .qa-trap {
    font-size: 7.2pt;
    color: #b91c1c;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 2px;
  }
  .qa-flawed {
    background: #fff5f5;
    border-left: 2.5px solid #f87171;
    padding: 4px 8px;
    margin: 5px 0;
    font-size: 8pt;
    color: #7f1d1d;
  }
  .qa-answer {
    color: #334155;
    font-size: 8.5pt;
    line-height: 1.42;
    margin-top: 5px;
  }

  .hero-header {
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }
  .hero-title {
    color: #0f172a;
    font-size: 18pt;
    font-weight: 800;
    margin: 0;
  }
  .hero-subtitle {
    color: #dc2626;
    font-size: 10pt;
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
</style>
</head>
<body>

<!-- HERO HEADER -->
<div class="hero-header">
  <div class="hero-title">LegalBuddy — Challenging DevOps & MLOps Grilling Playbook</div>
  <div class="hero-subtitle">High-Stakes Architectural Defense, Edge-Case Failure Scenarios & Live Production Incident Triage</div>
  <div class="meta-grid">
    <div class="meta-col">
      <strong>Format:</strong> Senior / Staff / Lead DevOps Interview<br>
      <strong>Level:</strong> Extreme Technical Depth & Trade-offs
    </div>
    <div class="meta-col">
      <strong>Focus Areas:</strong> Kernel OOMs, Swarm vs K8s, Swap Thrashing<br>
      <strong>Tools Tested:</strong> Docker Swarm, Traefik, azcopy, vLLM, Qdrant
    </div>
    <div class="meta-col">
      <strong>Evaluation:</strong> System Defense, Root-Cause Analysis, Hardware Math
    </div>
  </div>
</div>

<div class="callout callout-dark">
  <div style="font-weight: 800; font-size: 10.5pt; color: #f87171; margin-bottom: 2px;">How to Use This Grilling Playbook:</div>
  Interviews for senior DevOps and MLOps positions do not test whether you know what Docker is—they probe for the <strong>breaking points</strong> of your architecture. Interviewers will push you with questions like: <em>"What happens when your 64GB swap file thrashes and locks the kernel?", "Why didn't you use Triton Inference Server?", "How did your dual-network design prevent cross-tenant request forgery?", "Calculate the exact VRAM footprint of a 31B model with KV cache."</em><br>
  For each question, study the <strong>Interviewer's Trap</strong>, note the <strong>Junior Flawed Answer</strong> to avoid, and master the <strong>Senior/Staff Defense</strong>.
</div>

<!-- CATEGORY 1: ARCHITECTURAL DEFENSE & TRADE-OFFS -->
<h2>Category 1: Architectural Defense & Trade-Offs</h2>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: HARD</span>
    <span class="badge badge-purple">ARCHITECTURE DEFENSE</span>
    <div class="qa-title">Q1: "You used Dokploy and Docker Swarm instead of Kubernetes. Isn't that an amateur choice for an enterprise legal application?"</div>
    <div class="qa-trap">The Trap: Testing whether you are dogmatic about buzzwords or understand pragmatic ROI, resource budgets, and operational complexity.</div>
  </div>
  <div class="qa-flawed">
    <strong>Junior Answer:</strong> "Kubernetes was too hard to learn and we just wanted something fast, so we picked Dokploy." <em>(Shows lack of senior judgment and admits technical inadequacy.)</em>
  </div>
  <div class="qa-answer">
    <strong>Staff DevOps Defense:</strong><br>
    "Choosing an orchestration platform is an exercise in resource budgeting and failure domain management. Our production infrastructure runs on a single node with 4 vCPUs and 7.8 GB of RAM.<br><br>
    If we deployed a production Kubernetes control plane (even lightweight distributions like K3s with etcd), the control plane alone consumes 1.5 to 2 GB of resident memory and continuous background CPU cycles for reconciliation loops and pod lifecycle monitoring. On an 8GB machine where our application's resident 768-dimensional multilingual embedding model requires ~2.2 GB of RAM, allocating 25% of our host memory to Kubernetes infrastructure would severely starve our application and trigger kernel OOM panics.<br><br>
    Dokploy operates natively on Docker Swarm. It gives us the exact primitives we actually need: declarative compose stacks, healthcheck-gated zero-downtime rolling updates, GitOps webhook automation, and built-in Traefik reverse proxy with Let's Encrypt TLS renewal—all with an operational memory overhead under 250 MB. When our traffic scales beyond a single node, Docker Swarm scales out to multi-node overlay networks with zero changes to our compose manifest, or we can graduate to managed Kubernetes (EKS/AKS) without redesigning our container images."
  </div>
</div>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: EXPERT</span>
    <span class="badge badge-purple">NETWORKING & SECURITY</span>
    <div class="qa-title">Q2: "In your dual-network setup, Traefik, Next.js, and Qdrant all sit on dokploy-network. What prevents an attacker who compromises Next.js from querying Qdrant directly?"</div>
    <div class="qa-trap">The Trap: Probing your exact container network boundaries, Docker overlay routing, and application-layer authentication defenses.</div>
  </div>
  <div class="qa-flawed">
    <strong>Junior Answer:</strong> "The Next.js container only has frontend code so it can't talk to Qdrant." <em>(Factually false—any container on the same Docker bridge/overlay can initiate TCP handshakes to any other container IP.)</em>
  </div>
  <div class="qa-answer">
    <strong>Staff DevOps Defense:</strong><br>
    "In our architecture, defense-in-depth is enforced at three distinct layers:
    <ul>
      <li><strong>Network Segmentation:</strong> In <code>docker-compose.prod.yml</code>, the Next.js service is intentionally configured to proxy chat requests strictly to the FastAPI backend over the isolated, project-scoped <code>internal</code> network via <code>API_URL=http://api:8000</code>. Next.js does not contain Qdrant client libraries or connection drivers.</li>
      <li><strong>Mandatory Authentication Token:</strong> Qdrant is deployed with mandatory API key authentication (<code>QDRANT_API_KEY</code>). This secret is strictly injected into the FastAPI container's environment via Dokploy and is <strong>never</strong> shared or exposed to the <code>web</code> container or frontend client bundles. Even if an attacker obtained remote code execution inside the Next.js container, unauthenticated TCP requests to <code>qdrant:6333</code> are rejected with HTTP 401 Unauthorized.</li>
      <li><strong>Container Hardening:</strong> Next.js runs as an unprivileged user (<code>nextjs:nodejs</code>, UID 1001) in a read-only minimal container without curl, netcat, or package managers, severely constraining lateral movement. In an enterprise VPC upgrade, we would enforce Calico or Cilium NetworkPolicies to strictly deny egress traffic from the <code>web</code> pod CIDR to port 6333 at the kernel packet filtering level."</li>
    </ul>
  </div>
</div>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: HARD</span>
    <span class="badge badge-amber">DEPLOYMENT LIFECYCLE</span>
    <div class="qa-title">Q3: "If Uvicorn crashes in production, what happens to inflight requests, and how does Dokploy prevent an infinite restart loop?"</div>
    <div class="qa-trap">The Trap: Testing understanding of Docker restart policies, Swarm rollback mechanisms, and HTTP connection draining.</div>
  </div>
  <div class="qa-flawed">
    <strong>Junior Answer:</strong> "Docker just restarts it automatically because restart is set to always." <em>(Misses what happens to inflight sockets and ignores how to break restart loops.)</em>
  </div>
  <div class="qa-answer">
    <strong>Staff DevOps Defense:</strong><br>
    "Our production stack configures <code>restart: unless-stopped</code> and is orchestrated via Docker Swarm service specs.<br><br>
    When Uvicorn crashes unexpectedly:
    <ul>
      <li><strong>Inflight Connections:</strong> Any HTTP socket currently processing a request receives a TCP <code>RST</code> or connection reset. Traefik detects the sudden backend socket termination and responds to the client with an immediate HTTP 502 Bad Gateway.</li>
      <li><strong>Healthcheck Invalidation:</strong> Docker daemon immediately marks the container task dead and spawns a replacement container. However, because our startup gate requires <code>get_embedding_model()</code> and <code>verify_qdrant()</code> to complete before <code>/rag/health</code> returns 200, Traefik's dynamic load balancer will NOT route any incoming traffic to the new container until its healthcheck passes.</li>
      <li><strong>Crash Loop Defense:</strong> If the crash is due to a permanent defect (e.g. corrupted Qdrant collection or missing env var), the container fails startup during lifespan, exiting with code 1. In Dokploy's Swarm deployment spec, we define maximum retry attempts (<code>max_attempts: 3</code>) and failure action (<code>rollback</code>). Once retries are exhausted, Swarm freezes the service in a failed state rather than thrashing CPU cycles, and alerts are emitted via Dokploy's webhook notifications."</li>
    </ul>
  </div>
</div>

<!-- CATEGORY 2: WAR ROOM PRODUCTION INCIDENTS -->
<h2>Category 2: Live Production Incident Triage (War Room Scenarios)</h2>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: EXPERT</span>
    <span class="badge badge-red">WAR ROOM INCIDENT</span>
    <div class="qa-title">Q4: "It's 2:00 AM. Traefik is serving 502 Bad Gateway. You SSH into tommy-vm and run 'docker ps'. Both 'web' and 'api' are reported as running. Walk me through your exact command-line triage sequence."</div>
    <div class="qa-trap">The Trap: Checking if you panic, guess randomly, or execute a disciplined layer-by-layer root cause triage (L4/L7 networking -> container health -> application logs -> host resources).</div>
  </div>
  <div class="qa-answer">
    <strong>Senior DevOps Incident Playbook:</strong><br>
    "I follow a disciplined top-down triage protocol:
    <ol>
      <li><strong>Inspect Container Health States:</strong>
        <br><code>docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"</code>
        <br><em>Analysis:</em> 'Running' does not mean 'healthy'. If <code>api</code> says <code>(unhealthy)</code>, Traefik or Next.js has stopped routing to it.</li>
      <li><strong>Direct HTTP Probe of the Internal Health Endpoint:</strong>
        <br>Bypass Traefik and test the API directly from the host virtual network:
        <br><code>docker exec -it $(docker ps -qf name=api) python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/rag/health', timeout=3).read())"</code>
        <br><em>Branch A:</em> If it returns <code>{"status":"ok"}</code>, the API is healthy. The failure is in network resolution or Traefik routing.
        <br><em>Branch B:</em> If it hangs or raises ConnectionRefused, Uvicorn's event loop is blocked or crashed.</li>
      <li><strong>Check Host Resource Starvation (OOM / CPU Saturation):</strong>
        <br><code>free -h && vmstat 1 5 && dmesg -T | grep -i oom</code>
        <br><em>Analysis:</em> Verify if the Linux kernel OOM-killer killed a child worker process or if swap thrashing caused thread starvation.</li>
      <li><strong>Tail Real-Time Logs for Deadlocks or Upstream Timeouts:</strong>
        <br><code>docker logs --tail 100 --timestamps $(docker ps -qf name=api)</code>
        <br><code>docker logs --tail 100 --timestamps $(docker ps -qf name=web)</code>
        <br><em>What I'm looking for:</em> Is Qdrant timing out? Did an external LLM call (Gemini/Groq) hang without a timeout, locking Uvicorn worker threads? Did Uvicorn hit an unhandled exception during lifespan?</li>
      <li><strong>Mitigate & Restore:</strong> If the API is deadlocked, execute a clean rolling restart: <code>docker service update --force legalbuddy_api</code>. Once restored, capture logs and dump state for post-mortem analysis."</li>
    </ol>
  </div>
</div>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: EXPERT</span>
    <span class="badge badge-red">WAR ROOM INCIDENT</span>
    <div class="qa-title">Q5: "During GGUF conversion of Gemma-4-31B on Azure, the SSH session hangs, CPU drops to 0%, and the VM becomes totally unresponsive. What is happening inside the Linux kernel, and how do you architecturally prevent it?"</div>
    <div class="qa-trap">The Trap: Testing deep understanding of Linux Virtual Memory Management (VMM), swap thrashing, anonymous page eviction, and disk I/O queuing.</div>
  </div>
  <div class="qa-flawed">
    <strong>Junior Answer:</strong> "The VM ran out of memory, so I would just restart the VM and use a bigger instance." <em>(Doesn't explain why SSH froze or the kernel mechanism.)</em>
  </div>
  <div class="qa-answer">
    <strong>Staff DevOps Defense:</strong><br>
    "This is classic <strong>Swap Thrashing / Kswapd Lockup</strong>:
    <ul>
      <li><strong>Kernel Mechanism:</strong> When <code>convert_hf_to_gguf.py</code> parses 31 billion weights (~62GB uncompressed), memory allocations exceed physical RAM. The Linux kernel's page allocator invokes <code>kswapd</code> to aggressively page out anonymous memory to our 64GB swap file. As working set memory exceeds physical RAM, the CPU spends 99% of its cycles waiting on synchronous NVMe disk I/O (<code>iowait</code>) to swap pages back and forth rather than executing instructions.</li>
      <li><strong>Why SSH Froze:</strong> The SSH daemon (<code>sshd</code>) and user shell processes had their text and stack pages evicted to swap. When incoming TCP packets arrived, the kernel had to swap them back in from a saturated disk I/O queue, causing SSH to hang and look completely dead.</li>
      <li><strong>Architectural Prevention & Remediation:</strong>
        <ol>
          <li><strong>Tune Linux Kernel Swappiness:</strong> Lower <code>vm.swappiness</code> from default 60 to 10 (<code>sudo sysctl vm.swappiness=10</code>). This instructs the kernel to prefer evicting page cache rather than swapping active application heap pages.</li>
          <li><strong>Tune Dirty Page Ratios:</strong> Set <code>vm.dirty_ratio=10</code> and <code>vm.dirty_background_ratio=5</code> to flush I/O continuously in smaller chunks rather than blocking the I/O bus with massive 10GB write bursts.</li>
          <li><strong>Storage QoS:</strong> Place the swap file on an ephemeral NVMe data disk (<code>/dev/sdc</code> formatted as XFS) with striped read/write IOPS, completely separate from the OS disk (<code>/dev/sda</code>). This ensures system daemons and SSH remain responsive even during heavy swap operations.</li>
          <li><strong>Chunked Processing:</strong> Use <code>--outtype f16</code> streaming conversion flags in <code>convert_hf_to_gguf.py</code> to process tensor tensors incrementally rather than loading all shard safetensors simultaneously into memory."</li>
        </ol>
      </li>
    </ul>
  </div>
</div>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: HARD</span>
    <span class="badge badge-amber">CI/CD & BUILD DRIFT</span>
    <div class="qa-title">Q6: "A junior developer adds a new package to pyproject.toml. CI passes, but production crashes with 'CUDA error: out of memory' on boot. How did this happen if you pinned CPU PyTorch, and how do you enforce a strict lock?"</div>
    <div class="qa-trap">The Trap: Testing understanding of uv lockfile resolution, dependency tree conflicts, and CI gate enforcement.</div>
  </div>
  <div class="qa-answer">
    <strong>Senior DevOps Answer:</strong><br>
    "This occurs when a developer adds a package that depends on <code>torch</code> (like <code>torchvision</code> or <code>torchaudio</code>) and runs <code>uv add &lt;package&gt;</code> without specifying the custom index, or updates dependencies without the <code>--frozen</code> flag.<br><br>
    If the package requests a PyPI wheel that doesn't respect our <code>pytorch-cpu</code> source, Astral <code>uv</code> might resolve the dependency to the default PyPI index, pulling down standard CUDA-enabled wheels.
    <br><br>
    <strong>How We Enforce Strict Immutability:</strong>
    <ul>
      <li><strong>Index Isolation (<code>explicit = true</code>):</strong> In <code>pyproject.toml</code>, the <code>pytorch-cpu</code> index has <code>explicit = true</code>. This forbids <code>uv</code> from using it as a general fallback, forcing explicit source mapping.</li>
      <li><strong>CI Enforcement Gate:</strong> In <code>.github/workflows/ci.yml</code>, the CI job runs <code>uv sync --frozen --check</code>. The <code>--check</code> flag asserts that <code>uv.lock</code> matches <code>pyproject.toml</code> exactly. If any dependency is out of sync or unlocked, CI aborts immediately.</li>
      <li><strong>Lockfile Inspection Step:</strong> We add an automated CI check:
        <br><code>uv run python -c "import torch; assert not torch.cuda.is_available(); assert '+cpu' in torch.__version__"</code>
        <br>If any CUDA dynamic library is bundled, the assertion raises an error and blocks the merge before Dokploy ever receives a webhook."</li>
    </ul>
  </div>
</div>

<!-- CATEGORY 3: MLOPS, MODEL HARDWARE MATH & AZURE SERVING -->
<h2>Category 3: MLOps, Hardware Math & Azure Model Serving</h2>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: EXPERT</span>
    <span class="badge badge-blue">HARDWARE MATH</span>
    <div class="qa-title">Q7: "Prove to me with exact numbers why Gemma-2-27B requires ~54GB in FP16, and calculate the exact VRAM needed for Q4_K_M quantization with a 4,096 context window."</div>
    <div class="qa-trap">The Trap: Interviewers hate hand-waving. They want exact mathematical derivations of model parameters, byte precision, KV cache size, and activation overhead.</div>
  </div>
  <div class="qa-answer">
    <strong>Staff MLOps Mathematical Derivation:</strong><br>
    "Here is the precise hardware calculation:
    <ol>
      <li><strong>Model Weight Memory (FP16 / 16-bit):</strong>
        <br>• Parameters ($N$): $27 \times 10^9$ parameters (27 billion).
        <br>• Precision: FP16 uses 2 bytes per parameter (16 bits / 8 bits = 2 bytes).
        <br>• Base Weight VRAM: $27 \times 10^9 \times 2 \text{ bytes} = 54 \times 10^9 \text{ bytes} \approx \mathbf{50.3\text{ GiB}}$ (or 54 GB in decimal).
        <br>• Plus model architecture overhead (embeddings, layer norms, unembedding projection): $\approx \mathbf{54\text{ GB}}$.</li>
      <li><strong>Quantization to GGUF Q4_K_M (4-bit medium):</strong>
        <br>• Q4_K_M uses 4.5 bits on average per parameter (combining 4-bit blocks with 6-bit quantization scales for sensitive attention layers).
        <br>• Compressed Weights: $27 \times 10^9 \times (4.5 / 8) \text{ bytes} \approx \mathbf{15.18\text{ GB}}$ footprint on disk and VRAM.</li>
      <li><strong>KV Cache Memory at 4,096 Context Length:</strong>
        <br>• Formula: $\text{KV Cache Size} = 2 \times (\text{layers}) \times (\text{key-value heads}) \times (\text{head dimension}) \times (\text{context length}) \times (\text{bytes per element})$.
        <br>• For Gemma-2-27B: 46 layers, 16 KV heads (Grouped Query Attention), 128 head dim, FP16 precision (2 bytes).
        <br>• $\text{KV Cache} = 2 \times 46 \times 16 \times 128 \times 4,096 \times 2 \text{ bytes} \approx \mathbf{1.54\text{ GB}}$ per concurrent request.</li>
      <li><strong>Total Inference Footprint:</strong>
        <br>• Weights (15.2 GB) + KV Cache for batch 1 (1.5 GB) + Activation overhead (0.5 GB) $\approx \mathbf{17.2\text{ GB}}$.
        <br>• By setting <code>--gpu-memory-utilization 0.9</code> and running <code>llama-server</code> with offloaded context, it fits cleanly on an affordable 16GB T4/L4 GPU VM (using minimal CPU offloading for excess KV cache), eliminating the need for an expensive 80GB A100."</li>
    </ol>
  </div>
</div>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: HARD</span>
    <span class="badge badge-blue">MLOPS ARCHITECTURE</span>
    <div class="qa-title">Q8: "Why did you use llama-server and vLLM instead of Triton Inference Server or Ollama for serving in production?"</div>
    <div class="qa-trap">The Trap: Testing your comparative evaluation of inference engines across throughput, paged attention, operational overhead, and production readiness.</div>
  </div>
  <div class="qa-answer">
    <strong>Senior MLOps Answer:</strong><br>
    "We benchmarked these tools against our deployment targets:
    <ul>
      <li><strong>Why NOT Ollama?</strong> Ollama is fantastic for local desktop developer workflows, but it is not built for cloud production deployments. It bundles its own daemon, lacks fine-grained batch scheduling controls, hides low-level KV cache allocation parameters, and introduces extra abstraction layers that make container orchestration difficult.</li>
      <li><strong>Why NOT Triton Inference Server?</strong> NVIDIA Triton is an enterprise multi-model server, but setting up Triton with the TensorRT-LLM backend requires heavy model compilation for specific GPU compute capabilities (e.g. compiling distinct engines for Ampere vs Hopper vs Ada), producing rigid engine artifacts that cannot easily migrate between cloud VM types. The operational burden and build times (30+ minutes per engine) were disproportionate.</li>
      <li><strong>Why vLLM & llama.cpp?</strong>
        <br>• <strong>vLLM:</strong> Industry gold standard for high-concurrency serving. Its <em>PagedAttention</em> algorithm manages KV cache like virtual memory paging in an OS kernel, achieving 2–4x higher throughput under multi-user concurrency with dynamic continuous batching.
        <br>• <strong>llama.cpp (llama-server):</strong> Zero-dependency C/C++ binary with negligible memory overhead. It supports GGUF Q4_K_M quantization natively and exposes an OpenAI-compatible <code>/v1/chat/completions</code> endpoint with built-in streaming (SSE), allowing us to hot-swap models without changing any client-side code in FastAPI."</li>
    </ul>
  </div>
</div>

<!-- CATEGORY 4: VECTOR DATABASE & DATA PIPELINE RESILIENCE -->
<h2>Category 4: Vector Database & Data Pipeline Resilience</h2>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: EXPERT</span>
    <span class="badge badge-amber">ZERO-DOWNTIME MIGRATION</span>
    <div class="qa-title">Q9: "When you upgraded from triBne-e5-small (384-dim) to multilingual-e5-base (768-dim), how did you execute the collection recreation without causing downtime for users?"</div>
    <div class="qa-trap">The Trap: Testing blue/green database migration strategies, vector index rebuild zero-downtime patterns, and configuration management.</div>
  </div>
  <div class="qa-flawed">
    <strong>Junior Answer:</strong> "We ran <code>uv run ingest</code>, which dropped the collection and re-created it." <em>(During ingestion, which takes 30-45 minutes, every user query fails with 500 CollectionNotFound!)</em>
  </div>
  <div class="qa-answer">
    <strong>Staff DevOps Migration Strategy:</strong><br>
    "In vector search, changing embedding dimensions from 384 to 768 is a breaking schema migration—a collection cannot store mixed vector dimensions.
    <br><br>
    We executed a <strong>Blue/Green Collection Alias Migration</strong>:
    <ol>
      <li><strong>Ingest to Shadow Collection (Green):</strong> Ingested the 35,000+ sections into a brand-new collection named <code>legal_acts_v2_768</code> using the 768-dim model. The live production API continued querying the active collection (<code>legal_acts_v1_384</code>) without any interruption.</li>
      <li><strong>Readiness & Verification Gate:</strong> Ran our evaluation harness (<code>eval/run_eval.py --collection legal_acts_v2_768</code>) against the new collection to verify recall metrics and ensure all payload indexes (<code>act_year</code>, <code>section_uid</code>) were fully built.</li>
      <li><strong>Atomic Alias Swap:</strong> In Qdrant, we used the collection aliases API to atomically re-point the production alias:
        <pre><code>client.update_collection_aliases(
    change_aliases_operations=[
        models.CreateAliasOperation(
            collection_name="legal_acts_v2_768", alias_name="legal_acts_event_rag_full"
        )
    ]
)</code></pre>
        This alias update is an atomic in-memory pointer swap in Qdrant—zero dropped packets, zero 500 errors.</li>
      <li><strong>Configuration Update & Cleanup:</strong> Updated <code>EMBEDDING_MODEL</code> in Dokploy to <code>intfloat/multilingual-e5-base</code> and deployed the API. Once stable, dropped the legacy <code>legal_acts_v1_384</code> collection to reclaim RAM."</li>
    </ol>
  </div>
</div>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: HARD</span>
    <span class="badge badge-amber">RESILIENCE & FAILURES</span>
    <div class="qa-title">Q10: "During bulk ingestion of 35,000 legal sections, Qdrant crashes with an OOM kill. How do you tune Qdrant's HNSW indexing to survive on constrained hardware?"</div>
    <div class="qa-trap">The Trap: Testing vector database internals, HNSW graph parameters, memtable flush rates, and disk payload storage.</div>
  </div>
  <div class="qa-answer">
    <strong>Senior DevOps Answer:</strong><br>
    "When Qdrant ingests high-dimensional vectors (768 floats $\times$ 4 bytes = ~3KB per vector plus metadata), memory spikes are caused by simultaneous <strong>HNSW graph construction</strong> and in-memory vector indexing.
    <br><br>
    To guarantee ingestion stability on constrained hardware:
    <ul>
      <li><strong>Disable Indexing During Ingestion:</strong> In Qdrant's collection configuration, set <code>indexing_threshold: 0</code> during bulk upsert. This instructs Qdrant to append points directly to WAL (Write-Ahead-Log) segments on disk without continuously building the HNSW graph in RAM. Once ingestion completes, restore <code>indexing_threshold: 20000</code> to build the graph in a single pass.</li>
      <li><strong>On-Disk Payloads & Vectors:</strong> Configure <code>on_disk_payload: true</code> and <code>on_disk: true</code> for vectors in <code>HnswConfig</code>. This stores the vector data in memory-mapped files on disk rather than holding the entire index in physical RAM.</li>
      <li><strong>Batch Size & Concurrency Throttling:</strong> In <code>apps/ingestion/pipeline.py</code>, we throttled batch upserts to 64 points per batch and implemented exponential backoff retries (<code>upsert_with_retry</code> with 4 attempts and <code>sleep(2 * attempt)</code>). This flushes memory buffers consistently and prevents thread exhaustion."</li>
    </ul>
  </div>
</div>

<!-- CATEGORY 5: LINUX KERNEL, SECURITY & SYSTEM DESIGN -->
<h2>Category 5: Linux Internals, Security & Scale-Out System Design</h2>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: HARD</span>
    <span class="badge badge-purple">CONTAINER SECURITY</span>
    <div class="qa-title">Q11: "Why is running as non-root critical in our Dockerfiles, and what specific Linux capabilities did you drop or preserve?"</div>
    <div class="qa-trap">The Trap: Testing understanding of Linux namespaces, cgroups, UID mapping, and container breakout vulnerabilities.</div>
  </div>
  <div class="qa-answer">
    <strong>Senior DevOps Answer:</strong><br>
    "In Docker, the <code>root</code> user inside a container has UID 0—which maps directly to UID 0 (root) on the host Linux kernel unless user namespaces (<code>userns-remap</code>) are explicitly enabled. If an attacker exploits a remote code execution vulnerability (e.g. through a Python deserialization bug or library vulnerability) in a container running as root, any container breakout flaw (such as kernel cgroup escapes or mounted socket access) grants them full root privileges over the host operating system.
    <br><br>
    In our Dockerfiles:
    <ul>
      <li>In <code>apps/api/Dockerfile</code>, we create system user <code>app</code> and switch to <code>USER app</code>.</li>
      <li>In <code>apps/web/Dockerfile</code>, we create group <code>nodejs (1001)</code> and user <code>nextjs (1001)</code> and switch to <code>USER nextjs</code>.</li>
      <li>In production Swarm configs, we drop all default Linux capabilities and retain only those strictly required for unprivileged networking:
        <br><code>cap_drop: [ALL]</code>, granting zero raw socket manipulation, zero module loading, and zero mount capabilities."</li>
    </ul>
  </div>
</div>

<div class="qa-card">
  <div class="qa-header">
    <span class="badge badge-red">DIFFICULTY: EXPERT</span>
    <span class="badge badge-blue">SCALE-OUT SYSTEM DESIGN</span>
    <div class="qa-title">Q12: "Design an enterprise architecture for LegalBuddy to scale from our single 8GB VM to handling 10 million legal queries per day across Bangladesh with sub-200ms latency. Keep infrastructure costs under $1,500/month."</div>
    <div class="qa-trap">The Trap: Testing your ability to transition from a prototype/MVP architecture to a production multi-tier, distributed, auto-scaling cloud architecture with cost optimization.</div>
  </div>
  <div class="qa-answer">
    <strong>Staff Infrastructure Architecture Blueprint:</strong><br>
    "To handle 10M queries/day ($\approx 115 \text{ queries/sec}$ average, $\sim 350\text{ QPS}$ peak) at sub-200ms within a $1,500/month budget:
    <ol>
      <li><strong>Tier 1: Global Edge & Semantic Caching:</strong>
        <br>• Place Cloudflare CDN in front of Next.js to cache static assets and common legal queries at the edge.
        <br>• Implement a <strong>Redis Semantic Cache</strong> (Upstash / Redis Cloud): 30–40% of public legal queries ('punishment for theft', 'section 302 bail rules') are identical. Hashing query embeddings and matching with cosine similarity $\ge 0.98$ returns cached responses in &lt;15ms, bypassing LLM generation and vector search completely.</li>
      <li><strong>Tier 2: Stateless Compute (Next.js & FastAPI):</strong>
        <br>• Deploy Next.js and FastAPI on <strong>Azure Container Apps (ACA)</strong> or AWS ECS Fargate with KEDA auto-scaling based on incoming HTTP request rates ($2 \rightarrow 12$ replicas during business hours).
        <br>• Decouple the embedding model from FastAPI into an independent microservice or utilize a dedicated CPU/GPU Triton instance with dynamic request batching.</li>
      <li><strong>Tier 3: Clustered Qdrant Vector Engine:</strong>
        <br>• Move Qdrant to a 2-node replicated cluster with memory-mapped vector storage on NVMe SSDs. With payload indexes on <code>act_year</code> and <code>section_uid</code>, filtered vector search takes &lt;10ms.</li>
      <li><strong>Tier 4: Hybrid LLM Routing:</strong>
        <br>• <strong>Primary Inference:</strong> Self-hosted quantized Gemma-4-31B Q4_K_M on 2x Azure Spot GPU instances (e.g. <code>NC4as_T4_v3</code> or L4) behind an internal load balancer (~$450/month on Spot).
        <br>• <strong>Burst / Overflow Fallback:</strong> If concurrency spikes and GPU queue latency exceeds 400ms, dynamically route excess traffic to Groq API (Llama-3.3-70B at $0.59/1M tokens) or Gemini Flash.</li>
      <li><strong>Cost Breakdown:</strong> Edge & Redis ($80) + Container Apps ($220) + Qdrant Cluster ($300) + 2x Spot GPU VMs ($500) + Cloudflare & Monitoring ($100) $\approx \mathbf{\$1,200/\text{month}}$ total."</li>
    </ol>
  </div>
</div>

</body>
</html>
"""

def generate_pdf(output_path: str):
    print(f"Generating Challenging Questions PDF at {output_path}...")
    font_config = weasyprint.text.fonts.FontConfiguration()
    html = weasyprint.HTML(string=HTML_CONTENT)
    html.write_pdf(output_path, font_config=font_config)
    print("PDF generation complete!")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "LegalBuddy_DevOps_Challenging_Interview_Questions.pdf"
    generate_pdf(out)
