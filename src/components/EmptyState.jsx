import { FaInbox, FaSearch, FaExclamationTriangle } from "react-icons/fa";

const EmptyState = ({ 
  type = "default", 
  title, 
  message, 
  icon: Icon = FaInbox,
  action 
}) => {
  const defaultConfigs = {
    default: {
      title: "No data available",
      message: "There's nothing to display here yet.",
      icon: FaInbox,
      className: "text-slate-400"
    },
    search: {
      title: "No results found",
      message: "Try adjusting your search or filters.",
      icon: FaSearch,
      className: "text-slate-400"
    },
    error: {
      title: "Something went wrong",
      message: "We encountered an error. Please try again.",
      icon: FaExclamationTriangle,
      className: "text-red-400"
    },
    loading: {
      title: "Loading...",
      message: "Please wait while we fetch the data.",
      icon: null,
      className: "text-slate-400"
    }
  };

  const config = defaultConfigs[type] || defaultConfigs.default;
  const displayIcon = Icon !== FaInbox ? Icon : config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {displayIcon && (
        <div className={`mb-4 ${config.className}`}>
          <displayIcon className="h-16 w-16" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {displayTitle}
      </h3>
      <p className="text-sm text-slate-600 text-center max-w-md mb-4">
        {displayMessage}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
