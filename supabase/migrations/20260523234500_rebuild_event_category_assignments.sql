begin;

with event_text as (
	select
		id,
		lower(coalesce(title, '') || ' ' || coalesce(url, '')) as title_url_text,
		lower(coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(url, '')) as full_text
	from public.events
),
category_matches as (
	select id as event_id, 'ai' as category_slug
	from event_text
	where title_url_text ~* '\m(ai|agents?|automations?)\M'
		or full_text ~* '\m(artificial intelligence|machine learning|ml|llms?|genai|generative ai|agentic|ai agents?|chatgpt|cursor|lovable|data science)\M'
	union
	select id, 'software-engineering'
	from event_text
	where title_url_text ~* '\m(software|developers?|devs?|programming|coding|code|javascript|typescript|react|frontend|backend|fullstack|devops|cloud|cybersecurity|security|api|open source|github|qa|testing)\M'
		or full_text ~* '\m(software engineering|developer tools|cloud native|cybersecurity|javascript|typescript|react|frontend|backend|fullstack|devops|open source|github|qa|testing|ai systems|ai agents?|autonomous agents?|building ai products|ai products|data engineering)\M'
	union
	select id, 'design'
	from event_text
	where title_url_text ~* '\m(design|designers?|lisboaux|opo\.?design)\M'
		or full_text ~* '\m(ux|ui|figma|user research|design research|prototype|prototyping|branding|product design)\M'
	union
	select id, 'product'
	from event_text
	where title_url_text ~* '\m(productized|producttank)\M'
		or full_text ~* '\m(product management|product managers?|product strategy|product ops|product operations|product-led|plg)\M'
	union
	select id, 'startups-fundraising'
	from event_text
	where title_url_text ~* '\m(startups?|founders?|founder institute|startup grind|entrepreneurs?|entrepreneurship|fundraising|funding|investors?|investment|venture capital|vc|angels?|pitch|demo\s?day|accelerator|techstars|search funds?|valuation)\M'
		or full_text ~* '\m(founder institute|startup grind|fundraising|funding|investors?|venture capital|angels?|demo\s?day|accelerator|techstars|search funds?|startup valuation)\M'
),
removed_stale_assignments as (
	delete from public.event_category_assignments existing_assignment
	where existing_assignment.category_slug in (
		'ai',
		'software-engineering',
		'design',
		'product',
		'startups-fundraising'
	)
		and not exists (
			select 1
			from category_matches
			where category_matches.event_id = existing_assignment.event_id
				and category_matches.category_slug = existing_assignment.category_slug
		)
	returning event_id, category_slug
)
insert into public.event_category_assignments (event_id, category_slug)
select event_id, category_slug
from category_matches
on conflict do nothing;

commit;
