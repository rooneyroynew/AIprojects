export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ParsedCV {
  fullName?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{
    role: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

export interface CVContent {
  rawText: string;
  fileName: string;
  fileId?: string;
  parsedData?: ParsedCV;
}

export interface AuthState {
  isAuthenticated: boolean;
  email?: string;
  accessToken?: string;
}
