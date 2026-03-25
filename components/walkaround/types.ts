// types.ts
export interface Steps {
  step_1?: string;
  step_2?: string;
  step_3?: string;
  current_step?: string;
  total_steps?: string;
  chain_id?: string;
}

export interface FollowupAnswer {
  id: number;
  followup_question_id: number;
  followup_question_text: string;
  followup_question_code: string;
  selected: boolean;
  description: string | null;
  severity: string;
  created_at: string;
  followup_answers: FollowupAnswer[];
}

export interface Answer {
  id: number;
  question_text: string;
  question_id: number;
  answer: string;
  is_defected: boolean;
  calculated_severity: string;
  description: string | null;
  date: string;
  prove: string | null;
  motion_detected: boolean;
  user_id: number;
  user_name: string;
  vehicle_id: number | null;
  vehicle_registration: string | null;
  followup_answers: FollowupAnswer[];
}

export interface WalkaroundData {
  success: boolean;
  message: string;
  data: {
    walkaround: {
      id: number;
      vehicle: {
        id: number;
        registration_number: string;
        vehicle_type_name: string;
        last_mileage: string | null;
        purchase_mileage: string | null;
        mileage_unit: string;
        mileage_in_km: number | null;
        mileage_in_miles: number | null;
        site_allocated: Array<{
          id: number;
          name: string;
          status: string;
          image?: string;
        }>;
      };
      conducted_by: {
        id: number;
        email: string;
        full_name: string;
        role: string;
        avatar: string | null;
      };
      walkaround_assignee: {
        id: number;
        email: string;
        full_name: string;
        role: string;
        avatar: string | null;
      } | null;
      walkaround_step: number;
      check_type: string;
      date: string;
      time: string;
      mileage: number | null;
      signature: string | null;
      note: string | null;
      defects: string | null;
      walkaround_duration: string | null;
      status: string;
      created_at: string;
      updated_at: string;
      parent: number | null;
    };
    answers: Answer[];
    driver_signature: {
      id: number;
      user_id: number;
      user_name: string;
      role: string;
      signature: string;
      signed_at: string;
    } | null;
    cp_signature: any;
    activity_log: {
      id: number;
      user_id: number;
      user_name: string;
      action: string;
      details: string;
      created_at: string;
    }[];
    total_answers: number;
    defected_count: number;
    non_defected_count: number;
  };
}

export interface StepData {
  stepNumber: number;
  stepId: string;
  data: WalkaroundData | null;
  loading: boolean;
  error: string | null;
}