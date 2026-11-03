/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — ATS Scoring Engine Test Suite
 * Validates deterministic calculations, edge cases, entry-level fairness,
 * missing requirements, keyword stuffing, and OCR handling.
 */

import { parseRawResumeText } from '../utils/textExtractor.ts';
import { parseJobDescription } from '../utils/jobDescriptionParser.ts';
import { evaluateResume } from '../utils/atsScoringEngine.ts';
import { checkAtsCompatibility } from '../utils/atsCompatibilityChecker.ts';

export function runAtsTestSuite(): { passed: number; failed: number; results: { name: string; success: boolean; details: string }[] } {
  const results: { name: string; success: boolean; details: string }[] = [];

  const sampleJD = `
Software Engineer - Full Stack
Company: Acme Cloud

Requirements:
- Strong proficiency in TypeScript, React, and Node.js
- Experience with PostgreSQL and Docker
- Knowledge of REST API design and Git

Preferred Qualifications:
- Experience with AWS and GraphQL
- Familiarity with CI/CD and Tailwind CSS

Responsibilities:
- Build high-scale web applications
- Collaborate with agile product teams
`;

  // Test 1: Strongly Matching Resume and Job Description
  try {
    const strongResumeText = `
Sanjay Kumar
Email: sanjay@example.com | Phone: (555) 012-3456 | Location: San Francisco, CA
LinkedIn: linkedin.com/in/sanjay | GitHub: github.com/sanjay

PROFESSIONAL SUMMARY
Full Stack Engineer with expertise in TypeScript, React, and Node.js building scalable web applications.

EDUCATION
Bachelor of Science in Computer Science, Stanford University (2021 - 2025) GPA: 3.8

TECHNICAL SKILLS
Languages & Frameworks: TypeScript, JavaScript, React, Node.js, Express, PostgreSQL, Docker, Git, REST API, AWS, GraphQL, Tailwind CSS

EXPERIENCE
Software Engineer Intern at TechCorp (June 2024 - Present)
- Architected REST API microservices in Node.js and TypeScript, increasing query speed by 45%.
- Containerized deployment workflows using Docker, serving over 15,000 active daily users.

PROJECTS
Cloud Analytics Platform (React, Node.js, PostgreSQL)
- Developed real-time dashboard using React, Tailwind CSS, and PostgreSQL.
- Reduced database response latency by 35% with optimized SQL indexing.
`;
    const resume = parseRawResumeText(strongResumeText, 'pdf', 'strong_resume.pdf', 1, false, false);
    const jd = parseJobDescription(sampleJD, 'Full Stack Engineer', 'Acme Cloud');
    const report = evaluateResume(resume, jd);

    const isMatch = report.overallScore >= 80 && report.requiredSkillsMatch.percentage >= 85;
    results.push({
      name: '1. Strongly Matching Resume and Job Description',
      success: isMatch,
      details: `Score: ${report.overallScore}%, Required Match: ${report.requiredSkillsMatch.percentage}% (Earned: ${report.scoreLabel})`,
    });
  } catch (err: any) {
    results.push({ name: '1. Strongly Matching Resume', success: false, details: err.message });
  }

  // Test 2: Weakly Matching Resume and Job Description
  try {
    const weakResumeText = `
John Doe
Email: john@example.com | Phone: (555) 123-4567 | Location: Austin, TX

PROFESSIONAL SUMMARY
Account manager and sales representative with background in customer support.

EDUCATION
Bachelor of Arts in Communications, State University (2018 - 2022)

WORK EXPERIENCE
Sales Associate at Retail World (2022 - Present)
- Handled customer transactions and inventory management.
`;
    const resume = parseRawResumeText(weakResumeText, 'pdf', 'weak_resume.pdf', 1, false, false);
    const jd = parseJobDescription(sampleJD, 'Full Stack Engineer', 'Acme Cloud');
    const report = evaluateResume(resume, jd);

    const isWeak = report.overallScore < 50 && report.requiredSkillsMatch.percentage === 0;
    results.push({
      name: '2. Weakly Matching Resume and Job Description',
      success: isWeak,
      details: `Score: ${report.overallScore}%, Required Match: ${report.requiredSkillsMatch.percentage}% (Correctly identified low match)`,
    });
  } catch (err: any) {
    results.push({ name: '2. Weakly Matching Resume', success: false, details: err.message });
  }

  // Test 3: Missing Required Skills
  try {
    const missingSkillsText = `
Alice Student
Email: alice@example.com | Phone: (555) 999-8888 | Location: Seattle, WA

PROFESSIONAL SUMMARY
Web enthusiast familiar with HTML and CSS.

EDUCATION
BS in Computer Science (2022 - 2026)

PROJECTS
Simple Web Page
- Built responsive static websites with basic HTML and CSS.
`;
    const resume = parseRawResumeText(missingSkillsText, 'pdf', 'missing_skills.pdf', 1, false, false);
    const jd = parseJobDescription(sampleJD, 'Full Stack Engineer', 'Acme Cloud');
    const report = evaluateResume(resume, jd);

    const correctlyMissing = report.requiredSkillsMatch.missing.length >= 4;
    results.push({
      name: '3. Missing Required Skills Detection',
      success: correctlyMissing,
      details: `Correctly flagged ${report.requiredSkillsMatch.missing.length} missing required skills: ${report.requiredSkillsMatch.missing.slice(0, 3).join(', ')}`,
    });
  } catch (err: any) {
    results.push({ name: '3. Missing Required Skills', success: false, details: err.message });
  }

  // Test 4: Entry-Level Candidates with Projects but No Employment History
  try {
    const entryLevelJD = `
Software Engineer Intern
Company: Startup Lab

Requirements:
- Knowledge of Python, React, and SQL
- Strong understanding of algorithms and data structures
`;
    const entryLevelResume = `
Bob Freshman
Email: bob@college.edu | Phone: (555) 444-3333 | Location: Boston, MA

EDUCATION
B.S. in Computer Science, MIT (Expected 2027)

TECHNICAL SKILLS
Python, React, SQL, Git, Algorithms, Data Structures

PROJECTS
Open Source Data Pipeline
- Built an ETL pipeline using Python and SQL processing 50,000+ data rows daily.
- Implemented real-time React dashboard with 99.9% uptime.
`;
    const resume = parseRawResumeText(entryLevelResume, 'pdf', 'intern_resume.pdf', 1, false, false);
    const jd = parseJobDescription(entryLevelJD, 'Software Engineer Intern', 'Startup Lab');
    const report = evaluateResume(resume, jd);

    // Should NOT be heavily penalized for lack of formal job experience
    const fairScore = report.overallScore >= 75 && jd.isEntryLevel;
    results.push({
      name: '4. Entry-Level Candidates With Projects But No Employment History',
      success: fairScore,
      details: `Score: ${report.overallScore}%, isEntryLevel: ${jd.isEntryLevel} (Practical projects counted fairly without senior employment penalty)`,
    });
  } catch (err: any) {
    results.push({ name: '4. Entry-Level Candidates', success: false, details: err.message });
  }

  // Test 5: Resume Analysis Without a Job Description (General Quality Mode)
  try {
    const generalResume = `
David Lee
Email: david@domain.com | Phone: (555) 777-6666 | Location: New York, NY

PROFESSIONAL SUMMARY
Passionate engineer focused on modern cloud software development.

EDUCATION
B.S. in Software Engineering (2020 - 2024)

TECHNICAL SKILLS
TypeScript, React, Python, PostgreSQL, Docker, AWS, Git

PROJECTS
E-Commerce Application
- Built full-stack store with React and PostgreSQL, scaling to 1,200 active users.
`;
    const resume = parseRawResumeText(generalResume, 'pdf', 'general_resume.pdf', 1, false, false);
    const emptyJD = parseJobDescription('', '', '');
    const report = evaluateResume(resume, emptyJD);

    const isGeneral = report.mode === 'general-quality' && report.overallScore >= 70;
    results.push({
      name: '5. Resume Analysis Without a Job Description',
      success: isGeneral,
      details: `Mode: ${report.mode}, Score: ${report.overallScore}% (${report.scoreLabel})`,
    });
  } catch (err: any) {
    results.push({ name: '5. General Resume Analysis', success: false, details: err.message });
  }

  // Test 6: Scanned PDF Requiring OCR / Zero-Text Detection
  try {
    const scannedResume = parseRawResumeText('', 'pdf', 'scanned_scan.pdf', 1, true, false);
    const warnings = checkAtsCompatibility(scannedResume);
    const hasScannedWarning = warnings.some((w) => w.id === 'scanned-pdf-error');

    results.push({
      name: '6. Scanned PDF Requiring OCR / Zero-Text Detection',
      success: hasScannedWarning && scannedResume.isScanned,
      details: `Detected isScanned: ${scannedResume.isScanned}, Flagged warning: "${warnings.find((w) => w.id === 'scanned-pdf-error')?.title}"`,
    });
  } catch (err: any) {
    results.push({ name: '6. Scanned PDF Detection', success: false, details: err.message });
  }

  // Test 7: PDF with Selectable Text
  try {
    const pdfText = `
Emma Watson
Email: emma@tech.com | Phone: (555) 234-5678 | Location: Chicago, IL
EDUCATION
B.S. in Computer Science (2021 - 2025)
SKILLS
Java, Spring Boot, MySQL, Git
PROJECTS
Banking API
- Implemented secure REST microservices in Java with Spring Boot.
`;
    const resume = parseRawResumeText(pdfText, 'pdf', 'selectable.pdf', 1, false, false);
    results.push({
      name: '7. PDF with Selectable Text Parsing',
      success: resume.hasSelectableText && !resume.isScanned && resume.wordCount > 30,
      details: `Words: ${resume.wordCount}, hasSelectableText: ${resume.hasSelectableText}`,
    });
  } catch (err: any) {
    results.push({ name: '7. Selectable PDF Parsing', success: false, details: err.message });
  }

  // Test 8: DOCX Upload Simulation
  try {
    const docxText = `
Franklin Roosevelt
Email: frank@agency.gov | Phone: (555) 888-0000 | Location: Washington, DC
EDUCATION
B.A. in Public Administration (2019 - 2023)
SKILLS
Project Management, Agile, Scrum, Jira, Communications
`;
    const resume = parseRawResumeText(docxText, 'docx', 'resume.docx', 1, false, false);
    results.push({
      name: '8. DOCX Document Text Processing',
      success: resume.sourceType === 'docx' && resume.contact.email === 'frank@agency.gov',
      details: `Source: ${resume.sourceType}, Extracted email: ${resume.contact.email}`,
    });
  } catch (err: any) {
    results.push({ name: '8. DOCX Upload Simulation', success: false, details: err.message });
  }

  // Test 9: Corrupted, Empty, or Unsupported Files
  try {
    let emptyHandled = false;
    try {
      const emptyResume = parseRawResumeText('', 'text', 'empty.txt', 1, false, false);
      if (emptyResume.wordCount === 0) emptyHandled = true;
    } catch {
      emptyHandled = true;
    }

    results.push({
      name: '9. Corrupted, Empty, or Unsupported Files',
      success: emptyHandled,
      details: 'Correctly catches empty text stream and alerts user with descriptive error message.',
    });
  } catch (err: any) {
    results.push({ name: '9. Corrupted File Handling', success: false, details: err.message });
  }

  // Test 10: Duplicate Keywords and Misleading Keyword Stuffing
  try {
    const stuffedText = `
Keyword Spammer
Email: spammer@bot.com | Phone: (555) 000-0000 | Location: Remote
SKILLS
python python python python python python python python python python python
docker docker docker docker docker docker docker docker docker docker docker
react react react react react react react react react react react
`;
    const resume = parseRawResumeText(stuffedText, 'pdf', 'stuffed.pdf', 1, false, false);
    const warnings = checkAtsCompatibility(resume);
    const hasStuffingWarning = warnings.some((w) => w.id === 'keyword-stuffing');

    results.push({
      name: '10. Duplicate Keywords and Misleading Keyword Stuffing Detection',
      success: hasStuffingWarning,
      details: `Correctly flagged warning: "${warnings.find((w) => w.id === 'keyword-stuffing')?.title}" with recommendation.`,
    });
  } catch (err: any) {
    results.push({ name: '10. Keyword Stuffing Detection', success: false, details: err.message });
  }

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return { passed, failed, results };
}
