# 🧠 Psycho Engine (The "Layer Peeler")

**Source:** `Gemini-Rito de Passagem...md` (Master Prompt v4)
**Goal:** A "Maieutic Engine" that peels biographical noise to reveal symbolic patterns.

## 1. The 14 Sacred Patterns (Index Keys)
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
13. **Síndrome do Impostor** (Disconnect between output and self-image) *[Added 2026-02-20]*
14. **Medo da Exposição** (Hiding behind pseudonyms to avoid judgment) *[Added 2026-02-20]*

## 2. Architecture: "Bisturi + Freio + Amplificador"
### The Engine (Internal)
- **Input:** User text/voice.
- **Process:**
    1.  **De-identification:** Replace names with Archetypes ("Father" -> "The Authority", "Company" -> "The Stage").
    2.  **Pattern Match:** Calculate `Resonance Index` against the 14 keys.
    3.  **Somatic Pulse:** Identify physical texture (tight, heavy, flowing).
- **Output:** `JSON` (Strict Schema).

### The Output (JSON)
```json
{
  "resonance_index": {
    "detected_patterns": ["Síndrome do Impostor", "Medo da Exposição"],
    "evidence": "User has built 19 AI agents and a production OSINT system but feels the need to hide behind a pseudonym."
  },
  "open_tensions": ["Why does building enterprise-grade software feel like it's not enough?"],
  "symbolic_harvest": {
    "artistic_seeds": ["An architect who builds a skyscraper but sleeps in the basement because he thinks the roof will fall."]
  }
}
```

## 3. The "Descascador de Mangas" (External)
- **Voice:** "Anti-Intelectual", Brasileiro, Cotidiano.
- **Role:** Takes the `artistic_seeds` from the Engine and speaks them.
- **Example:** "Você construiu um arranha-céu inteiro sozinho, com fundação e tudo, mas tá com medo de colocar a placa na porta achando que vão dizer que é de isopor."

## 4. Integration
- **Mycelium Event:** `cortex.psycho.analyze`
- **Consumer:** `PsychoEngine Service` (Next.js / OpenRouter).

