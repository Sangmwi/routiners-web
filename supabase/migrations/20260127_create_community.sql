-- ============================================================================
-- Community Feature Migration
-- 커뮤니티 게시판 기능을 위한 테이블 및 RLS 정책
-- ============================================================================

-- 게시글 테이블
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 댓글 테이블
CREATE TABLE community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 좋아요 테이블
CREATE TABLE community_likes (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_posts_category ON community_posts(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_created_at ON community_posts(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_author_id ON community_posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_post_id ON community_comments(post_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author_id ON community_comments(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent_id ON community_comments(parent_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

-- Posts RLS
CREATE POLICY "Authenticated can read posts" ON community_posts
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can create posts" ON community_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can soft delete own posts" ON community_posts
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Comments RLS
CREATE POLICY "Authenticated can read comments" ON community_comments
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can create comments" ON community_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments" ON community_comments
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can soft delete own comments" ON community_comments
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Likes RLS
CREATE POLICY "Authenticated can read likes" ON community_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create likes" ON community_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON community_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Triggers for counter updates
-- ============================================================================

-- 좋아요 카운트 증가/감소
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON community_likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- 댓글 카운트 증가/감소
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE community_posts SET comments_count = comments_count - 1 WHERE id = NEW.post_id;
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR UPDATE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_count();
