-- Cover photo for the hero banner and the link preview image.
alter table profile add column cover_url text;
grant select (cover_url) on profile to anon;
