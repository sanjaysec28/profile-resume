/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Evidence-Based ATS Summary & Recommendation Generator
 */

interface SummaryInput {
  overallScore: number;
  isJobSpecific: boolean;
  jobTitle?: string;
  company?: string;
  requiredPresent?: string[];
  requiredMissing?: string[];
  metricsCount: number;
  wordCount: number;
}

export function generateAtsSummary(input: SummaryInput): {
  whyThisScore: string;
  strongestQualifications: string[];
  topMissingRequirements: string[];
  topNextSteps: string[];
} {
  const {
    overallScore,
    isJobSpecific,
    jobTitle,
    company,
    requiredPresent = [],
    requiredMissing = [],
    metricsCount,
    wordCount,
  } = input;

  const roleText = jobTitle
    ? `the ${jobTitle}${company ? ` role at ${company}` : ''}`
    : 'this target position';

  let whyThisScore = '';
  if (isJobSpecific) {
    if (overallScore >= 80) {
      whyThisScore = `The resume achieved a high ATS compatibility score of ${overallScore}% because it aligns closely with the core technical requirements for ${roleText}. It directly mentions ${requiredPresent.length} required skill(s) and maintains standard single/dual column parsing structure.`;
    } else if (overallScore >= 60) {
      whyThisScore = `The resume scored ${overallScore}% because while it establishes solid baseline qualifications, it is missing ${requiredMissing.length} explicitly stated requirement(s) for ${roleText}. Incorporating these verified skills in your bullets will significantly improve search ranking in candidate tracking algorithms.`;
    } else {
      whyThisScore = `The resume received an ATS score of ${overallScore}% due to low keyword overlap with ${roleText} and ${requiredMissing.length} missing required qualifications. Automated screening algorithms filter for high requirement density in early recruitment rounds.`;
    }
  } else {
    whyThisScore = `Evaluated under the General Resume Quality standard (score: ${overallScore}%), this resume demonstrates structured sections and readable formatting. For precise keyword ranking and match percentage, paste a specific job description.`;
  }

  // Strongest qualifications
  const strongestQualifications: string[] = [];
  if (requiredPresent.length > 0) {
    strongestQualifications.push(
      `Direct coverage of key technologies: ${requiredPresent.slice(0, 5).join(', ')}.`
    );
  } else {
    strongestQualifications.push('Clear educational background and clean document hierarchy.');
  }

  if (metricsCount >= 2) {
    strongestQualifications.push(
      `Strong measurable impact with ${metricsCount} quantified metric instances in project and experience descriptions.`
    );
  }

  if (wordCount >= 350 && wordCount <= 750) {
    strongestQualifications.push(
      `Optimal length (${wordCount} words) suitable for standard 1-page undergraduate and entry-level review.`
    );
  }

  // Top missing requirements
  const topMissingRequirements: string[] = [];
  if (isJobSpecific && requiredMissing.length > 0) {
    topMissingRequirements.push(
      `Primary missing required tools: ${requiredMissing.slice(0, 4).join(', ')}.`
    );
  } else if (!isJobSpecific) {
    topMissingRequirements.push(
      'Target job description not provided; specific skill gaps cannot be evaluated without role requirements.'
    );
  }

  if (metricsCount === 0) {
    topMissingRequirements.push(
      'Absence of numerical indicators (percentages, users, speeds, or volume) in work or project descriptions.'
    );
  }

  // Top 3 next steps
  const topNextSteps: string[] = [];
  if (isJobSpecific && requiredMissing.length > 0) {
    topNextSteps.push(
      `Integrate verified experience with ${requiredMissing.slice(0, 3).join(', ')} into your Skills or Project bullet points.`
    );
  } else if (!isJobSpecific) {
    topNextSteps.push(
      'Paste a job description to tailor keywords and verify required vs. preferred skill coverage.'
    );
  }

  if (metricsCount < 2) {
    topNextSteps.push(
      'Quantify at least two project bullet points with real numbers (e.g. "Achieved 99.8% uptime", "Implemented 12 API endpoints").'
    );
  }

  topNextSteps.push(
    'Keep section headers strictly standard ("Education", "Experience", "Projects", "Skills") for seamless parser extraction.'
  );

  return {
    whyThisScore,
    strongestQualifications: strongestQualifications.slice(0, 3),
    topMissingRequirements: topMissingRequirements.slice(0, 3),
    topNextSteps: topNextSteps.slice(0, 3),
  };
}
