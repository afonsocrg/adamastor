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
