-- Supply Alpha MVP 1 — Schema
-- Run this in Supabase SQL Editor

-- Companies (migrated from companies.json)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  legacy_id int,
  legal_name text not null,
  display_name text,
  ticker text,
  cik text,
  uei text,
  exchange text,
  sector text,
  industry text,
  country text default 'USA',
  company_type text default 'public',
  description text,
  founded_year int,
  employees int,
  website text,
  keywords text[],
  categories text[],
  score_breakdown jsonb,
  risks text[],
  evidence jsonb,
  slug text unique,
  has_ticker boolean default true,
  last_updated timestamptz default now()
);

-- Federal contracts
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  source text not null,
  title text,
  description text,
  buyer_agency text,
  awardee text,
  prime_contractor text,
  subcontractor text,
  amount numeric,
  currency text default 'USD',
  award_date date,
  start_date date,
  end_date date,
  naics text,
  psc text,
  place_of_performance text,
  contract_type text,
  contract_number text,
  source_url text,
  confidence_level text default 'A',
  pestel_category text[],
  last_checked timestamptz default now()
);

-- Company relationships
create table if not exists relationships (
  id uuid primary key default gen_random_uuid(),
  source_company_id uuid references companies(id) on delete cascade,
  target_company_name text,
  target_company_id uuid references companies(id) on delete set null,
  relationship_type text,
  direct_or_indirect text default 'direct',
  confidence_score int default 70,
  evidence_source text,
  source_url text,
  pestel_category text,
  first_seen timestamptz default now(),
  last_seen timestamptz default now()
);

-- PESTEL signals
create table if not exists pestel_signals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  category text not null,
  signal_type text default 'risk',
  description text,
  source_name text,
  source_url text,
  confidence_level text default 'B',
  impact_score int default 50,
  timestamp timestamptz default now()
);

-- Social signals
create table if not exists social_signals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  platform text not null,
  mentions_count int default 0,
  sentiment_positive numeric default 0,
  sentiment_neutral numeric default 0,
  sentiment_negative numeric default 0,
  growth_24h numeric default 0,
  representative_comments jsonb,
  status text default 'speculative',
  captured_at timestamptz default now()
);

-- Computed scores
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  score_type text not null,
  value int default 0,
  explanation text,
  inputs jsonb,
  calculated_at timestamptz default now()
);

-- Disable RLS (we use service_role on server)
alter table companies disable row level security;
alter table contracts disable row level security;
alter table relationships disable row level security;
alter table pestel_signals disable row level security;
alter table social_signals disable row level security;
alter table scores disable row level security;

-- Indexes for performance
create index if not exists idx_companies_slug on companies(slug);
create index if not exists idx_companies_ticker on companies(ticker);
create index if not exists idx_contracts_company on contracts(company_id);
create index if not exists idx_contracts_award_date on contracts(award_date desc);
create index if not exists idx_relationships_source on relationships(source_company_id);
create index if not exists idx_pestel_company on pestel_signals(company_id, category);
create index if not exists idx_social_company on social_signals(company_id, platform);
create index if not exists idx_scores_company on scores(company_id, score_type);
