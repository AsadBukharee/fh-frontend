'use client';

import Image from 'next/image';
import { useState } from 'react';
import GradientButton from '@/app/utils/GradientButton';
import icon from '../../../public/icon.jpg';
import { SendHorizonal } from 'lucide-react';
import Toast from '@/app/utils/Toast';
import API_URL from '@/app/utils/ENV';

export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Basic email validation regex
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null); // Clear previous toasts

    if (!isValidEmail(email)) {
      setToast({ message: 'Please enter a valid email address', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/password/forgot_password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setToast({ message: data.message || 'OTP sent to your email', type: 'success' });
        setEmail(''); // Clear input on success
      } else {
        setToast({ message: data.message || 'Failed to send OTP', type: 'error' });
      }
    } catch (error) {
      console.log(error)
      setToast({ message: 'Network error, please try again', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 p-px rounded-full bg-gradient-primary">
            <div className="w-full h-full flex items-center justify-center bg-white rounded-full overflow-hidden">
              <Image src={icon} width={40} height={40} alt="Fleet Management System Logo" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Fleet Management System</h1>
          <p className="text-gray-500 text-sm">Reset Your Password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Password Reset Form">
          <div>
            <label htmlFor="email" className="block text-sm text-gray-600 mb-1">
              Enter Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email address"
              aria-required="true"
              disabled={isLoading}
            />
          </div>

          <GradientButton
            text={isLoading ? 'Sending...' : 'Send Email'}
            width="100%"
            Icon={SendHorizonal}
          />

          <button
            type="button"
            className="w-full p-3 bg-white border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-600 hover:text-white"
            onClick={() => window.history.back()}
            disabled={isLoading}
            aria-label="Go Back"
          >
            Go Back
          </button>
        </form>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    </div>
  );
}