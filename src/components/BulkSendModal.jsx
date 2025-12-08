import { useState, useEffect } from "react";
import { FaTimes, FaEnvelope, FaWhatsapp, FaPaperPlane, FaSpinner, FaCheck, FaExclamationTriangle } from "react-icons/fa";

const BulkSendModal = ({ 
  isOpen, 
  onClose, 
  candidates, 
  type, // 'email' or 'whatsapp'
  onSendAll,
  onSendIndividual,
  canSend,
  settings
}) => {
  const [messages, setMessages] = useState({});
  const [sending, setSending] = useState({});
  const [sendStatus, setSendStatus] = useState({});
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => {
    if (isOpen && candidates) {
      // Initialize messages for all candidates
      const initialMessages = {};
      candidates.forEach(candidate => {
        const key = candidate.id || candidate.databaseId || candidate.candidateName;
        if (type === 'email') {
          initialMessages[key] = {
            candidate,
            to: candidate.candidateEmail || '',
            subject: candidate.emailDraft?.subject || 'IKF - Application Update',
            body: candidate.emailDraft?.body || '',
            originalBody: candidate.emailDraft?.body || '',
          };
        } else {
          initialMessages[key] = {
            candidate,
            to: candidate.candidateWhatsApp || '',
            message: candidate.whatsappDraft?.message || '',
            originalMessage: candidate.whatsappDraft?.message || '',
          };
        }
      });
      setMessages(initialMessages);
      setSending({});
      setSendStatus({});
    }
  }, [isOpen, candidates, type]);

  if (!isOpen) return null;

  const handleMessageChange = (key, field, value) => {
    setMessages(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      }
    }));
  };

  const handleSendIndividual = async (key) => {
    const messageData = messages[key];
    if (!messageData) return;

    setSending(prev => ({ ...prev, [key]: true }));
    setSendStatus(prev => ({ ...prev, [key]: 'Sending...' }));

    try {
      const result = await onSendIndividual(messageData, type);
      if (result.success) {
        setSendStatus(prev => ({ ...prev, [key]: 'Sent successfully ✓' }));
        setTimeout(() => {
          setSendStatus(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        }, 3000);
      } else {
        setSendStatus(prev => ({ ...prev, [key]: `Failed: ${result.error || 'Unknown error'}` }));
      }
    } catch (error) {
      setSendStatus(prev => ({ ...prev, [key]: `Error: ${error.message}` }));
    } finally {
      setSending(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const handleSendAll = async () => {
    setSendingAll(true);
    const allMessages = Object.values(messages);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < allMessages.length; i++) {
      const messageData = allMessages[i];
      const key = messageData.candidate.id || messageData.candidate.databaseId || messageData.candidate.candidateName;
      
      // Skip if already sent
      if (sendStatus[key]?.includes('Sent successfully')) {
        successCount++;
        continue;
      }

      setSending(prev => ({ ...prev, [key]: true }));
      setSendStatus(prev => ({ ...prev, [key]: 'Sending...' }));

      try {
        const result = await onSendIndividual(messageData, type);
        if (result.success) {
          successCount++;
          setSendStatus(prev => ({ ...prev, [key]: 'Sent successfully ✓' }));
        } else {
          failCount++;
          setSendStatus(prev => ({ ...prev, [key]: `Failed: ${result.error || 'Unknown error'}` }));
        }
      } catch (error) {
        failCount++;
        setSendStatus(prev => ({ ...prev, [key]: `Error: ${error.message}` }));
      } finally {
        setSending(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      }

      // Add delay between sends (except for last item)
      if (i < allMessages.length - 1) {
        if (type === 'whatsapp') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    setSendingAll(false);
    setSendStatus(prev => ({
      ...prev,
      _all: `Sent ${successCount} of ${allMessages.length} message(s)${failCount > 0 ? `. ${failCount} failed.` : ''}`
    }));
  };

  const messageEntries = Object.entries(messages);
  const allSent = messageEntries.every(([_, msg]) => {
    const key = msg.candidate.id || msg.candidate.databaseId || msg.candidate.candidateName;
    return sendStatus[key]?.includes('Sent successfully');
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {type === 'email' ? (
              <FaEnvelope className="text-2xl text-blue-600" />
            ) : (
              <FaWhatsapp className="text-2xl text-green-600" />
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Bulk {type === 'email' ? 'Email' : 'WhatsApp'} - {candidates?.length || 0} Candidates
              </h2>
              <p className="text-sm text-slate-500">
                Review and edit messages before sending
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {sendStatus._all && (
            <div className={`mb-4 rounded-lg border px-4 py-3 ${
              sendStatus._all.includes('Sent') && !sendStatus._all.includes('failed')
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center gap-2">
                {sendStatus._all.includes('Sent') && !sendStatus._all.includes('failed') ? (
                  <FaCheck className="text-green-600" />
                ) : (
                  <FaExclamationTriangle className="text-blue-600" />
                )}
                <span className="text-sm font-medium">{sendStatus._all}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messageEntries.map(([key, messageData]) => {
              const candidate = messageData.candidate;
              const isSending = sending[key];
              const status = sendStatus[key];
              const isSent = status?.includes('Sent successfully');
              const hasError = status?.includes('Failed') || status?.includes('Error');

              return (
                <div
                  key={key}
                  className={`rounded-lg border p-4 ${
                    isSent
                      ? 'border-green-200 bg-green-50'
                      : hasError
                      ? 'border-red-200 bg-red-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{candidate.candidateName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {type === 'email' ? messageData.to : `+91 ${messageData.to}`}
                        {candidate.roleApplied && ` • ${candidate.roleApplied}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSendIndividual(key)}
                      disabled={isSending || isSent || !canSend}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium ${
                        isSent
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : isSending
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : canSend
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isSending ? (
                        <FaSpinner className="animate-spin" />
                      ) : isSent ? (
                        <FaCheck />
                      ) : (
                        <FaPaperPlane />
                      )}
                      {isSent ? 'Sent' : isSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>

                  {type === 'email' ? (
                    <>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={messageData.subject}
                          onChange={(e) => handleMessageChange(key, 'subject', e.target.value)}
                          disabled={isSent}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Message Body
                        </label>
                        <textarea
                          value={messageData.body}
                          onChange={(e) => handleMessageChange(key, 'body', e.target.value)}
                          disabled={isSent}
                          rows={6}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-100 resize-y"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        WhatsApp Message
                      </label>
                      <textarea
                        value={messageData.message}
                        onChange={(e) => handleMessageChange(key, 'message', e.target.value)}
                        disabled={isSent}
                        rows={6}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 disabled:bg-slate-100 resize-y"
                      />
                    </div>
                  )}

                  {status && (
                    <div className={`mt-2 text-xs px-2 py-1 rounded ${
                      isSent
                        ? 'bg-green-100 text-green-700'
                        : hasError
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            {messageEntries.length} candidate{messageEntries.length !== 1 ? 's' : ''} ready to send
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Close
            </button>
            <button
              onClick={handleSendAll}
              disabled={sendingAll || !canSend || allSent}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                sendingAll || !canSend || allSent
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : type === 'email'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {sendingAll ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Sending All...
                </>
              ) : allSent ? (
                <>
                  <FaCheck />
                  All Sent
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Send All ({messageEntries.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSendModal;

