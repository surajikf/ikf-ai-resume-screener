import { FaEnvelope, FaWhatsapp, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  } catch {
    return { date: 'N/A', time: '' };
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'sent':
      return <FaCheckCircle className="text-green-600" />;
    case 'failed':
      return <FaTimesCircle className="text-red-600" />;
    case 'pending':
      return <FaClock className="text-orange-600" />;
    default:
      return <FaClock className="text-slate-400" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'sent':
      return 'bg-green-50 border-green-200';
    case 'failed':
      return 'bg-red-50 border-red-200';
    case 'pending':
      return 'bg-orange-50 border-orange-200';
    default:
      return 'bg-slate-50 border-slate-200';
  }
};

export default function CandidateCommunicationLog({ emailLogs, whatsappLogs }) {
  // Combine and sort all communications by date
  const allCommunications = [
    ...(emailLogs || []).map(log => ({
      ...log,
      type: 'email',
      icon: FaEnvelope,
      recipient: log.to_email,
      content: log.subject,
      fullContent: log.body,
    })),
    ...(whatsappLogs || []).map(log => ({
      ...log,
      type: 'whatsapp',
      icon: FaWhatsapp,
      recipient: log.to_whatsapp,
      content: log.message?.substring(0, 100) || 'Message',
      fullContent: log.message,
    })),
  ].sort((a, b) => {
    const dateA = new Date(a.created_at || a.sent_at || 0);
    const dateB = new Date(b.created_at || b.sent_at || 0);
    return dateB - dateA;
  });

  if (allCommunications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Communication History</h2>
        <div className="bg-slate-50 rounded-lg p-6 text-center text-slate-500">
          No communication history available.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Communication History ({allCommunications.length})
      </h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {allCommunications.map((comm, index) => {
          const Icon = comm.icon;
          const dateInfo = formatDate(comm.sent_at || comm.created_at);
          const statusColor = getStatusColor(comm.status);

          return (
            <div
              key={comm.id || index}
              className={`border rounded-lg p-4 ${statusColor}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Icon className={`text-lg ${
                    comm.type === 'email' ? 'text-blue-600' : 'text-green-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 capitalize">
                        {comm.type}
                      </span>
                      {getStatusIcon(comm.status)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {dateInfo.date} {dateInfo.time && `at ${dateInfo.time}`}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 mb-1">
                    <span className="font-medium">To:</span> {comm.recipient}
                  </div>
                  <div className="text-sm text-slate-700 line-clamp-2">
                    {comm.content}
                  </div>
                  {comm.status === 'failed' && comm.error_message && (
                    <div className="mt-2 text-xs text-red-600">
                      Error: {comm.error_message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

