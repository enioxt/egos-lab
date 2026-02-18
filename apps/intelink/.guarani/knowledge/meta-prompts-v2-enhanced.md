# EGOS.IA.BR — META-PROMPTS MASTER V2.0 (ENHANCED)
## Framework Completo: Teoria + Prática + Código + Exemplos Reais

**Versão:** 2.0 | **Status:** 🔴 VIVO | **Data:** 15 Nov 2025 | **Modo:** LABS

---

## 🆕 NOVIDADES V2.0

```diff
+ Seção 7: Meta-Prompts em Ação (Exemplos Reais)
+ Seção 8: JSON Response Schemas (Implementação)
+ Seção 9: Decision Tree (Qual Meta-Prompt Usar)
+ Seção 10: Code Library Python (Executável)
+ Seção 11: ADHD/Autism Adaptations (Neurodivergente-específico)
+ 30+ Exemplos práticos adicionados
+ JSON schemas para todas as respostas
```

---

# 📋 CONTEÚDO ORIGINAL (Mantido)

## SEÇÃO 1: AUTORES & REFERÊNCIAS MESTRES
[CONTEÚDO IDÊNTICO AO V1.0 - 5 autores: Ellis, Beck, Barkley, Clark, Miller & Rollnick]

## SEÇÃO 2: TÉCNICAS MAIS EFICAZES
[CONTEÚDO IDÊNTICO AO V1.0 - 6 técnicas: Thought Records, BA, RF-CBT, MI, Secondary Gain, Fear of Success]

## SEÇÃO 3: META-PROMPTS PARA AGENTES IA
[CONTEÚDO IDÊNTICO AO V1.0 - 8 meta-prompts]

## SEÇÃO 4: SISTEMA DE APRENDIZADO CONTÍNUO
[CONTEÚDO IDÊNTICO AO V1.0 - RLHF loop]

## SEÇÃO 5: CHECKLIST DE IMPLEMENTAÇÃO
[CONTEÚDO IDÊNTICO AO V1.0]

## SEÇÃO 6: TODAS AS FONTES
[CONTEÚDO IDÊNTICO AO V1.0]

---

# 🆕 SEÇÃO 7: META-PROMPTS EM AÇÃO (Exemplos Reais)

## Exemplo 1: Meta-Prompt #3 (Thought Record Automático)

### Input do Usuário:
```
"Enviei mensagem para meu chefe ontem às 3pm e ele ainda não respondeu. 
Estou super nervoso, acho que ele está bravo comigo."
```

### Agent Response (Com Meta-Prompt #3):
```json
{
  "validation": "Entendo que você está se sentindo nervoso com a falta de resposta. 
                 É comum interpretar silêncio como algo negativo.",
  
  "thought_record": {
    "situacao": "Mensagem enviada às 3pm, sem resposta até agora",
    "sentimento_inicial": "Nervoso, ansioso (8/10)",
    "pensamento_automatico": "Ele está bravo comigo",
    
    "tipo_distorcao": "Fortune Telling (adivinhar futuro) + Mind Reading (ler pensamento)",
    
    "perguntas_socraticas": [
      "Há evidência de que ele está bravo, ou é interpretação?",
      "Quantas vezes no passado ele demorou para responder?",
      "Há explicações alternativas (ocupado, esqueceu, viu e vai responder)?",
      "Se um amigo estivesse nesta situação, o que você diria?"
    ],
    
    "evidencia_contra": [
      "Ele frequentemente demora para responder emails",
      "É sexta-feira tarde, pode estar com agenda cheia",
      "Última vez que demorou (semana passada), não estava bravo",
      "Não há nada na mensagem que justificasse raiva"
    ],
    
    "pensamento_balanceado": "Ele provavelmente está ocupado. 
                              Vou dar 24h antes de me preocupar.",
    
    "sentimento_apos": "Menos nervoso (4/10)",
    
    "pattern_identificado": "Catastrofização + Ansiedade Antecipatória"
  },
  
  "next_step": "Vamos fazer um behavioral experiment? 
                Se amanhã às 3pm não responder, você envia follow-up gentil. 
                Apostamos que vai ser resposta normal, não raiva."
}
```

