# Padrões de Query Supabase no Intelink

**Data:** 12/12/2025  
**Status:** 📘 DOCUMENTAÇÃO OBRIGATÓRIA

Este documento explica um bug crítico que afetou o sistema e como evitá-lo no futuro.

---

## 🚨 O Problema

### Sintoma
Modais de entidades mostravam "0 conexões" mesmo quando existiam relacionamentos no banco.

### Causa Raiz
O **Supabase JS Client no browser** (usando `anon key`) não resolve corretamente JOINs via Foreign Key hints quando:
1. Há políticas RLS (Row Level Security) ativas
2. A query usa a sintaxe de JOIN do PostgREST

### Query Problemática (❌ NÃO USE)
```typescript
// ERRADO - FK JOINs no frontend
const { data: relationships } = await supabase
    .from('intelink_relationships')
    .select(`
        *,
        source:intelink_entities!intelink_relationships_source_id_fkey(*),
        target:intelink_entities!intelink_relationships_target_id_fkey(*)
    `)
    .or(`source_id.eq.${id},target_id.eq.${id}`);

// Resultado: source e target retornam NULL silenciosamente
```

### Query Correta (✅ USE SEMPRE)
```typescript
// CORRETO - Queries separadas
// 1. Buscar relacionamentos simples
const { data: relationships } = await supabase
    .from('intelink_relationships')
    .select('id, type, description, source_id, target_id')
    .or(`source_id.eq.${id},target_id.eq.${id}`);

// 2. Coletar IDs únicos
const relatedIds = new Set<string>();
relationships?.forEach(r => {
    if (r.source_id !== id) relatedIds.add(r.source_id);
    if (r.target_id !== id) relatedIds.add(r.target_id);
});

// 3. Buscar entidades em batch
const { data: relatedEntities } = await supabase
    .from('intelink_entities')
    .select('*')
    .in('id', Array.from(relatedIds));

// 4. Mapear para uso
const entityMap = new Map(relatedEntities?.map(e => [e.id, e]) || []);
```

---

## 🏗️ Padrão Recomendado: Usar API Routes

**MELHOR PRÁTICA:** Em vez de queries diretas no frontend, use API routes.

### Vantagens:
1. **Bypassa RLS:** API usa `getSupabaseAdmin()` com service_role key
2. **Centralizado:** Lógica de negócio em um lugar só
3. **Cache:** Pode usar cache de API
4. **Segurança:** Não expõe estrutura do banco no frontend

### Exemplo (PersonModal):
```typescript
// CORRETO - Usar API
const response = await fetch(`/api/entity/${person.id}/related`);
const apiData = await response.json();

// Em vez de query direta no componente
```

---

## 📋 Checklist para Novos Componentes

Antes de criar um componente que busca dados do Supabase:

- [ ] Existe uma API route para esse dado? Se não, crie uma.
- [ ] A query usa FK JOINs? Se sim, refatore para queries separadas.
- [ ] O componente lida com erros de API graciosamente?
- [ ] Há logging adequado para debug?

---

## 🔍 Como Identificar o Problema

### Sintomas:
- Modal mostra "0 conexões" ou dados vazios
- Console do browser não mostra erro
- Dados existem no banco (verificar via SQL)

### Debug:
```typescript
// Adicionar logging temporário
console.log('[Component] Fetching for ID:', id);
console.log('[Component] Relationships found:', relationships?.length);
console.log('[Component] Related entities:', entityMap.size);
```

---

## 📁 Arquivos Afetados e Corrigidos

| Arquivo | Status | Método |
|---------|--------|--------|
| `PersonModal.tsx` | ✅ Corrigido | Usa API |
| `VehicleModal.tsx` | ✅ Corrigido | Usa API |
| `LocationModal.tsx` | ⚠️ Parcial | Queries separadas |
| `OrganizationModal.tsx` | ⚠️ Parcial | Queries separadas |
| `/api/entity/[id]/related` | ✅ Corrigido | Queries separadas |
| `/api/history` | ❓ Verificar | Pode ter FK JOINs |

---

## 🧪 Testes Automatizados (TODO)

Para evitar regressões, criar testes E2E:

```typescript
// tests/e2e/entity-modal.spec.ts
test('PersonModal should show connections', async ({ page }) => {
    // Navegar para investigação com entidade conhecida
    await page.goto('/investigation/xxx');
    
    // Clicar na entidade
    await page.click('[data-entity-id="yyy"]');
    
    // Verificar se conexões aparecem
    await expect(page.locator('.connections-count')).not.toHaveText('0');
});
```

---

## 📞 Contato

Se encontrar um modal mostrando dados vazios:
1. Verificar console do browser
2. Verificar logs do servidor
3. Testar a API diretamente: `GET /api/entity/{id}/related`
4. Verificar se há dados no banco via SQL

---

*Documentação criada após bug crítico de 12/12/2025*
