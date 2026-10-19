export type Role = "student" | "trainer" | "admin";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  email: string | null;
  institution_id: string | null;
  department: string | null;
  year_of_study: number | null;
  roll_number: string | null;
  target_role: string | null;
  designation: string | null;
  subjects_taught: string[] | null;
  resume_score: number | null;
  created_at: string;
};
