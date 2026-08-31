# Project Catalog

## Stack (already installed and wired — record the values)
- GitHub repo: nataliaustpayroll/apa-crm-natali (remote: natali)
- Vercel project: apa-crm-natali
- Domain: apa-crm-natali.vercel.app
- Supabase project: bebuglzefwuxkaxqqfmf (region ap-southeast-2 / Sydney)
- Supabase URL: https://bebuglzefwuxkaxqqfmf.supabase.co
- Supabase service key: stored in .env.local + Vercel env (NOT recorded here — secret)
- Resend account: connected in code; API key in .env.local returns 401 (invalid) — needs a valid key

## Build (filled as we go)
- Plan written: [done]
- Build 1 (small) status: ✅ (PR #1 — merge after Vercel env vars set)
- Admin account seeded: ✅ with email natali@austpayroll.com.au
- Build 2 (all) status: ✅ code complete + verified locally (People directory w/ search,
  Contacts pipeline w/ activity_log on every stage change, Orders, Newsletter, person history,
  Resend confirmation + notification emails wired into submitLead). Migration 0002 applied.
  Data-layer smoke tests pass; all 6 admin screens rendered behind login. NOT yet committed/merged.
- Resend domain verified: ❌ — email code is complete and wired, but RESEND_API_KEY in .env.local
  returns 401 (invalid API key). Needs a valid Resend key + confirmation send.apa.com.au is verified.
  Re-run `node scripts/send-test-email.mjs` — it must print SENT before this can be ticked.

# How to use this catalog

You are my engineering partner. Before any task or /goal command:
1. Read this entire CLAUDE.md AND Working Files/product-plan.md.
2. Identify which catalog + plan items the task requires.
3. If any required item is [pending] or empty, STOP and tell me what to
   fill in. Use plain English: "I need X to do this. Please Y."
4. Don't proceed until every required item is filled.
5. After the task succeeds, update the catalog with new state.

Required items by task:
- /goal build 1 (small) → product-plan.md complete
- /goal build 2 (all) → product-plan.md + Build 1 complete + Resend domain verified
- Any deploy → GitHub + Vercel + Domain confirmed
