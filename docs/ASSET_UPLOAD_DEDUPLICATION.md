# JPEG support and asset upload deduplication

JPEG (.jpg/.jpeg, image/jpeg) already uses real Pillow verification and decoding.
Extraction returns dimensions and a bounded sampled RGB palette, plus SHA-256 of
original bytes. It does not perform OCR. Tests now exercise successful JPEG and
PNG multipart upload and invalid/truncated/mislabeled rejection.

## Cause and behavior

The upload endpoint creates a random private storage path for each attempt. The
previous finalize_upload RPC inserted documents/assets unconditionally; hashes
were recorded but not checked for duplicates.

The pending migration rejects byte-identical assets in the same workspace with
`conflict: an identical asset is already registered in this workspace` (HTTP 409).
It checks role and object path first, requires READ COMMITTED isolation, then
serializes asset registration using the
organization row before looking up the workspace-scoped digest. Existing document,
asset, approval, classification and audit records are not modified or deleted.
The same hash in another workspace is independent and starts unapproved.
Content and knowledge uploads retain their existing behavior.

## Pending production database change — not applied

`supabase/migrations/20261117200004_inkloom_prevent_duplicate_assets.sql` replaces
only the existing SECURITY INVOKER finalize_upload function and adds two non-unique
lookup indexes. Existing EXECUTE grants and all RLS/privacy policies are unchanged.
Historical duplicates intentionally remain; no unique constraint or cleanup is
performed. The migration was generated with Supabase CLI and tested in disposable
PGlite databases and native PostgreSQL 17.11, including upgrades over existing
duplicate records. No production migration has been applied.

Before rollout, review/authorize this migration and assess index creation lock time
against the production table sizes. Use the ordinary reviewed migration process;
never edit/delete historical assets to make an index fit. Production migration, merge and deployment remain subject to separate user approval.
The feature branch and pull request may be published for review.

## Limits

- Duplicate means identical original bytes, not visually similar, resized or
  re-encoded images. JPEG compression may slightly change sampled colours.
- A duplicate request still transfers bytes to a new random storage object before
  database rejection. Existing endpoint cleanup deletes only that new object.
  Cleanup is best effort; storage outages can leave an unregistered orphan object.
- All trusted asset registrations must use finalize_upload. A privileged writer
  bypassing the RPC can bypass this guard; browser writes remain denied.
- PGlite serializes queries; its paired-call test alone is not proof of contention.
  Separate native PostgreSQL 17.11 tests used distinct backend PIDs and observed
  blocking with pg_blocking_pids before releasing the first transaction.
- Asset registration rejects non-READ-COMMITTED transactions rather than risk a
  stale repeatable-read snapshot missing a concurrent insert. Normal PostgREST
  READ COMMITTED calls retain their existing API and result shape.
- Registration and regression tests do not constitute a live Supabase Storage test.

## Verification recorded for deployment review

A read-only production catalog check confirmed the current RPC is SECURITY
INVOKER, executable by service_role but not anon/authenticated. The database default
is READ COMMITTED, with no nondefault authenticator/service_role isolation override
found. No production function, grant, policy, row or setting was changed.

- Fresh database: all repository migrations apply in order, one asset registers,
  duplicates reject, and new approval defaults remain false.
- Existing database: historical duplicate documents/assets survive the migration;
  approvals, audit rows, EXECUTE ACL, SECURITY INVOKER/search_path and every RLS
  policy are checked before/after and remain identical.
- Native PostgreSQL 17.11 (Darwin arm64), loopback only: two independently connected
  clients with different backend PIDs contend on the same workspace. The second
  registration is observed blocking. First commit => second rejects with one
  asset; first rollback => second succeeds with one asset. Another workspace's
  same-hash registration completes while the first workspace is locked.
- Both fresh and upgrade paths pass the native contention cases. Repeatable-read
  calls fail closed. Restoring the old function is also tested in both disposable
  databases: grants and existing approvals are retained; duplicate prevention is
  intentionally disabled after rollback.
- HTTP tests preserve an existing storage object's bytes on duplicate cleanup,
  failed cleanup and a forced random-path collision. Upload uses no x-upsert;
  storage collision stops before registration/cleanup and cannot overwrite or
  delete the existing object.
- The native test runner and report are private local artifacts under
  `.cache/postgres-asset-tests`; no native PostgreSQL dependency is added to the
  application. GitHub CI repeats the committed PGlite fresh/upgrade tests.

## Execution sequence — requires authorization, not executed

1. Review the PR and green CI. Preserve the currently installed function definition,
   ACL/search_path and existing database backup. Confirm normal asset registrations
   use READ COMMITTED and the trusted RPC. Inspect table sizes and schedule the
   two ordinary CREATE INDEX operations during an appropriate maintenance window;
   they can block writes. For large tables, revise/review an online index plan first.
2. After explicit migration authorization, apply the exact pending migration as a
   single transaction with the approved migration runner. Use short lock and
   statement timeouts appropriate to the reviewed window (for example 5s/60s).
   On timeout/error, roll back the complete transaction; do not leave a partial
   index/function installation or mark a failed migration applied.
3. Verify indexes and installed function definition/ACL via read-only catalog
   checks. Confirm the grants, RLS policies and approval/audit records are intact.
   No production test upload is part of this authorization.
4. Merge the reviewed PR only after merge authorization; allow ordinary automatic
   deployments. Current production upload/error handling already supports this
   RPC signature and HTTP 409 cleanup, so the migration is backward compatible
   and may precede the application rebuild. Without the migration, deduplication
   is not active. No UI or environment-variable change is required.
5. Monitor existing user uploads for the expected HTTP 409 response and unexpected
   storage/lock errors. Do not delete historical duplicate assets or auto-approve
   anything.

## Rollback — requires authorization, not executed

Before a transaction commits, ROLLBACK undoes the migration, including new indexes.
After successful application, use a reviewed **new forward migration** to restore
that environment's captured prior finalize_upload definition. Do not edit the
applied migration or delete migration history. The repository's prior function is
shown below for review; confirm it matches the captured production definition.
CREATE OR REPLACE preserves its existing ACL and SECURITY INVOKER. Leave the two
non-unique indexes in place unless a separate removal is approved; they do not
change data or approval behavior. Restore only function code, never delete assets,
documents, audit records or storage objects. This disables duplicate prevention
and permits future duplicates, while retaining existing approvals and history.
An application-code revert alone does not undo a database function migration.

```sql
create or replace function public.inkloom_finalize_upload(p_org uuid,p_actor uuid,p_data jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare rid uuid; r text;
begin
 select role into r from public.inkloom_memberships where org_id=p_org and user_id=p_actor;
 if r is null or (p_data->>'purpose' in ('knowledge','asset') and r<>'admin') or (p_data->>'purpose'='content' and r not in ('admin','creator')) then raise exception 'denied: upload role'; end if;
 if split_part(p_data->>'object_path','/',1)<>p_org::text or split_part(p_data->>'object_path','/',2)<>p_actor::text then raise exception 'denied: object path'; end if;
 insert into public.inkloom_documents(org_id,name,object_path,mime,sha256,extracted_text,provenance,metadata,created_by)
 values(p_org,p_data->>'name',p_data->>'object_path',p_data->>'mime',p_data->>'sha256',coalesce(p_data->>'text',''),p_data->'provenance',p_data->'metadata',p_actor) returning id into rid;
 if p_data->>'purpose'='asset' then insert into public.inkloom_assets(org_id,document_id) values(p_org,rid); end if;
 perform inkloom_private.audit(p_org,p_actor,'upload',rid);
 return jsonb_build_object('id',rid);
end $$;
```
