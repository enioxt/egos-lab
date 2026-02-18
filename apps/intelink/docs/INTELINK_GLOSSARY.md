# 📖 Glossário Intelink - Padronização de Nomenclatura

**Versão:** 1.0  
**Data:** 13/12/2025  
**Status:** 📢 OBRIGATÓRIO

Este documento define a nomenclatura oficial do Intelink. **Todos os desenvolvedores, documentos e interfaces DEVEM usar estes termos.**

---

## 🎯 Regra de Ouro

> **UM conceito = UM termo. Sempre.**

---

## 📋 Termos Oficiais

### Investigação (não "Operação", "Caso", "Inquérito")

| ❌ Não Usar | ✅ Usar |
|-------------|---------|
| Operação | **Operação** (título) + **Investigação** (conceito) |
| Caso | Investigação |
| Inquérito | Investigação |
| IPL | Investigação |

**Explicação:**
- **Operação** é o NOME/TÍTULO dado pelo usuário (ex: "Operação Tsunami")
- **Investigação** é o CONCEITO do sistema (ex: "criar nova investigação")
- Na UI: "Operação Tsunami" (título) mas "Esta investigação tem 15 pessoas"

### Vínculo (não "Conexão", "Relacionamento", "Link")

| ❌ Não Usar | ✅ Usar |
|-------------|---------|
| Conexão | **Vínculo** |
| Relacionamento | **Vínculo** |
| Link | **Vínculo** |
| Relação | **Vínculo** |

**Explicação:**
- **Vínculo** é a relação DENTRO de uma mesma investigação
- Entre duas pessoas, pessoa e local, pessoa e veículo, etc.
- Tipos: CONHECE, MORA_EM, POSSUI, TRABALHA_COM, etc.

### Cross-Case (não "Conexão entre operações")

| ❌ Não Usar | ✅ Usar |
|-------------|---------|
| Conexão entre operações | **Cross-Case** |
| Vínculo entre investigações | **Cross-Case** |
| Match cross | **Cross-Case** |

**Explicação:**
- **Cross-Case** é quando a MESMA PESSOA/VEÍCULO aparece em investigações DIFERENTES
- É um alerta de inteligência, não um vínculo comum
- Detectado automaticamente por CPF, placa, nome idêntico

### Entidade (não "Envolvido", "Alvo", "Objeto")

| ❌ Não Usar | ✅ Usar |
|-------------|---------|
| Envolvido | **Entidade** (técnico) ou **Pessoa** (UI) |
| Alvo | **Entidade** |
| Objeto de investigação | **Entidade** |

**Tipos de Entidade:**
- PERSON → Pessoa
- VEHICLE → Veículo
- LOCATION → Local/Endereço
- ORGANIZATION → Organização (facção criminosa)
- COMPANY → Empresa (CNPJ)
- FIREARM → Arma de fogo
- PHONE → Telefone

### Evidência (não "Prova", "Documento")

| ❌ Não Usar | ✅ Usar |
|-------------|---------|
| Prova | **Evidência** |
| Material | **Evidência** |
| Documento (quando físico) | **Evidência** |

**Explicação:**
- **Evidência** = item físico ou digital apreendido/coletado
- **Documento** = arquivo digital (PDF, DOC) processado pelo sistema
- Drogas, armas, celulares são **Evidências**
- BO, RDO, Relatório são **Documentos**

---

## 🗺️ Mapa de Páginas e URLs

| Página | URL | Descrição |
|--------|-----|-----------|
| Dashboard | `/dashboard` | Visão geral |
| Lista de Operações | `/central/operacoes` | Todas as investigações |
| Detalhes da Operação | `/investigation/[id]` | Uma investigação |
| Grafo de Vínculos | `/graph/[id]` | Visualização de rede |
| Histórico | `/investigation/[id]/history` | Timeline de eventos |
| Relatórios | `/investigation/[id]/reports` | Documentos gerados |
| **Cross-Case** | `/central/vinculos` | Alertas cross-case |

---

## 💬 Exemplos de Uso Correto na UI

### Síntese da Investigação

```
❌ ERRADO:
"A Operação Tsunami envolve 15 pessoas interligadas por 36 conexões diretas."

✅ CORRETO:
"A Operação Tsunami envolve 15 pessoas interligadas por 36 vínculos diretos."
```

### Alertas

```
❌ ERRADO:
"Encontrada conexão entre operações: João Silva aparece em 2 casos."

✅ CORRETO:
"Cross-Case detectado: João Silva aparece em 2 investigações."
```

### Modal de Entidade

```
❌ ERRADO:
"0 conexões • 0 outras operações"

✅ CORRETO:
"0 vínculos • 0 cross-cases"
```

---

## 🔧 Constantes no Código

Arquivo: `lib/intelink/constants.ts`

```typescript
// Usar estes termos no código e UI
export const TERMINOLOGY = {
    // Singular
    investigation: 'investigação',
    operation: 'operação',      // Só para título
    entity: 'entidade',
    relationship: 'vínculo',    // NÃO 'conexão'
    crossCase: 'cross-case',
    evidence: 'evidência',
    document: 'documento',
    
    // Plural
    investigations: 'investigações',
    entities: 'entidades',
    relationships: 'vínculos',
    crossCases: 'cross-cases',
    evidences: 'evidências',
    documents: 'documentos',
};
```

---

## 📊 Tabela de Decisão: Vínculo vs Cross-Case

| Cenário | Termo |
|---------|-------|
| João conhece Maria (mesma investigação) | **Vínculo** |
| João mora em Rua X (mesma investigação) | **Vínculo** |
| João da Op. Tsunami = João da Op. Furacão | **Cross-Case** |
| Veículo ABC-1234 em 2 investigações | **Cross-Case** |
| Empresa X fornece para Empresa Y | **Vínculo** |

---

## ✅ Checklist de Conformidade

Antes de fazer merge de código:

- [ ] UI usa "vínculos" em vez de "conexões"?
- [ ] Alertas de cross-case estão identificados como "Cross-Case"?
- [ ] Títulos de operação usam "Operação X" mas conceito usa "investigação"?
- [ ] Console.log usa termos técnicos em inglês (relationship, entity)?
- [ ] Mensagens para usuário usam termos em português padronizado?

---

*Este glossário deve ser atualizado sempre que novos termos forem introduzidos.*