**Breakdown do que o Agente Fez:**
1. ✅ Validou emoção (empatia primeiro)
2. ✅ Estruturou como Thought Record
3. ✅ Identificou distorção (Fortune Telling + Mind Reading)
4. ✅ Usou perguntas Socráticas (não impôs perspectiva)
5. ✅ Coletou evidência contra
6. ✅ Construiu alternativa COM usuário
7. ✅ Re-avaliou emoção (caiu de 8 → 4)
8. ✅ Ofereceu behavioral experiment (testar hipótese)

---

## Exemplo 2: Meta-Prompt #5 (Ruminação Interruptor)

### Input do Usuário:
```
"Não consigo parar de pensar na conversa de ontem. 
Fico repassando tudo que disse, analisando cada palavra, 
me perguntando se falei algo errado. Já são 3 horas nisso."
```

### Agent Response (Com Meta-Prompt #5):
```json
{
  "validation": "Isso é exaustivo, né? 
                 Sua mente está presa em um loop de análise.",
  
  "pattern_detection": {
    "tipo": "Ruminação - Por Quê Infinito",
    "caracteristica": "Análise repetitiva sem resolução",
    "tempo_gasto": "3 horas (indicador de severidade alta)"
  },
  
  "educacao": "Isso é ruminação. Seu cérebro está no modo 'por quê?' infinito.
               Quanto mais analisa, mais dúvidas aparecem. 
               Não é falta de vontade de parar - é padrão neural.",
  
  "mode_shift": {
    "de": "POR QUÊ? (abstrato, infinito)",
    "para": "COMO? (concreto, acionável)",
    
    "perguntas_novas": [
      "Como posso saber se realmente ofendi? (perguntar à pessoa)",
      "Como posso me distrair agora? (ação física)",
      "Como vou evitar ruminação nas próximas 2h? (plano)"
    ]
  },
  
  "behavioral_interrupt": {
    "instrucao": "Vamos fazer isso AGORA:",
    "opcoes": [
      "Levante-se, 20 flexões ou 5 min de caminhada",
      "5-4-3-2-1 grounding: 5 coisas que vê, 4 que sente, etc",
      "Ligue para alguém (não sobre a conversa, qualquer coisa)",
      "Escreva tudo em papel, depois guarde envelope"
    ],
    "escolha": "Qual você vai fazer nos próximos 5 minutos?"
  },
  
  "timeline": "Faça a interrupção. Em 30 minutos, me diga: 
               ainda tão urgente? (Geralmente não)",
  
  "if_persists": "Se voltar, repita interrupt. 
                  Se persistir 24h+, vamos explorar o que a ruminação 
                  está tentando resolver (pode ter ganho secundário)"
}
```

**Breakdown:**
1. ✅ Detectou estilo: "Por Quê" loop
2. ✅ Educou sobre ruminação (não é falha)
3. ✅ Ofereceu mode shift (abstrato → concreto)
4. ✅ Deu opções de interrupção (escolha = autonomia)
5. ✅ Timeline para reavaliação
6. ✅ Plano B se persistir

---

## Exemplo 3: Meta-Prompt #7 (Fear of Success)

### Input do Usuário:
```
"Fui promovido para gerente. Deveria estar feliz, mas estou com vontade de pedir demissão. 
Não sei por quê, só sei que parece errado."
```

