export default function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card p-8 flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-3 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>{message}</p>
      </div>
    </div>
  );
}