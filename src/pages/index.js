import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import UploadPanel from "@/components/UploadPanel";
import JiraBoard from "@/components/JiraBoard";
import EvaluationModal from "@/components/EvaluationModal";
import StatusSummary from "@/components/StatusSummary";
import ResumeViewer from "@/components/ResumeViewer";
import {
  saveJD,
  getJDs,
  deleteJD,
  clearJDs,
} from "@/utils/jdStorage";
import {
  saveCandidateEvaluation,
  findPreviousEvaluation,
} from "@/utils/candidateHistory";
import { getSettings } from "@/utils/settingsStorage";
import { getEvaluations as getStoredEvaluations, saveEvaluations, addEvaluation, clearEvaluations } from "@/utils/evaluationStorage";
import { syncEvaluationsToSupabase, syncJobDescriptionsToSupabase } from "@/utils/syncToSupabase";
import { formatErrorMessage, logError, validateEvaluation, validateJobDescription, validateFile, safeAsync } from "@/utils/errorHandler";
import { confirm, prompt, alert as swalAlert } from "@/utils/swal";

// Helper function to convert duration string to months
const durationToMonths = (duration) => {
  if (!duration || typeof duration !== 'string') return 0;
  const monthsMatch = duration.match(/(\d+)\s*month/i);
  const yearsMatch = duration.match(/(\d+)\s*year/i);
  const months = monthsMatch ? parseInt(monthsMatch[1]) : 0;
  const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
  return years * 12 + months;
};

// Helper function to convert duration string to years (decimal)
const durationToYears = (duration) => {
  return durationToMonths(duration) / 12;
};