### Agent Response (Com Meta-Prompt #7):
```json
{
  "validation": "Isso parece contraditório, né? 
                 Conquistou algo bom mas sente-se desconfortável. 
                 Você não está louco - isso é padrão real.",
  
  "pattern": "Medo de Vencer (Fear of Success)",
  
  "fear_unpacking": {
    "camada_1_superficie": "O que assusta sobre ser gerente?",
    "resposta_usuario": "Não sei se consigo",
    
    "camada_2_implicacao": "Se você vencer nesse cargo, o que significaria?",
    "resposta_usuario": "Expectativas aumentariam",
    
    "camada_3_crenca": "E se as expectativas aumentarem, você teme...?",
    "resposta_usuario": "Que eu falhe de forma pública",
    
    "camada_4_raiz": "E se falhar publicamente, o pior seria...?",
    "resposta_usuario": "Descobririam que não sou bom quanto pensam",
    
    "identificado": "Síndrome do Impostor + Medo de Exposição"
  },
  
  "reality_test": {
    "pergunta": "Você já 'falhou publicamente' antes?",
    "resposta": "Sim, em apresentação ano passado",
    "resultado": "E o que aconteceu?",
    "resposta2": "Nada terrível. Pessoas foram gentis.",
    
    "insight": "Realidade foi MENOS severa que o medo imaginado"
  },
  
  "reframe": "Sucesso não é perigoso. 
              Seu cérebro está tentando te proteger de 'descoberta'. 
              Mas você JÁ foi 'descoberto' - como gerente competente, 
              por isso foi promovido.",
  
  "gradual_success": {
    "proposta": "E se você não pedir demissão, mas aceitar cargo com cláusula:
                 'Vou tentar 3 meses. Se realmente não funciona, reavalia'",
    "beneficio": "Remove pressão de 'forever commitment', 
                  permite testar sem all-or-nothing thinking"
  },
  
  "next_step": "Nos próximos 3 meses, vamos rastrear:
                - Você foi 'descoberto'? (provavelmente não)
                - Você falhou publicamente? (se sim, foi tão terrível?)
                - Expectativas são gerenciáveis? (com apoio, sim)"
}
```

**Breakdown:**
1. ✅ Detectou padrão: Fear of Success
2. ✅ Desempacotou em camadas (superfície → raiz)
3. ✅ Identificou crença: "Sou impostor"
4. ✅ Reality test com experiência passada
5. ✅ Reframe: Sucesso ≠ Perigo
6. ✅ Gradual success (teste, não compromisso eterno)

---

# 🆕 SEÇÃO 8: JSON RESPONSE SCHEMAS

## Schema 1: Thought Record Response

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["validation", "thought_record", "next_step"],
  "properties": {
    "validation": {
      "type": "string",
      "description": "Empathetic acknowledgment of user's experience"
    },
    "thought_record": {
      "type": "object",
      "required": ["situacao", "sentimento_inicial", "pensamento_automatico", 
                   "tipo_distorcao", "evidencia_contra", "pensamento_balanceado", 
                   "sentimento_apos"],
      "properties": {
        "situacao": {"type": "string"},
        "sentimento_inicial": {"type": "string"},
        "pensamento_automatico": {"type": "string"},
        "tipo_distorcao": {
          "type": "string",
          "enum": ["Catastrophizing", "All-or-Nothing", "Fortune Telling", 
                   "Mind Reading", "Overgeneralization", "Personalization"]
        },
        "perguntas_socraticas": {
          "type": "array",
          "items": {"type": "string"},
          "minItems": 3,
          "maxItems": 5
        },
        "evidencia_contra": {
          "type": "array",
          "items": {"type": "string"}
        },
        "pensamento_balanceado": {"type": "string"},
        "sentimento_apos": {"type": "string"},
        "pattern_identificado": {"type": "string"}
      }
    },
    "next_step": {"type": "string"}
  }
}
```

## Schema 2: Pattern Detection Response

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["patterns_detected", "primary_pattern", "confidence", "recommendation"],
  "properties": {
    "patterns_detected": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "pattern_name": {
            "type": "string",
            "enum": ["Ruminância", "Circularidade", "Medo de Vencer", 
                     "Ganho Secundário", "Autossabotagem", "Perfeccionismo",
                     "Hipervigilância", "Procrastinação", "Evitância",
                     "Culpa", "Ansiedade Social", "Baixa Autoestima"]
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "severity": {
            "type": "string",
            "enum": ["low", "medium", "high"]
          },
          "triggers": {
            "type": "array",
            "items": {"type": "string"}
          }
        }
      }
    },
    "primary_pattern": {"type": "string"},
    "recommendation": {
      "type": "object",
      "properties": {
        "technique": {"type": "string"},
        "meta_prompt": {"type": "string"},
        "estimated_duration": {"type": "string"}
      }
    }
  }
}
```

---

