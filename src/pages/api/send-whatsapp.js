// Parse phone number and extract country code and number
function parsePhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  // Ensure phoneNumber is a string (handle numbers, null, undefined)
  const phoneStr = String(phoneNumber || "").trim();
  if (!phoneStr) {
    throw new Error("Phone number is required");
  }

  // Check if original input has + at the start (before cleaning)
  const hasPlusPrefix = phoneStr.startsWith("+");
  
  // Remove ALL non-digit characters (spaces, dashes, dots, parentheses, +, etc.)
  let cleaned = phoneStr.replace(/\D/g, "");

  console.log("[parsePhoneNumber] Input:", JSON.stringify(phoneNumber), "As string:", JSON.stringify(phoneStr), "Cleaned digits only:", cleaned, "Length:", cleaned.length);

  // Handle +91XXXXXXXXXX format (if original had + and starts with 91)
  if (hasPlusPrefix && cleaned.startsWith("91") && cleaned.length === 12) {
    const number = cleaned.substring(2);
    if (number.length === 10 && /^\d{10}$/.test(number)) {
      return { countryCode: "91", number };
    }
  }

  // Handle 91XXXXXXXXXX format (12 digits total, no +)
  if (cleaned.startsWith("91") && cleaned.length === 12 && /^91\d{10}$/.test(cleaned)) {
    const number = cleaned.substring(2);
    return { countryCode: "91", number };
  }

  // Handle 0XXXXXXXXXX format (11 digits starting with 0)
  if (cleaned.length === 11 && cleaned.startsWith("0") && /^0\d{10}$/.test(cleaned)) {
    const number = cleaned.substring(1);
    return { countryCode: "91", number };
  }

  // Handle exactly 10 digits (assume Indian number)
  if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    return { countryCode: "91", number: cleaned };
  }

  // If it's longer than 10, try to extract the number
  if (cleaned.length > 10) {
    // If it starts with 91, remove it
    if (cleaned.startsWith("91")) {
      const withoutCountry = cleaned.substring(2);
      if (withoutCountry.length === 10 && /^\d{10}$/.test(withoutCountry)) {
        return { countryCode: "91", number: withoutCountry };
      }
    }
    // Try last 10 digits as fallback
    const last10 = cleaned.slice(-10);
    if (/^\d{10}$/.test(last10)) {
      console.log("[parsePhoneNumber] Using last 10 digits as fallback:", last10);
      return { countryCode: "91", number: last10 };
    }
  }

  // If it's shorter than 10, it's invalid
  if (cleaned.length < 10) {
    throw new Error(`Invalid phone number format: "${phoneStr}". Phone number has only ${cleaned.length} digits after cleaning. Please provide a 10-digit Indian phone number (e.g., 9272850850) or with country code (+919272850850).`);
  }

  throw new Error(`Invalid phone number format: "${phoneStr}". After cleaning, got "${cleaned}" (${cleaned.length} digits). Please provide a 10-digit Indian phone number (e.g., 9272850850) or with country code (+919272850850).`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    console.log("[send-whatsapp] Received request:", {
      method: req.method,
      bodyKeys: Object.keys(req.body || {}),
      hasTo: !!req.body?.to,
      hasMessage: !!req.body?.message,
      toValue: req.body?.to,
      toType: typeof req.body?.to,
      fullBody: JSON.stringify(req.body, null, 2),
    });

    const {
      to,
      message,
      candidateName,
      whatsappSendingEnabled,
      whatsappApiKey,
      whatsappApiUrl,
      whatsappPhoneNumberId,
      whatsappCompanyId,
      whatsappTemplateName,
      whatsappLanguage,
    } = req.body;

    // Get settings from request body (settings should be passed from frontend)
    // All settings must be provided in the request body
    const enabled = whatsappSendingEnabled ?? false;
    const apiKey = whatsappApiKey || "";
    const apiUrl = whatsappApiUrl || "https://publicapi.myoperator.co/chat/messages";
    const phoneNumberId = whatsappPhoneNumberId || "";
    const companyId = whatsappCompanyId || "";
    const templateName = whatsappTemplateName || "";
    const language = whatsappLanguage || "en";

    console.log("[send-whatsapp] Settings check:", {
      enabled,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      hasPhoneNumberId: !!phoneNumberId,
      phoneNumberIdValue: phoneNumberId, // Log the actual value to debug
      hasCompanyId: !!companyId,
      hasTemplateName: !!templateName,
      to: to,
      hasMessage: !!message,
    });
    
    // Validate phone_number_id is not a phone number (should be a UUID or numeric ID, not 10-12 digits)
    // Phone Number ID from MyOperator is typically a longer numeric ID (e.g., "690875100784871") or UUID
    // NOT the actual phone number (which would be 10 digits like "8044186875")
    const cleanedPhoneNumberId = phoneNumberId ? String(phoneNumberId).replace(/\D/g, "") : "";
    if (cleanedPhoneNumberId && /^\d{10,12}$/.test(cleanedPhoneNumberId)) {
      console.error("[send-whatsapp] WARNING: phone_number_id looks like a phone number, not a Phone Number ID!", {
        provided: phoneNumberId,
        cleaned: cleanedPhoneNumberId,
        length: cleanedPhoneNumberId.length
      });
      return res.status(400).json({
        error: "Invalid Phone Number ID",
        message: `The Phone Number ID appears to be a phone number (${phoneNumberId}) instead of a Phone Number ID. In MyOperator Settings, the "Phone Number ID" should be the ID of your WhatsApp Business number (usually a longer numeric ID like "690875100784871" or a UUID from MyOperator dashboard), NOT the phone number itself (which would be 10 digits). Please check your Settings → WhatsApp API settings and update the Phone Number ID field.`,
        hint: "Phone Number ID should be a longer numeric ID or UUID, not a 10-digit phone number. Check your MyOperator dashboard for the correct Phone Number ID.",
      });
    }

    // Validate settings
    if (!enabled) {
      console.error("[send-whatsapp] WhatsApp sending is disabled");
      return res.status(400).json({
        error: "WhatsApp sending is disabled",
        message: "Please enable WhatsApp messaging in Settings.",
      });
    }

    if (!apiKey || !phoneNumberId || !companyId || !templateName) {
      const missing = [];
      if (!apiKey) missing.push("API Key");
      if (!phoneNumberId) missing.push("Phone Number ID");
      if (!companyId) missing.push("Company ID");
      if (!templateName) missing.push("Template Name");
      
      console.error("[send-whatsapp] Missing credentials:", missing);
      return res.status(400).json({
        error: "Missing WhatsApp API credentials",
        message: `Please configure the following in Settings: ${missing.join(", ")}`,
        missing: missing,
      });
    }
    
    // Clean API key (remove trailing = if present) - do this early so we can validate it
    const cleanApiKey = apiKey.trim().replace(/=+$/, "");
    
    // Validate API key format (should not be empty after cleaning)
    if (!cleanApiKey || cleanApiKey.length < 10) {
      console.error("[send-whatsapp] Invalid API Key:", {
        originalLength: apiKey?.length,
        cleanedLength: cleanApiKey?.length,
        hasApiKey: !!apiKey
      });
      return res.status(400).json({
        error: "Invalid API Key",
        message: "WhatsApp API Key appears to be invalid. Please check your Settings.",
      });
    }

    if (!to || !message) {
      console.error("[send-whatsapp] Missing required fields:", {
        hasTo: !!to,
        hasMessage: !!message,
        toValue: to,
        messageLength: message?.length
      });
      return res.status(400).json({
        error: "Missing required fields",
        message: "Phone number (to) and message are required.",
      });
    }

    // Parse phone number
    let countryCode, number;
    try {
      console.log("[send-whatsapp] Attempting to parse phone number:", {
        input: to,
        type: typeof to,
        length: to?.length
      });
      
      const parsed = parsePhoneNumber(to);
      countryCode = parsed.countryCode;
      number = parsed.number;
      
      console.log("[send-whatsapp] Parsed phone number:", {
        countryCode,
        number,
        numberLength: number?.length
      });
      
      // Validate parsed number
      if (!number || number.length !== 10 || !/^\d{10}$/.test(number)) {
        throw new Error(`Parsed number is invalid: ${number}. Expected 10 digits, got ${number?.length || 0}.`);
      }
      if (!countryCode || countryCode !== "91") {
        throw new Error(`Country code is invalid: ${countryCode}. Expected "91" for India.`);
      }
    } catch (parseError) {
      console.error("[send-whatsapp] Phone number parsing error:", {
        input: to,
        inputType: typeof to,
        inputLength: to?.length,
        error: parseError.message,
        stack: parseError.stack
      });
      return res.status(400).json({
        error: "Invalid phone number format",
        message: parseError.message || `Invalid phone number: ${to}. Please provide a 10-digit Indian phone number (e.g., 9272850850) or with country code (+919272850850).`,
      });
    }

    // Prepare message body - clean it but don't be too aggressive
    // MyOperator template already has structure, so we just need the core message
    let messageBody = message.trim();
    
    // Only remove obvious signature elements that shouldn't be in template variable
    // Keep the main message content intact
    const signaturePatterns = [
      /Best regards[^.]*/gi,
      /Regards[^.]*/gi,
      /Jahanvi Patel[^.]*/gi,
      /I Knowledge Factory[^.]*/gi,
      /📞.*\+91 9665079317[^.]*/gi,
      /Phone:.*\+91 9665079317[^.]*/gi,
      /Email:.*@[^\s]+/gi,
    ];
    
    signaturePatterns.forEach(pattern => {
      messageBody = messageBody.replace(pattern, "").trim();
    });
    
    // Clean up excessive blank lines (more than 2 consecutive)
    messageBody = messageBody.replace(/\n{3,}/g, "\n\n").trim();

    // Validate message body is not empty
    if (!messageBody || messageBody.length === 0) {
      console.error("[send-whatsapp] Message body is empty after processing. Original message:", message.substring(0, 200));
      return res.status(400).json({
        error: "Message body is empty",
        message: "The message content for template variable {{messagebody}} is empty after processing. Please check the message content.",
      });
    }
    
    // Validate message body length (MyOperator may have limits)
    if (messageBody.length > 1000) {
      console.warn("[send-whatsapp] Message body is very long:", messageBody.length, "characters");
      // Truncate if too long, but log it
      messageBody = messageBody.substring(0, 1000);
    }

    // Prepare request payload
    // MyOperator API expects specific structure
    // Template variables are numbered based on their order in the template:
    // 1 = {{name}} (first variable)
    // 2 = {{messagebody}} (second variable)
    const requestPayload = {
      phone_number_id: String(phoneNumberId).trim(),
      customer_country_code: String(countryCode).trim(),
      customer_number: String(number).trim(),
      data: {
        type: "template",
        context: {
          template_name: String(templateName).trim(),
          language: String(language).trim(),
          body: {
            "1": String(candidateName || "Candidate").trim(), // Maps to {{name}} in template
            "2": String(messageBody).trim(), // Maps to {{messagebody}} in template
          },
        },
      },
    };
    
    // Validate template variables are not empty
    if (!requestPayload.data.context.body["1"] || requestPayload.data.context.body["1"].length === 0) {
      return res.status(400).json({
        error: "Invalid template variable",
        message: "Template variable '1' (name) cannot be empty.",
      });
    }
    
    if (!requestPayload.data.context.body["2"] || requestPayload.data.context.body["2"].length === 0) {
      return res.status(400).json({
        error: "Invalid template variable",
        message: "Template variable '2' (messagebody) cannot be empty.",
      });
    }

    console.log("[send-whatsapp] Sending WhatsApp message:", {
      to: number,
      countryCode: countryCode,
      candidateName: candidateName,
      messageLength: messageBody.length,
      templateName: templateName,
      phoneNumberId: phoneNumberId,
      companyId: companyId,
      templateVariables: {
        "1 (name)": requestPayload.data.context.body["1"],
        "2 (messagebody)": messageBody.substring(0, 150) + (messageBody.length > 150 ? "..." : ""),
      }
    });

    console.log("[send-whatsapp] Full request payload:", JSON.stringify(requestPayload, null, 2));
    console.log("[send-whatsapp] API URL:", apiUrl);
    console.log("[send-whatsapp] Headers:", {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${cleanApiKey.substring(0, 10)}...` + ` (length: ${cleanApiKey.length})`,
      "X-MYOP-COMPANY-ID": companyId,
    });

    // Send request to MyOperator API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${cleanApiKey}`,
        "X-MYOP-COMPANY-ID": companyId,
      },
      body: JSON.stringify(requestPayload),
    });
    
    console.log("[send-whatsapp] MyOperator response status:", response.status, response.statusText);

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[send-whatsapp] Failed to parse response:", responseText);
      return res.status(500).json({
        error: "Invalid response from MyOperator API",
        message: responseText.substring(0, 500),
      });
    }

    if (!response.ok) {
      console.error("[send-whatsapp] MyOperator API error:", {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText,
        responseData: responseData,
        requestPayload: {
          phone_number_id: phoneNumberId,
          customer_country_code: countryCode,
          customer_number: number,
          template_name: templateName,
          fullPayload: requestPayload
        }
      });
      
      // Extract error message from various possible response formats
      let errorMessage = "Failed to send WhatsApp message";
      let errorDetails = null;
      
      if (responseData.message) {
        errorMessage = responseData.message;
      } else if (responseData.error) {
        errorMessage = responseData.error;
      } else if (responseData.Message) {
        errorMessage = responseData.Message;
      } else if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else if (responseData.data?.message) {
        errorMessage = responseData.data.message;
      } else if (responseData.error?.message) {
        errorMessage = responseData.error.message;
      }
      
      // Extract detailed errors if available
      if (responseData.errors) {
        if (Array.isArray(responseData.errors)) {
          errorDetails = responseData.errors;
          errorMessage += ": " + responseData.errors.map(e => e.message || e).join(", ");
        } else if (typeof responseData.errors === 'object') {
          errorDetails = responseData.errors;
          // Try to extract specific field errors
          const fieldErrors = Object.entries(responseData.errors)
            .map(([field, error]) => `${field}: ${typeof error === 'string' ? error : JSON.stringify(error)}`)
            .join(", ");
          if (fieldErrors) {
            errorMessage += " - " + fieldErrors;
          }
        }
      }
      
      console.error("[send-whatsapp] MyOperator error details:", {
        code: responseData.code,
        message: responseData.message,
        errors: errorDetails,
        fullResponse: responseData
      });
      
      // Return more detailed error information
      return res.status(400).json({
        error: errorMessage,
        message: errorMessage,
        details: responseData,
        statusCode: response.status,
        requestDetails: {
          phone_number_id: phoneNumberId,
          customer_country_code: countryCode,
          customer_number: number,
          template_name: templateName,
        }
      });
    }

    // Check for success response - MyOperator may return different response formats
    const conversationId = responseData.data?.conversation_id || responseData.conversation_id;
    const messageId = responseData.data?.message_id || responseData.message_id;
    
    const isSuccess = response.ok && (
      (responseData.status === "success" && responseData.data) ||
      (responseData.data && (messageId || conversationId)) ||
      (messageId || conversationId)
    );

    if (isSuccess) {
      console.log("[send-whatsapp] Message sent successfully:", {
        conversation_id: conversationId,
        message_id: messageId,
      });

      // Log to database if evaluationId is provided
      const { evaluationId } = req.body || {};
      if (evaluationId) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/logs/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              evaluationId,
              toWhatsApp: number,
              message: messageBody, // Use the cleaned messageBody that was sent
              status: 'sent',
              messageId: messageId,
              conversationId: conversationId,
            }),
          });
        } catch (logError) {
          console.log('WhatsApp log save failed:', logError);
        }
      }

      return res.status(200).json({
        success: true,
        message: `WhatsApp message sent successfully to ${number}`,
        data: {
          conversation_id: conversationId,
          message_id: messageId,
        },
      });
    }

    // Unexpected response format
    console.error("[send-whatsapp] Unexpected response format:", responseData);
    return res.status(500).json({
      error: "Unexpected response from MyOperator API",
      message: "Message may have been sent, but received unexpected response format.",
      response: responseData,
    });
  } catch (error) {
    console.error("[send-whatsapp] Error:", error);
    
    // Log error to database if evaluationId is provided
    const { evaluationId, to, message } = req.body || {};
    if (evaluationId && to && message) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/logs/whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evaluationId,
            toWhatsApp: to,
            message,
            status: 'failed',
            errorMessage: error.message || "An unexpected error occurred.",
          }),
        });
      } catch (logError) {
        console.log('WhatsApp error log save failed:', logError);
      }
    }
    
    return res.status(500).json({
      error: "Failed to send WhatsApp message",
      message: error.message || "An unexpected error occurred.",
    });
  }
}

