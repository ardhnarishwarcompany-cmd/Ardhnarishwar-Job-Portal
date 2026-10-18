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

// Test Ollama validation
const testCases = [
  {
    name: "Valid strong result",
    input: { score: 85, categoryScores: { communication: 90, technicalDepth: 80, confidence: 85, relevance: 80 }, summary: "Great candidate", recommendation: "Strong Hire" },
    expected: true
  },
  {
    name: "Valid consider result",
    input: { score: 75, categoryScores: { communication: 80, technicalDepth: 70, confidence: 70, relevance: 80 }, summary: "Good candidate", recommendation: "Consider" },
    expected: true
  },
  {
    name: "Valid not a fit result",
    input: { score: 20, categoryScores: { communication: 15, technicalDepth: 10, confidence: 10, relevance: 20 }, summary: "Weak candidate", recommendation: "Not a Fit" },
    expected: true
  },
  {
    name: "Invalid score > 100",
    input: { score: 150, categoryScores: { communication: 90, technicalDepth: 80, confidence: 85, relevance: 80 }, summary: "Great", recommendation: "Strong Hire" },
    expected: false
  },
  {
    name: "Missing category",
    input: { score: 85, categoryScores: { communication: 90, technicalDepth: 80, relevance: 80 }, summary: "Great", recommendation: "Strong Hire" },
    expected: false
  },
  {
    name: "Invalid recommendation",
    input: { score: 85, categoryScores: { communication: 90, technicalDepth: 80, confidence: 85, relevance: 80 }, summary: "Great", recommendation: "Hire" },
    expected: false
  }
];

console.log("=== VALIDATION TESTS ===\n");
for (const tc of testCases) {
  const result = validateScoreResult(tc.input);
  const passed = result.valid === tc.expected;
  console.log(`${passed ? "PASS" : "FAIL"}: ${tc.name} - ${result.valid ? "valid" : "invalid: " + result.error}`);
}

console.log("\n=== ALL TESTS COMPLETE ===");