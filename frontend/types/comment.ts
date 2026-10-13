export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: { id: string; name: string; avatar_url: string | null } | null;
}
