-- GIN index for full-text search on Page title + content
CREATE INDEX "Page_fts_idx" ON "Page"
USING GIN (to_tsvector('english', "title" || ' ' || COALESCE("content"::text, '')));