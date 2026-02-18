# Hierarquia de Critérios de Matching - Intelink

**Versão:** 2.0.0  
**Data:** 2025-12-10  
**Status:** RFC (Request for Comments)

---

## 📋 Contexto do Problema

O sistema precisa identificar quando uma entidade (pessoa, veículo, telefone) cadastrada em uma operação policial já existe em outra operação. Isso permite:

1. **Cross-Case Intelligence**: Descobrir conexões entre investigações diferentes
2. **Deduplicação**: Evitar cadastros duplicados
3. **Qualidade de Dados**: Detectar erros de digitação

### Problema Identificado (2025-12-10)

O sistema estava gerando **falsos positivos**:
- "Fernanda Rodrigues" (CPF 525.xxx) vs "Fernanda Rodrigues" (CPF 269.xxx)
- Match de 90% por "mesmo nome e filiação"
- **ERRO**: São pessoas diferentes (CPFs diferentes)

**Causa Raiz**: A hierarquia de critérios não estava clara. O sistema dava peso para "nome + filiação" sem verificar se os CPFs conflitavam.

---

## 🎯 Princípio Fundamental

> **CPF é identificador único nacional.**
> 
> Se duas entidades têm CPFs **diferentes**, são **pessoas diferentes** - independente de qualquer outro critério.
> 
> Nome igual + CPF diferente = **HOMÔNIMOS**, não duplicata.

---

## 📊 Hierarquia de Critérios (Ordem de Precedência)

### Nível 1: Identificadores Únicos Nacionais (100%)
**DEFINITIVOS - Não podem ser contestados por outros critérios**

| Tipo | Critério | Confiança | Condição |
|------|----------|-----------|----------|
| PESSOA | **CPF** | 100% | Números iguais (11 dígitos) |
| PESSOA | **RG + UF** | 100% | Número + Estado iguais |
| EMPRESA | **CNPJ** | 100% | Números iguais (14 dígitos) |
| VEÍCULO | **Chassi** | 100% | 17 caracteres iguais (VIN) |
| VEÍCULO | **RENAVAM** | 100% | Números iguais |

> ⚠️ **PLACA NÃO É 100%!** Placas podem ser **clonadas**. 
> O chassi é o identificador único do veículo (equivalente ao CPF para pessoas).

**Regras de Ouro:**
```text
PESSOA:  SE CPF_A != CPF_B → Pessoas diferentes → NENHUM match
EMPRESA: SE CNPJ_A != CNPJ_B → Empresas diferentes → NENHUM match
VEÍCULO: SE Chassi_A != Chassi_B → Veículos diferentes → NENHUM match
         (Placa igual com chassi diferente = CLONAGEM DETECTADA!)
```

### Nível 1.5: Identificadores de Veículo (95%)
**Alta confiança, mas não definitivos**

| Critério | Confiança | Condição | Observação |
|----------|-----------|----------|------------|
| **Placa** | 95% | Letras e números iguais | ⚠️ Pode ser clonada |
| **Placa + Modelo** | 97% | Placa + mesmo modelo | Reduz risco de clone |
| **Placa + Cor** | 96% | Placa + mesma cor | Reduz risco de clone |

### Nível 2: Identificadores Compostos (90-95%)
**Requerem múltiplos campos iguais**

| Critério | Confiança | Condição |
|----------|-----------|----------|
| Nome + Data Nascimento | 95% | Nome exato + data igual |
| Nome + Mãe | 90% | Nome exato + nome da mãe igual |
| Nome + Pai | 90% | Nome exato + nome do pai igual |
| Nome + Mãe + Pai | 95% | Nome + ambos genitores |

**IMPORTANTE**: Estes critérios SÓ são válidos se:
- Ambas entidades **NÃO** têm CPF, OU
- Ambas têm o **MESMO** CPF

### Nível 3: Identificadores de Contato (85%)
**Podem indicar mesma pessoa ou mesma residência**

| Critério | Confiança | Condição |
|----------|-----------|----------|
| Telefone | 85% | Números iguais (10-11 dígitos) |
| Email | 85% | Email exato |

### Nível 4: Identificadores de Localização (70-80%)
**Podem indicar proximidade, não identidade**

| Critério | Confiança | Condição |
|----------|-----------|----------|
| Endereço Exato | 85% | Rua + número + cidade iguais |
| Endereço Próximo | 75% | Mesma rua, números ±50 |
| Mesma Rua | 70% | Mesma rua, números distantes |

### Nível 5: Similaridade de Nome (65-75%)
**APENAS se não há conflito de CPF**

