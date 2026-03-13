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
      <div className="auth-overlay absolute inset-0 animate-fade-in" onClick={() => setIsOtpModalOpen(false)} />

      <div className="auth-panel relative w-full max-w-md rounded-lg animate-scale-in" role="dialog" aria-labelledby="otp-title">
        <button onClick={() => setIsOtpModalOpen(false)} className="auth-close absolute top-4 right-4 p-2 transition-colors" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative p-8">
          <div className="text-center mb-6">
            <p className="auth-kicker mb-4">Verification Required</p>
            <h2 id="otp-title" className="auth-title mb-3">Verify your email</h2>
            <p className="auth-copy">We sent a 6-digit code to <strong className="text-cream">{pendingVerificationEmail}</strong></p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label htmlFor="otp" className="auth-label block mb-2">One-time code</label>
              <input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} type="text" inputMode="numeric" maxLength={6}
                className="auth-input px-4 py-3" placeholder="Enter 6-digit code" required />
            </div>

            {error && <p className="text-red-600 text-sm text-center" role="alert">{error}</p>}

            <button disabled={isLoading} type="submit" className="auth-primary w-full py-3 text-sm uppercase tracking-[0.22em] disabled:opacity-50">{isLoading ? 'Verifying...' : 'Verify'}</button>

            <div className="text-center mt-3">
              <button type="button" onClick={handleResend} disabled={resendLoading} className="auth-link">{resendLoading ? 'Resending...' : 'Resend code'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