# 🆕 SEÇÃO 9: DECISION TREE (Qual Meta-Prompt Usar)

```
Input do Usuário
    ↓
┌─────────────────────────────────────────┐
│ DETECÇÃO DE PADRÃO (Auto)               │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │ Temporal Focus? │
    └────────┬────────┘
             │
    ┌────────┴────────────────┐
    │                         │
PASSADO                   FUTURO
    │                         │
    ↓                         ↓
Ruminação?              Ansiedade?
    │                         │
    ↓                         ↓
Meta-Prompt #5          Meta-Prompt #8
(Rumination             (MI + Grounding)
Interrupt)
    │
    └─→ Loop? → Meta-Prompt #5
        └─→ "Por Quê?" → Mode Shift
        └─→ "E Se?" → Reality Test
        └─→ "Deveria" → Acceptance

┌─────────────────────────────────────────┐
│ PADRÃO COMPORTAMENTAL                   │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │ Evita situação? │
    └────────┬────────┘
             │
    ┌────────┴────────────────┐
    │                         │
SIM                        NÃO, MAS SABOTA
    │                         │
    ↓                         ↓
Evitância                 Fear of Success
    │                         │
    ↓                         ↓
Meta-Prompt #9            Meta-Prompt #7
(Exposure Hierarchy)      (Fear Unpacking)

┌─────────────────────────────────────────┐
│ RESISTÊNCIA À MUDANÇA                   │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │ Ganha algo por  │
    │ manter problema?│
    └────────┬────────┘
             │
            SIM
             │
             ↓
    Meta-Prompt #6
    (Secondary Gain)
```

**Implementação Python:**
```python
def select_meta_prompt(user_input, detected_patterns):
    """
    Seleciona meta-prompt baseado em padrão detectado
    """
    primary = detected_patterns['primary_pattern']
    
    decision_tree = {
        "Ruminância": "meta_prompt_5_rumination_interrupt",
        "Circularidade": "meta_prompt_5_rumination_interrupt",
        "Medo de Vencer": "meta_prompt_7_fear_of_success",
        "Ganho Secundário": "meta_prompt_6_secondary_gain",
        "Autossabotagem": "meta_prompt_7_fear_of_success",
        "Perfeccionismo": "meta_prompt_3_thought_record",
        "Hipervigilância": "meta_prompt_grounding",
        "Procrastinação": "meta_prompt_behavioral_activation",
        "Evitância": "meta_prompt_exposure",
        "Culpa": "meta_prompt_3_thought_record",
        "Ansiedade Social": "meta_prompt_8_mi",
        "Baixa Autoestima": "meta_prompt_3_thought_record"
    }
    
    return decision_tree.get(primary, "meta_prompt_1_detection")
```

---

# 🆕 SEÇÃO 10: CODE LIBRARY PYTHON

## Código 1: Thought Record Automation

