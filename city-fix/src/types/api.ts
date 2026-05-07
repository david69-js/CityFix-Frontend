export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  parent_id?: number | null;
}

export interface IssueStatus {
  id: number;
  name: string;
  color: string;
  sort_order: number;
}

export interface IssueImage {
  id: number;
  issue_id: number;
  file_path: string;
  full_url: string;
}

export interface IssueComment {
  id: number;
  issue_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user?: User;
}

export interface Issue {
  id: number;
  user_id: number;
  category_id: number;
  status_id: number;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  
  // Loaded from relations
  user?: User;
  category?: Category;
  status?: IssueStatus;
  images?: IssueImage[];
  
  // Counts
  upvotes_count?: number;
  comments_count?: number;
  
  // Comments array
  comments?: IssueComment[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
