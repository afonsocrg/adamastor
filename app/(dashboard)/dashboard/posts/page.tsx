import { Button } from "@/components/tailwind/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tailwind/ui/tabs";
import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MyPosts } from "./MyPosts";
import { OthersPosts } from "./OthersPosts";

type PostsPageProps = {
	searchParams?: Promise<{
		tab?: string;
	}>;
};

export default async function ProfilePage({ searchParams }: PostsPageProps) {
	const supabase = await createClient();
	const profile = await assertAuthenticated(supabase);
	const params = await searchParams;

	const isAdmin = profile.role === "admin";
	const activeTab = params?.tab === "others-posts" ? "others-posts" : "my-posts";

	return (
		<div className="w-full mx-auto p-6 animate-fade-in">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-xl font-semibold text-navy-shade dark:text-navy-lifted flex gap-2 items-center">Articles</h2>
				<Button
					className="inline-flex items-center px-4 py-2 text-white transition-all duration-200 rounded-lg bg-gold-hue hover:bg-gold-hue/90"
					asChild
				>
					<Link href="/dashboard/posts/new">New article</Link>
				</Button>
			</div>

			{isAdmin ? (
				<section className="w-full">
					<Tabs defaultValue={activeTab} className="space-y-4">
						<TabsList>
							<TabsTrigger value="my-posts">My articles</TabsTrigger>
							<TabsTrigger value="others-posts">Guest articles</TabsTrigger>
						</TabsList>

						<TabsContent value="my-posts" className="animate-in w-full">
							<MyPosts userId={profile.id} />
						</TabsContent>

						<TabsContent value="others-posts" className="animate-in w-full">
							<OthersPosts currentUserId={profile.id} />
						</TabsContent>
					</Tabs>
				</section>
			) : (
				<MyPosts userId={profile.id} />
			)}
		</div>
	);
}
