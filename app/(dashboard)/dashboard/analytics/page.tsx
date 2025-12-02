"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
	const [wau, setWau] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

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
			setError(err.message);
			console.error("Error:", err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center">
				<p className="text-neutral-500">Loading...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600">Error: {error}</p>
					<button
						onClick={() => {
							setLoading(true);
							fetchWAU();
						}}
						className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full flex items-center justify-center">
			<div className="bg-secondary p-8 rounded-lg text-center">
				<h2 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">Weekly Active Users</h2>
				<p className="mt-4 text-5xl font-bold text-primary">{wau !== null ? wau.toLocaleString() : "—"}</p>
			</div>
		</div>
	);
}
