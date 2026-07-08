// utils/recommendationEngine.js

/**
 * Calculates recommendation score for a single candidate developer compared to a logged-in user.
 * @param {Object} currentUser - The logged-in user object.
 * @param {Object} candidate - The candidate user object.
 * @returns {Object} An object containing score, commonSkills count, and reasons array.
 */
function calculateRecommendationScore(currentUser, candidate) {
  let score = 0;
  const reasons = [];
  let commonSkillsCount = 0;

  // 1. Same Skill Scoring (+10 per skill, Max 40)
  if (currentUser.skills && candidate.skills && Array.isArray(currentUser.skills) && Array.isArray(candidate.skills)) {
    const currentSkillsLower = currentUser.skills.map(s => s.toLowerCase().trim());
    const candidateSkillsLower = candidate.skills.map(s => s.toLowerCase().trim());
    
    currentSkillsLower.forEach(skill => {
      if (candidateSkillsLower.includes(skill)) {
        commonSkillsCount++;
      }
    });

    if (commonSkillsCount > 0) {
      const skillPoints = Math.min(commonSkillsCount * 10, 40);
      score += skillPoints;
      reasons.push(`${commonSkillsCount} common skill${commonSkillsCount > 1 ? 's' : ''}`);
    }
  }

  // 2. Same College Scoring (+20)
  if (currentUser.college && candidate.college && currentUser.college.trim().toLowerCase() === candidate.college.trim().toLowerCase()) {
    score += 20;
    reasons.push("Studied at the same college");
  }

  // 3. Same Company Scoring (+20)
  if (currentUser.company && candidate.company && currentUser.company.trim().toLowerCase() === candidate.company.trim().toLowerCase()) {
    score += 20;
    reasons.push("Works at the same company");
  }

  // 4. Same Experience Level Scoring (+15)
  if (currentUser.experienceLevel && candidate.experienceLevel && currentUser.experienceLevel === candidate.experienceLevel) {
    score += 15;
    reasons.push("Same experience level");
  }

  // 5. Same Availability Scoring (+15)
  if (currentUser.availability && candidate.availability && currentUser.availability === candidate.availability) {
    score += 15;
    if (currentUser.availability === "Hackathons") {
      reasons.push("Open for Hackathons");
    } else {
      reasons.push(`Open for ${currentUser.availability.replace("Open to ", "")}`);
    }
  }

  // 6. Same Location Scoring (+10)
  if (currentUser.location && candidate.location && currentUser.location.trim().toLowerCase() === candidate.location.trim().toLowerCase()) {
    score += 10;
    reasons.push("Located in the same city");
  }

  // 7. Premium User Scoring (+5)
  if (candidate.isPremium) {
    score += 5;
  }

  return {
    score,
    commonSkills: commonSkillsCount,
    reasons
  };
}

/**
 * Backward compatibility or specific mapping function if needed.
 */
function getRecommendationReasons(currentUser, candidate) {
  const result = calculateRecommendationScore(currentUser, candidate);
  return result.reasons;
}

/**
 * Filters, scores, sorts, and limits the developer candidates.
 * @param {Object} currentUser - The logged-in user object.
 * @param {Array} candidates - The array of potential candidate user objects.
 * @returns {Array} List of top 10 recommended developers with scores and reasons.
 */
function recommendDevelopers(currentUser, candidates) {
  if (!currentUser || !Array.isArray(candidates)) {
    return [];
  }

  const processedCandidates = candidates.map(candidate => {
    const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
    const analysis = calculateRecommendationScore(currentUser, candidateObj);

    return {
      _id: candidateObj._id,
      firstName: candidateObj.firstName,
      lastName: candidateObj.lastName || "",
      username: candidateObj.username,
      photoUrl: candidateObj.photoUrl,
      developerTitle: candidateObj.developerTitle || "",
      company: candidateObj.company || "",
      college: candidateObj.college || "",
      location: candidateObj.location || "",
      skills: candidateObj.skills || [],
      availability: candidateObj.availability || "",
      isPremium: candidateObj.isPremium || false,
      score: analysis.score,
      commonSkills: analysis.commonSkills,
      reasons: analysis.reasons
    };
  });

  // Sorting logic: score descending -> Premium users first -> firstName ascending
  processedCandidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.isPremium !== a.isPremium) {
      return b.isPremium ? 1 : -1;
    }
    return a.firstName.localeCompare(b.firstName);
  });

  return processedCandidates.slice(0, 10);
}

module.exports = {
  calculateRecommendationScore,
  getRecommendationReasons,
  recommendDevelopers
};