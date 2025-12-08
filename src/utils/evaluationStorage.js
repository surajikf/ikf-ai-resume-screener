// Utility to store evaluations in localStorage as backup
// Primary storage is database, this is for quick access and fallback

const STORAGE_KEY = 'ikfEvaluations';

export const saveEvaluations = (evaluations) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
  } catch (error) {
    console.error('Failed to save evaluations to localStorage:', error);
  }
};

export const getEvaluations = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load evaluations from localStorage:', error);
    return [];
  }
};

export const addEvaluation = (evaluation) => {
  const evaluations = getEvaluations();
  // Check if already exists (by id or databaseId)
  const exists = evaluations.some(
    e => e.id === evaluation.id || 
         e.databaseId === evaluation.databaseId ||
         (e.candidateName === evaluation.candidateName && 
          e.roleApplied === evaluation.roleApplied &&
          Math.abs(new Date(e.createdAt) - new Date(evaluation.createdAt)) < 60000) // Same minute
  );
  
  if (!exists) {
    evaluations.unshift(evaluation); // Add to beginning
    // Keep only last 100 evaluations in localStorage
    const limited = evaluations.slice(0, 100);
    saveEvaluations(limited);
  }
};

export const clearEvaluations = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear evaluations from localStorage:', error);
  }
};

