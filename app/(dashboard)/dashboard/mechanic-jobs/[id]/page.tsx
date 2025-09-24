'use client';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

// Define interfaces for the API response
interface Part {
  id: number;
  name: string;
  brand: string;
  sku: string;
  unit: string;
  cost_price: string;
  sale_price: string;
}

interface JobData {
  id: number;
  vehicle_reg: string;
  mechanic_name: string;
  assignee_name: string;
  mechanicdefects: string[];
  parts_used: Part[];
  notes: string;
  source: string;
  status: string;
  timestamp: string;
  vehicle: number;
  mechanic: number;
  assignee: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: JobData;
}

const MechanicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const cookies=useCookies()

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/activity/mechanic-job/${id}/`,{
          headers:{
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          }
        });
        const result: ApiResponse = await response.json();
        if (result.success) {
          setJobData(result.data);
        } else {
          setError(result.message || 'Failed to fetch job details');
        }
      } catch (err) {
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!jobData) return <div>No data found</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mechanic Job Details</h1>
      <div className="bg-gray-100 p-4 rounded-lg">
        <p><strong>ID:</strong> {jobData.id}</p>
        <p><strong>Vehicle Registration:</strong> {jobData.vehicle_reg}</p>
        <p><strong>Mechanic Name:</strong> {jobData.mechanic_name}</p>
        <p><strong>Assignee Name:</strong> {jobData.assignee_name}</p>
        <p><strong>Defects:</strong> {jobData.mechanicdefects.join(', ')}</p>
        <p><strong>Notes:</strong> {jobData.notes}</p>
        <p><strong>Source:</strong> {jobData.source}</p>
        <p><strong>Status:</strong> {jobData.status}</p>
        <p><strong>Timestamp:</strong> {new Date(jobData.timestamp).toLocaleString()}</p>
        
        <h2 className="text-xl font-semibold mt-4">Parts Used</h2>
        <ul className="list-disc pl-5">
          {jobData.parts_used.map((part) => (
            <li key={part.id}>
              {part.name} ({part.brand}, SKU: {part.sku}) - Cost: ${part.cost_price}, Sale: ${part.sale_price}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MechanicDetail;