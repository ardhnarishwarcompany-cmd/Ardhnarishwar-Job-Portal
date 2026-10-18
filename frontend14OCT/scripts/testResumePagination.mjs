// CV Builder PDF pagination test.
//
// Verifies the resume generator never writes text past the bottom (or right)
// margin of an A4 page and that every piece of resume content - including the
// last bullet of a multi-page resume and long unbroken URLs - survives into
// the produced PDF.
//
// Run with:  node scripts/testResumePagination.mjs
import { register } from "node:module";

// Make `import jsPDF from "jspdf"` work under Node before loading the generator.
register("./jspdf-resolve-hooks.mjs", import.meta.url);

// pdfjs cannot fetch standard font files under Node; extraction still works.
// Patch console before importing pdfjs so its own captured references are quiet.
const isFontNoise = (arg) => /standardFontDataUrl|Unable to load font data/.test(String(arg));
for (const level of ["warn", "error"]) {
  const original = console[level].bind(console);
  console[level] = (...args) => {
    if (!args.some(isFontNoise)) original(...args);
  };
}

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const { generateResumePdf } = await import("../src/utils/resumeUtils.js");

const PT_PER_MM = 72 / 25.4;
const PAGE_W = 595.28; // A4 in pt
const PAGE_H = 841.89;
const MARGIN = 16; // mm
const TOL = 3; // pt of slack for baseline / glyph metrics
const LEFT_LIMIT = MARGIN * PT_PER_MM - TOL;
const RIGHT_LIMIT = PAGE_W - MARGIN * PT_PER_MM + TOL;
const BOTTOM_LIMIT = MARGIN * PT_PER_MM - TOL; // y grows upward in PDF space
const TOP_LIMIT = PAGE_H - MARGIN * PT_PER_MM + TOL;

const longUrl =
  "https://github.com/candidate-portfolio/very-long-project-repository-name/blob/main/src/components/dashboard/analytics-view/deep/nested/path?with=query&and=more-tracking-parameters-end-marker";

const makeCv = (scale) => {
  const bullet = (i) =>
    `Delivered measurable outcome number ${i} by partnering with cross functional teams, rewriting critical workflows and shipping improvements that reduced cycle time endmarker${i}`;
  const experience = Array.from({ length: scale }, (_, i) => ({
    id: `exp-${i}`,
    role: `Senior Software Engineer ${i}`,
    company: `Example Corp ${i}`,
    duration: `Jan 20${15 + i} - Present`,
    description: Array.from({ length: 6 }, (_, j) => bullet(i * 10 + j)).join("\n"),
  }));
  return {
    name: "Pagination Test Candidate",
    title: "Staff Frontend Engineer",
    email: "candidate@example.com",
    phone: "+91 90000 00000",
    location: "Bengaluru, India",
    linkedin: "linkedin.com/in/pagination-test",
    portfolio: longUrl,
    summary:
      "Product-minded engineer with a decade of experience building accessible web platforms, design systems and data-heavy dashboards for high growth teams. " +
      "This summary is intentionally long so it wraps across several lines and exercises the paragraph pagination path in the generator. ".repeat(6),
    skills: Array.from({ length: 40 }, (_, i) => `Skill-${i}`).join(", "),
    certifications: Array.from({ length: 8 }, (_, i) => `Certification ${i}`).join(", "),
    achievements: Array.from({ length: 8 }, (_, i) => `Achievement marker ${i} endach`).join("\n"),
    languages: "English, Hindi, Marathi, Kannada",
    experience,
    education: [
      { id: "edu-1", degree: "B.Tech Computer Science", school: "Example University", year: "2014" },
      { id: "edu-2", degree: "M.Tech Software Systems", school: "Example University", year: "2016" },
    ],
    projects: Array.from({ length: scale }, (_, i) => ({
      id: `proj-${i}`,
      title: `Project ${i}`,
      description: Array.from({ length: 4 }, (_, j) =>
        `Built component ${i}-${j} that automated reporting and reduced manual effort endmarker${i}-${j}`,
      ).join("\n"),
    })),
    links: [
      { id: "lnk-1", label: "Portfolio", url: longUrl },
      { id: "lnk-2", label: "GitHub", url: "https://github.com/pagination-test" },
    ],
  };
};

