import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function OtpModal() {
  const { isOtpModalOpen, setIsOtpModalOpen, pendingVerificationEmail, verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  if (!isOtpModalOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingVerificationEmail) {
      setError('No email to verify');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await verifyOtp(pendingVerificationEmail, otp.trim());
    if (!result.ok) setError(result.message || 'Invalid OTP or expired.');
    setIsLoading(false);
  };

  const handleResend = async () => {
    if (!pendingVerificationEmail) {
      setError('No email to resend to');
      return;
    }
    setResendLoading(true);
    setError('');
    const result = await resendOtp(pendingVerificationEmail);
    if (!result.ok) setError(result.message || 'Failed to resend OTP. Please try again later.');
    setResendLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-archive-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsOtpModalOpen(false)} />

      <div className="relative w-full max-w-md bg-cream rounded-lg shadow-2xl animate-scale-in" role="dialog" aria-labelledby="otp-title">
        <button onClick={() => setIsOtpModalOpen(false)} className="absolute top-4 right-4 p-2 text-archive-400 hover:text-archive-900 transition-colors" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 id="otp-title" className="font-editorial text-2xl mb-1">Verify your email</h2>
            <p className="text-archive-500 text-sm">We sent a 6-digit code to <strong>{pendingVerificationEmail}</strong></p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label htmlFor="otp" className="block text-sm text-archive-600 mb-2">One-time code</label>
              <input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} type="text" inputMode="numeric" maxLength={6}
                className="w-full px-4 py-3 bg-white border border-archive-200 rounded focus:outline-none focus:border-archive-500 transition-colors" placeholder="Enter 6-digit code" required />
            </div>

            {error && <p className="text-red-600 text-sm text-center" role="alert">{error}</p>}

            <button disabled={isLoading} type="submit" className="w-full py-3 bg-archive-900 text-cream text-sm uppercase tracking-wider hover:bg-archive-800 transition-colors disabled:opacity-50">{isLoading ? 'Verifying...' : 'Verify'}</button>

            <div className="text-center mt-3">
              <button type="button" onClick={handleResend} disabled={resendLoading} className="text-archive-900 hover:underline">{resendLoading ? 'Resending...' : 'Resend code'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
