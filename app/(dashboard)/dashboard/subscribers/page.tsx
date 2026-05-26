import { SubscribersList } from "./SubscribersList";

export default async function SubscribersPage() {
	return (
		<div className="w-full mx-auto p-6">
			<div className="flex justify-between items-center mb-8">
				{/* Page title uses Lora Bold (--font-lora-bold) per
				    docs/design-system.md — the system's editorial display
				    serif. */}
				<h2 className="text-2xl font-bold text-navy dark:text-cyan-lifted flex gap-2 items-center [font-family:var(--font-lora-bold)]">
					Newsletter Subscribers
				</h2>
			</div>

			<SubscribersList />
		</div>
	);
}
