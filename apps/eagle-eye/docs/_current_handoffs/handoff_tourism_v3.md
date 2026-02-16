# 🦅 Handoff: Eagle Eye Tourism v3 (Community Edition)

> **Data:** 2026-02-16 (Sessão 3 - Final)
> **Status:** Backend + Frontend Alpha + **Community Strategy (B2G)**
> **Pivot:** De "Scraper Pasivo" para "Inteligência Colaborativa".

---

## 🧠 A Nova Estratégia: "Waze do Turismo"

Atendendo ao feedback crítico, mudamos o foco para a **Comunidade**.
1.  **O Problema:** Dados da web são velhos ou genéricos (Google Maps).
2.  **A Solução:** Cidadãos mapeiam a cidade em troca de recompensas.
3.  **O Produto:** Uma plataforma B2G (Business to Government) onde a Prefeitura paga pela inteligência e engajamento.

O documento mestre da estratégia está em: [`apps/eagle-eye/docs/COMMUNITY_STRATEGY.md`](../../../apps/eagle-eye/docs/COMMUNITY_STRATEGY.md)

---

## 🛠️ Entregas Técnicas (V3)

### 1. Motor de Consenso (`truth-consensus.ts`)
Implementamos a lógica de "Confiança Progressiva":
*   **Entrada do Usuário:** Começa com **10%** (Rumor).
*   **Validação Web (IA):** Sobe para **30%** se achar no Google/Instagram.
*   **Confirmação de Pares:** Sobe **+15%** por cada outro cidadão que confirmar.
*   **Dono do Negócio:** Salta para **80%+** (Verdade Verificada).

### 2. Chatbot Cidadão 2.0 (`citizen-logger.ts`)
*   O bot não apenas "anota". Ele agora calcula o **Score de Confiança** em tempo real.
*   *Exemplo:* "Você registrou a 'Coxinha do Zé'. Status: Rumor (10%). Mande uma foto para subir para 30%!"

---

## 📦 Pacote Completo (Resumo Geral)

| Módulo | Status | O que faz? |
| :--- | :--- | :--- |
| **Frontend** | Alpha | Dashboard do Gestor (React/Tailwind) + Login. |
| **Scraper** | V2 | Busca notícias no Google/Exa (Bypass Diário Oficial). |
| **Community** | **Novo** | Lógica de Consenso e Estratégia B2G. |
| **SEO Factory**| V1 | Gera conteúdo para pequenos negócios. |
| **Design** | Final | 9 Telas prontas no Stitch (Figma-like). |

---

## 🚀 Próximos Passos (Roadmap V3)

1.  **Gamificação Real:** Conectar os pontos do `TruthConsensus` com prêmios reais (ex: desconto no IPTU ou vouchers no comércio local).
2.  **App Mobile:** O Chatbot precisa virar um PWA ou App Nativo para facilitar o envio de fotos na rua.
3.  **Venda B2G:** Apresentar o `COMMUNITY_STRATEGY.md` para a Secretaria de Turismo de Patos.

---

## 🏁 Comando Final
```bash
git add .
git commit -m "feat(tourism): implement community consensus engine & strategy v1"
git push origin main
```
