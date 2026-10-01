CREATE TABLE assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL REFERENCES staff_users (id),
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content text NOT NULL DEFAULT '',
  tool_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assistant_messages_staff_created_idx
  ON assistant_messages (staff_user_id, created_at DESC);
