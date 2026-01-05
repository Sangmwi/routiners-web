-- ============================================================================
-- 채팅 시스템 재설계: AI 채팅 + 유저 간 실시간 채팅 통합
-- ============================================================================
--
-- 목표:
-- 1. 메시지를 별도 테이블로 분리 (확장성, 검색, 페이지네이션)
-- 2. AI 채팅과 유저 채팅을 통합 구조로 관리
-- 3. 1:1, 그룹, AI 대화 모두 지원
-- 4. Supabase Realtime 최적화
--
-- ============================================================================

-- ============================================================================
-- Phase 1: 대화방 (Conversations) 테이블
-- ============================================================================
-- 모든 종류의 대화를 하나의 테이블에서 관리

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 대화 유형
  type TEXT NOT NULL CHECK (type IN ('ai', 'direct', 'group')),

  -- AI 대화 전용 필드
  ai_purpose TEXT CHECK (
    type != 'ai' OR ai_purpose IN ('workout', 'meal')
  ),
  ai_status TEXT DEFAULT 'active' CHECK (
    type != 'ai' OR ai_status IN ('active', 'completed', 'abandoned')
  ),
  ai_result_applied BOOLEAN DEFAULT false,
  ai_result_applied_at TIMESTAMPTZ,

  -- 공통 필드
  title TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 소프트 삭제
  deleted_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_ai_status ON conversations(ai_status)
  WHERE type = 'ai';

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- ============================================================================
-- Phase 2: 대화 참여자 (Conversation Participants) 테이블
-- ============================================================================
-- 다대다 관계 지원 (그룹 채팅, 1:1, AI)

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 역할
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),

  -- 상태
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,

  -- 읽음 표시
  last_read_at TIMESTAMPTZ DEFAULT now(),
  last_read_message_id UUID,

  -- 알림 설정
  muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMPTZ,

  -- 유니크 제약
  UNIQUE(conversation_id, user_id)
);

-- 인덱스
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_active ON conversation_participants(user_id, conversation_id)
  WHERE left_at IS NULL;

-- ============================================================================
-- Phase 3: 메시지 (Messages) 테이블
-- ============================================================================
-- 모든 메시지를 개별 row로 저장

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- 발신자 (AI인 경우 NULL)
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- AI 대화에서의 역할
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'assistant', 'system')),

  -- 메시지 내용
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (
    content_type IN ('text', 'image', 'file', 'audio', 'video', 'location', 'call')
  ),

  -- 미디어 첨부 (파일, 이미지 등)
  media_url TEXT,
  media_metadata JSONB,  -- { fileName, fileSize, mimeType, width, height, duration }

  -- 메타데이터
  metadata JSONB,  -- 확장용 (링크 프리뷰, 멘션 등)

  -- 답장/인용
  reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- 인덱스 (성능 최적화)
CREATE INDEX idx_messages_conversation_time ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_messages_content_search ON chat_messages USING gin(to_tsvector('korean', content));

-- Realtime용 인덱스 (중요!)
CREATE INDEX idx_messages_realtime ON chat_messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- Phase 4: 메시지 반응 (Message Reactions) 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,  -- '👍', '❤️', '😂' 등
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);

-- ============================================================================
-- Phase 5: RLS 정책
-- ============================================================================

-- Conversations RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select" ON conversations FOR SELECT
  USING (
    -- AI 대화: 본인 것만
    (type = 'ai' AND created_by IN (
      SELECT id FROM users WHERE provider_id = auth.uid()::text
    ))
    OR
    -- 일반 대화: 참여자만
    (type != 'ai' AND id IN (
      SELECT conversation_id FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE u.provider_id = auth.uid()::text AND cp.left_at IS NULL
    ))
  );

CREATE POLICY "conversations_insert" ON conversations FOR INSERT
  WITH CHECK (
    created_by IN (SELECT id FROM users WHERE provider_id = auth.uid()::text)
  );

CREATE POLICY "conversations_update" ON conversations FOR UPDATE
  USING (
    created_by IN (SELECT id FROM users WHERE provider_id = auth.uid()::text)
    OR
    id IN (
      SELECT conversation_id FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE u.provider_id = auth.uid()::text AND cp.role IN ('owner', 'admin')
    )
  );

