# Release Smoke Checklist

Use this before shipping changes that touch public pages, publishing, events, or subscriptions.

## Automated Checks

- Run `pnpm build` and confirm it exits successfully.
- Run `pnpm typecheck` and confirm it exits successfully.
- Run targeted Biome checks for touched files.

## Public Reading Flow

- Open `/` and confirm the first page lists recent articles.
- Open `/page/2` and confirm older articles load.
- Use `Older articles` and `Newer articles` links.
- Open one article from the homepage.
- Confirm article title, author card, subscribe form, content, share widget, and feedback form render.

## Subscription Flow

- On a public post page, submit the subscribe form with a test email address.
- Confirm the request succeeds and the success toast appears.
- Confirm the welcome email arrives.
- Confirm the subscriber appears in Resend or the dashboard subscribers page.
- Confirm PostHog receives the `subscribed_newsletter` event.

## Events Flow

- Open `/events` and confirm event groups render.
- Confirm `Today` and `Tomorrow` only appear after the page hydrates; cached HTML should still be safe with absolute dates.
- Use a city filter such as `/events?city=lisboa`.
- Use the calendar date filter and clear it with `Show All Events`.
- Open at least one event link.

## Event Submissions Flow

- Open `/events/submit` while logged out and confirm the form renders.
- Paste a real event URL (e.g. a public Luma page) into the Event link field and click `Fill from event link`.
- Confirm the skeleton appears, then the form populates with title, description, start time, city, and inferred categories.
- Submit the form (with a throwaway email if you don't want notifications).
- Confirm the submitter confirmation email arrives.
- Confirm an admin notification email arrives at every `profiles.role='admin'` address.
- Log in as admin, open `/dashboard/event-submissions`, confirm the badge count matches and the submission is in the Pending review section.
- Open the submission, edit something trivial, click `Approve & publish`.
- Confirm the event appears on `/events` (no manual revalidation needed).
- Confirm the submitter approval email arrives with the city-filtered event link.
- Submit another test event, then reject it with a reason.
- Confirm the rejection email arrives with the reason included.

## Auth/Admin Flow

- Logged out: confirm the navbar does not show `Account`.
- Logged in: confirm the navbar shows `Account`.
- Open a public post as an author/admin and confirm edit, publish/unpublish, and delete controls appear.
- Open a public post logged out and confirm admin controls do not appear.

## Publishing And Revalidation

- Publish a new public post.
- Confirm it appears on `/` after the publish action completes.
- Edit an existing public post title and confirm the public post page and homepage update.
- Unpublish or delete a test post and confirm it disappears from the public listing.
- Create or edit an event and confirm `/events` updates.

## Newsletter Flow

- Send a test newsletter from the dashboard.
- Confirm the test email includes the selected article and upcoming events.
- Do not send a broadcast unless the test email has been reviewed.
