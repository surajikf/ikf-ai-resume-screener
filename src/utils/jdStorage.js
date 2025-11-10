export const saveJD = (title, content) => {
  if (typeof window === "undefined") return;

  const existing = JSON.parse(localStorage.getItem("savedJDs")) || [];
  const updated = [
    { title, content, date: new Date().toISOString() },
    ...existing.filter((jd) => jd.title !== title),
  ];
  localStorage.setItem("savedJDs", JSON.stringify(updated.slice(0, 10)));
};

export const getJDs = () => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("savedJDs")) || [];
};

export const deleteJD = (title) => {
  if (typeof window === "undefined") return;
  const existing = JSON.parse(localStorage.getItem("savedJDs")) || [];
  const filtered = existing.filter((jd) => jd.title !== title);
  localStorage.setItem("savedJDs", JSON.stringify(filtered));
};

export const clearJDs = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("savedJDs");
};

