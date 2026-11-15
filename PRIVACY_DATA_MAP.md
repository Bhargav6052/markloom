# Privacy data map — implementation facts

Updated 15 November 2026. Notice is an unpublished draft; provider-account terms are unverified.

| Data | Location / access | External AI behavior | Retention |
| --- | --- | --- | --- |
| Email/account ID/session | Shared Supabase Auth; backend validates sessions | Not intentionally included in model prompt | Provider/Auth lifecycle and manual operator handling |
| Memberships, roles, invitations | Inkloom Postgres tables; org-scoped RLS | Not model input | No automatic purge |
| Draft text, intent, revision metadata/hash | Inkloom content versions; org member reads; authorized mutations | Draft text only when policy/classification/choice permit | Immutable browser history, manual operator retention |
| Approved rules/facts and source snapshots | Inkloom source/run/passport tables | Selected exact passages only; source/document class participates in gate | No automatic purge; approval history retained |
| Uploaded PDF/DOCX/PNG/JPEG | Private inkloom-private Storage; org-scoped authorized download | Original binary is never sent by these adapters | Manual operator handling; failed registration cleanup is best-effort |
| Extracted passages/provenance/pixel metadata | Inkloom documents | Text passages may be sent under the gate | No automatic purge |
| Processing attempts | Inkloom processing_events; member reads | Provider/model, categories, actor, policy revision, time and outcome; raw prompt is not stored in event row | No automatic purge |
| Decisions, audit, passports, notifications | Inkloom Postgres/RLS; personal notification filtering | Not model input | Manual legal/retention review needed |
| Export/deletion requests | Requester/admin reads | Never model input | Manual processing; requested does not mean fulfilled |

Unknown/missing source classification defaults confidential. Unknown explicit values fail closed. Restricted material has no external override. PUBLIC and INTERNAL are opt-in for each organization and require a creator's explicit choice for the saved version. Local deterministic checks are labeled as limited coverage.

Provider network failures can occur after receipt; a failed response is not proof that data never reached the provider. A worker crash may leave an attempt unresolved and a recovered job can repeat a provider request. Policy revision and classifications are recorded before the call; saved versions/evidence are checked again before persisting results as current.

Supabase project region: ap-northeast-2 (Seoul). Cross-border processing and AI provider region/training/retention/DPA details require verification for actual operator accounts. The current shared project's legacy signup trigger also writes its existing application's profile record; review or separate account infrastructure before public use. No automatic retention/delete/export capability or legal guarantee is implied by the Privacy Center.

## Optional website analytics and security processing

When enabled and consented, inkloom_website_events stores event type, allowlisted public path, consent version and time, without account/visitor/IP/referrer/query fields. Browser roles cannot insert/read it; the server-only endpoint filters schema/origin/privacy signals and limits abuse. It is not joined to organizations or private activity. Events currently number zero; no automatic retention purge is implemented. Infrastructure/auth services may process separate connection/security logs. Turnstile, when configured, supplies security challenges verified through Supabase Auth. Operator notice/terms and provider configuration still require review. Consent preferences live in browser storage with a one-year expiry and can be reopened/withdrawn.
