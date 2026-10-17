# Issue tracker: Local Markdown

Issues and specs live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- Feature spec: `.scratch/<feature-slug>/spec.md`.
- Implementation issues: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`,
  numbered from `01`, with one file per ticket.
- Record triage state in a `Status:` line near the top of each issue.
  Use the roles in `triage-labels.md`.
- Append comments and conversation history under `## Comments`.

## Publish to the issue tracker

Create the appropriate spec or issue file using these paths.
Create parent directories as needed.

## Fetch a relevant ticket

Read the file at the referenced path. If given only a number,
resolve it within the relevant feature directory. Ask for the
feature when the number is ambiguous.

## Wayfinding operations

- Map: `.scratch/<effort>/map.md`, containing Notes,
  Decisions-so-far, and Fog.
- Child ticket: `.scratch/<effort>/issues/NN-<slug>.md`,
  numbered from `01`, with the question in the body.
- Record ticket type in `Type:`:
  `research`, `prototype`, `grilling`, or `task`.
- Record dependencies in `Blocked by: NN, NN`.
- A ticket is unblocked when every dependency is resolved.
- Frontier: choose the lowest-numbered open, unblocked,
  unclaimed ticket.
- Claim: set `Status: claimed` and save before starting work.
- Resolve: append the answer under `## Answer`, set
  `Status: resolved`, and add a gist plus link to the map's
  Decisions-so-far.

Wayfinding uses `claimed` and `resolved` as workflow statuses;
ordinary issue triage uses the roles in `triage-labels.md`.
