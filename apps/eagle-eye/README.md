# 🦅 Eagle Eye: Open Source Intelligence (OSINT)

> **"Democratizando o acesso a dados públicos e inteligência local."**

O **Eagle Eye** é um motor de inteligência modular projetado para monitorar, filtrar e analisar dados de fontes abertas (Diários Oficiais, Notícias Locais, Redes Sociais).

## 🚀 Módulos Ativos

### 1. 📜 Gazette Monitor (Diários Oficiais)
Integração nativa com a API do **Querido Diário** (Open Knowledge Brasil).
- **O que faz:** Monitora novas publicações em busca de palavras-chave (Licitações, Leis, Nomeações).
- **Status:** Produção (Brasil todo).
- **Código:** [`src/fetch_gazettes.ts`](./src/fetch_gazettes.ts)

### 2. 🏙️ Local Intelligence (Patos de Minas)
Um módulo de exemplo focado em hiper-localidade.
- **O que faz:** Monitora portais de notícias locais (Patos Hoje, Patos Já) e detecta influenciadores/eventos.
- **Custo:** $0.00 (Regex Scrapers).
- **Código:** [`src/modules/tourism/`](./src/modules/tourism/)

## 🤝 Como Colaborar

O Eagle Eye é **Open Source** e precisamos da sua ajuda para expandir:

1.  **Novos Scrapers:** Crie um scraper para o portal de notícias da sua cidade.
2.  **Novos Padrões:** Melhore os Regex do `GenericPatternMatcher`.
3.  **Integrações:** Conecte com novas APIs de dados públicos.

### 🛠️ Quick Start

```bash
# Instalar dependências
bun install

# Testar o monitor de Diários Oficiais (Busca Nacional)
bun run eagle-eye:fetch

# Testar o módulo local (Patos de Minas)
bun run apps/eagle-eye/src/test-intelligence.ts
```

## 💼 Parcerias & Consultoria

Este projeto é mantido pelo **Egos Lab**.
Se você precisa de uma versão customizada do Eagle Eye para sua empresa (Monitoramento de Marca, Licitações Específicas, Inteligência de Mercado), entre em contato.

## 💼 Connect with the Author

**Enio Rocha**
*Artificial Intelligence Architect @ Egos Lab | Founder @ [Carteira Livre](https://www.carteiralivre.com)*

- 🔗 [LinkedIn](https://www.linkedin.com/in/eniorochaxt)
- 🐦 [X (Twitter)](https://x.com/anoineim)
- 💬 [WhatsApp](https://wa.me/5534992374363)

> **Egos Lab** is the open-source arm of my research into Agentic Systems.
> Need a custom AI solution? Let's talk.
