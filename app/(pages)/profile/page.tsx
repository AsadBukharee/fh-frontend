'use client'
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

// Define TypeScript interfaces for the API response
interface Site {
  id: number;
  name: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

interface Contract {
  id: number;
  name: string;
  description: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  avatar: string | null;
  is_active: boolean;
  rota_start_date: string | null;
  contract_signing_date: string | null;
  paid_holidays: number;
  created_at: string;
  updated_at: string;
  roles: string[];
  role_slugs: string[];
  allocated_sites: Site[];
  contract: Contract | null;
}

interface ProfileSite {
  id: number;
  name: string;
  status: string;
  image: string;
}

interface Profile {
  id: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    display_name: string;
    parent_rota_completed: boolean;
    child_rota_completed: boolean;
    contract_signing_date: string | null;
    rota_start_date: string | null;
    paid_holidays: number;
    is_active: boolean;
    contract: Contract | null;
    role: string;
    site: ProfileSite[];
    shifts_count: number;
    avatar: string | null;
  };
  warnings: string[];
  missing_attributes: string[];
  source: string;
  next_step: string;
  is_profile_completed: boolean;
  remarks: string;
  profile_status: string;
  have_other_jobs: boolean;
  have_other_jobs_note: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  account_no: string | null;
  sort_code: string | null;
  post_code: string | null;
  national_insurance_no: string | null;
  license_number: string | null;
  license_issue_number: string | null;
  next_of_kin_name: string | null;
  next_of_kin_relationship: string | null;
  next_of_kin_note: string | null;
  next_of_kin_contact: string | null;
  next_of_kin_email: string | null;
  next_of_kin_address: string | null;
  manager_name: string | null;
  signup_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileData {
  user: User;
  profile: Profile | null;
  profile_type: string | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: ProfileData;
}

const Profile: React.FC = () => {
  const searchParams = useSearchParams();
  const user_id = searchParams.get('user_id');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const cookies=useCookies();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/profiles/profiles/?user_id=${user_id}`,{
          headers: {
            'Authorization': `Bearer ${cookies.get('access_token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch profile data');
        const data: ApiResponse = await response.json();
        setProfileData(data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch profile data');
        setLoading(false);
      }
    };
    if (user_id) fetchProfile();
  }, [user_id]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  if (!profileData) return null;

  const { user, profile, profile_type } = profileData;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{profile_type ? `${profile_type} Profile` : 'User Profile'}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-2xl font-semibold text-gray-500">
                      {user.full_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-gray-500">{user.roles.join(', ')}</p>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <p><span className="font-medium">Status:</span> {user.is_active ? 'Active' : 'Inactive'}</p>
                {user.contract && (
                  <p><span className="font-medium">Contract:</span> {user.contract.name} ({user.contract.description})</p>
                )}
                {profile && (
                  <>
                    {/* {profile.shifts_count && (
                      <p><span className="font-medium">Shifts Completed:</span> {profile.shifts_count}</p>
                    )} */}
                    {profile.profile_status && (
                      <p><span className="font-medium">Profile Status:</span> {profile.profile_status}</p>
                    )}
                    {profile.next_of_kin_name && (
                      <p><span className="font-medium">Next of Kin:</span> {profile.next_of_kin_name} ({profile.next_of_kin_relationship})</p>
                    )}
                    {profile.next_of_kin_contact && (
                      <p><span className="font-medium">Contact:</span> {profile.next_of_kin_contact}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Allocated Sites */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocated Sites</h3>
              {user.allocated_sites.length > 0 ? (
                user.allocated_sites.map((site: Site) => (
                  <div key={site.id} className="border-b border-gray-200 py-2">
                    <p className="font-medium">{site.name}</p>
                    <p className="text-gray-600">{site.address}</p>
                    <p className="text-gray-500">Postcode: {site.postcode}</p>
                    <p className="text-gray-500">Coordinates: ({site.latitude}, {site.longitude})</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No allocated sites</p>
              )}
            </div>

            {/* Warnings */}
            {profile && profile.warnings && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Warnings</h3>
                {profile.warnings.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {profile.warnings.map((warning: string, index: number) => (
                      <li key={index} className="text-yellow-600">{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No warnings</p>
                )}
              </div>
            )}

            {/* Missing Attributes */}
            {profile && profile.missing_attributes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Attributes</h3>
                {profile.missing_attributes.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {profile.missing_attributes.map((attr: string, index: number) => (
                      <li key={index} className="text-red-600">{attr}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">All attributes provided</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;