-- Participants RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select" ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE u.provider_id = auth.uid()::text
    )
  );

CREATE POLICY "participants_insert" ON conversation_participants FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE provider_id = auth.uid()::text)
  );

CREATE POLICY "participants_update" ON conversation_participants FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE provider_id = auth.uid()::text)
  );

-- Messages RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE u.provider_id = auth.uid()::text AND cp.left_at IS NULL
    )
    OR
    conversation_id IN (
      SELECT id FROM conversations
      WHERE type = 'ai' AND created_by IN (
        SELECT id FROM users WHERE provider_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "messages_insert" ON chat_messages FOR INSERT
  WITH CHECK (
    -- AI 대화: assistant 역할 또는 본인
    (sender_id IS NULL AND role = 'assistant')
    OR
    sender_id IN (SELECT id FROM users WHERE provider_id = auth.uid()::text)
  );

CREATE POLICY "messages_update" ON chat_messages FOR UPDATE
  USING (
    sender_id IN (SELECT id FROM users WHERE provider_id = auth.uid()::text)
  );

CREATE POLICY "messages_delete" ON chat_messages FOR DELETE
  USING (
    sender_id IN (SELECT id FROM users WHERE provider_id = auth.uid()::text)
  );

-- Reactions RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select" ON message_reactions FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM chat_messages WHERE conversation_id IN (
        SELECT conversation_id FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE u.provider_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "reactions_insert" ON message_reactions FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE provider_id = auth.uid()::text)
  );

CREATE POLICY "reactions_delete" ON message_reactions FOR DELETE
  USING (
    user_id IN (SELECT id FROM users WHERE provider_id = auth.uid()::text)
  );

-- ============================================================================
-- Phase 6: Realtime 활성화
-- ============================================================================

-- Realtime 발행 설정
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- ============================================================================
-- Phase 7: 유틸리티 함수
-- ============================================================================

-- 읽지 않은 메시지 수 조회
CREATE OR REPLACE FUNCTION get_unread_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_read TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  SELECT last_read_at INTO v_last_read
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

  SELECT COUNT(*) INTO v_count
  FROM chat_messages
  WHERE conversation_id = p_conversation_id
    AND created_at > COALESCE(v_last_read, '1970-01-01'::timestamptz)
    AND sender_id != p_user_id
    AND deleted_at IS NULL;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 마지막 메시지 조회
CREATE OR REPLACE FUNCTION get_last_message(p_conversation_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  sender_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.content, m.sender_id, m.created_at
  FROM chat_messages m
  WHERE m.conversation_id = p_conversation_id AND m.deleted_at IS NULL
  ORDER BY m.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Phase 8: 기존 ai_sessions 데이터 마이그레이션
-- ============================================================================
-- 주의: 실제 마이그레이션 전 백업 필수!

-- 1. ai_sessions → conversations 마이그레이션
INSERT INTO conversations (id, type, ai_purpose, ai_status, ai_result_applied, ai_result_applied_at, title, created_by, created_at, updated_at)
SELECT
  id,
  'ai',
  purpose,
  status,
  result_applied,
  result_applied_at,
  title,
  user_id,
  created_at,
  COALESCE(completed_at, created_at)
FROM ai_sessions
ON CONFLICT (id) DO NOTHING;

-- 2. ai_sessions.messages → chat_messages 마이그레이션
INSERT INTO chat_messages (id, conversation_id, sender_id, role, content, created_at)
SELECT
  (msg->>'id')::uuid,
  s.id,
  CASE WHEN msg->>'role' = 'user' THEN s.user_id ELSE NULL END,
  msg->>'role',
  msg->>'content',
  (msg->>'createdAt')::timestamptz
FROM ai_sessions s,
LATERAL jsonb_array_elements(s.messages) AS msg
ON CONFLICT (id) DO NOTHING;

-- 3. AI 대화 참여자 추가
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
SELECT id, user_id, 'owner', created_at
FROM ai_sessions
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- ============================================================================
-- 완료 메시지
-- ============================================================================
-- 마이그레이션 완료 후:
-- 1. 기존 ai_sessions 테이블은 백업 후 삭제 가능
-- 2. threads/messages 테이블도 백업 후 삭제 가능
-- 3. 새 API 엔드포인트로 전환
