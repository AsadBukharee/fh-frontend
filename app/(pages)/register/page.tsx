'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import GradientButton from '@/app/utils/GradientButton';
import { Icon } from '@iconify/react';
import icon from '../../../public/icon.jpg';
import Link from 'next/link';
import { useToast } from '@/app/Context/ToastContext';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import { useRouter } from 'next/navigation';

const AsideImage = () => (
  <div className="relative">
    <Image
      src="/aside_image-removebg-preview.png"
      alt="Fleet Illustration"
      width={400}
      height={400}
      className="w-full h-auto object-contain"
    />
    <div className="absolute top-0 left-1 w-16 h-16 bg-magenta rounded-full flex items-center justify-center opacity-50 animate-float" />
    <div className="absolute bottom-0 right-1 w-16 h-16 opacity-50 bg-magenta rounded-full flex items-center justify-center animate-float" />
  </div>
);

export default function Register() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { showToast } = useToast();
  const cookies = useCookies();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_URL}/access/roles/`);
        const data = await res.json();
        const roleNames = data.results?.map((role: { name: string }) => role.name) || [];
        setRoles(roleNames);
      } catch (error) {
        console.error('Error fetching roles:', error);
        showToast('Failed to load roles', 'error');
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    // Password length validation
    if (password.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }
  
    // Password alphabet validation
    if (!/[a-zA-Z]/.test(password)) {
      showToast('Password must contain at least one letter.', 'error');
      return;
    }
  
    // Password match validation
    if (password !== confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }
  
    // Role selection validation
    if (!selectedRole) {
      showToast('Please select a role.', 'error');
      return;
    }
  
    const payload = {
      email,
      full_name: fullName,
      password,
      password_confirm: confirmPassword,
      role: selectedRole,
    };
  
    try {
      const response = await fetch(`${API_URL}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Store tokens in cookies
        cookies.set('access_token', data.access, { path: '/' });
        cookies.set('refresh_token', data.refresh, { path: '/' });
        cookies.set('user_id', data?.user?.id)
        cookies.set('role', data?.user?.role)
  
        showToast('User registered successfully!', 'success');
        // Redirect to a protected route (e.g., dashboard) after successful registration
        router.push('/dashboard');
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      showToast('An error occurred during registration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex w-full max-w-5xl overflow-hidden">
        <div className="hidden md:flex md:w-1/2 items-center justify-center p-10">
          <AsideImage />
        </div>

        <div className="w-full md:w-1/2 px-8 py-4 bg-white shadow-lg rounded-xl">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 p-px rounded-full bg-gradient-primary">
              <div className="w-full h-full flex items-center justify-center bg-white rounded-full overflow-hidden">
                <Image src={icon} width={40} height={40} alt="Logo" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Fleet Management System</h1>
            <p className="text-gray-500 text-sm">Create an account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email / Username</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your email"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Create Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role Select */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Select Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select a role</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sign Up */}
            <GradientButton
               text={isLoading ? 'Signing up...' : 'Sign up'}
              width="100%"
              onClick={() => {}} // onClick is not needed since form submission triggers handleSubmit
            />
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-4">
            <div className="grow h-px bg-gray-300" />
            <span className="px-2 text-sm text-gray-500">OR</span>
            <div className="grow h-px bg-gray-300" />
          </div>

          {/* Social */}
          <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-3 rounded-lg text-sm hover:bg-gray-100">
            <Icon icon="flat-color-icons:google" className="text-xl" />
            Sign up with Google
          </button>
          <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-3 rounded-lg text-sm mt-3 hover:bg-gray-100">
            <Icon icon="mdi:facebook" className="text-xl text-[#1877f2]" />
            Sign up with Facebook
          </button>

          {/* Already have account */}
          <p className="text-center text-sm mt-5">
            Already have an account? <Link href="/login" className="text-orange-500 hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}