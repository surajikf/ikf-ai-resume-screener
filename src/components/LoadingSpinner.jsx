export default function LoadingSpinner({ size = "md", text = "" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-200 border-t-blue-600`}></div>
      {text && <p className="text-sm text-slate-600">{text}</p>}
    </div>
  );
}

