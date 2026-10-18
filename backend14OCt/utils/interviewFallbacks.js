// Deterministic local fallbacks for interview text-generation endpoints
// Used when Ollama/Groq is unavailable or returns invalid output

// ============================================================
// COMMON TECHNOLOGY DETECTION
// ============================================================

const TECH_CATEGORIES = {
  python: {
    keywords: ["python", "django", "flask", "fastapi", "pandas", "numpy", "sqlalchemy", "pytest", "celery", "redis"],
    questions: {
      technical: [
        "Explain the difference between Django's select_related and prefetch_related. When would you use each?",
        "How does Django's ORM handle database migrations? What are common pitfalls?",
        "Describe how you would implement authentication and authorization in a Django REST Framework application.",
        "What are Django signals? Provide an example of when you would use them.",
        "How do you handle database transactions in Django? What is the difference between atomic and non-atomic operations?",
        "Explain Django's middleware architecture. How would you create custom middleware?",
        "What is the difference between a ViewSet and an APIView in Django REST Framework?",
        "How do you optimize Django ORM queries to avoid N+1 problems?",
        "Explain Django's caching framework. What backends are available and when would you use each?",
        "How do you implement background tasks in Django? Compare Celery with Django-Q."
      ],
      behavioral: [
        "Describe a time when you had to debug a complex Django performance issue. What was your approach?",
        "Tell me about a time you had to migrate a Django application to a newer version. What challenges did you face?",
        "Describe a situation where you had to make a trade-off between Django's built-in features and custom implementation."
      ],
      practical: [
        "How would you design a REST API for a multi-tenant Django application?",
        "Explain how you would implement rate limiting in a Django REST API.",
        "How would you handle file uploads securely in Django?",
        "Describe your approach to testing Django applications. What tools do you use?"
      ]
    }
  },
  java: {
    keywords: ["java", "spring", "spring boot", "hibernate", "jpa", "maven", "gradle", "junit", "kafka", "microservices"],
    questions: {
      technical: [
        "Explain the difference between @Component, @Service, and @Repository in Spring. When would you use each?",
        "How does Spring's dependency injection work? What is the difference between constructor and field injection?",
        "What is the difference between @Transactional propagation REQUIRED and REQUIRES_NEW?",
        "How does Hibernate's first-level and second-level cache work?",
        "Explain the difference between JPA's EntityManager and Spring's JpaRepository.",
        "What are Spring profiles? How do you configure environment-specific beans?",
        "How does Spring Security's filter chain work? Explain the difference between authentication and authorization filters.",
        "What is the difference between @RestController and @Controller in Spring MVC?",
        "Explain Spring's event-driven architecture. How do you publish and listen to custom events?",
        "How do you handle database migrations in Spring? Compare Flyway and Liquibase."
      ],
      behavioral: [
        "Describe a time when you had to debug a Spring transaction issue. What was the root cause?",
        "Tell me about a time you had to refactor a monolithic Spring application into microservices.",
        "Describe a situation where you had to choose between Spring's built-in features and a third-party library."
      ],
      practical: [
        "How would you implement a circuit breaker pattern in a Spring Boot microservice?",
        "Explain how you would implement distributed tracing in a Spring Cloud application.",
        "How would you handle configuration management across multiple Spring Boot services?",
        "Describe your approach to testing Spring applications. What is the difference between @MockBean and @Mock?"
      ]
    }
  },
  javascript: {
    keywords: ["javascript", "typescript", "react", "node", "express", "next.js", "vue", "angular", "webpack", "jest", "npm"],
    questions: {
      technical: [
        "Explain the difference between var, let, and const in JavaScript. What is hoisting?",
        "What is the event loop in Node.js? Explain the difference between microtasks and macrotasks.",
        "What are React hooks? Explain the difference between useState, useEffect, and useMemo.",
        "Explain the difference between controlled and uncontrolled components in React.",
        "What is the virtual DOM? How does React's reconciliation algorithm work?",
        "What are TypeScript generics? Provide an example of when you would use them.",
        "Explain the difference between interface and type in TypeScript.",
        "What are React Server Components? How do they differ from traditional client-side rendering?",
        "How does Next.js handle server-side rendering vs static site generation?",
        "What is the difference between useCallback and useMemo? When would you use each?"
      ],
      behavioral: [
        "Describe a time when you had to debug a memory leak in a React application.",
        "Tell me about a time you had to migrate a legacy JavaScript codebase to TypeScript.",
        "Describe a situation where you had to optimize a slow React component."
      ],
      practical: [
        "How would you implement authentication in a Next.js application?",
        "Explain how you would set up CI/CD for a React/Node.js application.",
        "How would you handle state management in a large React application? Compare Redux, Zustand, and Context API.",
        "Describe your approach to testing React components. What tools do you use?"
      ]
    }
  },
  devops: {
    keywords: ["docker", "kubernetes", "k8s", "aws", "azure", "gcp", "terraform", "ansible", "ci/cd", "jenkins", "github actions", "gitlab ci"],
    questions: {
      technical: [
        "Explain the difference between a Docker image and a container. What is a Dockerfile?",
        "What is the difference between Kubernetes Deployment, StatefulSet, and DaemonSet?",
        "Explain Kubernetes Services: ClusterIP, NodePort, LoadBalancer, and ExternalName.",
        "What is Helm? How does it simplify Kubernetes deployments?",
        "Explain the difference between Terraform and Ansible. When would you use each?",
        "What is infrastructure as code? What are the benefits of using Terraform?",
        "How does Kubernetes handle service discovery and load balancing?",
        "Explain the concept of Infrastructure as Code (IaC). What are the key principles?",
        "What is a Kubernetes Ingress? How does it differ from a LoadBalancer service?",
        "How do you implement blue-green deployments in Kubernetes?"
      ],
      behavioral: [
        "Describe a time when you had to troubleshoot a Kubernetes cluster issue.",
        "Tell me about a time you had to migrate an application to the cloud.",
        "Describe a situation where you had to implement disaster recovery for a production system."
      ],
      practical: [
        "How would you set up a CI/CD pipeline for a microservices architecture?",
        "Explain how you would implement monitoring and alerting for a Kubernetes cluster.",
        "How would you handle secrets management in a Kubernetes environment?",
        "Describe your approach to capacity planning for a Kubernetes cluster."
      ]
    }
  },
  database: {
    keywords: ["sql", "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "orm", "query optimization", "database"],
    questions: {
      technical: [
        "Explain the difference between SQL and NoSQL databases. When would you choose each?",
        "What is database normalization? Explain 1NF, 2NF, and 3NF.",
        "What is the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN?",
        "Explain database indexing. What are the trade-offs of creating indexes?",
        "What are database transactions? Explain ACID properties.",
        "What is the difference between optimistic and pessimistic locking?",
        "Explain database connection pooling. Why is it important?",
        "What is database sharding? When would you use it?",
        "Explain the difference between Redis and Memcached. When would you use each?",
        "What is the CAP theorem? How does it apply to distributed databases?"
      ],
      behavioral: [
        "Describe a time when you had to optimize a slow database query.",
        "Tell me about a time you had to migrate data between different database systems.",
        "Describe a situation where you had to handle a database outage."
      ],
      practical: [
        "How would you design a database schema for a multi-tenant application?",
        "Explain how you would implement database backup and disaster recovery.",
        "How would you handle database migrations in a zero-downtime deployment?",
        "Describe your approach to database performance monitoring."
      ]
    }
  }
};

const GENERIC_QUESTIONS = {
  technical: [
    "Explain a complex technical problem you solved recently. What was your approach?",
    "How do you stay current with new technologies and industry trends?",
    "Describe your experience with version control systems. What branching strategy do you prefer?",
    "Explain your approach to code reviews. What do you look for?",
    "How do you handle technical debt in your projects?",
    "Describe your experience with automated testing. What testing pyramid do you follow?",
    "Explain how you handle error monitoring and logging in production applications.",
    "What is your approach to API design? REST vs GraphQL vs gRPC?"
  ],
  behavioral: [
    "Describe a time when you had to work with a difficult team member. How did you handle it?",
    "Tell me about a project that failed. What did you learn?",
    "Describe a situation where you had to make a decision with incomplete information.",
    "Tell me about a time you had to learn a new technology quickly for a project.",
    "Describe a time when you had to push back on a requirement. How did you handle it?",
    "Tell me about a time you mentored a junior developer.",
    "Describe a situation where you had to balance technical excellence with business deadlines."
  ],
  practical: [
    "How would you approach designing a new feature from requirements to deployment?",
    "Explain how you would set up a new project from scratch. What tools and practices would you use?",
    "How do you handle deployment rollbacks when something goes wrong?",
    "Describe your approach to documenting code and architecture decisions."
  ]
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const detectTechStack = (text) => {
  if (!text) return [];
  const lower = text.toLowerCase();
  const detected = [];
  for (const [category, config] of Object.entries(TECH_CATEGORIES)) {
    for (const keyword of config.keywords) {
      // Use word boundary matching for more precise detection
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(lower)) {
        detected.push(category);
        break;
      }
    }
  }
  return [...new Set(detected)];
};

const getQuestionsForStack = (categories, focus, count) => {
  const allQuestions = [];
  const questionTypes = focus === "Technical" ? ["technical"] : 
                        focus === "Behavioral" ? ["behavioral"] : 
                        ["technical", "behavioral", "practical"];
  
  for (const category of categories) {
    const config = TECH_CATEGORIES[category];
    if (!config) continue;
    for (const type of questionTypes) {
      if (config.questions[type]) {
        allQuestions.push(...config.questions[type].map(q => ({ text: q, category: type })));
      }
    }
  }
  
  // Add generic questions if we need more
  if (allQuestions.length < count) {
    for (const type of questionTypes) {
      if (GENERIC_QUESTIONS[type]) {
        allQuestions.push(...GENERIC_QUESTIONS[type].map(q => ({ text: q, category: type })));
      }
    }
  }
  
  // Shuffle and take requested count
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q, i) => ({
    text: q.text,
    timeLimitSec: q.category === "technical" ? 120 : q.category === "behavioral" ? 90 : 90
  }));
};

