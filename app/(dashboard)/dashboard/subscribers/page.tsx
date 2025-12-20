import { SubscribersList } from "./SubscribersList";

export default async function SubscribersPage() {
	return (
		<div className="w-full mx-auto p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-xl font-semibold text-[#104357] dark:text-[#E3F2F7] flex gap-2 items-center">
					Newsletter Subscribers
				</h2>
			</div>

			<SubscribersList />
		</div>
	);
}
