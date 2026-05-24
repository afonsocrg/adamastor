import { SubscribersList } from "./SubscribersList";

export default async function SubscribersPage() {
	return (
		<div className="w-full mx-auto p-6">
			<div className="flex justify-between items-center mb-8">
				{/* Page title uses CalSans (--font-title) per docs/design-system.md
				    "Page title (h1/h2): CalSans, large display weight." */}
				<h2 className="text-2xl text-navy dark:text-[#E3F2F7] flex gap-2 items-center [font-family:var(--font-title)]">
					Newsletter Subscribers
				</h2>
			</div>

			<SubscribersList />
		</div>
	);
}
