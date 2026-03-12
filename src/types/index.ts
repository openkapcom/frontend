export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  website?: string;
  is_admin: boolean;
  subscription_tier?: string;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: number;
  title: string;
  description?: string;
  filename: string;
  duration: number;
  size: number;
  thumbnail?: string;
  share_token?: string;
  is_shared: boolean;
  is_favourite: boolean;
  views_count: number;
  comments_count: number;
  status: string;
  hls_ready: boolean;
  hls_path?: string;
  user_id: number;
  user?: User;
  folder_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  body: string;
  timestamp?: number;
  user_id: number;
  user?: User;
  video_id: number;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: number;
  emoji: string;
  user_id: number;
  video_id: number;
  created_at: string;
}

export interface Folder {
  id: number;
  name: string;
  color: string;
  user_id: number;
  videos_count: number;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: number;
  name: string;
  description?: string;
  is_shared: boolean;
  share_token?: string;
  has_password: boolean;
  sort_by: string;
  user_id: number;
  videos_count: number;
  videos?: Video[];
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description?: string;
  owner_id: number;
  owner?: User;
  members_count: number;
  videos_count: number;
  members?: WorkspaceMember[];
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: number;
  user_id: number;
  workspace_id: number;
  role: 'admin' | 'member';
  user?: User;
  joined_at: string;
}

export interface WorkspaceInvitation {
  id: number;
  email: string;
  token: string;
  workspace_id: number;
  workspace?: Workspace;
  inviter_id: number;
  inviter?: User;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface Integration {
  provider: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  connected_at?: string;
}

export interface IntegrationTarget {
  id: string;
  name: string;
  type: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

export interface Screenshot {
  id: number;
  title: string;
  filename: string;
  share_token?: string;
  is_shared: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ChatConversation {
  id: number;
  title: string;
  user_id: number;
  messages_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  conversation_id: number;
  created_at: string;
}

export interface Feedback {
  id: number;
  type: string;
  subject: string;
  message: string;
  status: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ZoomEvent {
  id?: number;
  x: number;
  y: number;
  time: number;
  duration: number;
  zoom_level: number;
}

export interface ZoomSettings {
  enabled: boolean;
  zoom_level: number;
  zoom_duration: number;
}

export interface EditorItem {
  id: string;
  type: 'blur' | 'text' | 'overlay';
  x: number;
  y: number;
  width: number;
  height: number;
  startTime: number;
  endTime: number;
  // text specific
  text?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  // overlay specific
  overlayFile?: File;
  overlayUrl?: string;
}

export interface UserSettings {
  auto_zoom: boolean;
  default_zoom_level: number;
  default_zoom_duration: number;
  bunny_encoding: boolean;
  brand_color?: string;
  organization_logo?: string;
}

export interface SubscriptionStatus {
  tier: string;
  is_active: boolean;
  videos_count: number;
  videos_limit: number;
  duration_limit: number;
  expires_at?: string;
}

export interface AdminStats {
  total_users: number;
  total_videos: number;
  total_storage: number;
  recent_users: User[];
  recent_videos: Video[];
}
