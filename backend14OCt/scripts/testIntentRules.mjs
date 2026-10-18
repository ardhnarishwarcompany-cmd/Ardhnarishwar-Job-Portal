import { classifyIntent } from "../utils/intentClassifier.js";

const messages = [
  "Hello",
  "What is the career path for AI Developer?",
  "How do I become a software developer?",
  "Find Python developer jobs",
  "What skills are in demand for AI developers?",
  "Help me improve my resume",
  "What is my application status?",
  "Tell me about Recruweb Resources Pvt. Ltd.",
  "What should I learn first?",
  "Who are you?",
  "What can you help me with?",
  "Explain what an AI Developer does",
  "How should I prepare for placements?",
  "What should I learn next?",
  "Salary for React developer with 3 years exp",
  "What jobs match my skills?",
  "Check my application status",
  "Skills needed for DevOps",
  "Learning roadmap for full stack",
  "Career path for AI developer",
  "show me jobs in Bangalore",
  "recommend jobs for me",
  "help me",
];

const history = [
  { from: "user", text: "What is the career path for AI Developer?" },
  { from: "bot", text: "Here is a path for AI Developer..." },
];

for (const message of messages) {
  const withHistory = /learn first|learn next/.test(message);
  const result = await classifyIntent(message, withHistory ? history : []);
  console.log(
    `${message.padEnd(46)} -> ${result.intent.padEnd(21)} conf=${String(result.confidence).padEnd(3)} source=${result.source.padEnd(8)} role=${result.entities.role || "-"} company=${result.entities.company || "-"} location=${result.entities.location || "-"}`,
  );
}
