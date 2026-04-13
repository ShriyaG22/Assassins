import React, { useState } from 'react';
import { Logo, Btn, Input, Label, Toast, Spinner } from '../components/UI';
import { sendOTP, verifyOTP } from '../lib/auth';

export default function AuthPage({ onLogin, onSkip }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // phone | verify
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendOTP = async () => {
    if (!phone.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
      await sendOTP(formatted);
      setStep('verify');
    } catch (e) {
      setError(e.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
      const data = await verifyOTP(formatted, code);
      onLogin(data.user);
    } catch (e) {
      setError(e.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Logo />
      <div className="fade-up">
        {step === 'phone' ? (
          <>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 300, margin: '0 auto 28px' }}>
              Sign in with your phone number to track your stats across games.
            </p>
            <Label>Phone Number</Label>
            <Input value={phone} onChange={setPhone} placeholder="+1 (555) 123-4567" type="tel" maxLength={20}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 18, textAlign: 'center', letterSpacing: '0.05em' }} />
            <div style={{ height: 16 }} />
            <Btn onClick={handleSendOTP} disabled={!phone.trim() || loading}>
              {loading ? <Spinner /> : 'Send Code →'}
            </Btn>
            <div style={{ height: 16 }} />
            <Btn variant="ghost" onClick={onSkip} style={{ width: '100%', textAlign: 'center' }}>
              Continue as Guest
            </Btn>
          </>
        ) : (
          <>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 300, margin: '0 auto 28px' }}>
              Enter the 6-digit code sent to {phone}
            </p>
            <Label>Verification Code</Label>
            <Input value={code} onChange={setCode} placeholder="000000" maxLength={6}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 28, textAlign: 'center', letterSpacing: '0.3em' }} />
            <div style={{ height: 16 }} />
            <Btn onClick={handleVerify} disabled={code.length < 6 || loading}>
              {loading ? <Spinner /> : 'Verify →'}
            </Btn>
            <div style={{ height: 12 }} />
            <Btn variant="ghost" onClick={() => { setStep('phone'); setCode(''); }} style={{ width: '100%', textAlign: 'center' }}>
              ← Change Number
            </Btn>
          </>
        )}
      </div>
      <Toast message={error} />
    </>
  );
}