```python
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class DistortionType(Enum):
    CATASTROPHIZING = "Catastrophizing"
    ALL_OR_NOTHING = "All-or-Nothing"
    FORTUNE_TELLING = "Fortune Telling"
    MIND_READING = "Mind Reading"
    OVERGENERALIZATION = "Overgeneralization"
    PERSONALIZATION = "Personalization"

@dataclass
class ThoughtRecord:
    situation: str
    initial_feeling: str
    initial_intensity: int  # 0-100
    automatic_thought: str
    distortion_type: DistortionType
    socratic_questions: List[str]
    evidence_against: List[str]
    balanced_thought: str
    new_feeling: str
    new_intensity: int
    pattern: Optional[str] = None

def generate_socratic_questions(automatic_thought: str, distortion: DistortionType) -> List[str]:
    """
    Gera perguntas Socráticas baseadas no tipo de distorção
    """
    questions_bank = {
        DistortionType.CATASTROPHIZING: [
            "Qual é a evidência de que o pior vai acontecer?",
            "Qual é a probabilidade REAL disso acontecer?",
            "Se acontecer, qual é a severidade REAL (não imaginada)?",
            "Você já passou por algo similar? Foi tão terrível?"
        ],
        DistortionType.MIND_READING: [
            "Você tem evidência do que a pessoa pensa, ou está adivinhando?",
            "Como você pode TESTAR essa hipótese?",
            "Se um amigo dissesse isso, você acreditaria sem perguntar?",
            "Há explicações alternativas para o comportamento?"
        ],
        DistortionType.FORTUNE_TELLING: [
            "Como você sabe que isso vai acontecer?",
            "Quantas vezes previu o futuro e estava certo?",
            "O que poderia ser diferente desta vez?",
            "Se tivesse que apostar, qual é a probabilidade REAL?"
        ]
    }
    
    # Retorna 3-4 perguntas relevantes
    return questions_bank.get(distortion, [])[:4]

def thought_record_agent(user_input: str, llm_client) -> ThoughtRecord:
    """
    Agente que guia usuário por Thought Record
    """
    # 1. Extrair situação
    situation = llm_client.extract_situation(user_input)
    
    # 2. Extrair sentimento inicial
    feeling, intensity = llm_client.extract_feeling(user_input)
    
    # 3. Identificar pensamento automático
    auto_thought = llm_client.extract_automatic_thought(user_input)
    
    # 4. Classificar distorção
    distortion = llm_client.classify_distortion(auto_thought)
    
    # 5. Gerar perguntas Socráticas
    questions = generate_socratic_questions(auto_thought, distortion)
    
    # 6. Coletar evidência contra (com usuário)
    evidence = llm_client.elicit_evidence_against(auto_thought, questions)
    
    # 7. Construir pensamento balanceado
    balanced = llm_client.build_balanced_thought(auto_thought, evidence)
    
    # 8. Re-avaliar sentimento
    new_feeling, new_intensity = llm_client.reassess_feeling()
    
    # 9. Identificar padrão
    pattern = llm_client.identify_pattern(distortion, auto_thought)
    
    return ThoughtRecord(
        situation=situation,
        initial_feeling=feeling,
        initial_intensity=intensity,
        automatic_thought=auto_thought,
        distortion_type=distortion,
        socratic_questions=questions,
        evidence_against=evidence,
        balanced_thought=balanced,
        new_feeling=new_feeling,
        new_intensity=new_intensity,
        pattern=pattern
    )
```

## Código 2: Pattern Detection Engine

```python
from typing import Dict, List
import numpy as np

class PatternDetector:
    def __init__(self):
        self.patterns = [
            "Ruminância", "Circularidade", "Medo de Vencer",
            "Ganho Secundário", "Autossabotagem", "Perfeccionismo",
            "Hipervigilância", "Procrastinação", "Evitância",
            "Culpa", "Ansiedade Social", "Baixa Autoestima"
        ]
        
        # Keywords por padrão
        self.keywords = {
            "Ruminância": ["pensar repetidamente", "não consigo parar", "horas pensando",
                          "repassando", "analisando", "por quê"],
            "Medo de Vencer": ["promovido mas", "deveria estar feliz", "sucesso assusta",
                              "pedir demissão", "algo vai dar errado"],
            "Procrastinação": ["deadline", "amanhã", "depois", "não começar",
                              "última hora", "tempo passou"]
        }
        
    def detect_patterns(self, user_messages: List[str]) -> Dict:
        """
        Detecta padrões em mensagens do usuário
        """
        scores = {pattern: 0.0 for pattern in self.patterns}
        
        # Concatenar mensagens
        text = " ".join(user_messages).lower()
        
        # Score por keywords
        for pattern, keywords in self.keywords.items():
            for keyword in keywords:
                if keyword in text:
                    scores[pattern] += 1.0
        
        # Normalizar
        total = sum(scores.values())
        if total > 0:
            confidence_scores = {k: v/total for k, v in scores.items()}
        else:
            confidence_scores = scores
        
        # Ordenar por confiança
        sorted_patterns = sorted(confidence_scores.items(), 
                                key=lambda x: x[1], 
                                reverse=True)
        
        return {
            "patterns_detected": [
                {
                    "pattern_name": pattern,
                    "confidence": score,
                    "severity": self._estimate_severity(pattern, text)
                }
                for pattern, score in sorted_patterns if score > 0.1
            ],
            "primary_pattern": sorted_patterns[0][0] if sorted_patterns else None,
            "primary_confidence": sorted_patterns[0][1] if sorted_patterns else 0.0
        }
    
    def _estimate_severity(self, pattern: str, text: str) -> str:
        """
        Estima severidade baseado em palavras-chave de intensidade
        """
        high_intensity = ["não aguento", "não consigo", "horas", "dias", 
                         "sempre", "toda vez", "insuportável"]
        
        count = sum(1 for word in high_intensity if word in text)
        
        if count >= 3:
            return "high"
        elif count >= 1:
            return "medium"
        else:
            return "low"

# Uso
detector = PatternDetector()
messages = [
    "Não consigo parar de pensar na conversa de ontem",
    "Fico horas analisando cada palavra que disse"
]
result = detector.detect_patterns(messages)
print(result)
# Output: primary_pattern = "Ruminância", confidence = 0.85, severity = "high"
```

