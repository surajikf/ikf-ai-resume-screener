const DEFAULT_SETTINGS = {
  emailSignature: [
    "Best regards,",
    "Jahanvi Patel",
    "I Knowledge Factory Pvt. Ltd.",
    "📞 +91 9665079317",
  ].join("\n"),
  emailSendingEnabled: false,
  gmailEmail: "",
  gmailAppPassword: "",
  googleClientId: "",
  googleClientSecret: "",
  googleRefreshToken: "",
  googleSenderEmail: "",
  whatsappSendingEnabled: false,
  whatsappApiKey: "",
  whatsappApiUrl: "https://publicapi.myoperator.co/chat/messages",
  whatsappPhoneNumberId: "",
  whatsappCompanyId: "",
  whatsappTemplateName: "",
  whatsappLanguage: "en",
};

export const getSettings = () => {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };

  try {
    const raw = localStorage.getItem("ikfSettings");
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...(parsed || {}),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = (partialSettings) => {
  if (typeof window === "undefined") return;

  const current = getSettings();
  const next = {
    ...current,
    ...(partialSettings || {}),
  };

  localStorage.setItem("ikfSettings", JSON.stringify(next));
};

