export interface Student {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  points: number;
  personal_stats: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}


