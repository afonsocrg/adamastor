begin;

with event_text as (
	select
		id,
		lower(coalesce(title, '') || ' ' || coalesce(url, '')) as title_url_text,
		lower(coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(url, '')) as full_text
	from public.events
),
software_engineering_matches as (
	select id as event_id
	from event_text
	where title_url_text ~* '\m(software|developers?|devs?|programming|coding|code|javascript|typescript|react|frontend|backend|fullstack|devops|cloud|cybersecurity|security|api|open source|github|qa|testing)\M'
		or full_text ~* '\m(software engineering|developer tools|cloud native|cybersecurity|javascript|typescript|react|frontend|backend|fullstack|devops|open source|github|qa|testing|ai systems|ai agents?|autonomous agents?|building ai products|ai products|data engineering)\M'
)
insert into public.event_category_assignments (event_id, category_slug)
select event_id, 'software-engineering'
from software_engineering_matches
on conflict do nothing;

commit;
