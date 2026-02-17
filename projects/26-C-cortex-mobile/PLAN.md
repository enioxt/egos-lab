# Cortex Mobile: O "Ladrão de Contexto" Ético

> **Objetivo:** Capturar TUDO o que passa na tela do usuário (ChatGPT, WhatsApp, Emails) para criar um "Segundo Cérebro" que conecta os pontos.

## 📱 A Tecnologia: Android Accessibility Service
Para "ler a tela do usuário" sem root, existe apenas uma porta: **Acessibilidade**.
É a mesma API que leitores de tela para cegos usam. Ela nos dá acesso à árvore de visualização (View Tree) de qualquer app aberto.

### O que é possível extrair?
1.  **Textos:** Mensagens do WhatsApp, respostas do ChatGPT, corpo de emails.
2.  **Input:** O que o usuário está digitando (via `TYPE_VIEW_TEXT_CHANGED`).
3.  **Navegação:** Saber qual app está aberto e em qual tela.

### ⚠️ Permissões Necessárias (Grande Barreira)
*   **Permissão Especial:** `BIND_ACCESSIBILITY_SERVICE`.
*   **UX:** O usuário precisa ir em *Configurações > Acessibilidade > Cortex > Ativar*. O Android exibe um aviso assustador ("Este app pode ler tudo, incluindo senhas").
*   **Google Play:** Apps com isso são **banidos** se não provarem que ajudam pessoas com deficiência OU se não forem apps corporativos (MDM). Para uso pessoal (Sideload/APK), é tranquilo.

---

## 🏗️ Arquitetura do MVP

### 1. O "Olho" (Service Layer)
Um `Service` Android rodando em background.
*   **Event Filter:** Escuta apenas `com.whatsapp`, `com.openai.chatgpt`, `com.google.android.gm` (Gmail).
*   **Throttling:** Captura texto apenas quando a tela estabiliza (para não fritar a bateria).

### 2. O "Cérebro Local" (On-Device AI)
Não podemos enviar tudo para a nuvem (privacidade + custo).
*   **Vector DB Local:** Usar **ObjectBox** ou **SQLite-VSS** no celular.
*   **Embeddings:** Rodar um modelo pequeno (ex: `all-MiniLM-L6-v2`) via **ONNX Runtime** no próprio Android.

### 3. O Fluxo de Dados
1.  **User** abre o ChatGPT e discute "Projeto X".
2.  **Cortex** lê a tela: "Contexto: Projeto X, Ideias: A, B, C".
3.  **Cortex** vetoriza e salva localmente com timestamp.
4.  **User** abre o WhatsApp e fala com "Sócio" sobre "Projeto X".
5.  **Cortex** detecta a semelhança semântica.
6.  **Notificação Cortex:** "Ei, você falou sobre isso no ChatGPT há 10 mins. Quer ver o resumo?"

---

## 🚀 Plano de Implementação (Roadmap)

### Fase 1: O "Logger" (MVP Inicial)
*   App Android nativo (Kotlin) ou Flutter.
*   Serviço de Acessibilidade configurado.
*   Loga todo texto encontrado em um arquivo `.txt` local seguro.
*   **Entregável:** Um APK que, quando ativado, gera um "diário" do que você viu.

### Fase 2: O "Conector"
*   Implementar Database Local.
*   Agrupar logs por "Sessão" (ex: conversa do zap das 14:00 às 14:10).
*   Envio (opcional) para o `Intelink` (seu PC) via WiFi para processamento pesado.

### Fase 3: A "Inteligência"
*   RAG Local no celular.
*   Botão flutuante (Overlay) que brilha quando encontra conexões.

## 🛡️ Riscos & Mitigação
1.  **Privacidade:** Dados sensíveis (senhas, bancos).
    *   *Solução:* Blacklist de apps (Nubank, Inter) e detecção de campos `password`.
2.  **Bateria:** Processar texto consome CPU.
    *   *Solução:* Processamento em "batches" quando a tela apaga.

---

**Veredito:** É 100% possível tecnicamente. A barreira é a **fricção de instalação** (o usuário tem que confiar MUITO em você para dar acesso de Acessibilidade). Como ferramenta *pessoal* ou *enterprise*, é genial. Como produto de massa na Play Store, é quase impossível aprovar.
