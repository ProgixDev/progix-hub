# Tasks — Spec 038 (AI weekly digest)

- [x] Migration 0045: project_digests (+RLS: members read, PM insert)
- [x] env: OPENAI_API_KEY + OPENAI_DIGEST_MODEL (server-only, optional)
- [x] openai package
- [x] digests slice: types, data (getLatestDigest), generate (OpenAI), actions (PM-gated), DigestSection
- [x] Mount on project page; SparkleIcon; i18n digests (en+fr)
- [x] Verify: section renders, PM generate button, graceful no-key error
- [ ] appsec + ship; user adds OPENAI_API_KEY then tests live generation
