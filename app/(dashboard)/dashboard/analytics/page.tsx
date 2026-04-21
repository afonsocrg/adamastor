"use client";
import { Button } from "@/components/tailwind/ui/button";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { useEffect, useState } from "react";

export default function DashboardPage() {
	const [wau, setWau] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchWAU();

		// Optional: Refresh every 5 minutes
		const interval = setInterval(fetchWAU, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	const fetchWAU = async () => {
		try {
			const response = await fetch("/api/analytics");
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to fetch data");
			}

			setWau(data.wau);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch data");
			console.error("Error:", err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return <AnalyticsSkeleton />;
	}

	if (error) {
		return (
			<div className="flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600">Error: {error}</p>
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							setLoading(true);
							fetchWAU();
						}}
						className="mt-4"
					>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full flex items-center justify-center dashboard-content-in">
			<div className="bg-secondary p-8 rounded-lg text-center">
				<h2 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">Weekly Active Users</h2>
				<p className="mt-4 text-5xl font-bold text-primary">{wau !== null ? wau.toLocaleString() : "—"}</p>
			</div>
		</div>
	);
}

function AnalyticsSkeleton() {
	return (
		<div className="w-full flex items-center justify-center" aria-busy="true" aria-label="Loading analytics">
			<div className="bg-secondary p-8 rounded-lg text-center min-w-[260px]" aria-hidden="true">
				<Skeleton className="h-4 w-40 mx-auto" />
				<Skeleton className="h-12 w-24 mx-auto mt-4" />
			</div>
		</div>
	);
}