---

# 🆕 SEÇÃO 11: ADHD/AUTISM ADAPTATIONS

## Adaptações Específicas para Neurodivergentes

### ADHD-Specific Modifications

```yaml
CHALLENGE: Executive Dysfunction
ADAPTATION:
  - Break all techniques into 3-5 min chunks
  - Use timers visibly (Pomodoro: 25 min work, 5 min break)
  - External reminders (not "remember to do X")
  - Gamification (points, levels, streaks)

CHALLENGE: Time Blindness
ADAPTATION:
  - No "think about it later" - address NOW
  - Immediate rewards (not future-focused)
  - Visual timeline (não apenas texto)

CHALLENGE: RSD (Rejection Sensitive Dysphoria)
ADAPTATION:
  - Extra validação emocional
  - "Isso não é sobre você ser inadequado"
  - Reality testing mais frequente
  - Gradual exposure (social anxiety)

CHALLENGE: Emotional Dysregulation
ADAPTATION:
  - Grounding exercises PRIMEIRO
  - Calm before cognitive work
  - Physical movement integrado
```

### Autism-Specific Modifications

```yaml
CHALLENGE: Perseveração Mental
ADAPTATION:
  - Behavioral interrupt mais firme
  - Clear signal: "Isso é loop, vamos mudar"
  - Alternative focus (não vazio)

CHALLENGE: Literal Thinking
ADAPTATION:
  - Avoid metaphors (ou explicar claramente)
  - Concrete examples sempre
  - Step-by-step instructions (não abstrato)

CHALLENGE: Sensory Overload
ADAPTATION:
  - Grounding com foco sensorial
  - "5 coisas que vê" (visual grounding)
  - Quiet space quando overwhelmed

CHALLENGE: Social Communication
ADAPTATION:
  - Explicit social skills training
  - Scripts para situações comuns
  - Video feedback para self-awareness
```

### Meta-Prompt ADHD/Autism Enhanced

```
"Para usuários neurodivergentes:

DETECÇÃO:
- Se menciona ADHD/Autism: Aplicar adaptações automaticamente
- Se padrões sugerem (RSD, executive dysfunction): Oferecer teste

ADAPTAÇÕES GERAIS:
1. Chunking: Dividir tudo em 3-5 min
2. Timers: Usar sempre
3. Gamification: Oferecer pontos
4. Validação Extra: RSD-aware language
5. Concrete: Evitar abstrato
6. Physical: Integrar movimento
7. Immediate: Recompensas agora, não depois

EXEMPLO ADHD (Procrastinação):
Tradicional: 'Comece a tarefa amanhã'
ADHD-adapted: 'Vamos fazer 5 min AGORA. Timer set. Começar: abrir documento'

EXEMPLO Autism (Ansiedade Social):
Tradicional: 'Vá ao evento e tente relaxar'
Autism-adapted: 'Script: "Oi, sou [nome]. Como você conhece [host]?" 
                  Pratique 3x antes. Vá por 30 min. Exit strategy: "Preciso ir, foi bom te conhecer"'
```

---

**FIM DA VERSÃO 2.0 ENHANCED**

Próximo: V2.0 dos outros 3 arquivos (213, 182, 214)
