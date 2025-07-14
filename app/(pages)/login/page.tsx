'use client';

import Image from 'next/image';
import { useState } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import GradientButton from '@/app/utils/GradientButton';
import { Icon } from '@iconify/react';
import icon from '../../../public/icon.jpg';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCookies } from 'next-client-cookies';
import API_URL from '@/app/utils/ENV';

const AsideImage = () => (
  <div className="relative">
    <Image
      src="/aside_image-removebg-preview.png"
      alt="Fleet Illustration"
      width={400}
      height={400}
      className="w-full h-auto object-contain"
    />
    <div className="absolute top-0 left-1 w-16 h-16 bg-magenta rounded-full flex items-center justify-center opacity-50 animate-float">
      {/* <span className="text-white text-sm">Fleet</span> */}
    </div>
    <div className="absolute bottom-0 right-1 w-16 h-16 opacity-50 bg-magenta rounded-full flex items-center justify-center animate-float">
      {/* <span className="text-white text-sm">Fleet</span> */}
    </div>
  </div>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const router = useRouter();
  const cookies = useCookies();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed. Please check your credentials.');
      }

      const data = await response.json();

      // Store tokens in cookies using next-cookies-client
      cookies.set('access_token', data.access);
      cookies.set('user_id', data?.user?.id);
      cookies.set('role', data?.user?.role);
      cookies.set('refresh_token', data.refresh);

      // Optionally store user data in localStorage if rememberMe is checked
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login.';
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex w-full max-w-5xl overflow-hidden">
        {/* Left side illustration with floating bubble */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center p-10">
          <AsideImage />
        </div>

        {/* Right side form */}
        <div className="w-full md:w-1/2 px-8 py-4 bg-white shadow-lg rounded-xl">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 p-px rounded-full bg-gradient-primary">
              <div className="w-full h-full flex items-center justify-center bg-white rounded-full overflow-hidden">
                <Image src={icon} width={40} height={40} alt="Logo" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Fleet Management System</h1>
            <p className="text-gray-500 text-sm">Sign into account</p>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input with Label */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email / Username</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your email"
                disabled={isLoading} // Disable input during loading
              />
            </div>

            {/* Password Input with Label and Eye Toggle */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your password"
                  disabled={isLoading} // Disable input during loading
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
                  disabled={isLoading} // Disable button during loading
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                  disabled={isLoading} // Disable checkbox during loading
                />
                Remember me
              </label>
              <Link href="/forget-password" className="text-pink-500 hover:underline">Forgot Password?</Link>
            </div>

            {/* Sign In Button */}
            <GradientButton
              text={isLoading ? 'Signing in...' : 'Sign in'}
              width="100%"
              Icon={LogIn}
              // type="submit" // Ensure button triggers form submission
              // disabled={isLoading} // Disable button during loading
            />
          </form>

          {/* OR Section */}
          <div className="flex items-center my-4">
            <div className="grow h-px bg-gray-300" />
            <span className="px-2 text-sm text-gray-500">OR</span>
            <div className="grow h-px bg-gray-300" />
          </div>

          {/* Google and Facebook with Iconify Icons */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-3 rounded-lg text-sm hover:bg-gray-100"
            disabled={isLoading} // Disable button during loading
          >
            <Icon icon="flat-color-icons:google" className="text-xl" />
            Sign in with Google
          </button>
          <button
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-3 rounded-lg text-sm mt-3 hover:bg-gray-100"
            disabled={isLoading} // Disable button during loading
          >
            <Icon icon="mdi:facebook" className="text-xl text-[#1877f2]" />
            Sign in with Facebook
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm mt-5">
            Don’t have an account?{' '}
            <Link href="/register" className="text-orange-500 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}