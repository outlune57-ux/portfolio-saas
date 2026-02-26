-- ═══════════════════════════════════════════════════════════
-- Execute este SQL no Supabase SQL Editor do projeto
-- portfolio-saas (reqktwtooeasyyqj)
-- ═══════════════════════════════════════════════════════════

-- 1. Cria a tabela
create table portfolios (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text,
  tagline    text,
  accent     text default '#c9a96e',
  email      text,
  phone      text,
  instagram  text,
  spreads    jsonb not null default '[]',
  created_at timestamptz default now()
);

-- 2. Ativa segurança por linha (RLS)
alter table portfolios enable row level security;

-- 3. Permite leitura pública (qualquer um pode ver os portfólios)
create policy "Public read"
  on portfolios for select
  using (true);

-- 4. Insere um portfolio de exemplo para testar
-- Acesse: seusite.com/cliente/ana-silva
insert into portfolios (slug, name, tagline, email, phone, instagram, spreads)
values (
  'ana-silva',
  'Ana Silva',
  'Fotografia de Retratos',
  'ana@exemplo.com',
  '+55 (11) 9 9999-9999',
  'anasilva.foto',
  '[
    {
      "left": {
        "type": "cover",
        "title": "Retratos & Essência",
        "subtitle": "Photography Portfolio",
        "eyebrow": "Coleção Exclusiva"
      },
      "right": {
        "type": "photo",
        "image": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80",
        "label": "Abertura",
        "title": "A luz que revela",
        "subtitle": "a alma das coisas"
      }
    },
    {
      "left": {
        "type": "photo",
        "image": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80",
        "label": "01 · Retrato",
        "title": "Sofia",
        "subtitle": "A Contemplação",
        "meta": "Estúdio Privado · 85mm f/1.4"
      },
      "right": {
        "type": "text",
        "label": "01 · Retrato",
        "title": "Sofia",
        "titleItalic": "A Contemplação",
        "body": "Uma sessão que capturou a serenidade em sua forma mais pura. A luz lateral suave revelou as nuances de cada expressão.",
        "grid": [
          {"label": "Localização", "value": "Estúdio Privado"},
          {"label": "Iluminação",  "value": "Natural + Soft Box"},
          {"label": "Câmera",      "value": "Sony A7R IV"},
          {"label": "Lente",       "value": "85mm f/1.4"}
        ]
      }
    },
    {
      "left": {
        "type": "quote",
        "quote": "A fotografia é a arte de capturar o invisível.",
        "sub": "Fim do catálogo"
      },
      "right": {
        "type": "backcover"
      }
    }
  ]'
);
