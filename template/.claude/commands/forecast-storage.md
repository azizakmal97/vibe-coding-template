---
description: Forecast database storage growth at year 1, 5, 10, 30. Flag free-tier limit risks. Suggest retention strategy.
---

# /forecast-storage

Run AI analysis of current schema + asked scale to predict storage growth + when free-tier limits get hit.

## Steps

1. Read schema files:
   - Prisma: `prisma/schema.prisma`
   - Drizzle: `drizzle/schema.ts`
   - Raw SQL: `migrations/*.sql`
   - Cloudflare D1: `wrangler.jsonc` + `migrations/*.sql`
2. Ask user for scale assumptions if not in `AUDIT_AND_ROADMAP.md` Part 9:
   - Active users (concurrent / total).
   - Transactions per month (e.g. orders, visits, messages).
   - Retention requirement (legal: e.g. 7 years for medical, 5 years for financial).
3. For each table, estimate:
   - Avg row size in bytes (count columns, guess avg text length, use 50 bytes for FKs).
   - Rows per year based on scale assumption.
   - Cumulative storage at year 1, 5, 10, 30.
4. Identify the free-tier limit for the DB engine:
   - **Cloudflare D1**: 5 GB storage, 5M reads/day, 100k writes/day.
   - **Supabase Free**: 500 MB DB, 5 GB egress, 50k MAU.
   - **Neon Free**: 0.5 GB storage, 100h compute/month.
   - **Vercel Postgres Hobby**: 256 MB storage, 60h compute/month.
   - **PlanetScale Free** (when available): 5 GB storage.
   - **Self-hosted Postgres**: practical limit is your disk; flag at 80%.
5. Compute when each limit hits.

## Output

```
STORAGE FORECAST
================
Scale assumption: <users>, <transactions/month>, <retention years>

| Table          | Rows/yr | Bytes/row | Size/yr | At 5y  | At 10y | At 30y |
|----------------|--------:|----------:|--------:|-------:|-------:|-------:|
| users          |    1.2k |       500 |  0.6MB  |   3MB  |  6MB   |  18MB  |
| invoices       |   24k   |       800 |  19MB   | 96MB   | 192MB  | 576MB  |
| invoice_items  |   72k   |       150 |  11MB   | 55MB   | 110MB  | 330MB  |
| audit_logs     |  100k   |       150 |  15MB   | 75MB   | 150MB  | 450MB  |
| TOTAL          |         |           | ~46MB   | ~229MB | ~458MB | ~1.4GB |

FREE-TIER ANALYSIS (engine: <Supabase Free>)
- Storage limit:  500 MB
- Hit at:         year ~9
- Reads/day:      [estimate based on traffic]
- Egress:         [estimate]

RECOMMENDED RETENTION STRATEGY
- year 1-4:  no action
- year 5:    cron archive audit_logs to S3/R2 monthly (drops ~15MB/yr from hot DB)
- year 7:    enforce legal retention — hard delete records older than <N> years
- year 10:   consider migration to paid tier <Supabase Pro $25/mo> if hot data growing

INDEXES TO ADD (preempt slow queries at scale)
- audit_logs(created_at DESC, user_id)
- invoices(client_id, created_at DESC)

ARCHIVE TARGETS (move to cold storage cheap)
- audit_logs older than 1 year → R2/S3 NDJSON, $0.015/GB/mo
- soft-deleted rows (deletedAt < 1yr ago) → same
```

## Rules

- Be conservative. Round bytes UP, scale UP.
- Never tell user they're safe forever. Always give a year-N hit point.
- If user's scale assumption seems unrealistic (10M users on free tier), say so.
- Retention strategy must respect legal requirements (ask if unsure).
