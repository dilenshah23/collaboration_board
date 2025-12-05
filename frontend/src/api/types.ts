export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  owner: User;
  members: WorkspaceMember[];
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: number;
  user: User;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}

export interface Board {
  id: number;
  workspace: number;
  workspace_name: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBoardData {
  name: string;
  description?: string;
}

export interface Card {
  id: number;
  board_id: number;
  title: string;
  description?: string;
  column: 'todo' | 'in_progress' | 'done';
  position: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  assigned_to: CardAssignment[];
}

export interface CardAssignment {
  id: number;
  user_id: number;
  assigned_at: string;
}

export interface CreateCardData {
  title: string;
  description?: string;
  column?: 'todo' | 'in_progress' | 'done';
  position?: number;
}

export interface UpdateCardData {
  title?: string;
  description?: string;
  column?: 'todo' | 'in_progress' | 'done';
  position?: number;
}

export interface WSMessage {
  type: 'card.created' | 'card.updated' | 'card.moved' | 'card.deleted' | 'initial_state';
  data: Card | Card[] | { id: number; board_id: number };
  user?: {
    user_id: number;
    username: string;
  };
}

export interface WSAction {
  action: 'card.create' | 'card.update' | 'card.move' | 'card.delete';
  data: {
    id?: number;
    title?: string;
    description?: string;
    column?: 'todo' | 'in_progress' | 'done';
    position?: number;
  };
}
