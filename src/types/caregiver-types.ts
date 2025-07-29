export interface Caregiver {
  id: number;
  name: string;
  status: '가능' | '불가능'; // Made non-optional
  phone: string; // Made non-optional
  photoUrl?: string;
  birthDate: string; // Made non-optional
  gender: '남성' | '여성'; // Made non-optional
  experience?: string;
  certifications?: string;
  specialNotes?: string; // Add new field for special notes
  unavailableDates: string[]; // Made non-optional
}

export interface CaregiverRecommendationInput {
  patientGender?: '남성' | '여성';
  patientBirthDate?: string;
  careType: string;
  requestedDateRange?: {
    from?: string;
    to?: string;
  };
  requestedTime?: string;
  specificNeeds: string;
}

export interface CaregiverRecommendationOutput {
  recommendations: {
    name: string;
    age: number;
    gender: string;
    experience: string;
    certifications: string[];
    suitabilityScore: number;
    phone: string;
    photoUrl?: string;
  }[];
}