| Critério | Confiança | Condição |
|----------|-----------|----------|
| Nome Exato | 75% | Jaro-Winkler = 1.0 + evidência |
| Nome Similar | 70% | Jaro-Winkler > 0.92 + evidência |
| Nome Parcial | 65% | Primeiro + último nome + cidade/rua |

**"Evidência"** = pelo menos 1 de: mesmo endereço, mesmo telefone, mesma profissão, mesma cidade

### Nível 6: Indicadores Fracos (60%)
**Apenas para investigação manual**

| Critério | Confiança | Condição |
|----------|-----------|----------|
| Alcunha | 60% | Apelido idêntico |
| Profissão + Cidade | 60% | Mesma ocupação + cidade |

---

## 🚫 Regras de Invalidação

### Match por Nome é INVÁLIDO se:

1. **CPFs diferentes**
   ```
   CPF_A = "111.222.333-44"
   CPF_B = "555.666.777-88"
   → INVÁLIDO (pessoas diferentes)
   ```

2. **Nome comum + sobrenomes diferentes**
   ```
   "Maria Silva" vs "Maria Santos"
   → INVÁLIDO (Maria é muito comum)
   ```

3. **Sem evidências adicionais**
   ```
   "João Pereira" vs "João Pereira"
   Sem CPF, sem telefone, sem endereço
   → INVÁLIDO (precisamos de mais dados)
   ```

### Match por Filiação é INVÁLIDO se:

1. **CPFs diferentes**
   ```
   Pessoa A: CPF 111.xxx, Mãe: Patricia
   Pessoa B: CPF 222.xxx, Mãe: Patricia
   → INVÁLIDO (mães podem ter filhos com nomes iguais)
   ```

2. **Apenas um genitor igual**
   ```
   Pessoa A: Pai: Francisco, Mãe: Patricia
   Pessoa B: Pai: Francisca, Mãe: Juliana
   → INVÁLIDO (pais totalmente diferentes)
   ```

---

## 🔧 Implementação Atual

### Arquivos Relevantes

| Arquivo | Função |
|---------|--------|
| `lib/intelink/cross-reference-service.ts` | Algoritmo principal de matching |
| `lib/entity-resolution/matcher.ts` | Funções de similaridade |
| `app/api/documents/save/route.ts` | Detecção de duplicatas na extração |
| `supabase/migrations/20251210_*.sql` | Trigger de cross-case no banco |

### Código do Trigger SQL (Atual)

```sql
-- Match por CPF (100% confiança) - SEMPRE criar alerta
-- Match por Nome + Filiação (90%) - APENAS se CPFs não conflitam
-- Match por Nome APENAS (70%) - APENAS se AMBOS sem CPF
```

---

## 📈 Métricas de Qualidade

### KPIs de Matching

| Métrica | Meta | Atual |
|---------|------|-------|
| Falsos Positivos | < 5% | ~15% (antes do fix) |
| Falsos Negativos | < 10% | ~5% |
| Precisão (CPF) | 100% | 100% |
| Recall (Nome) | > 80% | ~70% |

### Alertas a Monitorar

1. **CPF com nomes diferentes**: Erro crítico de cadastro
2. **Mesmo nome sem evidências**: Possível homônimo
3. **Filiação parcial**: Verificar manualmente

---

## 🔮 Melhorias Futuras (Roadmap)

### P0 - Crítico
- [x] ~~Corrigir falso positivo de CPF diferente~~
- [ ] Adicionar validação de dígito verificador CPF
- [ ] Detectar CPFs sabidamente inválidos (000.000.000-00, etc)

### P1 - Importante
- [ ] Machine Learning para threshold dinâmico
- [ ] Integração com bases externas (INFOSEG)
- [ ] Feedback loop: aprender com confirmações/rejeições

### P2 - Desejável
- [ ] Match fonético (Soundex/Metaphone brasileiro)
- [ ] Detecção de typosquatting em nomes
- [ ] Normalização automática de endereços (CEP → Rua)

---

## 📚 Referências

1. **BoostER Paper**: Optimal question selection for entity resolution
2. **Jaro-Winkler**: Algoritmo de similaridade de strings
3. **Receita Federal**: Regras de CPF válido

---

## 📝 Changelog

| Data | Versão | Mudança |
|------|--------|---------|
| 2025-12-10 | 2.0.0 | Correção crítica: CPF diferente invalida match por nome |
| 2025-12-03 | 1.0.0 | Versão inicial com hierarquia básica |

---

*Documento mantido por: Equipe Intelink*
*Última revisão: 2025-12-10*
