/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Cases for Phase C.1 PDF Export Quality Assurance
 */

import { ResumeData } from '../../../types/resume.ts';

export const TEST_CASE_A_SHORT_STUDENT: ResumeData = {
  id: 'test-case-a',
  title: 'Case A: Short Student Resume (1 Page)',
  updatedAt: new Date().toISOString(),
  templateId: 'modern',
  personalInfo: {
    fullName: 'Aarav Sharma',
    professionalTitle: 'Computer Science Undergraduate',
    email: 'aarav.sharma@college.edu',
    phone: '+91 98765 12345',
    location: 'Bangalore, India',
    linkedin: 'linkedin.com/in/aaravsharma-cs',
    github: 'github.com/aaravsharma',
    website: 'aaravsharma.dev',
    summary: 'Third-year Computer Science student specializing in scalable web systems and algorithmic problem solving. Seeking a Software Engineering Internship for Summer 2025.',
    showPhoto: false,
  },
  education: [
    {
      id: 'edu-1',
      institution: 'National Institute of Technology',
      degree: 'B.Tech in Computer Science and Engineering',
      fieldOfStudy: 'Computer Science',
      startDate: '2022',
      endDate: '2026',
      scoreOrGpa: '8.92 / 10.0',
    },
  ],
  skills: {
    technical: ['C++', 'Python', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git', 'Docker'],
    soft: ['Analytical Thinking', 'Team Collaboration', 'Effective Communication'],
  },
  projects: [
    {
      id: 'proj-1',
      title: 'Campus Lost & Found Platform',
      role: 'Full Stack Developer',
      techStack: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      description: 'Built a centralized campus item-recovery system serving over 4,000 university students with automated email claim notifications.',
      bullets: [
        'Implemented indexed full-text search reducing item discovery latency by 45%.',
        'Integrated campus single sign-on (SSO) verifying student credentials securely.',
      ],
      liveUrl: 'https://campus-lostfound-demo.org',
      repoUrl: 'https://github.com/aaravsharma/campus-lostfound',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Department of Computer Science',
      position: 'Undergraduate Teaching Assistant — Data Structures',
      location: 'Campus',
      startDate: 'Aug 2024',
      endDate: 'Present',
      description: 'Conducted weekly lab sessions on trees, graphs, and dynamic programming for 80+ second-year students.',
      bullets: [
        'Evaluated lab assignments and developed automated autograding test suites in C++.',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issueDate: '2024',
    },
  ],
};

export const TEST_CASE_B_MEDIUM_INTERNSHIP: ResumeData = {
  id: 'test-case-b',
  title: 'Case B: Medium Internship Resume (2 Pages)',
  updatedAt: new Date().toISOString(),
  templateId: 'classic',
  personalInfo: {
    fullName: 'Priya Venkatesh',
    professionalTitle: 'Software Engineering & Cloud Systems Intern',
    email: 'priya.venkatesh@techuniv.edu',
    phone: '+91 98111 22334',
    location: 'Hyderabad, India',
    linkedin: 'linkedin.com/in/priyavenkatesh',
    github: 'github.com/priyavenkat',
    website: 'priyavenkat.tech',
    summary: 'Final-year Computer Science student with practical production experience building microservices and cloud automation pipelines. Proven ability to reduce query latency and automate CI/CD deployments.',
    showPhoto: false,
  },
  education: [
    {
      id: 'edu-1',
      institution: 'Indian Institute of Information Technology',
      degree: 'B.Tech in Information Technology',
      fieldOfStudy: 'Information Technology',
      startDate: '2021',
      endDate: '2025',
      scoreOrGpa: '9.15 / 10.0 CGPA',
    },
    {
      id: 'edu-2',
      institution: 'Delhi Public School',
      degree: 'Higher Secondary Certificate (CBSE Class XII)',
      fieldOfStudy: 'Physics, Chemistry, Mathematics',
      startDate: '2019',
      endDate: '2021',
      scoreOrGpa: '96.4%',
    },
  ],
  skills: {
    technical: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'React', 'TypeScript', 'Kubernetes', 'Redis', 'PostgreSQL', 'Docker'],
    soft: ['Agile / Scrum', 'Cross-Functional Collaboration', 'System Architecture'],
    tools: ['Git', 'Linux', 'GitHub Actions', 'Grafana', 'Prometheus'],
  },
  projects: [
    {
      id: 'proj-1',
      title: 'Distributed Distributed Task Queue',
      role: 'Lead Architect',
      techStack: ['Go', 'Redis', 'PostgreSQL', 'Docker'],
      description: 'Engineered a fault-tolerant asynchronous job queue with dead-letter exchanges and exponential backoff retry policies.',
      bullets: [
        'Benchmarked task processing throughput exceeding 12,000 tasks/second with sub-5ms Redis latency.',
        'Designed graceful worker shutdown ensuring zero in-flight task loss during rolling cluster updates.',
        'Built Prometheus metrics exporter monitoring queue lag, worker memory, and failure rates.',
      ],
      liveUrl: 'https://taskqueue-demo.priyavenkat.tech',
      repoUrl: 'https://github.com/priyavenkat/distributed-task-queue',
    },
    {
      id: 'proj-2',
      title: 'Real-Time Collaborative Code Editor',
      role: 'Frontend & WebSocket Developer',
      techStack: ['TypeScript', 'React', 'Node.js', 'WebSocket', 'CRDT'],
      description: 'Developed an in-browser multiplayer code editor with operational transformation and multi-cursor synchronization.',
      bullets: [
        'Implemented Yjs CRDT protocol resolving concurrent keystrokes across geographically distributed clients.',
        'Added syntax highlighting for 14 programming languages with Monaco Editor integration.',
        'Containerized code execution sandbox executing Python, C++, and JavaScript with strict time limits.',
      ],
      liveUrl: 'https://codecollab.priyavenkat.tech',
      repoUrl: 'https://github.com/priyavenkat/realtime-code-editor',
    },
    {
      id: 'proj-3',
      title: 'Smart Campus Shuttle Tracker',
      role: 'Mobile & Backend Developer',
      techStack: ['FastAPI', 'PostgreSQL', 'Leaflet.js', 'MQTT'],
      description: 'GPS telemetry platform tracking 12 campus transit shuttles in real time for 8,500 daily university commuters.',
      bullets: [
        'Streamed vehicle coordinates over MQTT with sub-second websocket client broadcast.',
        'Reduced student wait times by an estimated 18 minutes through predictive arrival algorithms.',
      ],
      repoUrl: 'https://github.com/priyavenkat/shuttle-tracker',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Razorpay Technologies',
      position: 'Backend Software Engineering Intern',
      location: 'Bangalore, India',
      startDate: 'May 2024',
      endDate: 'Jul 2024',
      description: 'Worked with the Merchant Settlements team optimizing payment reconciliation batches and idempotency safeguards.',
      bullets: [
        'Refactored batch settlement SQL queries reducing nightly execution window from 42 minutes to 16 minutes.',
        'Implemented Redis distributed locks preventing duplicate payout dispatches under concurrent webhooks.',
        'Wrote 45+ unit and integration tests achieving 91% code coverage on settlement reconciliation modules.',
      ],
    },
    {
      id: 'exp-2',
      company: 'Cloud Computing Research Lab',
      position: 'Student Research Assistant',
      location: 'IIIT Hyderabad',
      startDate: 'Jan 2024',
      endDate: 'May 2024',
      description: 'Conducted research on serverless function cold-start latency mitigation under fluctuating traffic patterns.',
      bullets: [
        'Benchmarked OpenFaaS container provisioning times across varied Linux kernel cgroup configurations.',
        'Co-authored research paper draft accepted at National Student Cloud Computing Symposium.',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'Kubernetes and Cloud Native Associate (KCNA)',
      issuer: 'Linux Foundation & CNCF',
      issueDate: '2024',
    },
    {
      id: 'cert-2',
      name: 'Oracle Certified Professional: Java SE 11 Developer',
      issuer: 'Oracle',
      issueDate: '2023',
    },
  ],
};

export const TEST_CASE_C_LONG_RESUME: ResumeData = {
  id: 'test-case-c',
  title: 'Case C: Long Resume (3+ Pages)',
  updatedAt: new Date().toISOString(),
  templateId: 'modern',
  personalInfo: {
    fullName: 'Dr. Siddharth Mukherjee',
    professionalTitle: 'Senior Research Scholar & Distributed Systems Specialist',
    email: 'siddharth.mukherjee@research.edu',
    phone: '+91 99887 76655',
    location: 'New Delhi, India',
    linkedin: 'linkedin.com/in/siddharth-mukherjee',
    github: 'github.com/smukherjee-research',
    website: 'https://smukherjee.org',
    summary: 'Doctoral researcher with 5+ years of extensive research in consensus algorithms, Byzantine fault tolerance, and verifiable computing. Author of 6 peer-reviewed conference publications with substantial industrial engineering contributions across distributed storage engines.',
    showPhoto: false,
  },
  education: [
    {
      id: 'edu-1',
      institution: 'Indian Institute of Technology Delhi',
      degree: 'Ph.D. in Computer Science & Engineering',
      fieldOfStudy: 'Distributed Systems & Cryptography',
      startDate: '2021',
      endDate: '2025',
      scoreOrGpa: '9.45 / 10.0',
    },
    {
      id: 'edu-2',
      institution: 'Indian Institute of Science Bangalore',
      degree: 'Master of Technology in Computer Science',
      fieldOfStudy: 'Computer Systems',
      startDate: '2019',
      endDate: '2021',
      scoreOrGpa: '9.60 / 10.0',
    },
    {
      id: 'edu-3',
      institution: 'Jadavpur University',
      degree: 'Bachelor of Engineering in Computer Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2015',
      endDate: '2019',
      scoreOrGpa: '8.88 / 10.0',
    },
  ],
  skills: {
    technical: ['Rust', 'C++', 'Go', 'Distributed Consensus (Raft/Paxos)', 'Zero-Knowledge Proofs', 'Linux eBPF', 'RocksDB', 'Formal Verification (TLA+)', 'PostgreSQL'],
    soft: ['Doctoral Mentorship', 'Grant Proposal Writing', 'Research Dissemination', 'Technical Leadership'],
    tools: ['Docker', 'Kubernetes', 'Perf / Valgrind', 'QEMU', 'CMake', 'GitLab CI'],
  },
  projects: [
    {
      id: 'proj-1',
      title: 'VeriSync: High-Throughput BFT State Machine',
      role: 'Principal Researcher',
      techStack: ['Rust', 'Tokio', 'RocksDB', 'BLS Signatures'],
      description: 'A novel Byzantine fault-tolerant consensus protocol decoupling transaction ordering from execution pipeline.',
      bullets: [
        'Formally verified safety and liveness invariants using TLA+ specification checker.',
        'Achieved 140,000 transactions/second with sub-second finality across a 64-node geo-distributed WAN testbed.',
        'Optimized network serialization using zero-copy byte buffers cutting CPU cycles per block by 32%.',
        'Published architecture paper in ACM Symposium on Operating Systems Principles (SOSP 2024).',
      ],
      liveUrl: 'https://verisync.smukherjee.org',
      repoUrl: 'https://github.com/smukherjee-research/verisync',
    },
    {
      id: 'proj-2',
      title: 'KernelFlow: eBPF Network Observability Daemon',
      role: 'Systems Programmer',
      techStack: ['C', 'eBPF', 'Go', 'Prometheus'],
      description: 'Kernel-space packet tracking agent monitoring TCP socket lifecycle and socket buffer queue delays.',
      bullets: [
        'Captured TCP retransmits and window stalls directly in kernel space with negligible (< 0.8%) overhead.',
        'Exported OpenTelemetry flow traces to Grafana tempo for microservice latency bottleneck analysis.',
      ],
      repoUrl: 'https://github.com/smukherjee-research/kernelflow',
    },
    {
      id: 'proj-3',
      title: 'PebbleStore: Append-Only Write-Optimized Log',
      role: 'Core Contributor',
      techStack: ['C++', 'Direct I/O', 'io_uring'],
      description: 'Storage engine optimized for NVMe SSD drives taking advantage of Linux io_uring asynchronous system calls.',
      bullets: [
        'Surpassed standard synchronous append benchmarks by 3.8x under random multi-threaded workloads.',
        'Implemented lock-free ring buffer for write request batching and concurrent epoch flushes.',
      ],
      repoUrl: 'https://github.com/smukherjee-research/pebblestore',
    },
    {
      id: 'proj-4',
      title: 'CertiCrypt: Formally Verified Cryptographic Library',
      role: 'Lead Developer',
      techStack: ['OCaml', 'Coq', 'C'],
      description: 'Constant-time elliptic curve arithmetic implementation formally verified against timing side-channel leaks.',
      bullets: [
        'Machine-checked proof in Coq guaranteeing absence of integer overflow and timing variance.',
      ],
      repoUrl: 'https://github.com/smukherjee-research/certicrypt',
    },
    {
      id: 'proj-5',
      title: 'AegisDB: Hardware-Enclave Encrypted Database',
      role: 'Co-Investigator',
      techStack: ['C++', 'Intel SGX', 'SQLite', 'AES-GCM'],
      description: 'Confidential database engine executing relational queries inside hardware-protected memory enclaves.',
      bullets: [
        'Mitigated memory access pattern side channels via oblivious RAM (ORAM) tree shuffling.',
        'Sustained 4,500 encrypted SQL transactions per second with under 12% enclave context-switch overhead.',
      ],
      repoUrl: 'https://github.com/smukherjee-research/aegisdb',
    },
    {
      id: 'proj-6',
      title: 'SimMesh: Peer-to-Peer Epidemic Dissemination Simulator',
      role: 'Research Programmer',
      techStack: ['Python', 'SimPy', 'NetworkX', 'NumPy'],
      description: 'Large-scale discrete event simulator modeling probabilistic gossip protocols across 50,000 simulated nodes.',
      bullets: [
        'Analyzed message propagation latency across diverse power-law network graphs.',
        'Presented findings at ACM SIGMETRICS student poster track.',
      ],
      repoUrl: 'https://github.com/smukherjee-research/simmesh',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Microsoft Research',
      position: 'Research Intern — Systems & Networking Group',
      location: 'Redmond, WA (Remote)',
      startDate: 'Jun 2023',
      endDate: 'Dec 2023',
      description: 'Investigated multi-tenant performance isolation in distributed storage engines for Azure cloud infrastructure.',
      bullets: [
        'Designed weighted fair-queuing scheduler preventing noisy neighbors from starving tail latency sensitive storage requests.',
        'Filed 2 US patents on adaptive token-bucket rate limiting for cloud shared storage volumes.',
      ],
    },
    {
      id: 'exp-2',
      company: 'Google Cloud Platform',
      position: 'Software Engineering Intern — Cloud Spanner',
      location: 'Hyderabad, India',
      startDate: 'May 2020',
      endDate: 'Aug 2020',
      description: 'Worked on Paxos leader election stability under asymmetric network partitioning.',
      bullets: [
        'Simulated network disruption topologies using Jepsen testing framework to validate fault tolerance.',
        'Improved failover detection latency by 28% without triggering false leader elections.',
      ],
    },
    {
      id: 'exp-3',
      company: 'IIT Delhi Department of CSE',
      position: 'Head Teaching Assistant & Lab Coordinator',
      location: 'New Delhi, India',
      startDate: 'Jan 2022',
      endDate: 'May 2024',
      description: 'Managed 8 subordinate teaching assistants and oversaw lab curriculum for Advanced Operating Systems course.',
      bullets: [
        'Authored 4 complex programming assignments on virtual memory paging and xv6 operating system kernel hacking.',
      ],
    },
    {
      id: 'exp-4',
      company: 'Oracle India Development Center',
      position: 'Member of Technical Staff — Core Database Engine',
      location: 'Bangalore, India',
      startDate: 'Jul 2019',
      endDate: 'Jul 2021',
      description: 'Maintained redo log buffer caching and write-ahead logging (WAL) serialization routines.',
      bullets: [
        'Patched race condition in shared memory lock acquisition under extreme latch contention.',
        'Received Engineering Excellence spot award for zero customer-reported regressions in database release 21c.',
      ],
    },
  ],
  positionsOfResponsibility: [
    {
      id: 'pos-1',
      role: 'General Secretary — Association for Computing Machinery (ACM) Student Chapter',
      organization: 'IIT Delhi',
      duration: '2022 – 2024',
      description: 'Organized national technical symposium with 1,200 participants and 18 invited corporate tech talks.',
      bullets: [
        'Spearheaded diversity in computing initiative increasing female conference participation by 35%.',
      ],
    },
    {
      id: 'pos-2',
      role: 'Peer Reviewer',
      organization: 'IEEE Transactions on Dependable and Secure Computing',
      duration: '2023 – Present',
      description: 'Reviewed 14 manuscript submissions on consensus protocols and distributed fault models.',
      bullets: [],
    },
  ],
  achievements: [
    'Prime Minister Research Fellowship (PMRF) awardee for exceptional doctoral research (2021–2025).',
    'Best Paper Award at Asia-Pacific Systems Workshop (APSys 2023).',
    'ACM ICPC World Finalist representing India at Porto, Portugal (2019).',
  ],
  coursework: [
    'Advanced Distributed Systems',
    'Formal Methods & Verification',
    'Applied Cryptography',
    'Kernel Architecture & Virtualization',
    'Storage Systems Engineering',
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'Certified Information Systems Security Professional (CISSP)',
      issuer: '(ISC)²',
      issueDate: '2022',
    },
  ],
};

export const TEST_CASE_D_LONG_CONTACT: ResumeData = {
  id: 'test-case-d',
  title: 'Case D: Long Email & Multiple Contact Links',
  updatedAt: new Date().toISOString(),
  templateId: 'minimal',
  personalInfo: {
    fullName: 'Ananya Ramachandra-Krishnamurthy',
    professionalTitle: 'Computational Bioinformatician & Genomic Data Scientist',
    email: 'ananya.ramachandra.krishnamurthy.ugrad2024.bioengineering@interdisciplinary-sciences.iitdelhi.ac.in',
    phone: '+91 (080) 2345-6789 / +91 99880 11223',
    location: 'Indian Institute of Science Campus, CV Raman Avenue, Bangalore, Karnataka 560012, India',
    linkedin: 'https://linkedin.com/in/ananya-ramachandra-krishnamurthy-computational-genomics-research',
    github: 'https://github.com/ananya-krishnamurthy-algorithms-computational-biology',
    website: 'https://genomics-research.ananya-krishnamurthy-portfolio.academic-network.org',
    summary: 'Bioinformatics researcher developing deep learning models for genomic variant pathogenicity prediction and multi-omics pipeline orchestration.',
    showPhoto: false,
  },
  education: [
    {
      id: 'edu-1',
      institution: 'Indian Institute of Science, Center for Computational Biology',
      degree: 'B.S. (Research) in Computational Biology',
      fieldOfStudy: 'Bioinformatics & Machine Learning',
      startDate: '2021',
      endDate: '2025',
      scoreOrGpa: '9.30 / 10.0',
    },
  ],
  skills: {
    technical: ['Python', 'Biopython', 'R / Bioconductor', 'PyTorch', 'Nextflow', 'Snakemake', 'Docker', 'AWS Batch'],
    soft: ['Scientific Writing', 'Interdisciplinary Communication'],
  },
  projects: [
    {
      id: 'proj-1',
      title: 'VariantFlow: Nextflow Whole Genome Sequencing Pipeline',
      role: 'Lead Developer',
      techStack: ['Nextflow', 'GATK', 'BWA-MEM', 'Docker'],
      description: 'High-throughput somatic and germline variant calling pipeline orchestrated on AWS Batch with auto-scaling compute spot instances.',
      bullets: [
        'Processed 300+ patient exome datasets with 99.8% concordance against GIAB gold standards.',
      ],
      liveUrl: 'https://variantflow.academic-network.org',
      repoUrl: 'https://github.com/ananya-krishnamurthy-algorithms-computational-biology/variantflow',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Tata Institute of Fundamental Research (TIFR)',
      position: 'Summer Genomic Research Fellow',
      location: 'Mumbai, India',
      startDate: 'May 2024',
      endDate: 'Jul 2024',
      description: 'Trained transformer models on DNA sequences predicting regulatory motif mutations.',
      bullets: [
        'Outperformed baseline CNN models by 4.2% ROC-AUC on ENCODE transcription factor binding datasets.',
      ],
    },
  ],
};

export const TEST_CASE_E_PHOTO_ENABLED: ResumeData = {
  ...TEST_CASE_A_SHORT_STUDENT,
  id: 'test-case-e',
  title: 'Case E: Profile Photo Enabled',
  templateId: 'modern',
  personalInfo: {
    ...TEST_CASE_A_SHORT_STUDENT.personalInfo,
    showPhoto: true,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
};

export const TEST_CASE_F_PHOTO_DISABLED: ResumeData = {
  ...TEST_CASE_A_SHORT_STUDENT,
  id: 'test-case-f',
  title: 'Case F: Profile Photo Disabled',
  templateId: 'modern',
  personalInfo: {
    ...TEST_CASE_A_SHORT_STUDENT.personalInfo,
    showPhoto: false,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
};

export const TEST_CASE_G_MANY_BULLETS_MULTILINE: ResumeData = {
  id: 'test-case-g',
  title: 'Case G: Many Project Bullets & Multiline Descriptions',
  updatedAt: new Date().toISOString(),
  templateId: 'technical',
  personalInfo: {
    fullName: 'Rohan Mehra',
    professionalTitle: 'Full-Stack Systems & AI Infrastructure Engineer',
    email: 'rohan.mehra@devlab.io',
    phone: '+91 98765 00112',
    location: 'Pune, India',
    linkedin: 'linkedin.com/in/rohanmehra-dev',
    github: 'github.com/rohanmehra',
    website: 'rohanmehra.dev',
    summary: 'Software engineer building data-intensive applications, real-time message brokers, and ML inference engines. Passionate about system observability and clean code.',
    showPhoto: false,
  },
  education: [
    {
      id: 'edu-1',
      institution: 'College of Engineering Pune (COEP)',
      degree: 'B.Tech in Computer Engineering',
      fieldOfStudy: 'Computer Engineering',
      startDate: '2021',
      endDate: '2025',
      scoreOrGpa: '8.85 / 10.0',
    },
  ],
  skills: {
    technical: ['Rust', 'Python', 'Go', 'TypeScript', 'PostgreSQL', 'Redis', 'Kafka', 'Docker'],
    soft: ['Agile Collaboration', 'Code Reviewer'],
  },
  projects: [
    {
      id: 'proj-1',
      title: 'StreamVortex: Real-Time Telemetry & Log Aggregator',
      role: 'Creator & Lead Developer',
      techStack: ['Rust', 'Kafka', 'ClickHouse', 'React', 'TypeScript'],
      description: 'High-volume stream processing engine designed for real-time log parsing.\nProcesses billions of incoming events per day with distributed partitioned consumers.\nFeatures custom query syntax and instant sub-second histogram visualizations.',
      bullets: [
        'Engineered zero-copy memory ring buffer receiving 500,000 UDP metric packets per second.',
        'Wrote custom ClickHouse ingestion pipeline reducing storage footprint by 64% using LZ4 block compression.',
        'Built WebSocket dashboard rendering 60 FPS live charting for cluster CPU, RAM, and disk utilization.',
        'Implemented automatic anomaly detection triggering PagerDuty alerts on unusual latency spikes.',
        'Authored end-to-end integration test harness simulating chaos monkey network dropouts.',
      ],
      liveUrl: 'https://streamvortex.devlab.io',
      repoUrl: 'https://github.com/rohanmehra/streamvortex',
    },
    {
      id: 'proj-2',
      title: 'NeuralServe: Low-Latency Model Inference Proxy',
      role: 'Backend Architect',
      techStack: ['Python', 'FastAPI', 'ONNX Runtime', 'Triton', 'Redis'],
      description: 'Distributed model inference proxy supporting dynamic request batching and GPU memory scheduling.\nProvides automatic model hot-reloading without dropping active client connections.',
      bullets: [
        'Decreased P99 inference latency from 140ms to 24ms by implementing dynamic micro-batching.',
        'Integrated token bucket rate limiter preventing upstream GPU out-of-memory crash cascades.',
        'Built health check supervisor automatically failing over between primary and standby worker nodes.',
        'Supported streaming server-sent events (SSE) for LLM response token generation.',
      ],
      liveUrl: 'https://neuralserve.devlab.io',
      repoUrl: 'https://github.com/rohanmehra/neuralserve',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Zepto Delivery Systems',
      position: 'Backend Engineering Intern',
      location: 'Mumbai, India',
      startDate: 'Jan 2024',
      endDate: 'Jun 2024',
      description: 'Enhanced rider assignment routing service handling rapid order dispatches during peak hours.\nCollaborated directly with product and operations teams to optimize dispatch dispatch efficiency.',
      bullets: [
        'Refactored geospatial Redis geohash queries decreasing rider matching time by 38%.',
        'Built automated alerting pipeline tracking order drop-offs and failed delivery notifications.',
        'Mentored 3 junior summer interns on Golang testing methodologies and code linting standards.',
      ],
    },
  ],
};

export const TEST_CASE_H_COMPACT_DENSE: ResumeData = {
  id: 'test-case-h',
  title: 'Case H: Compact Template Dense 1-Page Content',
  updatedAt: new Date().toISOString(),
  templateId: 'compact',
  personalInfo: {
    fullName: 'Devansh Kulkarni',
    professionalTitle: 'Full-Stack Developer & Competitive Programmer',
    email: 'devansh.kulkarni@univ.edu',
    phone: '+91 97654 32109',
    location: 'Pune, Maharashtra',
    linkedin: 'linkedin.com/in/devanshkulkarni',
    github: 'github.com/devanshk',
    website: 'devanshk.me',
    summary: 'Competitive programmer (Codeforces Candidate Master) and full-stack developer with experience building fast, accessible web applications and distributed backends.',
    showPhoto: false,
  },
  education: [
    {
      id: 'edu-1',
      institution: 'Vishwakarma Institute of Technology',
      degree: 'B.Tech in Computer Engineering',
      fieldOfStudy: 'Computer Engineering',
      startDate: '2021',
      endDate: '2025',
      scoreOrGpa: '9.2 / 10.0',
    },
  ],
  skills: {
    technical: ['C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git', 'Linux'],
    soft: ['Algorithmic Problem Solving', 'Rapid Prototyping'],
  },
  projects: [
    {
      id: 'proj-1',
      title: 'CodeReviewAI: Automated PR Feedback Bot',
      role: 'Developer',
      techStack: ['Node.js', 'TypeScript', 'GitHub API', 'OpenAI'],
      description: 'GitHub Action bot scanning pull requests for security vulnerabilities and code style issues.',
      bullets: [
        'Adopted by 45+ open-source repositories reviewing 1,200+ pull requests automatically.',
        'Cached AST parses cutting GitHub Action runner execution cost by 50%.',
      ],
      liveUrl: 'https://codereviewai.devanshk.me',
      repoUrl: 'https://github.com/devanshk/codereview-ai',
    },
    {
      id: 'proj-2',
      title: 'QuickAlgo: Interactive Algorithm Visualizer',
      role: 'Frontend Developer',
      techStack: ['React', 'TypeScript', 'Canvas2D', 'Tailwind CSS'],
      description: 'Visual simulation tool demonstrating graph algorithms, sorting techniques, and recursion trees.',
      bullets: [
        'Used by over 15,000 students studying computer science curriculum concepts.',
      ],
      liveUrl: 'https://quickalgo.devanshk.me',
      repoUrl: 'https://github.com/devanshk/quickalgo',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Persistent Systems',
      position: 'Software Developer Intern',
      location: 'Pune, India',
      startDate: 'Jun 2024',
      endDate: 'Aug 2024',
      description: 'Built REST microservices for an enterprise cloud management dashboard.',
      bullets: [
        'Automated database migrations reducing deployment downtime from 15 minutes to zero.',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'Google Cloud Certified Associate Cloud Engineer',
      issuer: 'Google Cloud',
      issueDate: '2024',
    },
  ],
};

export const TEST_CASE_I_CLASSIC_TYPOGRAPHY: ResumeData = {
  ...TEST_CASE_A_SHORT_STUDENT,
  id: 'test-case-i',
  title: 'Case I: Classic Serif Typography & Structure',
  templateId: 'classic',
};

export const TEST_CASE_J_CONTEMPORARY_SIDEBAR_MULTIPAGE: ResumeData = {
  ...TEST_CASE_B_MEDIUM_INTERNSHIP,
  id: 'test-case-j',
  title: 'Case J: Contemporary Sidebar Legacy Multi-Page',
  templateId: 'contemporary-sidebar',
  personalInfo: {
    ...TEST_CASE_B_MEDIUM_INTERNSHIP.personalInfo,
    showPhoto: true,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
};

export const ALL_TEST_CASES = {
  case_a: TEST_CASE_A_SHORT_STUDENT,
  case_b: TEST_CASE_B_MEDIUM_INTERNSHIP,
  case_c: TEST_CASE_C_LONG_RESUME,
  case_d: TEST_CASE_D_LONG_CONTACT,
  case_e: TEST_CASE_E_PHOTO_ENABLED,
  case_f: TEST_CASE_F_PHOTO_DISABLED,
  case_g: TEST_CASE_G_MANY_BULLETS_MULTILINE,
  case_h: TEST_CASE_H_COMPACT_DENSE,
  case_i: TEST_CASE_I_CLASSIC_TYPOGRAPHY,
  case_j: TEST_CASE_J_CONTEMPORARY_SIDEBAR_MULTIPAGE,
};
