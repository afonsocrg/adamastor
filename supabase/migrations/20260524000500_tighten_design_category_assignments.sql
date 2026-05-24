begin;

with event_text as (
	select
		id,
		lower(coalesce(title, '') || ' ' || coalesce(url, '')) as title_url_text,
		lower(coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(url, '')) as full_text
	from public.events
),
design_matches as (
	select id as event_id
	from event_text
	where title_url_text ~* '\m(design|designers?|lisboaux|opo\.?design)\M'
		or full_text ~* '\m(ux|ui|figma|user research|design research|prototype|prototyping|branding|product design)\M'
),
removed_stale_design_assignments as (
	delete from public.event_category_assignments existing_assignment
	where existing_assignment.category_slug = 'design'
		and not exists (
			select 1
			from design_matches
			where design_matches.event_id = existing_assignment.event_id
		)
	returning event_id
)
insert into public.event_category_assignments (event_id, category_slug)
select event_id, 'design'
from design_matches
on conflict do nothing;

commit;