const normalizeTechText = (text) => {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// ============================================================
// TEMPLATE QUESTION GENERATION FALLBACK
// ============================================================

const buildLocalTemplateQuestions = (jobTitle, jobDescription, focus = "Mixed", count = 8) => {
  const detectedCategories = detectTechStack(`${jobTitle} ${jobDescription}`);
  const questions = getQuestionsForStack(detectedCategories, focus, count);
  
  // Ensure we have exactly the requested count
  while (questions.length < count) {
    questions.push({
      text: `Describe a challenging project you worked on related to ${jobTitle}. What was your role and what was the outcome?`,
      timeLimitSec: 90
    });
  }
  
  return questions.slice(0, count).map((q, i) => ({
    id: `q-${Date.now()}-${i}`,
    order: i,
    text: q.text,
    timeLimitSec: q.timeLimitSec
  }));
};

// ============================================================
// PRACTICE QUESTION GENERATION FALLBACK
// ============================================================

const buildLocalPracticeQuestions = (roleTitle, focus = "Mixed", count = 6) => {
  const detectedCategories = detectTechStack(roleTitle);
  const questions = getQuestionsForStack(detectedCategories, focus, count);
  
  while (questions.length < count) {
    questions.push({
      text: `Explain a fundamental concept in ${roleTitle} that you think is important for this role.`,
      timeLimitSec: 90
    });
  }
  
  return questions.slice(0, count).map((q, i) => ({
    id: `q-${Date.now()}-${i}`,
    order: i,
    text: q.text,
    timeLimitSec: q.timeLimitSec
  }));
};

// ============================================================
// INTERVIEW SCORING FALLBACK
// ============================================================

const extractKeywords = (text) => {
  if (!text) return new Set();
  const lower = text.toLowerCase();
  // Technical keywords that indicate depth
  const techKeywords = [
    "implemented", "designed", "architected", "optimized", "debugged", "refactored",
    "migrated", "deployed", "scaled", "automated", "integrated", "configured",
    "database", "api", "microservice", "docker", "kubernetes", "aws", "cloud",
    "sql", "nosql", "redis", "kafka", "rabbitmq", "graphql", "rest", "grpc",
    "ci/cd", "pipeline", "test", "unit test", "integration test", "e2e test",
    "design pattern", "solid", "dry", "clean code", "refactor", "technical debt",
    "performance", "latency", "throughput", "bottleneck", "profiling", "monitoring",
    "alerting", "logging", "observability", "security", "authentication", "authorization",
    "oauth", "jwt", "oauth2", "ssl", "tls", "encryption", "hashing"
  ];
  
  const found = new Set();
  for (const kw of techKeywords) {
    if (lower.includes(kw)) found.add(kw);
  }
  return found;
};

const hasConcreteExample = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  const exampleIndicators = [
    "for example", "for instance", "in my experience", "in my previous role",
    "at my previous company", "in a project", "we built", "i built", "i designed",
    "i implemented", "i optimized", "i debugged", "i fixed", "i resolved",
    "the result was", "the outcome was", "improved by", "reduced by", "increased by",
    "from X to Y", "before and after", "compared to", "measurable", "metric"
  ];
  return exampleIndicators.some(indicator => lower.includes(indicator));
};

