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
  image_url: string;
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
  
  // Admin visibility fields
  is_hidden?: boolean;
  hidden_reason?: string;
  
  // Loaded from relations
  user?: User;
  category?: Category;
  status?: IssueStatus;
  images?: IssueImage[];
  assigned_worker?: User | null;
  
  // Counts
  upvotes_count?: number;
  comments_count?: number;
  has_voted?: boolean;
  
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

export interface CreateIssuePayload {
  category_id: number;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  images?: {
    uri: string;
    type: string;
    name: string;
  }[];
}

export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  category_id?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  status_id?: number;
  images?: (string | { uri: string; name: string; type: string })[];
  deleted_images?: number[];
  is_hidden?: boolean;
}

export interface AdminUpdateIssuePayload extends UpdateIssuePayload {
  hidden_reason?: string;
}
