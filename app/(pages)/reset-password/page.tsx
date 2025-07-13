'use client';

import { useState, useEffect } from 'react';
import GradientButton from '@/app/utils/GradientButton';
import Image from 'next/image';
import icon from '../../../public/icon.jpg';
import { useSearchParams } from 'next/navigation';
import API_URL from '@/app/utils/ENV';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();

  // Extract uid and token from URL query parameters
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called'); // Debugging
    setError('');
    setSuccess('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    // Validate uid and token existence
    if (!uid || !token) {
      setError('Invalid or missing reset link parameters.');
      return;
    }

    try {
      // Make API request
      const response = await fetch(`${API_URL}/api/password/reset_password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setSuccess('Password reset successfully! You can now log in.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 p-px rounded-full bg-gradient-primary">
            <div className="w-full h-full flex items-center justify-center bg-white rounded-full overflow-hidden">
              <Image src={icon} width={40} height={40} alt="Logo" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Fleet Management System</h1>
          <p className="text-gray-500 text-sm">Create your new password</p>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm text-gray-600 mb-1">Create Password</label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
              placeholder="Create new password"
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <GradientButton
            text="Reset password"
            width="100%"
          />
          <button
            type="button"
            className="w-full p-3 bg-white border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-600 hover:text-white"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </form>
      </div>
    </div>
  );
}