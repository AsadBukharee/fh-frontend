import { data } from '@/app/(dashboard)/dashboard/compliance-management/driver-management/data';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Driver management API is working!',data:
      {
  "success": true,
 
    
    "results": [
      {
        "id": 10,
        "user": {
          "id": 20,
          "email": "ali.hassan@gmail.com",
          "full_name": "Ali Hassan",
          "display_name": "Ali Hassan",
          "role": "Driver"
        },
        "profile_status": "approved",
        "driver_compliance": {
          "driver_licence_expiry": "2027-06-15",
          "last_driver_check_code_date": "2025-03-01",
          "next_driver_check_code_due": "2025-09-01",
          "cpc_card_expiry": "2028-01-01",
          "tacho_expiry": "2027-08-01",
          "last_driver_tacho_download": "2025-06-15",
          "next_driver_tacho_download": "2025-12-15",
          "dbs_expiry_date": "2026-08-01",
          "right_to_work_check_date": "2025-07-01",
          "night_worker_assessment_expiry": "2026-02-01",
          "vehicle_familiarisation_walkaround_refresher_expiry": "2026-03-01",
          "employment_start_date": "2025-07-01",
          "six_months_probation_review": "2026-01-01",
          "first_anniversary": "2026-07-01",
          "second_anniversary": "2027-07-01",
          "third_anniversary": "2028-07-01"
        }
      },
      {
        "id": 9,
        "user": {
          "id": 18,
          "email": "rajah_nabeel@hotmail.com",
          "full_name": "Nabeel Aslam",
          "display_name": "Nabeel Aslam",
          "role": "Driver"
        },
        "profile_status": "not_approved",
        "driver_compliance": {
          "driver_licence_expiry": "2026-07-17",
          "last_driver_check_code_date": "2025-03-01",
          "next_driver_check_code_due": "2025-09-01",
          "cpc_card_expiry": "2027-01-01",
          "tacho_expiry": "2026-06-01",
          "last_driver_tacho_download": "2025-07-01",
          "next_driver_tacho_download": "2026-01-01",
          "dbs_expiry_date": "2026-08-01",
          "right_to_work_check_date": "2025-08-01",
          "night_worker_assessment_expiry": "2026-02-01",
          "vehicle_familiarisation_walkaround_refresher_expiry": "2026-03-01",
          "employment_start_date": "2025-07-31",
          "six_months_probation_review": "2026-01-31",
          "first_anniversary": "2026-07-31",
          "second_anniversary": "2027-07-31",
          "third_anniversary": "2028-07-31"
        }
      },
      {
        "id": 8,
        "user": {
          "id": 16,
          "email": "adeel1@gmail.com",
          "full_name": "Adeel Malik",
          "display_name": "Adeel Malik",
          "role": "Driver"
        },
        "profile_status": "not_approved",
        "driver_compliance": {
          "driver_licence_expiry": "2027-02-01",
          "last_driver_check_code_date": "2025-02-01",
          "next_driver_check_code_due": "2025-08-01",
          "cpc_card_expiry": "2028-01-01",
          "tacho_expiry": "2027-06-01",
          "last_driver_tacho_download": "2025-08-01",
          "next_driver_tacho_download": "2026-02-01",
          "dbs_expiry_date": "2026-09-01",
          "right_to_work_check_date": "2025-07-01",
          "night_worker_assessment_expiry": "2026-03-01",
          "vehicle_familiarisation_walkaround_refresher_expiry": "2026-04-01",
          "employment_start_date": "2025-07-31",
          "six_months_probation_review": "2026-01-31",
          "first_anniversary": "2026-07-31",
          "second_anniversary": "2027-07-31",
          "third_anniversary": "2028-07-31"
        }
      },
      {
        "id": 7,
        "user": {
          "id": 15,
          "email": "sara.noor@gmail.com",
          "full_name": "Sara Noor",
          "display_name": "Sara Noor",
          "role": "Driver"
        },
        "profile_status": "review",
        "driver_compliance": {
          "driver_licence_expiry": "2026-09-30",
          "last_driver_check_code_date": "2025-04-01",
          "next_driver_check_code_due": "2025-10-01",
          "cpc_card_expiry": "2027-06-01",
          "tacho_expiry": "2026-12-01",
          "last_driver_tacho_download": "2025-09-01",
          "next_driver_tacho_download": "2026-03-01",
          "dbs_expiry_date": "2027-01-01",
          "right_to_work_check_date": "2025-09-01",
          "night_worker_assessment_expiry": "2026-06-01",
          "vehicle_familiarisation_walkaround_refresher_expiry": "2026-07-01",
          "employment_start_date": "2025-08-01",
          "six_months_probation_review": "2026-02-01",
          "first_anniversary": "2026-08-01",
          "second_anniversary": "2027-08-01",
          "third_anniversary": "2028-08-01"
        }
      },
      {
        "id": 6,
        "user": {
          "id": 11,
          "email": "khalidsadiq@gmail.com",
          "full_name": "Khalid Sadiq",
          "display_name": "Khalid Sadiq",
          "role": "Driver"
        },
        "profile_status": "approved",
        "driver_compliance": {
          "driver_licence_expiry": "2028-01-15",
          "last_driver_check_code_date": "2025-05-01",
          "next_driver_check_code_due": "2025-11-01",
          "cpc_card_expiry": "2029-01-01",
          "tacho_expiry": "2027-07-01",
          "last_driver_tacho_download": "2025-09-01",
          "next_driver_tacho_download": "2026-03-01",
          "dbs_expiry_date": "2026-10-01",
          "right_to_work_check_date": "2025-06-01",
          "night_worker_assessment_expiry": "2026-04-01",
          "vehicle_familiarisation_walkaround_refresher_expiry": "2026-05-01",
          "employment_start_date": "2025-09-02",
          "six_months_probation_review": "2026-03-02",
          "first_anniversary": "2026-09-02",
          "second_anniversary": "2027-09-02",
          "third_anniversary": "2028-09-02"
        }
      },
      {
        "id": 5,
        "user": {
          "id": 10,
          "email": "gemma.hatfield@mail.com",
          "full_name": "Gemma Hatfield",
          "display_name": "Gemma Hatfield",
          "role": "Driver"
        },
        "profile_status": "not_approved",
        "driver_compliance": {
          "driver_licence_expiry": "2025-12-01",
          "last_driver_check_code_date": "2025-06-01",
          "next_driver_check_code_due": "2025-12-01",
          "cpc_card_expiry": "2026-05-01",
          "tacho_expiry": "2026-01-01",
          "last_driver_tacho_download": "2025-07-01",
          "next_driver_tacho_download": "2026-01-01",
          "dbs_expiry_date": "2026-11-01",
          "right_to_work_check_date": "2025-05-01",
          "night_worker_assessment_expiry": "2026-03-01",
          "vehicle_familiarisation_walkaround_refresher_expiry": "2026-04-01",
          "employment_start_date": "2025-09-17",
          "six_months_probation_review": "2026-03-17",
          "first_anniversary": "2026-09-17",
          "second_anniversary": "2027-09-17",
          "third_anniversary": "2028-09-17"
        }
      },
      {
        "id": 4,
        "user": {
          "id": 8,
          "email": "naqvi.mohsin@mail.com",
          "full_name": "Mohsin Naqvi",
          "display_name": "Mohsin Naqvi",
          "role": "Driver"
        },
        "profile_status": "approved",
        "driver_compliance": {
          "driver_licence_expiry": "2027-10-01",
          "last_driver_check_code_date": "2025-07-01",
          "next_driver_check_code_due": "2026-01-01",
          "cpc_card_expiry": "2029-01-01",
          "tacho_expiry": "2027-11-01",
          "last_driver_tacho_download": "2025-08-01",
          "next_driver_tacho_download": "2026-02-01",
          "dbs_expiry_date": "2027-01-01",
          "right_to_work_check_date": "2025-06-01",
          "night_worker_assessment_expiry": "2026-04-01",
          "vehicle_familiarisation_walkaround_refresher_expiry": "2026-05-01",
          "employment_start_date": "2025-08-21",
          "six_months_probation_review": "2026-02-21",
          "first_anniversary": "2026-08-21",
          "second_anniversary": "2027-08-21",
          "third_anniversary": "2028-08-21"
        }
      },
      {
        "id": 3,
        "user": {
          "id": 4,
          "email": "shoaib.yaseen@mail.com",
          "full_name": "Shoaib Yaseen",
          "display_name": "Shoaib Yaseen",
          "role": "Driver"
        },
        "profile_status": "approved",
        "driver_compliance": {
          "driver_licence_expiry": "2026-05-01",
          "last_driver_check_code_date": "2025-04-01",
          "next_driver_check_code_due": "2025-10-01",
          "cpc_card_expiry": "2027-09-01",
          "tacho_expiry": "2026-07-01",
          "last_driver_tacho_download": "2025-09-01",
          "next_driver_tacho_download": "2026-03-01",
          "dbs_expiry_date": "2026-12-01",
          "right_to_work_check_date": "2025-07-01",
          "night_worker_assessment_expiry": "2026-03-01",
          "vehicle_familiarisation_walkaround_refresher_expiry": "2026-04-01",
          "employment_start_date": "2025-07-31",
          "six_months_probation_review": "2026-01-31",
          "first_anniversary": "2026-07-31",
          "second_anniversary": "2027-07-31",
          "third_anniversary": "2028-07-31"
        }
      },
      {
        "id": 2,
        "user": {
          "id": 5,
          "email": "imran.khalique@mail.com",
          "full_name": "Imran Khalique",
          "display_name": "Imran Khalique",
          "role": "SuperAdmin"
        },
        "profile_status": "review",
        "driver_compliance": {
          "driver_licence_expiry": "2026-01-01",
          "last_driver_check_code_date": "2025-03-01",
          "next_driver_check_code_due": "2025-09-01",
          "cpc_card_expiry": "2027-01-01",
          "tacho_expiry": "2026-06-01",
          "last_driver_tacho_download": "2025-06-01",
          "next_driver_tacho_download": "2025-12-01",
          "dbs_expiry_date": "2026-09-01",
          "right_to_work_check_date": "2025-08-01",
          "night_worker_assessment_expiry": "2026-02-01",
          "vehicle_familiarisation_walkaround_refresher_expiry": "2026-03-01",
          "employment_start_date": "2025-08-20",
          "six_months_probation_review": "2026-02-20",
          "first_anniversary": "2026-08-20",
          "second_anniversary": "2027-08-20",
          "third_anniversary": "2028-08-20"
        }
      },
      {
        "id": 1,
        "user": {
          "id": 6,
          "email": "asad.abbas@mail.com",
          "full_name": "Syed Asad Abbas",
          "display_name": "Syed Asad Abbas",
          "role": "Driver"
        },
        "profile_status": "review",
        "driver_compliance": {
          "driver_licence_expiry": "2027-04-01",
          "last_driver_check_code_date": "2025-02-01",
          "next_driver_check_code_due": "2025-08-01",
          "cpc_card_expiry": "2028-01-01",
          "tacho_expiry": "2027-05-01",
          "last_driver_tacho_download": "2025-07-01",
          "next_driver_tacho_download": "2026-01-01",
          "dbs_expiry_date": "2026-11-01",
          "right_to_work_check_date": "2025-06-01",
          "night_worker_assessment_expiry": "2026-03-01",
          "vehicle_familiarisation_walkaround_refresher_expiry": "2026-04-01",
          "employment_start_date": "2025-08-27",
          "six_months_probation_review": "2026-02-27",
          "first_anniversary": "2026-08-27",
          "second_anniversary": "2027-08-27",
          "third_anniversary": "2028-08-27"
        }
      }
    ],
    "pagination": {
      "count": 10,
      "next": null,
      "previous": null,
      "current_page": 1,
      "total_pages": 1,
      "page_size": 20
    },
    "stats": {
      "approved_count": 4,
      "review_count": 3,
      "not_approved_count": 3,
      "completed_count": 6,
      "incomplete_count": 4,
      "total": 10
    }
  }
   });
}