const hasSTARStructure = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  const starIndicators = [
    "situation", "task", "action", "result",
    "challenge", "approach", "solution", "outcome",
    "problem", "solution", "result", "impact"
  ];
  return starIndicators.filter(indicator => lower.includes(indicator)).length >= 2;
};

const calculateAnswerQuality = (question, answer, questionKeywords) => {
  if (!answer || answer.trim().length < 10) {
    return { score: 0, hasContent: false, hasExample: false, hasSTAR: false, keywordOverlap: 0 };
  }
  
  const answerLower = answer.toLowerCase();
  const answerKeywords = extractKeywords(answer);
  const questionKwArray = Array.from(questionKeywords);
  const overlap = questionKwArray.filter(kw => answerKeywords.has(kw)).length;
  const overlapRatio = questionKwArray.length > 0 ? overlap / questionKwArray.length : 0;
  
  return {
    score: Math.min(100, answer.trim().length / 2), // rough length signal
    hasContent: answer.trim().length >= 50,
    hasExample: hasConcreteExample(answer),
    hasSTAR: hasSTARStructure(answer),
    keywordOverlap: overlapRatio,
    technicalTerms: answerKeywords.size
  };
};

const buildLocalInterviewScore = (questions, answers) => {
  // Build question keyword sets
  const questionKeywordSets = questions.map(q => extractKeywords(q.text));
  
  let totalQuality = 0;
  let answeredCount = 0;
  let totalExamples = 0;
  let totalSTAR = 0;
  let totalKeywordOverlap = 0;
  let totalTechnicalTerms = 0;
  let totalAnswerLength = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const a = answers.find(ans => ans.questionId === q.id);
    const answerText = a?.transcript || "";
    
    if (answerText && answerText.trim().length > 10 && 
        !answerText.includes("No answer recorded") && 
        !answerText.includes("technical failure")) {
      answeredCount++;
      const quality = calculateAnswerQuality(q, answerText, questionKeywordSets[i]);
      totalQuality += quality.score;
      totalAnswerLength += answerText.trim().length;
      if (quality.hasExample) totalExamples++;
      if (quality.hasSTAR) totalSTAR++;
      totalKeywordOverlap += quality.keywordOverlap;
      totalTechnicalTerms += quality.technicalTerms;
    }
  }
  
  const totalQuestions = questions.length;
  const answerRate = totalQuestions > 0 ? answeredCount / totalQuestions : 0;
  
  // Calculate category scores (0-100)
  // Communication: based on answer completeness, structure, and examples
  const avgAnswerLength = answeredCount > 0 ? totalAnswerLength / answeredCount : 0;
  const communication = Math.min(100, Math.round(
    (answerRate * 30) + 
    (Math.min(avgAnswerLength / 200, 1) * 25) + 
    (totalExamples / Math.max(answeredCount, 1) * 25) + 
    (totalSTAR / Math.max(answeredCount, 1) * 20)
  ));
  
  // Technical Depth: based on keyword overlap and technical terminology
  const avgKeywordOverlap = answeredCount > 0 ? totalKeywordOverlap / answeredCount : 0;
  const avgTechnicalTerms = answeredCount > 0 ? totalTechnicalTerms / answeredCount : 0;
  const technicalDepth = Math.min(100, Math.round(
    (avgTechnicalTerms * 15) + (avgKeywordOverlap * 70) + (answerRate * 15)
  ));
  
  // Confidence: based on answer completeness and specificity (not just answer rate)
  // Penalize very short answers even if all questions answered
  const avgWords = answeredCount > 0 ? (totalAnswerLength / answeredCount / 5) : 0; // rough word count
  const confidence = Math.min(100, Math.round(
    (answerRate * 30) + 
    (Math.min(avgWords / 30, 1) * 35) + 
    (avgKeywordOverlap * 35)
  ));
  
  // Relevance: how well answers address the specific questions asked
  const relevance = Math.min(100, Math.round(
    (avgKeywordOverlap * 80) + (answerRate * 20)
  ));
  
  // Overall score (weighted)
  const score = Math.min(100, Math.max(0, Math.round(
    communication * 0.25 + technicalDepth * 0.35 + confidence * 0.20 + relevance * 0.20
  )));
  
  // Recommendation
  let recommendation = "Not a Fit";
  if (score >= 75) recommendation = "Strong Hire";
  else if (score >= 50) recommendation = "Consider";
  
  // Summary
  const summaryParts = [];
  if (answeredCount === 0) {
    summaryParts.push("The candidate did not provide any valid answers to the interview questions.");
  } else {
    summaryParts.push(`The candidate answered ${answeredCount} of ${totalQuestions} questions.`);
    if (totalExamples > 0) summaryParts.push(`They provided ${totalExamples} concrete example(s) from their experience.`);
    if (totalSTAR > 0) summaryParts.push(`They used structured STAR format in ${totalSTAR} answer(s).`);
    summaryParts.push(`Technical keyword overlap averaged ${Math.round(totalKeywordOverlap / Math.max(answeredCount, 1) * 100)}% with the questions asked.`);
    summaryParts.push(`Overall assessment: ${recommendation.toLowerCase()}.`);
  }
  
  return {
    score,
    categoryScores: {
      communication,
      technicalDepth,
      confidence,
      relevance
    },
    summary: summaryParts.join(" "),
    recommendation
  };
};

