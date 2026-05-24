begin;

create table if not exists public.event_categories (
	slug text primary key,
	name text not null,
	description text not null,
	created_at timestamp with time zone not null default now()
);

create table if not exists public.event_category_assignments (
	event_id bigint not null references public.events(id) on delete cascade,
	category_slug text not null references public.event_categories(slug) on delete restrict,
	created_at timestamp with time zone not null default now(),
	primary key (event_id, category_slug)
);

create index if not exists event_category_assignments_category_slug_idx
	on public.event_category_assignments (category_slug);

alter table public.event_categories enable row level security;
alter table public.event_category_assignments enable row level security;

drop policy if exists "Event categories are publicly readable" on public.event_categories;
create policy "Event categories are publicly readable"
	on public.event_categories
	for select
	using (true);

drop policy if exists "Authenticated users can manage event categories" on public.event_categories;
drop policy if exists "Admins can manage event categories" on public.event_categories;
create policy "Admins can manage event categories"
	on public.event_categories
	for all
	to authenticated
	using (
		exists (
			select 1
			from public.profiles
			where profiles.id = auth.uid()
				and profiles.role = 'admin'
		)
	)
	with check (
		exists (
			select 1
			from public.profiles
			where profiles.id = auth.uid()
				and profiles.role = 'admin'
		)
	);

drop policy if exists "Event category assignments are publicly readable" on public.event_category_assignments;
create policy "Event category assignments are publicly readable"
	on public.event_category_assignments
	for select
	using (true);

drop policy if exists "Authenticated users can manage event category assignments" on public.event_category_assignments;
drop policy if exists "Admins can manage event category assignments" on public.event_category_assignments;
create policy "Admins can manage event category assignments"
	on public.event_category_assignments
	for all
	to authenticated
	using (
		exists (
			select 1
			from public.profiles
			where profiles.id = auth.uid()
				and profiles.role = 'admin'
		)
	)
	with check (
		exists (
			select 1
			from public.profiles
			where profiles.id = auth.uid()
				and profiles.role = 'admin'
		)
	);

insert into public.event_categories (slug, name, description)
values
	('ai', 'AI', 'Artificial intelligence, machine learning, agents, LLMs, automation, and data science.'),
	('software-engineering', 'Software Engineering', 'Developer events, programming, web engineering, cloud, security, DevOps, QA, and tooling.'),
	('design', 'Design', 'UX, UI, product design, design research, Figma, prototyping, and creative technology.'),
	('product', 'Product', 'Product management, product strategy, discovery, product operations, and product-led growth.'),
	('startups-fundraising', 'Startups & Fundraising', 'Startup building, founders, pitching, accelerators, investment, demo days, and fundraising.')
on conflict (slug) do update
set
	name = excluded.name,
	description = excluded.description;

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
)
insert into public.event_category_assignments (event_id, category_slug)
select event_id, category_slug
from category_matches
on conflict do nothing;

commit;
