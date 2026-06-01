// Shared layout for every /events/* route. Its job is to host the persistent
// filter chrome (the city tab row) so it survives navigation between filter
// routes instead of remounting on every chip click. The shell is a client
// component because the tab row reads the active filter from the URL and drives
// optimistic navigation; the layout itself stays a server component so it adds
// no client cost to the sibling pages (calendar, submit) that opt out of the
// chrome.
import type { ReactNode } from "react";
import EventsLayoutShell from "./EventsLayoutShell";

export default function EventsLayout({ children }: { children: ReactNode }) {
	return <EventsLayoutShell>{children}</EventsLayoutShell>;
}
