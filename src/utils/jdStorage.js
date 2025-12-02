export const saveJD = (title, content) => {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem("savedJDs");
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [
      { title, content, date: new Date().toISOString() },
      ...existing.filter((jd) => jd.title !== title),
    ];
    localStorage.setItem("savedJDs", JSON.stringify(updated.slice(0, 10)));
  } catch (error) {
    console.error("Error saving JD:", error);
    // Reset corrupted data
    localStorage.setItem("savedJDs", JSON.stringify([{ title, content, date: new Date().toISOString() }]));
  }
};

export const getJDs = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("savedJDs");
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Error reading JDs:", error);
    // Clear corrupted data
    localStorage.removeItem("savedJDs");
    return [];
  }
};

export const deleteJD = (title) => {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("savedJDs");
    const existing = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((jd) => jd.title !== title);
    localStorage.setItem("savedJDs", JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting JD:", error);
    localStorage.removeItem("savedJDs");
  }
};

export const clearJDs = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("savedJDs");
};

