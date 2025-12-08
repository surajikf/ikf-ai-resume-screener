export default function ProcessAnimation({ message = "Processing..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
    </div>
  );
}

