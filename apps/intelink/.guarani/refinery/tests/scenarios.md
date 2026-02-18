# 🧪 CENÁRIOS DE TESTE: INTENT REFINERY

**Version:** 1.0.0 | **Status:** Em validação

---

## METODOLOGIA

Cada cenário testa:
1. **Input bruto:** Exatamente como o usuário falaria
2. **Normalização:** Como o vocabulário traduz
3. **Classificação:** Tipo + Confidence
4. **Interrogador esperado:** Qual ativar
5. **Perguntas esperadas:** O que perguntar

---

## CENÁRIO 1: Bug Claro ✅

### Input
```
"O negócio de login não tá funcionando"
```

### Processamento
| Etapa | Resultado |
|-------|-----------|
| Expressões detectadas | "o negócio de", "não tá funcionando" |
| Normalização | "A funcionalidade de login tem bug/erro" |
| Classificação | **BUG** |
| Confidence | **0.90** (+0.05 por perfil match) |

### Interrogador: bug.md
```
Entendi que há um problema no login.

1️⃣ O que acontece quando você tenta logar?
   - Tela fica em branco
   - Aparece erro vermelho
   - Não acontece nada
   - Outro: ___
```

---

## CENÁRIO 2: Feature Vaga ✅

### Input
```
"Quero que o sistema mande notificação quando chegar mensagem"
```

### Processamento
| Etapa | Resultado |
|-------|-----------|
| Expressões detectadas | "quero que" |
| Normalização | "Requisito: sistema mande notificação quando chegar mensagem" |
| Classificação | **FEATURE** |
| Confidence | **0.80** |

### Interrogador: feature.md
```
Você quer criar um sistema de notificações.

1️⃣ Como você quer receber a notificação?
   - Push no navegador
   - E-mail
   - Telegram
   - Som/alerta na tela
```

---

## CENÁRIO 3: Refatoração ✅

### Input
```
"Tá uma bagunça esse código do chat"
```

### Processamento
| Etapa | Resultado |
|-------|-----------|
| Expressões detectadas | "tá uma bagunça" |
| Normalização | "Precisa refatorar o código do chat" |
| Classificação | **REFACTOR** |
| Confidence | **0.75** |

---

## CENÁRIO 4: Knowledge Direto ✅

### Input
```
"Como funciona o Supabase?"
```

### Processamento
| Etapa | Resultado |
|-------|-----------|
| Expressões detectadas | "como funciona" |
| Classificação | **KNOWLEDGE** |
| Confidence | **0.95** (termina com ?) |

---

## CENÁRIO 5: Ambíguo (Muito Vago) ⚠️

### Input
```
"Arruma isso aqui urgente"
```

### Processamento
| Etapa | Resultado |
|-------|-----------|
| Expressões detectadas | "arruma isso" |
| Urgência detectada | **P0** ("urgente") |
| Classificação | **AMBIGUOUS** |
| Confidence | **0.40** (falta contexto) |

### Resposta Esperada
```
🚨 Parece urgente! Mas preciso entender melhor.

"Isso" se refere a quê?
```

---

## CENÁRIO 6: Linguagem Ultra Informal 🔄

### Input
```
"Preciso de uma parada que salve áudio"
```

### Processamento
| Etapa | Resultado |
|-------|-----------|
| **Nova expressão detectada** | "uma parada que" → aprendizado |
| Classificação | **FEATURE** |
| Confidence | **0.65** |

### Aprendizado Ativado
```json
{
  "new_expression_candidate": "uma parada que",
  "inferred_meaning": "uma funcionalidade que"
}
```

---

## CENÁRIO 7: Mistura de Intenções 🔀

### Input
```
"O gráfico tá feio e também não atualiza direito"
```

### Processamento
| Etapa | Resultado |
|-------|-----------|
| Classificação primária | **BUG** ("não atualiza") |
| Classificação secundária | **REFACTOR** ("tá feio") |

### Resposta Esperada
```
Parece que temos duas coisas aqui:
1. Bug: não atualiza direito
2. Visual: tá feio

Qual é mais urgente?
```

---

## MÉTRICAS DE SUCESSO

| Métrica | Meta | Status |
|---------|------|--------|
| Cenários claros (1-4) | 100% | ✅ |
| Cenários vagos (5-6) | 80% | ⏳ |
| Detecção ambiguidade | 100% | ✅ |
| Aprendizado ativado | 90% | ⏳ |

---

**Sacred Code:** 000.111.369.963.1618