const flat = (s) => String(s).replace(/\s+/g, "");

const readPdf = async (doc) => {
  const data = new Uint8Array(Buffer.from(doc.output("arraybuffer")));
  const pdf = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: false,
    standardFontDataUrl: new URL("../node_modules/pdfjs-dist/standard_fonts/", import.meta.url).href,
  }).promise;

  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const { items } = await page.getTextContent();
    const shown = items.filter((it) => it.str && it.str.trim());
    pages.push({ items: shown, text: shown.map((it) => it.str).join("") });
  }
  return { numPages: pdf.numPages, pages };
};

const cases = [
  { label: "short", scale: 1, minPages: 1 },
  { label: "normal", scale: 3, minPages: 1 },
  { label: "long (multi-page)", scale: 8, minPages: 2 },
];
const templates = ["modern", "classic", "professional"];

let failures = 0;
let checked = 0;

for (const tpl of templates) {
  for (const c of cases) {
    const before = failures;
    const cv = makeCv(c.scale);

    const doc = generateResumePdf(cv, tpl);
    const pdf = await readPdf(doc);
    const haystack = flat(pdf.pages.map((p) => p.text).join(""));

    console.log(`\n[${tpl}] ${c.label}: ${pdf.numPages} page(s)`);

    if (pdf.numPages < c.minPages) {
      failures += 1;
      console.log(`  FAIL  expected >= ${c.minPages} page(s), got ${pdf.numPages}`);
    }

    pdf.pages.forEach((page, idx) => {
      page.items.forEach((it) => {
        checked += 1;
        const x = it.transform[4];
        const y = it.transform[5];
        const right = x + (it.width || 0);
        if (y < BOTTOM_LIMIT) {
          failures += 1;
          console.log(
            `  FAIL  page ${idx + 1}: text below bottom margin (y=${y.toFixed(1)}pt < ${BOTTOM_LIMIT.toFixed(1)}) "${it.str.slice(0, 50)}"`,
          );
        } else if (y > TOP_LIMIT) {
          failures += 1;
          console.log(
            `  FAIL  page ${idx + 1}: text above top margin (y=${y.toFixed(1)}pt > ${TOP_LIMIT.toFixed(1)}) "${it.str.slice(0, 50)}"`,
          );
        }
        if (x < LEFT_LIMIT - 20 || right > RIGHT_LIMIT) {
          failures += 1;
          console.log(
            `  FAIL  page ${idx + 1}: text outside horizontal margins (x=${x.toFixed(1)}..${right.toFixed(1)}pt, allowed ${LEFT_LIMIT.toFixed(1)}..${RIGHT_LIMIT.toFixed(1)}) "${it.str.slice(0, 40)}"`,
          );
        }
      });
    });

    const lastExp = cv.experience[cv.experience.length - 1];
    const lastProj = cv.projects[cv.projects.length - 1];
    const mustContain = [
      cv.name,
      lastExp.role,
      lastExp.description.split("\n").pop(),
      cv.education[cv.education.length - 1].degree,
      lastProj.title,
      lastProj.description.split("\n").pop(),
      cv.achievements.split("\n").pop(),
      cv.certifications.split(",").pop().trim(),
      cv.links[0].url.split("/").pop(),
      "endmarker",
    ];
    // The classic template renders without a job title (same as its preview),
    // and the templates separate languages differently, so check them apart.
    if (tpl !== "classic") mustContain.push(cv.title);
    mustContain.push(...cv.languages.split(",").map((l) => l.trim()));
    for (const needle of mustContain) {
      if (!needle) continue;
      if (!haystack.includes(flat(needle))) {
        failures += 1;
        console.log(`  FAIL  missing from PDF text: "${String(needle).slice(0, 70)}"`);
      }
    }

    if (failures === before) console.log("  OK    complete content, nothing clipped");
  }
}

console.log(`\nchecked ${checked} text runs`);
console.log(failures ? `${failures} FAILURE(S)` : "ALL PAGINATION TESTS PASSED");
process.exit(failures ? 1 : 0);
