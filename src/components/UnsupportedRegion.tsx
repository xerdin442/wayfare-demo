"use client";

export default function UnsupportedRegion({
  message,
}: {
  message?: string | null;
}) {
  const display = message ?? "This region is not supported.";

  return (
    <div
      aria-modal="true"
      role="alertdialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-auto"
    >
      <div className="mx-4 w-full max-w-xl rounded-lg bg-white p-6 text-center shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-red-600">
          Unsupported Region
        </h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{display}</p>
      </div>
    </div>
  );
}
