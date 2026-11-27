# CI Cost Rules (GitHub Actions)

Owner: Master KMO. Set 2026-11-27. The same rules are in every repository of
this account (Report-VectorSticker, VectorSticker.Com, social-designkmo,
vs-designsystem); keep the copies the same.

Goal: the lowest reasonable CI cost while every necessary check still runs.
A skipped necessary check is a failure, not a saving.

Why (2026-11-27): the private repositories used the whole $12 of included
Actions compute by 2026-11-22. From then on every job was refused ("The job
was not started because ... your spending limit needs to be increased") and
PRs were still merged without CI. November gross usage: VectorSticker.Com
$5.92, social-designkmo $5.36, vs-designsystem $2.63 (public, not charged),
Report-VectorSticker $0.73.

## Rules

1. Budget: Actions $5/month (stop usage on, alerts on); every other product
   $0. Never change a budget without Master KMO.
2. No merge unless CI is green. Failed, blocked (billing), cancelled or
   pending CI means no merge. A docs-only PR where no workflow runs by design
   is allowed: say so in the PR.
3. CI blocked by billing: do not merge; report it. Run the tests locally and
   show the output only if Master KMO asks to merge anyway.
4. Never re-run old or finished runs, and never start a workflow by hand
   (workflow_dispatch), without Master KMO's approval.
5. Every push to an open PR starts CI. Push when a coherent step is done,
   not after each small edit.
6. Release PRs (dev -> main) and push-to-main runs keep their checks: a
   different base is a different merge result.
7. Never change a workflow file (.github/workflows/) without Master KMO's
   approval. First state: triggers, jobs, expected minutes per run, cache,
   cancellation, and what could be skipped.
8. Timeouts come from measured run times. No job over 15 minutes without
   approval.
9. Skips must fail safe: if unsure whether a file matters, run the checks.
   Tests can read docs (the main site's PHPUnit reads docs/facelift/*.md),
   so "docs only" is not automatically safe to skip.
10. ubuntu-latest runners only. No scheduled (cron) workflows without
    approval.