// Calculate derived fields from workExperience
const calculateDerivedFields = (workExperience, scoreBreakdown) => {
  if (!workExperience || !Array.isArray(workExperience) || workExperience.length === 0) {
    return {
      currentDesignation: "",
      currentCompany: "",
      totalExperienceYears: 0,
      relevantExperienceYears: 0,
      numberOfCompanies: 0,
      latestCompanyOne: "",
      latestDesignationOne: "",
      tenureMonthsOne: 0,
      previousCompanyTwo: "",
      previousDesignationTwo: "",
      tenureMonthsTwo: 0,
      stabilityScore: scoreBreakdown?.stabilityScore || 0,
    };
  }

  // Filter out "Total Experience" entry
  const companies = workExperience.filter(exp => exp.companyName !== "Total Experience");
  const totalExpEntry = workExperience.find(exp => exp.companyName === "Total Experience");
  
  const numberOfCompanies = companies.length;
  const latestCompanyOne = companies[0]?.companyName || "";
  const latestDesignationOne = companies[0]?.role || "";
  const tenureMonthsOne = durationToMonths(companies[0]?.duration || "");
  const previousCompanyTwo = companies[1]?.companyName || "";
  const previousDesignationTwo = companies[1]?.role || "";
  const tenureMonthsTwo = durationToMonths(companies[1]?.duration || "");

  // Calculate total experience
  let totalExperienceYears = 0;
  if (totalExpEntry) {
    totalExperienceYears = durationToYears(totalExpEntry.duration);
  } else {
    // Calculate from all companies
    totalExperienceYears = companies.reduce((sum, exp) => sum + durationToYears(exp.duration || ""), 0);
  }

  // Relevant experience is same as total for now (can be enhanced based on JD match)
  const relevantExperienceYears = totalExperienceYears;

  // Current designation and company (most recent)
  const currentDesignation = latestDesignationOne || "";
  const currentCompany = latestCompanyOne || "";

  // Stability score: average tenure per company (higher is better)
  const stabilityScore = scoreBreakdown?.stabilityScore || (numberOfCompanies > 0 
    ? Math.min(100, Math.round((totalExperienceYears / numberOfCompanies) * 20)) 
    : 0);

  return {
    currentDesignation,
    currentCompany,
    totalExperienceYears: Math.round(totalExperienceYears * 10) / 10, // Round to 1 decimal
    relevantExperienceYears: Math.round(relevantExperienceYears * 10) / 10,
    numberOfCompanies,
    latestCompanyOne,
    latestDesignationOne,
    tenureMonthsOne,
    previousCompanyTwo,
    previousDesignationTwo,
    tenureMonthsTwo,
    stabilityScore,
  };
};

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jdHistory, setJdHistory] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false); // Keep for backward compatibility but won't show full-screen
  const [evaluatingFiles, setEvaluatingFiles] = useState(new Map()); // Track individual file evaluations: Map<fileName, {status: 'evaluating'|'done'|'error', progress?: string}>
  const [globalError, setGlobalError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const duplicateWarningTimerRef = useRef(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [settings, setSettings] = useState(null);
  const isJDFromSavedRef = useRef(false); // Track if current JD is from a saved JD (should not be auto-saved)

  // Function to load evaluations (reusable)
  const loadEvaluations = async (useStoredFirst = true) => {
    // Load from localStorage immediately (instant display)
    if (useStoredFirst) {
      const storedEvaluations = getStoredEvaluations();
      if (storedEvaluations.length > 0) {
        setEvaluations(storedEvaluations);
      }
    }
    
    // Then load from database (will update if available)
    try {
      const response = await fetch('/api/evaluations/list?limit=100');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const dbEvaluations = data.data.map(evaluation => {
          // Calculate derived fields if not present
          const derivedFields = calculateDerivedFields(
            evaluation.workExperience || [], 
            evaluation.scoreBreakdown || {}
          );
          
          const emailTypeMap = {
            "Recommended": "Shortlist",
            "Partially Suitable": "Entry-Level",
            "Not Suitable": "Rejection"
          };

          return {
            id: evaluation.id,
            databaseId: evaluation.id, // Store database ID
            candidateName: evaluation.candidateName,
            candidateEmail: evaluation.candidateEmail,
            candidateWhatsApp: evaluation.candidateWhatsApp,
            linkedInUrl: evaluation.linkedInUrl || "",
            roleApplied: evaluation.roleApplied,
            experience: evaluation.experience,
            workExperience: evaluation.workExperience,
            candidateLocation: evaluation.candidateLocation,
            companyLocation: evaluation.companyLocation,
            strengths: evaluation.strengths,
            gaps: evaluation.gaps,
            educationGaps: evaluation.educationGaps,
            experienceGaps: evaluation.experienceGaps,
            verdict: evaluation.verdict,
            betterSuitedFocus: evaluation.betterSuitedFocus,
            matchScore: evaluation.matchScore,
            scoreBreakdown: evaluation.scoreBreakdown || {
              jdMatch: 0,
              educationMatch: 0,
              experienceMatch: 0,
              locationMatch: 0,
              stabilityScore: 0,
            },
            // Derived fields (use existing if present, otherwise calculate)
            currentDesignation: evaluation.currentDesignation || derivedFields.currentDesignation,
            currentCompany: evaluation.currentCompany || derivedFields.currentCompany,
            totalExperienceYears: evaluation.totalExperienceYears || derivedFields.totalExperienceYears,
            relevantExperienceYears: evaluation.relevantExperienceYears || derivedFields.relevantExperienceYears,
            numberOfCompanies: evaluation.numberOfCompanies || derivedFields.numberOfCompanies,
            latestCompanyOne: evaluation.latestCompanyOne || derivedFields.latestCompanyOne,
            latestDesignationOne: evaluation.latestDesignationOne || derivedFields.latestDesignationOne,
            tenureMonthsOne: evaluation.tenureMonthsOne || derivedFields.tenureMonthsOne,
            previousCompanyTwo: evaluation.previousCompanyTwo || derivedFields.previousCompanyTwo,
            previousDesignationTwo: evaluation.previousDesignationTwo || derivedFields.previousDesignationTwo,
            tenureMonthsTwo: evaluation.tenureMonthsTwo || derivedFields.tenureMonthsTwo,
            freeTextNotesShort: evaluation.freeTextNotesShort || evaluation.betterSuitedFocus || "",
            emailType: evaluation.emailType || emailTypeMap[evaluation.verdict] || "Rejection",
            emailDraft: evaluation.emailDraft,
            whatsappDraft: evaluation.whatsappDraft,
            createdAt: evaluation.createdAt,
            jobTitle: evaluation.jobTitle,
          };
        });
        
        // Update state with database evaluations
        setEvaluations(dbEvaluations);
        
        // Also save to localStorage as backup
        try {
          saveEvaluations(dbEvaluations);
        } catch (saveError) {
          logError(saveError, 'Save Evaluations to localStorage');
        }
      } else if (data.success && data.data && data.data.length === 0) {
        // No evaluations in database - keep localStorage if exists
        console.log('No evaluations found in database');
      }
    } catch (err) {
      logError(err, 'Load Evaluations from Database');
      // Keep using localStorage evaluations if database fails
      if (useStoredFirst) {
        try {
          const storedEvaluations = getStoredEvaluations();
          if (storedEvaluations && Array.isArray(storedEvaluations) && storedEvaluations.length > 0) {
            setEvaluations(storedEvaluations);
          }
        } catch (localError) {
          logError(localError, 'Load from localStorage fallback');
        }
      }
    }
    
    return () => {
      isCancelled = true;
    };
  };

  useEffect(() => {
    // Load from localStorage immediately (instant display)
    setJdHistory(getJDs());
    
    // Load evaluations
    loadEvaluations(true);
    
    // Then try to load job descriptions from database
    fetch('/api/job-descriptions/list')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          // Merge with localStorage data
          const dbJDs = data.data.map(jd => ({
            title: jd.title,
            content: jd.content,
            id: jd.id,
          }));
          setJdHistory([...dbJDs, ...getJDs()]);
        }
      })
      .catch(err => console.log('Database JD load failed, using localStorage:', err));
    
    // Reload evaluations when page becomes visible (user navigated back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadEvaluations(false); // Don't show stored first, go straight to database
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-sync localStorage to Supabase on page load (after initial load)
  useEffect(() => {
    // Wait a bit after page load to sync
    const syncTimer = setTimeout(async () => {
      try {
        // Sync evaluations
        const evalSyncResult = await syncEvaluationsToSupabase();
        if (evalSyncResult.success && evalSyncResult.synced > 0) {
          console.log(`✅ Synced ${evalSyncResult.synced} evaluation(s) to Supabase`);
          // Reload evaluations to get database IDs
          loadEvaluations(false);
        }

        // Sync job descriptions
        const jdSyncResult = await syncJobDescriptionsToSupabase();
        if (jdSyncResult.success && jdSyncResult.synced > 0) {
          console.log(`✅ Synced ${jdSyncResult.synced} job description(s) to Supabase`);
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
        // Don't show error to user - sync is background operation
      }
    }, 3000); // Wait 3 seconds after page load

    return () => clearTimeout(syncTimer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Load UI settings from database - will auto-initialize defaults if needed
    const loadSettings = async () => {
      try {
        // Initialize defaults in database if they don't exist (silent, don't wait)
        fetch('/api/settings/init', { method: 'POST' }).catch(() => {});
        
        // Load settings from database (API will auto-initialize if empty)
        const response = await fetch('/api/settings/get');
        
        if (!isMounted) return;
        
        if (!response.ok) {
          throw new Error(`Failed to load settings: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!isMounted) return;
        
        if (data.success) {
          const settingsData = data.data || {};
          setSettings(settingsData);
          // Also sync to localStorage as backup
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("ikfSettings", JSON.stringify(settingsData));
            } catch (storageError) {
              logError(storageError, 'Save Settings to localStorage');
            }
          }
        } else {
          // Fallback to localStorage
          const localSettings = getSettings();
          if (isMounted) {
            setSettings(localSettings);
          }
        }
      } catch (err) {
        logError(err, 'Load Settings');
        if (isMounted) {
          const localSettings = getSettings();
          setSettings(localSettings);
        }
      }
    };
    
    loadSettings();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const detectedTitle =
      jobDescription
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.length > 0) || "";
    setJobTitle(detectedTitle);
    
    // Note: We track if JD is from saved via isJDFromSavedRef
    // This flag is set when handleUseJD is called and cleared when user explicitly saves
    // This prevents auto-saving pre-saved JDs after evaluation
  }, [jobDescription]);

  // Smart title extraction from JD content
  const extractSmartTitle = (content) => {
    if (!content || !content.trim()) return "Untitled JD";
    
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Clean function to remove unwanted phrases
    const cleanTitle = (text) => {
      if (!text) return text;
      return text
        .replace(/\bjob\s+description\b/gi, '')
        .replace(/\bjob\s+desc\b/gi, '')
        .replace(/\bjd\b/gi, '')
        .replace(/\bdescription\b/gi, '')
        .replace(/^[-–—:\s]+|[-–—:\s]+$/g, '') // Remove leading/trailing dashes, colons, spaces
        .trim();
    };
    
    // Look for common patterns
    const patterns = [
      /^(job\s+title|position|role|title)[:]\s*(.+)$/i,
      /^(position|role|title)[:]\s*(.+)$/i,
      /^(.+?)\s*[-–—]\s*(job|position|role)/i,
      /^(looking\s+for|hiring|we\s+are\s+hiring)[:]\s*(.+?)(?:\n|$)/i,
    ];
    
    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[2]) {
          let extracted = match[2].trim();
          extracted = cleanTitle(extracted);
          if (extracted.length > 3 && extracted.length < 100) {
            return extracted;
          }
        }
      }
    }
    
    // Fallback: use first meaningful line
    for (const line of lines) {
      if (line.length > 5 && line.length < 100) {
        const cleaned = cleanTitle(line);
        if (cleaned.length > 3 && 
            !cleaned.toLowerCase().includes('company') &&
            !cleaned.toLowerCase().includes('location') &&
            !cleaned.toLowerCase().includes('requirements') &&
            !cleaned.toLowerCase().includes('qualifications')) {
          return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned;
        }
      }
    }
    
    // Last resort: use detected jobTitle (cleaned) or first line
    const cleanedJobTitle = cleanTitle(jobTitle);
    if (cleanedJobTitle && cleanedJobTitle.length > 3) {
      return cleanedJobTitle;
    }
    
    const firstLine = lines[0] ? cleanTitle(lines[0]) : '';
    return firstLine && firstLine.length > 3 
      ? (firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine)
      : "Untitled JD";
  };

  const handleSaveJD = async () => {
    if (!jobDescription.trim()) {
      setGlobalError("Cannot save an empty job description.");
      return;
    }

    // Clear the flag when user explicitly saves - this is intentional
    isJDFromSavedRef.current = false;

    // Extract smart title
    const suggestedTitle = extractSmartTitle(jobDescription);
    
    // Check for duplicates
    const existingJD = jdHistory.find(jd => 
      jd.content.trim() === jobDescription.trim() || 
      jd.title.toLowerCase() === suggestedTitle.toLowerCase()
    );

    let finalTitle = suggestedTitle;
    
    if (existingJD) {
      const update = await confirm(
        'Job Description Already Exists',
        `A job description with the title "<strong>${existingJD.title}</strong>" already exists.<br><br>Do you want to update it with the current content?<br><br><small>Click "Update" to replace, or "Cancel" to create a new one with a different title.</small>`,
        'Update',
        'Cancel',
        'question'
      );
      
      if (update) {
        finalTitle = existingJD.title;
      } else {
        // Ask for new title
        const newTitle = await prompt(
          'Enter New Title',
          'Enter a new title for this job description:',
          suggestedTitle,
          'Job description title'
        );
        if (!newTitle || !newTitle.trim()) return;
        finalTitle = newTitle.trim();
      }
    } else if (jobTitle && jobTitle !== suggestedTitle) {
      // If we have a detected title that's different, ask user
      const useDetected = await confirm(
        'Choose Title',
        `Suggested title: "<strong>${suggestedTitle}</strong>"<br><br>Detected title: "<strong>${jobTitle}</strong>"<br><br>Use suggested title?`,
        'Use Suggested',
        'Use Detected',
        'question'
      );
      
      if (!useDetected) {
        finalTitle = jobTitle;
      }
    }

    // Save to localStorage
    saveJD(finalTitle, jobDescription);
    
    // Save to database
    try {
      const response = await fetch('/api/job-descriptions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          description: jobDescription,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.id) {
          // Update local history with database ID
          const updatedHistory = jdHistory.map(jd => 
            jd.title === finalTitle ? { ...jd, id: data.data.id } : jd
          );
          if (!updatedHistory.find(jd => jd.title === finalTitle)) {
            updatedHistory.unshift({ title: finalTitle, content: jobDescription, id: data.data.id });
          }
          setJdHistory(updatedHistory);
        }
      }
    } catch (err) {
      console.log('Database save failed, using localStorage:', err);
    }
    
    // Reload from both sources
    const localJDs = getJDs();
    fetch('/api/job-descriptions/list')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          const dbJDs = data.data.map(jd => ({
            title: jd.title,
            content: jd.content,
            id: jd.id,
          }));
          // Merge and deduplicate
          const allJDs = [...dbJDs];
          localJDs.forEach(localJD => {
            if (!allJDs.find(jd => jd.title === localJD.title)) {
              allJDs.push(localJD);
            }
          });
          setJdHistory(allJDs);
        } else {
          setJdHistory(localJDs);
        }
      })
      .catch(() => setJdHistory(localJDs));
    
    setGlobalError("");
    
    // Show success message
    if (typeof window !== "undefined") {
      const message = existingJD ? `Updated "${finalTitle}"` : `Saved "${finalTitle}"`;
      // You could add a toast notification here
      console.log(message);
    }
  };

  const handleUseJD = (jd) => {
    setJobDescription(jd.content);
    setGlobalError("");
    // Mark that this JD is from a saved one - should NOT be auto-saved
    isJDFromSavedRef.current = true;
  };

  const handleDeleteJD = async (jd) => {
    // Delete from localStorage (by title for localStorage entries, or by id if available)
    if (jd.id) {
      // If it has an ID, it's from database - delete from localStorage by matching title
      deleteJD(jd.title);
    } else {
      // If no ID, it's only in localStorage
      deleteJD(jd.title);
    }
    
    // Delete from database if it has an ID
    if (jd.id) {
      try {
        const response = await fetch('/api/job-descriptions/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: jd.id }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Database delete failed:', errorData);
        }
      } catch (err) {
        console.error('Database delete failed:', err);
      }
    }
    
    // Reload JDs from both sources
    const localJDs = getJDs();
    try {
      const response = await fetch('/api/job-descriptions/list');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const dbJDs = data.data.map(jd => ({
          title: jd.title,
          content: jd.content,
          id: jd.id,
          date: jd.createdAt || jd.created_at,
        }));
        
        // Merge and deduplicate (prefer database entries)
        const mergedJDs = [...dbJDs];
        localJDs.forEach(localJD => {
          // Only add if not already in database (by id or title match)
          if (!mergedJDs.find(jd => 
            (jd.id && localJD.id && jd.id === localJD.id) || 
            (jd.title === localJD.title && jd.content === localJD.content)
          )) {
            mergedJDs.push(localJD);
          }
        });
        
        setJdHistory(mergedJDs);
      } else {
        // No database JDs, just use localStorage
        setJdHistory(localJDs);
      }
    } catch (err) {
      console.error('Failed to reload JDs from database:', err);
      // Fallback to localStorage only
      setJdHistory(localJDs);
    }
  };

  const handleUpdateJD = async (jd, newTitle) => {
    if (!newTitle || !newTitle.trim()) {
      console.error("Empty title provided");
      return;
    }
    
    console.log("Updating JD:", { oldTitle: jd.title, newTitle, jdId: jd.id });
    
    // Update localStorage first
    const localJDs = getJDs();
    let foundInLocal = false;
    const updatedLocalJDs = localJDs.map(j => {
      // Match by id if available, otherwise by title and content
      if (jd.id && j.id === jd.id) {
        foundInLocal = true;
        return { ...j, title: newTitle };
      }
      if (!jd.id && j.title === jd.title) {
        // Also check content to be sure
        if (j.content === jd.content || (!j.content && !jd.content)) {
          foundInLocal = true;
          return { ...j, title: newTitle };
        }
      }
      return j;
    });
    
    // If not found in local, add it
    if (!foundInLocal && jd.content) {
      updatedLocalJDs.unshift({
        title: newTitle,
        content: jd.content,
        id: jd.id,
        date: jd.date || new Date().toISOString(),
      });
    }
    
    localStorage.setItem("savedJDs", JSON.stringify(updatedLocalJDs));
    
    // Update in database
    if (jd.id) {
      try {
        const response = await fetch('/api/job-descriptions/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: jd.id,
            title: newTitle,
            description: jd.content,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Database update response:", data);
          
          // Reload from database to get updated data
          const dbResponse = await fetch('/api/job-descriptions/list');
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            if (dbData.success) {
              const dbJDs = (dbData.data || []).map(j => ({
                title: j.title,
                content: j.content,
                id: j.id,
                date: j.created_at || j.date,
              }));
              
              // Merge with localStorage (prioritize database)
              const mergedJDs = [...dbJDs];
              updatedLocalJDs.forEach(localJD => {
                if (!mergedJDs.find(j => 
                  (j.id && localJD.id && j.id === localJD.id) || 
                  (j.title === localJD.title && j.content === localJD.content)
                )) {
                  mergedJDs.push(localJD);
                }
              });
              
              setJdHistory(mergedJDs);
              console.log("JD history updated:", mergedJDs);
              return;
            }
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Database update failed:", response.status, errorData);
        }
      } catch (err) {
        console.error('Database update error:', err);
      }
    }
    
    // Update state from localStorage if database update failed or no id
    const updatedJDs = jdHistory.map(j => {
      // Match by id if available, otherwise by title and content
      if (jd.id && j.id === jd.id) {
        return { ...j, title: newTitle };
      }
      if (!jd.id && j.title === jd.title) {
        // Also check content to be sure
        if (j.content === jd.content || (!j.content && !jd.content)) {
          return { ...j, title: newTitle };
        }
      }
      return j;
    });
    
    setJdHistory(updatedJDs);
    console.log("JD history updated from localStorage:", updatedJDs);
  };

  const handleClearJDs = () => {
    clearJDs();
    setJdHistory([]);
  };

  const buildEmailBodyWithSignature = (body, signature) => {
    if (!signature) return body || '';
    const markers = ["Best regards", "Best Regards", "Regards,", "Thanks & Regards", "Thanks,"];
    let cutIndex = -1;
    markers.forEach((marker) => {
      const idx = body.lastIndexOf(marker);
      if (idx !== -1 && (cutIndex === -1 || idx < cutIndex)) {
        cutIndex = idx;
      }
    });
    const trimmedBody = cutIndex !== -1 ? body.slice(0, cutIndex).trimEnd() : body.trimEnd();
    return `${trimmedBody}\n\n${signature.trim()}`;
  };

  const handleBulkSendEmail = async (candidates) => {
    // Get settings from localStorage if state is not available
    const currentSettings = settings || getSettings();
    
    if (!currentSettings || !currentSettings.emailSendingEnabled) {
      return { success: false, error: "Email sending is not enabled in Settings" };
    }
    
    // Validate email credentials
    if (!currentSettings.gmailEmail || !currentSettings.gmailAppPassword) {
      if (!currentSettings.googleClientId || !currentSettings.googleClientSecret || !currentSettings.googleRefreshToken || !currentSettings.googleSenderEmail) {
        return { success: false, error: "Missing email credentials. Please configure Gmail email + App Password in Settings." };
      }
    }

    // Handle single candidate (from modal individual send)
    if (candidates.length === 1 && candidates[0].candidate) {
      const messageData = candidates[0];
      const candidate = messageData.candidate;
      
      try {
        // Use the edited body from modal, or fallback to original
        const bodyToUse = messageData.body || messageData.originalBody || candidate.emailDraft?.body || '';
        const emailBody = buildEmailBodyWithSignature(
          bodyToUse,
          currentSettings.emailSignature || ''
        );

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: messageData.to,
            subject: messageData.subject || candidate.emailDraft?.subject || 'IKF - Application Update',
            body: emailBody,
            evaluationId: candidate.id || candidate.databaseId || null,
            emailSendingEnabled: currentSettings.emailSendingEnabled,
            gmailEmail: currentSettings.gmailEmail,
            gmailAppPassword: currentSettings.gmailAppPassword,
            googleClientId: currentSettings.googleClientId,
            googleClientSecret: currentSettings.googleClientSecret,
            googleRefreshToken: currentSettings.googleRefreshToken,
            googleSenderEmail: currentSettings.googleSenderEmail,
          }),
        });

        if (response.ok) {
          return { success: true };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return { success: false, error: errorData.error || 'Failed to send email' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // Handle multiple candidates (from send all)
    let success = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < candidates.length; i++) {
      const messageData = candidates[i];
      const candidate = messageData.candidate || messageData;
      
      try {
        // Use edited body from modal if available
        const bodyToUse = messageData.body || messageData.originalBody || candidate.emailDraft?.body || '';
        const emailBody = buildEmailBodyWithSignature(
          bodyToUse,
          currentSettings.emailSignature || ''
        );

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: messageData.to || candidate.candidateEmail,
            subject: messageData.subject || candidate.emailDraft?.subject || 'IKF - Application Update',
            body: emailBody,
            evaluationId: candidate.id || candidate.databaseId || null,
            emailSendingEnabled: currentSettings.emailSendingEnabled,
            gmailEmail: currentSettings.gmailEmail,
            gmailAppPassword: currentSettings.gmailAppPassword,
            googleClientId: currentSettings.googleClientId,
            googleClientSecret: currentSettings.googleClientSecret,
            googleRefreshToken: currentSettings.googleRefreshToken,
            googleSenderEmail: currentSettings.googleSenderEmail,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'simulated' || data.message) {
            success++;
          } else {
            success++;
          }
        } else {
          failed++;
          const errorData = await response.json().catch(() => ({}));
          errors.push(`${candidate.candidateName}: ${errorData.error || 'Failed'}`);
        }
        
        // Add small delay between sends to avoid rate limiting (except for last item)
        if (i < candidates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        failed++;
        errors.push(`${candidate.candidateName}: ${error.message}`);
      }
    }

    return {
      success,
      failed,
      message: `Sent ${success} of ${candidates.length} email(s)${failed > 0 ? `. ${failed} failed.` : ''}`,
      errors: errors.length > 0 ? errors : undefined,
    };
  };

  const handleBulkSendWhatsApp = async (candidates) => {
    // Get settings from localStorage if state is not available
    const currentSettings = settings || getSettings();
    
    if (!currentSettings || !currentSettings.whatsappSendingEnabled) {
      return { success: false, error: "WhatsApp sending is not enabled in Settings" };
    }
    
    // Validate WhatsApp credentials
    if (!currentSettings.whatsappApiKey || !currentSettings.whatsappPhoneNumberId || !currentSettings.whatsappCompanyId) {
      return { success: false, error: "Missing WhatsApp credentials. Please configure WhatsApp API settings in Settings." };
    }

    // Handle single candidate (from modal individual send)
    if (candidates.length === 1 && candidates[0].candidate) {
      const messageData = candidates[0];
      const candidate = messageData.candidate;
      
      // Validate phone number before sending
      const phoneToSend = (messageData.to || candidate.candidateWhatsApp || '').trim();
      if (!phoneToSend) {
        return { success: false, error: "Phone number is missing" };
      }
      
      // Basic validation - should be at least 10 digits (after removing spaces/dashes)
      const digitsOnly = phoneToSend.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        return { success: false, error: "Invalid phone number format - need at least 10 digits" };
      }
      
      // Validate message exists
      const messageToSend = messageData.message || candidate.whatsappDraft?.message || '';
      if (!messageToSend || messageToSend.trim().length === 0) {
        return { success: false, error: "Message is empty" };
      }
      
      try {
        const response = await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phoneToSend,
            message: messageToSend,
            candidateName: candidate.candidateName || 'Candidate',
            evaluationId: candidate.id || candidate.databaseId || null,
            whatsappSendingEnabled: currentSettings.whatsappSendingEnabled,
            whatsappApiKey: currentSettings.whatsappApiKey,
            whatsappApiUrl: currentSettings.whatsappApiUrl,
            whatsappPhoneNumberId: currentSettings.whatsappPhoneNumberId,
            whatsappCompanyId: currentSettings.whatsappCompanyId,
            whatsappTemplateName: currentSettings.whatsappTemplateName,
            whatsappLanguage: currentSettings.whatsappLanguage || 'en',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            return { success: true };
          } else {
            return { success: false, error: data.error || 'Failed to send WhatsApp' };
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          return { success: false, error: errorData.error || 'Failed to send WhatsApp' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // Handle multiple candidates (from send all)
    let success = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < candidates.length; i++) {
      const messageData = candidates[i];
      const candidate = messageData.candidate || messageData;
      
      // Validate phone number before sending
      const phoneToSend = (messageData.to || candidate.candidateWhatsApp || '').trim();
      if (!phoneToSend) {
        failed++;
        errors.push(`${candidate.candidateName || 'Candidate'}: Phone number is missing`);
        continue;
      }
      
      // Basic validation - should be at least 10 digits (after removing spaces/dashes)
      const digitsOnly = phoneToSend.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        failed++;
        errors.push(`${candidate.candidateName || 'Candidate'}: Invalid phone number format - need at least 10 digits`);
        continue;
      }
      
      // Validate message exists
      const messageToSend = messageData.message || candidate.whatsappDraft?.message || '';
      if (!messageToSend || messageToSend.trim().length === 0) {
        failed++;
        errors.push(`${candidate.candidateName || 'Candidate'}: Message is empty`);
        continue;
      }

      try {
        const response = await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phoneToSend,
            message: messageToSend,
            candidateName: candidate.candidateName || 'Candidate',
            evaluationId: candidate.id || candidate.databaseId || null,
            whatsappSendingEnabled: currentSettings.whatsappSendingEnabled,
            whatsappApiKey: currentSettings.whatsappApiKey,
            whatsappApiUrl: currentSettings.whatsappApiUrl,
            whatsappPhoneNumberId: currentSettings.whatsappPhoneNumberId,
            whatsappCompanyId: currentSettings.whatsappCompanyId,
            whatsappTemplateName: currentSettings.whatsappTemplateName,
            whatsappLanguage: currentSettings.whatsappLanguage || 'en',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            success++;
          } else {
            failed++;
            errors.push(`${candidate.candidateName || 'Candidate'}: ${data.error || 'Failed'}`);
          }
        } else {
          failed++;
          const errorData = await response.json().catch(() => ({}));
          errors.push(`${candidate.candidateName || 'Candidate'}: ${errorData.error || 'Failed'}`);
        }
        
        // Add delay between sends to avoid rate limiting (except for last item)
        // WhatsApp APIs often have rate limits, so 1 second delay is safer
        if (i < candidates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        failed++;
        errors.push(`${candidate.candidateName || 'Candidate'}: ${error.message}`);
      }
    }

    return {
      success: success > 0,
      failed,
      message: `Sent ${success} of ${candidates.length} WhatsApp(s)${failed > 0 ? `. ${failed} failed.` : ''}`,
      errors: errors.length > 0 ? errors : undefined,
    };
  };

  const handleResetScan = async () => {
    const hasEvaluations = evaluations.length > 0;
    const hasJD = jobDescription.trim().length > 0;
    
    if (!hasEvaluations && !hasJD) return;
    
    const itemsToClear = [];
    if (hasEvaluations) {
      itemsToClear.push(`${evaluations.length} evaluation(s)`);
    }
    if (hasJD) {
      itemsToClear.push('current job description');
    }
    
    const itemsList = itemsToClear.map(item => `• ${item}`).join('<br>');
    const message = `This will clear:<br>${itemsList}<br><br><small class="text-slate-500">Note: All data is saved in the database and can be accessed later.</small>`;
    
    const confirmed = await confirm(
      'Reset and start a new scan?',
      message,
      'Reset',
      'Cancel',
      'warning'
    );
    
    if (confirmed) {
      setEvaluations([]);
      clearEvaluations();
      setJobDescription('');
      setJobTitle('');
      setSelectedEvaluation(null);
      setGlobalError('');
      setDuplicateWarning(null);
    }
  };

  const arrayFrom = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value
        .split(/\n|;|•|,/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };


  const handleJDFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("jdFile", file);

    const response = await fetch("/api/parse-jd", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Unable to process the job description file.");
    }

    const data = await response.json();
    if (data?.text) {
      setJobDescription(data.text);
      // File upload is new content, not from saved JD
      isJDFromSavedRef.current = false;
      return data.text;
    }

    throw new Error("Unable to read the uploaded job description file.");
  };

  const handleEvaluate = async ({ resumeFile }) => {
    const fileName = resumeFile.name || `resume_${Date.now()}`;
    
    // Mark this file as evaluating (no full-screen loader)
    setEvaluatingFiles(prev => {
      const newMap = new Map(prev);
      newMap.set(fileName, { status: 'evaluating', progress: 'Processing resume...' });
      return newMap;
    });
    
    setGlobalError("");

    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      formData.append("resume", resumeFile);

      const response = await fetch("/api/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Unable to evaluate resume.");
      }

      const data = await response.json();
      const summary = data?.result?.evaluationSummary || {};
      const emailDraft = data?.result?.emailDraft || null;
      const whatsappDraft = data?.result?.whatsappDraft || null;

      const candidateName = summary.candidateName || "Candidate";
      const roleApplied = summary.roleApplied || jobTitle || "Role";
      
      // Smart duplicate detection (from database with multiple matching strategies)
      try {
        const duplicateParams = new URLSearchParams({
          candidateName: candidateName,
        });
        if (summary.candidateEmail) duplicateParams.append('candidateEmail', summary.candidateEmail);
        if (summary.candidateWhatsApp) duplicateParams.append('candidateWhatsApp', summary.candidateWhatsApp);
        if (summary.linkedInUrl) duplicateParams.append('linkedInUrl', summary.linkedInUrl);
        
        const duplicateCheck = await fetch(`/api/evaluations/check-duplicate?${duplicateParams.toString()}`);
        const duplicateData = await duplicateCheck.json();
        
        if (duplicateData.success && duplicateData.isDuplicate) {
          const prevDate = new Date(duplicateData.data.createdAt).toLocaleDateString();
          setDuplicateWarning({
            candidateName,
            previousRole: duplicateData.data.roleApplied,
            previousDate: prevDate,
            matchMethod: duplicateData.matchMethod,
          });
          // Clear any existing timer
          if (duplicateWarningTimerRef.current) {
            clearTimeout(duplicateWarningTimerRef.current);
          }
          // Set new timer
          duplicateWarningTimerRef.current = setTimeout(() => {
            setDuplicateWarning(null);
            duplicateWarningTimerRef.current = null;
          }, 20000);
        } else {
          // Fallback to localStorage check
          const previousEval = findPreviousEvaluation(candidateName);
          if (previousEval) {
            const prevDate = new Date(previousEval.createdAt).toLocaleDateString();
            setDuplicateWarning({
              candidateName,
              previousRole: previousEval.roleApplied,
              previousDate: prevDate,
              matchMethod: 'localStorage',
            });
            // Clear any existing timer
            if (duplicateWarningTimerRef.current) {
              clearTimeout(duplicateWarningTimerRef.current);
            }
            // Set new timer
            duplicateWarningTimerRef.current = setTimeout(() => {
              setDuplicateWarning(null);
              duplicateWarningTimerRef.current = null;
            }, 20000);
          }
        }
      } catch (err) {
        logError(err, 'Duplicate Check');
        // Fallback to localStorage
        const previousEval = findPreviousEvaluation(candidateName);
        if (previousEval) {
          const prevDate = new Date(previousEval.createdAt).toLocaleDateString();
          setDuplicateWarning({
            candidateName,
            previousRole: previousEval.roleApplied,
            previousDate: prevDate,
            matchMethod: 'localStorage',
          });
          // Clear any existing timer
          if (duplicateWarningTimerRef.current) {
            clearTimeout(duplicateWarningTimerRef.current);
          }
          // Set new timer
          duplicateWarningTimerRef.current = setTimeout(() => {
            setDuplicateWarning(null);
            duplicateWarningTimerRef.current = null;
          }, 20000);
        }
      }

      // Calculate derived fields
      const derivedFields = calculateDerivedFields(summary.workExperience || [], summary.scoreBreakdown || {});
      const scoreBreakdown = {
        jdMatch: summary.scoreBreakdown?.jdMatch || 0,
        educationMatch: summary.scoreBreakdown?.educationMatch || 0,
        experienceMatch: summary.scoreBreakdown?.experienceMatch || 0,
        locationMatch: summary.scoreBreakdown?.locationMatch || 0,
        stabilityScore: summary.scoreBreakdown?.stabilityScore || derivedFields.stabilityScore,
      };

      // Map verdict to EmailType
      const emailTypeMap = {
        "Recommended": "Shortlist",
        "Partially Suitable": "Entry-Level",
        "Not Suitable": "Rejection"
      };

      const evaluation = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        candidateName,
        candidateEmail: summary.candidateEmail || "",
        candidateWhatsApp: summary.candidateWhatsApp || "",
        linkedInUrl: summary.linkedInUrl || "",
        roleApplied,
        experience: summary.experienceCtcNoticeLocation || "",
        workExperience: summary.workExperience || [],
        candidateLocation: summary.candidateLocation || "",
        companyLocation: summary.companyLocation || "",
        strengths: arrayFrom(summary.keyStrengths),
        gaps: arrayFrom(summary.gaps),
        educationGaps: arrayFrom(summary.educationGaps),
        experienceGaps: arrayFrom(summary.experienceGaps),
        verdict: summary.verdict || "Not Suitable",
        betterSuitedFocus: summary.betterSuitedFocus || "",
        matchScore: summary.matchScore || 0,
        scoreBreakdown,
        // Derived fields
        currentDesignation: derivedFields.currentDesignation,
        currentCompany: derivedFields.currentCompany,
        totalExperienceYears: derivedFields.totalExperienceYears,
        relevantExperienceYears: derivedFields.relevantExperienceYears,
        numberOfCompanies: derivedFields.numberOfCompanies,
        latestCompanyOne: derivedFields.latestCompanyOne,
        latestDesignationOne: derivedFields.latestDesignationOne,
        tenureMonthsOne: derivedFields.tenureMonthsOne,
        previousCompanyTwo: derivedFields.previousCompanyTwo,
        previousDesignationTwo: derivedFields.previousDesignationTwo,
        tenureMonthsTwo: derivedFields.tenureMonthsTwo,
        freeTextNotesShort: summary.betterSuitedFocus || (summary.gaps && summary.gaps.length > 0 ? summary.gaps.slice(0, 2).join("; ") : ""),
        emailType: emailTypeMap[summary.verdict] || "Rejection",
        emailDraft,
        whatsappDraft,
        jobTitle: data?.metadata?.jobDescriptionTitle || jobTitle,
        jdLink: data?.metadata?.jdLink || "",
        createdAt: new Date().toISOString(),
      };

      // Save to database
      try {
        const saveResponse = await fetch('/api/evaluations/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName,
            candidateName,
            candidateEmail: summary.candidateEmail || '',
            candidateWhatsApp: summary.candidateWhatsApp || '',
            candidateLocation: summary.candidateLocation || '',
            linkedInUrl: summary.linkedInUrl || '',
            roleApplied,
            companyLocation: summary.companyLocation || '',
            experienceCtcNoticeLocation: summary.experienceCtcNoticeLocation || '',
            workExperience: summary.workExperience || [],
            verdict: summary.verdict || 'Not Suitable',
            matchScore: summary.matchScore || 0,
            scoreBreakdown: {
              jdMatch: summary.scoreBreakdown?.jdMatch || 0,
              educationMatch: summary.scoreBreakdown?.educationMatch || 0,
              experienceMatch: summary.scoreBreakdown?.experienceMatch || 0,
              locationMatch: summary.scoreBreakdown?.locationMatch || 0,
              stabilityScore: summary.scoreBreakdown?.stabilityScore || derivedFields.stabilityScore,
            },
            keyStrengths: arrayFrom(summary.keyStrengths),
            gaps: arrayFrom(summary.gaps),
            educationGaps: arrayFrom(summary.educationGaps),
            experienceGaps: arrayFrom(summary.experienceGaps),
            betterSuitedFocus: summary.betterSuitedFocus || '',
            emailDraft,
            whatsappDraft,
          }),
        });
        
        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          const dbEvaluationId = saveData.data?.evaluationId;
          if (dbEvaluationId) {
            evaluation.id = dbEvaluationId;
            evaluation.databaseId = dbEvaluationId;
            
            // Save resume file to database if available
            if (data?.metadata?.resumeFile) {
              try {
                const resumeData = data.metadata.resumeFile;
                await fetch('/api/resumes/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    evaluationId: dbEvaluationId,
                    fileName: resumeData.fileName,
                    fileType: resumeData.fileType,
                    fileSize: resumeData.fileSize,
                    fileContent: resumeData.fileContent, // Already base64
                  }),
                });
              } catch (resumeError) {
                console.log('Resume save failed:', resumeError);
                // Continue - evaluation is saved, resume is optional
              }
            }
          }
        }
      } catch (dbError) {
        console.log('Database save failed, using localStorage:', dbError);
      }

      // Save candidate to history (localStorage fallback)
      saveCandidateEvaluation(candidateName, roleApplied, evaluation.id, evaluation.createdAt);

      // Mark evaluation as complete first (removes from loading column)
      setEvaluatingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileName); // Remove from evaluating list
        return newMap;
      });
      
      // Add to state and localStorage (appears in kanban immediately)
      setEvaluations((prev) => {
        const updated = [evaluation, ...prev];
        // Save to localStorage immediately for session persistence
        saveEvaluations(updated);
        return updated;
      });

      // If database save failed, mark for sync later
      if (!evaluation.databaseId) {
        console.log('⚠️ Evaluation saved to localStorage but not to database. Will sync on next page load.');
      }
      
      // Scroll kanban into view so user sees the new result
      setTimeout(() => {
        const kanbanElement = document.querySelector('[data-kanban-section]');
        if (kanbanElement) {
          kanbanElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      
      // IMPORTANT: JD is NOT automatically saved after evaluation
      // User must explicitly click "Save JD" button to save it
      // We do NOT call saveJD() or fetch('/api/job-descriptions/save') here
      // 
      // Additional safeguard: If JD was loaded from saved JDs (isJDFromSavedRef.current === true),
      // we definitely should NOT save it again - it's already saved
      // The flag will be cleared when user explicitly clicks "Save JD" or uploads a new file
      
      return evaluation;
    } catch (error) {
      // Mark evaluation as error
      setEvaluatingFiles(prev => {
        const newMap = new Map(prev);
        newMap.set(fileName, { status: 'error', error: error.message });
        return newMap;
      });
      
      setGlobalError(error.message || "Unable to evaluate resume.");
      throw error;
    }
  };

  const boardEvaluations = useMemo(() => evaluations, [evaluations]);
  const verdictCounts = useMemo(() => {
    return evaluations.reduce(
      (acc, evaluation) => {
        const verdictKey = evaluation.verdict || "Not Suitable";
        acc[verdictKey] = (acc[verdictKey] || 0) + 1;
        return acc;
      },
      { Recommended: 0, "Partially Suitable": 0, "Not Suitable": 0 },
    );
  }, [evaluations]);
  const latestEvaluationTime = useMemo(
    () => evaluations[0]?.createdAt || null,
    [evaluations],
  );

  return (
    <>
      <Head>
        <title>IKF AI Resume Screener | I Knowledge Factory Pvt. Ltd.</title>
      </Head>
      <main className="relative min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Company Logo/Branding */}
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <span className="text-lg font-bold">IKF</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl leading-tight">
                      Resume Screener
                    </h1>
                  </div>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    I Knowledge Factory Pvt. Ltd.
                  </p>
                  {evaluations.length > 0 && (
                    <p className="text-sm text-slate-500 mt-0.5">
                      {evaluations.length} candidate{evaluations.length !== 1 ? 's' : ''} evaluated
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {evaluations.length > 0 && (
                  <StatusSummary counts={verdictCounts} lastEvaluated={latestEvaluationTime} />
                )}
                {evaluations.length > 0 && (
                  <button
                    onClick={handleResetScan}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    title="Reset and start a new scan"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset Scan
                  </button>
                )}
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              </div>
            </div>
          </header>

          {/* Loading Overlay - REMOVED: No full-screen loader, results appear in kanban */}

          <div className="flex flex-col gap-6 pb-12">
            {/* Main Workflow */}
            <UploadPanel
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              jobTitle={jobTitle}
              onSaveJD={handleSaveJD}
              jdHistory={jdHistory}
              onUseJD={handleUseJD}
              onDeleteJD={handleDeleteJD}
              onClearJDs={handleClearJDs}
              onUpdateJD={handleUpdateJD}
              onEvaluate={handleEvaluate}
              onJDFileUpload={handleJDFileUpload}
              loading={loading}
            />

            {globalError && (
              <div className="rounded-xl border-2 border-red-300 bg-red-50 px-6 py-4 text-sm text-red-700 shadow-sm">
                <strong>Error:</strong> {globalError}
              </div>
            )}

            {duplicateWarning && (
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-6 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 mb-1">
                      Duplicate Candidate Detected
                    </p>
                    <p className="text-sm text-amber-800">
                      <strong>{duplicateWarning.candidateName}</strong> was previously evaluated on{" "}
                      <strong>{duplicateWarning.previousDate}</strong> for the position:{" "}
                      <strong>{duplicateWarning.previousRole}</strong>
                      {duplicateWarning.matchMethod && (
                        <span className="ml-2 text-xs text-amber-600">
                          (Matched by: {duplicateWarning.matchMethod})
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(null)}
                    className="flex-shrink-0 rounded-md p-1 text-amber-600 hover:bg-amber-100 hover:text-amber-800"
                    aria-label="Close warning"
                    title="Close"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Results Section */}
            {evaluations.length > 0 && (
              <div className="mt-4">
                {/* Scan Status Banner */}
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          Active Scan Session
                        </p>
                        <p className="text-xs text-blue-700 mt-0.5">
                          {evaluations.length} candidate{evaluations.length !== 1 ? 's' : ''} evaluated • 
                          {evaluations[0]?.jobTitle && ` Position: ${evaluations[0].jobTitle} • `}
                          Evaluations persist until you reset or start a new scan
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleResetScan}
                      className="inline-flex items-center gap-1.5 rounded border border-blue-300 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                      title="Reset and start a new scan"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset Scan
                    </button>
                  </div>
                </div>
                
                <JiraBoard
                  evaluations={boardEvaluations}
                  evaluatingFiles={evaluatingFiles}
                  onSelectCandidate={setSelectedEvaluation}
                  onViewResume={(candidate) => setSelectedResume(candidate)}
                  onBulkSendEmail={handleBulkSendEmail}
                  onBulkSendWhatsApp={handleBulkSendWhatsApp}
                  canSendEmail={!!settings?.emailSendingEnabled}
                  canSendWhatsApp={!!settings?.whatsappSendingEnabled}
                  settings={settings}
                />
              </div>
            )}
          </div>
        </div>
        {selectedEvaluation && (
          <EvaluationModal
            candidate={selectedEvaluation}
            onClose={() => setSelectedEvaluation(null)}
            emailSignature={settings?.emailSignature}
            canSendEmail={!!settings?.emailSendingEnabled}
            canSendWhatsApp={!!settings?.whatsappSendingEnabled}
          />
        )}
        
        {selectedResume && (
          <ResumeViewer
            evaluationId={selectedResume.databaseId || selectedResume.id}
            candidateName={selectedResume.candidateName}
            onClose={() => setSelectedResume(null)}
          />
        )}
        
        {/* Footer with Branding */}
        <footer className="mt-12 border-t border-slate-200 bg-white py-6">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <span className="text-sm font-bold">IKF</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-slate-900">I Knowledge Factory Pvt. Ltd.</p>
                  <p className="text-xs text-slate-500">AI-Powered Resume Screening Solution</p>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                © {new Date().getFullYear()} I Knowledge Factory Pvt. Ltd. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
