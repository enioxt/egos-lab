# 🍄 Mycelium Network Integration Plan

**Concept:** The "Fungal Root System" of Egos.
**Role:** Invisible, underground interconnection layer connecting all Apps (Intelink, Eagle Eye, Carteira Livre) via Event-Driven Architecture.

## 1. Architecture: The "NATS" Nervous System
Mycelium is not a database; it is a **Message Broker** (NATS JetStream).
- **Subject-Based Addressing:** `egos.intelink.alert.new`, `egos.cortex.pattern.detected`.
- **Zero-Knowledge Proofs (ZKP):** Nodes verify each other without revealing identity (The "Shadow Node" protocol).

## 2. Integration Points
### A. Intelink -> Mycelium
- **Event:** `intelink.entity.flagged`
- **Action:** Mycelium broadcasts to Eagle Eye ("Is this entity active in the city?").

### B. Cortex (Mobile) -> Mycelium
- **Event:** `cortex.context.captured` (e.g., User stressed).
- **Action:** Mycelium triggers "Psycho Engine" to analyze latent patterns.

### C. Psycho Engine -> Mycelium
- **Event:** `psycho.pattern.detected` (e.g., "Circularidade").
- **Action:** Updates User Reputation score (Ethik) silently.

## 3. Implementation Plan (Phase 32)
1.  **Deploy NATS Server:** `docker-compose up nats`.
2.  **Schema Registry:** Define `mycelium.schema.ts` (Protobuf/Avro).
3.  **ZKP Module:** Integrate `snarkjs` for Identity masking.

## 4. Status
- **Current:** Conceptual / Planned.
- **Next Step:** Proto-validation with simple Pub/Sub.
