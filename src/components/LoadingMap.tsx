export default function LoadingMap() {
  return (
    <div className="flex w-full h-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 md:h-10 md:w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Initializing GPS...</p>
      </div>
    </div>
  );
}
