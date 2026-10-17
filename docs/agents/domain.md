# Domain docs

## Layout

This repo uses a single-context layout:

- `GLOSSARY.md` at the repo root for domain terminology.
- `docs/adr/` for architecture decision records.

Create domain documents lazily when terms or decisions are resolved.

## Before exploring

Read the root `GLOSSARY.md` and ADRs relevant to the area of work.
If these documents do not exist, proceed silently.

## Vocabulary

Use glossary terms in issue titles, proposals, hypotheses, and tests.
If a needed concept is missing, reconsider whether it belongs to
the domain or note the gap for domain-modeling.

## Decision conflicts

Explicitly identify any proposal that contradicts an existing ADR.
Name the ADR and explain why the decision merits reconsideration.
