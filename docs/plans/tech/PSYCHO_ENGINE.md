# 🧠 Psycho Engine (The "Layer Peeler")

**Source:** `Gemini-Rito de Passagem...md` (Master Prompt v4)
**Goal:** A "Maieutic Engine" that peels biographical noise to reveal symbolic patterns.

## 1. The 12 Sacred Patterns (Index Keys)
1.  **Ruminância** (Looping thought)
2.  **Circularidade** (Returning to start)
3.  **Medo de Vencer** (Success inhibition)
4.  **Ganho Secundário** (Hidden benefit of suffering)
5.  **Autossabotagem** (Active destruction)
6.  **Perfeccionismo** (Paralysis by standard)
7.  **Hipervigilância** (Scanning for threat)
8.  **Procrastinação** (Delay as defense)
9.  **Evitância** (Avoiding the gaze)
10. **Culpa** (Debt to the past)
11. **Ansiedade Social** (Performance fear)
12. **Baixa Autoestima** (Identity deficit)

## 2. Architecture: "Bisturi + Freio + Amplificador"
### The Engine (Internal)
- **Input:** User text/voice.
- **Process:**
    1.  **De-identification:** Replace names with Archetypes ("Father" -> "The Authority").
    2.  **Pattern Match:** Calculate `Resonance Index` against the 12 keys.
    3.  **Somatic Pulse:** Identify physical texture (tight, heavy, flowing).
- **Output:** `JSON` (Strict Schema).

### The Output (JSON)
```json
{
  "resonance_index": {
    "detected_patterns": ["Circularidade"],
    "evidence": "User repeated 'again' 3 times."
  },
  "open_tensions": ["Why does success feel like danger?"],
  "symbolic_harvest": {
    "artistic_seeds": ["A man spinning a fruit but never eating it."]
  }
}
```

## 3. The "Descascador de Mangas" (External)
- **Voice:** "Anti-Intelectual", Brasileiro, Cotidiano.
- **Role:** Takes the `artistic_seeds` from the Engine and speaks them.
- **Example:** "Sabe, você tá girando essa manga faz uma hora. O que acontece se você morder?"

## 4. Integration
- **Mycelium Event:** `cortex.psycho.analyze`
- **Consumer:** `PsychoEngine Service` (Python/LangChain).
