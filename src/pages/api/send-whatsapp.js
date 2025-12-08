import { getSettings } from "@/utils/settingsStorage";

// Parse phone number and extract country code and number
function parsePhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  // Remove all spaces, dashes, and other non-digit characters except +
  let cleaned = phoneNumber.trim().replace(/[\s\-\(\)]/g, "");

  // If it starts with +91, remove it and get 10 digits
  if (cleaned.startsWith("+91")) {
    const number = cleaned.substring(3);
    if (number.length === 10 && /^\d{10}$/.test(number)) {
      return { countryCode: "91", number };
    }
  }

  // If it starts with 91 (without +), remove it and get 10 digits
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    const number = cleaned.substring(2);
    if (number.length === 10 && /^\d{10}$/.test(number)) {
      return { countryCode: "91", number };
    }
  }

  // If it's exactly 10 digits, assume it's an Indian number
  if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    return { countryCode: "91", number: cleaned };
  }

  // If it's 11 digits and starts with 0, remove the 0
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    const number = cleaned.substring(1);
    if (number.length === 10 && /^\d{10}$/.test(number)) {
      return { countryCode: "91", number };
    }
  }

  throw new Error(`Invalid phone number format: ${phoneNumber}`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
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

    // Get settings if not provided in request
    const settings = getSettings();
    const enabled = whatsappSendingEnabled ?? settings.whatsappSendingEnabled;
    const apiKey = whatsappApiKey || settings.whatsappApiKey;
    const apiUrl = whatsappApiUrl || settings.whatsappApiUrl || "https://publicapi.myoperator.co/chat/messages";
    const phoneNumberId = whatsappPhoneNumberId || settings.whatsappPhoneNumberId;
    const companyId = whatsappCompanyId || settings.whatsappCompanyId;
    const templateName = whatsappTemplateName || settings.whatsappTemplateName;
    const language = whatsappLanguage || settings.whatsappLanguage || "en";

    // Validate settings
    if (!enabled) {
      return res.status(400).json({
        error: "WhatsApp sending is disabled",
        message: "Please enable WhatsApp messaging in Settings.",
      });
    }

    if (!apiKey || !phoneNumberId || !companyId || !templateName) {
      return res.status(400).json({
        error: "Missing WhatsApp API credentials",
        message: "Please configure WhatsApp API Key, Phone Number ID, Company ID, and Template Name in Settings.",
      });
    }

    if (!to || !message) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Phone number (to) and message are required.",
      });
    }

    // Parse phone number
    let countryCode, number;
    try {
      const parsed = parsePhoneNumber(to);
      countryCode = parsed.countryCode;
      number = parsed.number;
    } catch (parseError) {
      return res.status(400).json({
        error: "Invalid phone number format",
        message: parseError.message,
      });
    }

    // Clean API key (remove trailing = if present)
    const cleanApiKey = apiKey.trim().replace(/=+$/, "");

    // Prepare message body - remove any greeting, closing, or signature that might be in the message
    let messageBody = message.trim();
    
    // Remove greeting lines
    messageBody = messageBody.replace(/^(Hi|Dear|Hey|Hello)[^!]*[!,\n]?/gmi, "").trim();
    
    // Remove closing phrases
    messageBody = messageBody.replace(/Looking forward to connecting with you[!.]?/gi, "").trim();
    messageBody = messageBody.replace(/Looking forward[^.]*[!.]?/gi, "").trim();
    
    // Remove signature elements
    messageBody = messageBody.replace(/Best regards[^.]*/gi, "").trim();
    messageBody = messageBody.replace(/Regards[^.]*/gi, "").trim();
    messageBody = messageBody.replace(/Jahanvi Patel[^.]*/gi, "").trim();
    messageBody = messageBody.replace(/I Knowledge Factory[^.]*/gi, "").trim();
    messageBody = messageBody.replace(/📞.*\+91 9665079317[^.]*/gi, "").trim();
    messageBody = messageBody.replace(/Phone:.*\+91 9665079317[^.]*/gi, "").trim();
    
    // Remove URLs and links
    messageBody = messageBody.replace(/https?:\/\/[^\s]+/gi, "").trim();
    messageBody = messageBody.replace(/www\.[^\s]+/gi, "").trim();
    messageBody = messageBody.replace(/🔗[^\n]*/gi, "").trim();
    
    // Clean up excessive blank lines
    messageBody = messageBody.replace(/\n{3,}/g, "\n\n").trim();

    // Validate message body is not empty
    if (!messageBody || messageBody.length === 0) {
      return res.status(400).json({
        error: "Message body is empty",
        message: "The message content for template variable {{messagebody}} is empty after processing.",
      });
    }

    // Prepare request payload
    const requestPayload = {
      phone_number_id: phoneNumberId,
      customer_country_code: countryCode,
      customer_number: number,
      data: {
        type: "template",
        context: {
          template_name: templateName,
          language: language,
          body: {
            "1": candidateName || "Candidate", // Template variable {{name}}
            "2": messageBody, // Template variable {{messagebody}}
          },
        },
      },
      reply_to: null,
      myop_ref_id: null,
      trail: { name: null },
    };

    console.log("[send-whatsapp] Sending WhatsApp message to:", number);
    console.log("[send-whatsapp] Template variables:", {
      "1 (name)": requestPayload.data.context.body["1"],
      "2 (messagebody)": messageBody.substring(0, 100) + "...",
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
      console.error("[send-whatsapp] MyOperator API error:", responseData);
      return res.status(response.status).json({
        error: responseData.message || "Failed to send WhatsApp message",
        details: responseData,
      });
    }

    // Check for success response
    if (responseData.status === "success" && responseData.data) {
      console.log("[send-whatsapp] Message sent successfully:", {
        conversation_id: responseData.data.conversation_id,
        message_id: responseData.data.message_id,
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
              message: fullMessage,
              status: 'sent',
              messageId: responseData.data.message_id,
              conversationId: responseData.data.conversation_id,
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
          conversation_id: responseData.data.conversation_id,
          message_id: responseData.data.message_id,
        },
      });
    }

    // Unexpected response format
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