// ============================================================
// VALIDATION HELPERS
// ============================================================

const validateQuestionArray = (questions, expectedCount) => {
  if (!Array.isArray(questions)) return { valid: false, error: "Not an array" };
  if (questions.length !== expectedCount) {
    return { valid: false, error: `Expected ${expectedCount} questions, got ${questions.length}` };
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (typeof q.text !== "string" || !q.text.trim()) {
      return { valid: false, error: `Question ${i} missing or invalid text` };
    }
    if (typeof q.timeLimitSec !== "number" || q.timeLimitSec < 30 || q.timeLimitSec > 300) {
      return { valid: false, error: `Question ${i} invalid timeLimitSec: ${q.timeLimitSec}` };
    }
  }
  return { valid: true };
};

const validateScoreResult = (result) => {
  if (!result || typeof result !== "object") return { valid: false, error: "Result is not an object" };
  if (typeof result.score !== "number" || result.score < 0 || result.score > 100) {
    return { valid: false, error: `Invalid score: ${result.score}` };
  }
  if (!result.categoryScores || typeof result.categoryScores !== "object") {
    return { valid: false, error: "Missing categoryScores" };
  }
  const requiredCategories = ["communication", "technicalDepth", "confidence", "relevance"];
  for (const cat of requiredCategories) {
    const val = result.categoryScores[cat];
    if (typeof val !== "number" || val < 0 || val > 100) {
      return { valid: false, error: `Invalid category score ${cat}: ${val}` };
    }
  }
  if (typeof result.summary !== "string" || !result.summary.trim()) {
    return { valid: false, error: "Summary missing or empty" };
  }
  if (!["Strong Hire", "Consider", "Not a Fit"].includes(result.recommendation)) {
    return { valid: false, error: `Invalid recommendation: ${result.recommendation}` };
  }
  return { valid: true };
};

// ============================================================
// EXPORTS
// ============================================================

export {
  buildLocalTemplateQuestions,
  buildLocalPracticeQuestions,
  buildLocalInterviewScore,
  validateQuestionArray,
  validateScoreResult,
  detectTechStack,
  getQuestionsForStack,
  // For testing
  TECH_CATEGORIES,
  GENERIC_QUESTIONS,
  extractKeywords,
  hasConcreteExample,
  hasSTARStructure,
  calculateAnswerQuality
};