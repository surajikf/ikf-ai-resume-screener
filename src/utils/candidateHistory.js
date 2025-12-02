// Store and retrieve candidate evaluation history

export const saveCandidateEvaluation = (candidateName, roleApplied, evaluationId, createdAt) => {
  if (typeof window === "undefined") return;

  const history = getCandidateHistory();
  const normalizedName = candidateName?.toLowerCase().trim() || "unknown";

  // Check if candidate already exists
  const existingIndex = history.findIndex(
    (entry) => entry.name.toLowerCase().trim() === normalizedName
  );

  const newEntry = {
    name: candidateName || "Unknown Candidate",
    roleApplied: roleApplied || "Unknown Role",
    evaluationId,
    createdAt: createdAt || new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    // Update existing entry and move to top
    history[existingIndex] = newEntry;
    history.unshift(history.splice(existingIndex, 1)[0]);
  } else {
    // Add new entry at the beginning
    history.unshift(newEntry);
  }

  // Keep only last 100 candidates
  const limitedHistory = history.slice(0, 100);
  localStorage.setItem("candidateHistory", JSON.stringify(limitedHistory));
};

export const getCandidateHistory = () => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("candidateHistory")) || [];
};

export const findPreviousEvaluation = (candidateName) => {
  if (typeof window === "undefined" || !candidateName) return null;

  const history = getCandidateHistory();
  const normalizedName = candidateName.toLowerCase().trim();

  return history.find(
    (entry) => entry.name.toLowerCase().trim() === normalizedName
  ) || null;
};

export const getCandidateEvaluations = (candidateName) => {
  if (typeof window === "undefined" || !candidateName) return [];
  
  const history = getCandidateHistory();
  const normalizedName = candidateName.toLowerCase().trim();

  return history.filter(
    (entry) => entry.name.toLowerCase().trim() === normalizedName
  );
};

export const clearCandidateHistory = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("candidateHistory");
};

