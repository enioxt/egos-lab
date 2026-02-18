# 📊 Referência de Tipos de Entidade — Intelink

**Última Atualização:** 2025-12-12  
**Fonte:** Análise do banco de dados `intelink_entities`  
**Localização:** `.guarani/ENTITY_TYPES_REFERENCE.md` (SSOT)

---

## 🎯 Tipos de Entidade

O Intelink trabalha com 6 tipos principais de entidade, cada um com seu próprio modal padronizado.

---

## 👤 PERSON (Pessoa)

> **Total no banco:** 269 entidades

### Campos de Metadados (Hierarquia de Identificação)

| Campo | Descrição | Prioridade | Frequência |
|-------|-----------|------------|------------|
| `cpf` | CPF (critério de certeza) | 🥇 Máxima | 87% |
| `rg` | RG (com `uf` se disponível) | 🥈 Alta | 85% |
| `mae` / `nome_mae` / `filiacao_mae` | Nome da mãe | 🥉 Alta | 86% |
| `data_nascimento` / `nascimento` / `dn` | Data de nascimento | ⭐ Média | 82% |
| `pai` / `filiacao_pai` | Nome do pai | ⭐ Média | 85% |
| `telefone` / `phone` | Telefone de contato | ⭐ Média | 83% |
| `endereco` / `address` | Endereço completo | ⭐ Média | 87% |
| `bairro` | Bairro | ⭐ Média | 81% |
| `cidade` / `city` | Cidade | ⭐ Média | 81% |
| `profissao` / `profession` / `ocupacao` | Profissão | 📌 Baixa | 79% |
| `vulgo` / `alcunha` | Apelido/Vulgo | 📌 Baixa | 3% |
| `idade` | Idade (calculada) | 📌 Baixa | 5% |
| `antecedentes` | Histórico criminal | 📌 Baixa | <1% |
| `tatuagem` | Descrição de tatuagens | 📌 Baixa | <1% |

### Roles Possíveis
- `suspeito` / `suspect` / `investigado` → 🔴 Vermelho
- `vitima` / `victim` → 🟠 Âmbar
- `testemunha` / `witness` → 🔵 Azul
- `lider` → 🟣 Roxo
- `informante` → 🟢 Verde

---

## 🚗 VEHICLE (Veículo)

> **Total no banco:** 80 entidades

### Campos de Metadados

| Campo | Descrição | Frequência |
|-------|-----------|------------|
| `placa` / `plate` | Placa do veículo | 100% |
| `cor` / `color` | Cor | 99% |
| `chassi` | Número do chassi | 95% |
| `ano` / `year` | Ano de fabricação | 94% |
| `modelo` / `model` | Modelo | 9% |
| `marca` / `brand` | Marca | 6% |
| `renavam` | RENAVAM | 8% |
| `proprietario` / `owner` | Proprietário | 5% |

### Cor do Ícone
- 🩷 Rosa (`text-pink-400`, `bg-pink-500/20`)

---

## 📍 LOCATION (Local)

> **Total no banco:** 75 entidades

### Campos de Metadados

| Campo | Descrição | Frequência |
|-------|-----------|------------|
| `bairro` | Bairro | 76% |
| `cidade` / `city` | Cidade | 71% |
| `cep` | CEP | 67% |
| `coordenadas` | Lat/Long | 67% |
| `endereco` / `address` | Endereço | 7% |
| `tipo` / `type` | Tipo do local | 9% |
| `latitude` / `longitude` | Coordenadas separadas | 4% |
| `uf` / `municipio` | UF/Município | <2% |

### Cor do Ícone
- 🟢 Esmeralda (`text-emerald-400`, `bg-emerald-500/20`)

---

## 🔫 FIREARM (Arma de Fogo)

> **Total no banco:** 44 entidades

### Campos de Metadados

| Campo | Descrição | Frequência |
|-------|-----------|------------|
| `marca` / `brand` | Marca da arma | 100% |
| `calibre` / `caliber` | Calibre | 100% |
| `numero_serie` / `serial_number` | Número de série | 100% |
| `situacao` / `status` | Situação (legal/ilegal) | 95% |
| `modelo` / `model` | Modelo | 9% |
| `weapon_type` | Tipo (pistola/revólver/etc) | 9% |

### Cor do Ícone
- 🔴 Rosa escuro (`text-rose-400`, `bg-rose-500/20`)

---

## 🏢 ORGANIZATION (Organização Criminosa)

> **Total no banco:** 10 entidades  
> ⚠️ **ATENÇÃO:** Organizações criminosas (PCC, CV, milícias), NÃO empresas!

### Campos de Metadados

| Campo | Descrição | Frequência |
|-------|-----------|------------|
| `cnpj` | CNPJ (se fachada) | 100% |
| `endereco` | Endereço da sede | 100% |
| `cidade` | Cidade de atuação | 100% |
| `socios` | Membros/sócios | 40% |
| `tipo` | Tipo (facção/milícia/quadrilha) | 20% |
| `area_atuacao` | Área de atuação | 20% |
| `atividades` | Atividades criminosas | 20% |
| `membros_estimados` | Número estimado de membros | 20% |
| `lider_conhecido` | Líder identificado | 10% |

### Cor do Ícone
- 🔴 Vermelho (`text-red-400`, `bg-red-500/20`)

---

## 🏪 COMPANY (Empresa)

> **Total no banco:** 2 entidades  
> ⚠️ **ATENÇÃO:** Empresas legais com CNPJ, NÃO facções criminosas!

### Campos de Metadados

| Campo | Descrição | Frequência |
|-------|-----------|------------|
| `cnpj` | CNPJ da empresa | 100% |
| `endereco` / `address` | Endereço comercial | 50% |
| `telefone` | Telefone | 50% |
| `cidade` | Cidade | 50% |
| `owner` | Proprietário/Sócio | 50% |

### Cor do Ícone
- 🟠 Âmbar (`text-amber-400`, `bg-amber-500/20`)

---

## 🎨 Cores Padronizadas (Design System)

```typescript
const ENTITY_COLORS = {
    PERSON:       { icon: 'text-blue-400',    bg: 'bg-blue-500/20',    border: 'border-blue-500/30' },
    VEHICLE:      { icon: 'text-pink-400',    bg: 'bg-pink-500/20',    border: 'border-pink-500/30' },
    LOCATION:     { icon: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    FIREARM:      { icon: 'text-rose-400',    bg: 'bg-rose-500/20',    border: 'border-rose-500/30' },
    ORGANIZATION: { icon: 'text-red-400',     bg: 'bg-red-500/20',     border: 'border-red-500/30' },
    COMPANY:      { icon: 'text-amber-400',   bg: 'bg-amber-500/20',   border: 'border-amber-500/30' },
};
```

---

## 📁 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `components/shared/EntityDetailModal.tsx` | Modal padronizado para todas entidades |
| `components/shared/GlobalSearch.tsx` | Busca global com identificação hierárquica |
| `lib/intelink/constants.ts` | Constantes SSOT (ENTITY_TYPES, etc) |
| `app/api/search/route.ts` | API de busca com metadados |

---

## 🔄 Como Atualizar

1. Rode a query no Supabase para ver novos campos:
```sql
SELECT type, jsonb_object_keys(metadata) as key, COUNT(*) 
FROM intelink_entities 
WHERE metadata IS NOT NULL 
GROUP BY type, key 
ORDER BY type, count DESC;
```

2. Atualize este arquivo
3. Atualize o `EntityDetailModal.tsx` se necessário
4. Commit com `docs: update entity types reference`

---

*"Entidades são ALVOS DE INVESTIGAÇÃO, não metadados."*
