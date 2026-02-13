# Protótipo Cloud Legal

**User:** Enio Rocha (enioxt@gmail.com)  
**Created:** 2/4/2026 22:39:18  
**Updated:** 2/5/2026 17:52:55  
**Exported:** 2/12/2026 23:02:30  
**Link:** [https://chatgpt.com/c/6983f4c6-2cbc-8326-bfa9-970a88451d83](https://chatgpt.com/c/6983f4c6-2cbc-8326-bfa9-970a88451d83)  

## Prompt:
Me ajude a criar um sistema mais simples, fácil uso, um protótipo, que é basicamente um HTML, que vai conter a API da Cloud Legal, que é um plugin do Cloud, que ele faz análises em documentações jurídicas. Então, liste todas as capacidades e use todas as capacidades que essa API oferece nessa ferramenta. A entrada de documentos deve ser facilitada com fotos, PDF ou texto livre para a pessoa analisar quaisquer textos ou documentos que queira. Permita o upload de documentos grandes, já que processos podem ser grandes. E já inclua também uma opção de, caso tenha restrições de tamanho, uma opção de já cortar para a pessoa ou dividir arquivos para ela, ou sugerir, por exemplo, o iLovePDF para dividir esses arquivos. Enfim, e o output deve ser da melhor forma possível, né? A saída, a resposta da parte jurídica, a parte legal, a parte análise do contexto, talvez com três respostas ou duas respostas diferentes, em tons diferentes, para o usuário escolher a melhor forma de analisar aquilo e abrir uma discussão, já que tem direito muito sobre a discussão, de algo que oferecer três respostas sobre várias análises ou várias perspectivas que seriam importante para essa ferramenta que estamos criando aqui. Faça toda a documentação, escreva todo o PRD deste projeto, tudo o que ele precisa, todas as camadas. Quem faz, se é possível desenhar sobre isso em um simples HTML, em um simples dashboard, né? Pode falar HTML, um dashboard, podendo sortear esse site facilmente para ter persistência, para ter memória, ou apenas um protótipo inicialmente, que é um HTML para rodar e ver as capacidades.

https://legaltechnology.com/2026/02/03/anthropic-unveils-claude-legal-plugin-and-causes-market-meltdown/

2/2

## Response:
Thought for 57s

Enio, dá pra fazer sim um **protótipo em “um HTML só”** (um dashboard) que **exercita todas as capacidades públicas descritas do “Legal plugin” do Claude/Cowork** — e deixa pronto o encaixe para você plugar a “Cloud Legal API” (ou um backend seu que chama essa API).

Pelo que está publicamente descrito, o plugin “Legal” cobre estes **modos/capacidades** (e é isso que vamos refletir no produto):

*   **Revisão de contratos cláusula-a-cláusula** contra um **playbook configurável**, com **flags GREEN/YELLOW/RED** e **sugestões de redline** (`/review-contract`). [Claude+1](https://claude.com/plugins/legal)
*   **Triage de NDA** para classificar em **aprovação padrão / revisão do jurídico / revisão completa** (`/triage-nda`). [Claude+1](https://claude.com/plugins/legal)
*   **Checagem de status de vendor agreement** (`/vendor-check`). [Claude+1](https://claude.com/plugins/legal)
*   **Briefings contextuais** (daily brief, pesquisa de tema, incident response) (`/brief`). [Claude+1](https://claude.com/plugins/legal)
*   **Respostas template** para rotinas comuns (ex.: **DSAR**, **discovery hold**) (`/respond`). [Claude+1](https://claude.com/plugins/legal)
*   **Configuração via “local settings file”** (playbook, posições padrão, ranges aceitáveis, gatilhos de escalonamento) e **conexões via MCP** com ferramentas (ex.: Slack, Box, Egnyte, Jira, Microsoft 365) para contexto rico. [Claude+2GitHub+2](https://claude.com/plugins/legal)
*   **Aviso explícito**: saída deve ser **revisada por advogado licenciado** (assistência, não “aconselhamento final”). [Claude+1](https://claude.com/plugins/legal)

O gatilho “market meltdown” e o contexto de mercado foram noticiados (Legal IT Insider + Guardian), mas pra teu produto o que importa mesmo é: **workflow jurídico empacotado + playbook + triagem + risco + integrações**. [Legal IT Insider+2The Guardian+2](https://legaltechnology.com/2026/02/03/anthropic-unveils-claude-legal-plugin-and-causes-market-meltdown/)

* * *

PRD — “Cloud Legal Analyzer” (Protótipo HTML)
---------------------------------------------

### 1) Visão do produto

Um dashboard web simples para **subir documentos jurídicos (foto/PDF/texto)** e rodar análises usando as capacidades do “Legal plugin” (ou “Cloud Legal API”), retornando **múltiplas perspectivas** de resposta para facilitar discussão.

### 2) Objetivos

*   Reduzir fricção: “cola aqui / sobe PDF / tira foto e pronto”.
*   Suportar documentos grandes (processos extensos).
*   Padronizar análise por playbook (empresa/escritório) e tolerância a risco.
*   Entregar saída “discutível”: 2–3 estilos/perspectivas.

### 3) Personas

*   **In-house counsel / jurídico corporativo** (contratos, vendors, compliance, DSAR).
*   **Advogado(a) / estagiário(a)** (triagem, leitura rápida, preparação de briefing).
*   **Gestor(a) não-jurídico** (quer resumo executivo e próximos passos).

### 4) Casos de uso (MVP)

1.  **Review Contract**: contrato + playbook → flags + riscos + sugestões.
2.  **NDA Triage**: NDA → classificação e justificativas.
3.  **Vendor Check**: dados do fornecedor + contrato/termos → status/pendências.
4.  **Brief**: briefing contextual (tema / incidente / daily).
5.  **Respond**: resposta template (DSAR / hold / e-mail padrão).

### 5) Inputs suportados

*   **Upload**: PDF, DOC/DOCX (opcional), TXT, imagens (JPG/PNG/HEIC).
*   **Captura por câmera** (mobile): `accept="image/*" capture`.
*   **Texto livre**.

> Observação: Em “um HTML só”, você **não vai conseguir OCR/parse robusto** sem serviços externos. Então no protótipo a gente:

*   envia imagem/PDF “como está” pro backend/API (se a API aceitar), ou
*   faz fallback: “sem OCR, cole o texto” (com botão e instrução).

### 6) Documentos grandes

*   **Upload “grande”**: usar backend com upload em partes (multipart/resumable) + armazenamento (S3/R2/GCS) + job assíncrono.
*   **Se houver limite na API** (payload/tokens): oferecer opções:
    1.  **Dividir automaticamente** (para texto) em chunks + map-reduce de análise.
    2.  **Sugerir iLovePDF** (para PDF) com instrução direta (quando não der pra dividir no browser).
    3.  **Modo “Amostragem inteligente”**: analisar índice + peças-chave (petição inicial, sentença, acórdão, etc.) se o usuário marcar.

### 7) Outputs (melhor forma possível)

Estrutura recomendada de saída (sempre com “trechos citados”):

*   **Resumo executivo** (5–10 bullets)
*   **O que importa juridicamente** (teses, pedidos, obrigações, prazos)
*   **Riscos e severidade** (GREEN/YELLOW/RED)
*   **Redlines / sugestões concretas**
*   **Perguntas para esclarecer** (o que falta)
*   **Próximos passos**
*   **Trechos citados** (quotes curtas por seção)

**Múltiplas perspectivas (3 respostas):**

1.  **Formal/jurídica** (parecer, linguagem técnica).
2.  **Objetiva/operacional** (checklist, ações, prazos).
3.  **Contrapontos (“advogado do diabo”)** (riscos ocultos, argumentos contrários, pontos de atenção).

### 8) Requisitos não-funcionais

*   Privacidade: avisos + opção “não salvar” (modo sessão) vs “salvar” (memória).
*   Auditoria: log das análises (quem, quando, qual playbook).
*   Segurança: remoção/mascaração de PII opcional antes de enviar à API.
*   Observabilidade: tempo por etapa, falhas por tipo de arquivo.

### 9) Arquitetura (recomendada)

**Protótipo (rápido):**

*   Um `index.html` + JS chamando um endpoint único:
    *   `POST /api/analyze` (seu backend) → chama “Cloud Legal API”/Claude.

**Produção (camadas):**

*   Frontend: static (Vercel/Netlify/Cloudflare Pages).
*   Backend: serverless (Edge/Functions) + fila (para jobs longos).
*   Storage: S3/R2 + links assinados.
*   “Memory”: banco simples (Postgres/Supabase) guardando:
    *   playbooks versionados
    *   histórico de análises
    *   preferências de estilo de saída

* * *

Protótipo: um HTML (dashboard) pronto pra rodar
-----------------------------------------------

Abaixo vai um **single-file** que:

*   aceita **texto / upload / captura por câmera**
*   detecta **arquivo grande** e sugere **dividir / iLovePDF**
*   permite escolher o **modo** (review, nda, vendor, brief, respond)
*   permite escolher **3 tons/perspectivas**
*   já manda um payload bem organizado para um endpoint (`/api/analyze`) que você implementa do jeito que a “Cloud Legal API” pedir.

> **Importante**: sem backend, browser não chama API com segurança (chave exposta) e não lida bem com upload gigante. Então o HTML assume **um backend proxy**.

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cloud Legal Analyzer (Protótipo)</title>
  <style>
    :root { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
    body { margin: 0; background:#0b0c10; color:#e8e8ea; }
    header { padding: 16px 20px; border-bottom: 1px solid #22252b; position: sticky; top:0; background:#0b0c10; }
    h1 { margin:0; font-size: 18px; }
    main { padding: 18px 20px; max-width: 1100px; margin: 0 auto; }
    .grid { display:grid; grid-template-columns: 1.1fr 0.9fr; gap: 14px; }
    @media (max-width: 900px){ .grid { grid-template-columns: 1fr; } }
    .card { background:#11131a; border:1px solid #22252b; border-radius: 16px; padding: 14px; }
    .row { display:flex; gap: 10px; flex-wrap: wrap; }
    label { font-size: 12px; opacity: 0.9; display:block; margin-bottom: 6px; }
    select, input[type="text"], textarea { width:100%; box-sizing:border-box; padding:10px 10px; border-radius: 12px; border:1px solid #2a2f39; background:#0c0f16; color:#e8e8ea; }
    textarea { min-height: 140px; resize: vertical; }
    input[type="file"] { width:100%; }
    button { padding: 10px 12px; border-radius: 12px; border:1px solid #2a2f39; background:#171a22; color:#e8e8ea; cursor:pointer; }
    button.primary { background:#2b64ff; border-color:#2b64ff; }
    button:disabled { opacity:0.55; cursor:not-allowed; }
    .muted { opacity:0.75; font-size: 12px; line-height: 1.4; }
    .pill { font-size: 12px; padding: 4px 10px; border-radius: 999px; border:1px solid #2a2f39; background:#0c0f16; }
    .warn { border-color:#ffb02055; background:#221a0a; }
    .ok { border-color:#35d07f55; background:#0d1a12; }
    .danger { border-color:#ff4d4d55; background:#220c0c; }
    .out { white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 12px; }
    .hr { height:1px; background:#22252b; margin: 12px 0; }
    .kvs { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .small { font-size: 11px; opacity: 0.8; }
  </style>
</head>
<body>
<header>
  <div class="row" style="align-items:center; justify-content:space-between;">
    <h1>Cloud Legal Analyzer — Protótipo (HTML)</h1>
    <span class="pill">MVP: review • NDA • vendor • brief • respond</span>
  </div>
</header>

<main>
  <div class="grid">
    <section class="card">
      <div class="row">
        <div style="flex: 1 1 240px;">
          <label>Modo de análise (capacidade)</label>
          <select id="mode">
            <option value="review-contract">/review-contract — revisão cláusula-a-cláusula + flags + redlines</option>
            <option value="triage-nda">/triage-nda — triagem de NDA (aprova / jurídico / full review)</option>
            <option value="vendor-check">/vendor-check — checagem de status de vendor agreement</option>
            <option value="brief">/brief — briefing contextual (tema / daily / incident response)</option>
            <option value="respond">/respond — resposta template (DSAR / discovery hold / e-mails)</option>
          </select>
        </div>
        <div style="flex: 1 1 240px;">
          <label>Jurisdicação / contexto (opcional)</label>
          <input id="jurisdiction" type="text" placeholder="Ex.: Brasil (MG), LGPD, CPC, CLT, ANPD, etc." />
          <div class="small" style="margin-top:6px;">Dica: melhora muito a qualidade se você indicar ramo (cível/penal/trabalhista) e norma-chave.</div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row">
        <div style="flex: 1 1 280px;">
          <label>Upload de documento (PDF/Imagem/TXT) — aceita múltiplos</label>
          <input id="files" type="file" multiple />
          <div class="row" style="margin-top:8px;">
            <button id="cameraBtn" type="button">Capturar foto (mobile)</button>
            <input id="camera" type="file" accept="image/*" capture="environment" style="display:none;" />
            <span class="muted">Se você estiver no celular, o botão abre a câmera.</span>
          </div>
          <div id="fileInfo" class="muted" style="margin-top:10px;"></div>
          <div id="sizeAdvice" class="muted" style="margin-top:10px;"></div>
        </div>

        <div style="flex: 1 1 280px;">
          <label>Ou cole o texto aqui (texto livre / OCR manual)</label>
          <textarea id="freeText" placeholder="Cole o texto do contrato/peça/decisão aqui..."></textarea>
          <div class="row" style="margin-top:8px;">
            <button id="chunkTextBtn" type="button">Dividir texto em partes (se ficar grande)</button>
            <span class="muted">Cria chunks pra enviar por limite de tokens/payload.</span>
          </div>
          <div id="chunksInfo" class="muted" style="margin-top:10px;"></div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="kvs">
        <div>
          <label>Playbook / tolerância de risco (JSON) — opcional</label>
          <textarea id="playbook" placeholder='Ex.: {"positions":{"liability_cap":"1x fees","governing_law":"BR","indemnity":"limited"},"escalation":{"red":["unlimited liability","broad indemnity"]}}'></textarea>
          <div class="muted">Isso simula o “local settings file” do plugin (posições padrão, ranges, gatilhos).</div>
        </div>
        <div>
          <label>Perspectivas de saída</label>
          <div class="row" style="margin-bottom:10px;">
            <span class="pill ok"><input id="toneFormal" type="checkbox" checked /> Formal/jurídica</span>
            <span class="pill"><input id="toneExec" type="checkbox" checked /> Executiva/objetiva</span>
            <span class="pill warn"><input id="toneDevil" type="checkbox" checked /> Contrapontos</span>
          </div>

          <label>Preferência de formatação</label>
          <select id="format">
            <option value="structured">Estruturado (títulos + bullets + trechos citados)</option>
            <option value="memo">Memo/Parecer</option>
            <option value="checklist">Checklist operacional</option>
          </select>

          <div class="hr"></div>

          <div class="row">
            <button id="runBtn" class="primary" type="button">Analisar</button>
            <button id="clearBtn" type="button">Limpar</button>
            <span id="status" class="muted"></span>
          </div>

          <div class="muted" style="margin-top:10px;">
            ⚠️ Protótipo: não envia chave de API no browser. Configure um backend proxy em <code>/api/analyze</code>.
          </div>
        </div>
      </div>
    </section>

    <aside class="card">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <strong>Saída</strong>
        <span id="latency" class="muted"></span>
      </div>
      <div class="hr"></div>

      <div id="output" class="out muted">Nenhuma análise ainda.</div>

      <div class="hr"></div>
      <div class="muted">
        <strong>Observações rápidas</strong><br/>
        • Para PDFs enormes: o ideal é dividir (ex.: iLovePDF) ou enviar via backend com upload em partes.<br/>
        • Imagem (foto) normalmente precisa de OCR — se sua API não faz OCR, peça pro usuário colar o texto.<br/>
        • A saída deve ser revisada por profissional habilitado.
      </div>
    </aside>
  </div>
</main>

<script>
  // ===== Config do protótipo =====
  const API_ENDPOINT = "/api/analyze";          // seu backend chama a "Cloud Legal API"
  const SOFT_FILE_LIMIT_MB = 25;               // aviso no UI (ajuste conforme sua infra)
  const HARD_FILE_LIMIT_MB = 80;               // simulação de “restrição”
  const TEXT_CHUNK_CHARS = 12000;              // chunking simples (não-token)
  let textChunks = [];

  // ===== Helpers =====
  const $ = (id) => document.getElementById(id);
  const fmtMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + " MB";

  function selectedTones() {
    const tones = [];
    if ($("toneFormal").checked) tones.push("formal_juridico");
    if ($("toneExec").checked) tones.push("executivo_objetivo");
    if ($("toneDevil").checked) tones.push("contrapontos");
    // fallback: pelo menos 1
    return tones.length ? tones : ["formal_juridico"];
  }

  function setStatus(msg) { $("status").textContent = msg || ""; }
  function setOutput(txt) { $("output").textContent = txt; }
  function setLatency(ms) { $("latency").textContent = ms ? (ms + " ms") : ""; }

  // ===== Upload / camera =====
  $("cameraBtn").addEventListener("click", () => $("camera").click());

  function updateFileInfo() {
    const files = [...$("files").files, ...$("camera").files];
    if (!files.length) { $("fileInfo").textContent = "Nenhum arquivo selecionado."; $("sizeAdvice").textContent=""; return; }

    const total = files.reduce((s,f)=>s+f.size, 0);
    $("fileInfo").textContent = files.map(f => `• ${f.name} (${fmtMB(f.size)})`).join("\n") + `\n\nTotal: ${fmtMB(total)}`;

    const totalMB = total / (1024*1024);
    let advice = "";

    if (totalMB > HARD_FILE_LIMIT_MB) {
      advice += "⚠️ Total muito grande pro modo simples do protótipo.\n";
      advice += "Sugestões:\n";
      advice += "1) Dividir o PDF em partes (ex.: iLovePDF)\n";
      advice += "2) Ou usar backend com upload em partes + análise por chunks\n";
      advice += "3) Ou analisar apenas peças-chave (petição/sentença/acórdão)\n";
      $("sizeAdvice").className = "muted pill danger";
    } else if (totalMB > SOFT_FILE_LIMIT_MB) {
      advice += "Atenção: arquivo(s) grandes. Pode bater limite de payload/tokens na API.\n";
      advice += "Sugestões: dividir PDF (iLovePDF) ou mandar via backend com chunking.\n";
      $("sizeAdvice").className = "muted pill warn";
    } else {
      advice += "OK: tamanho dentro do esperado.";
      $("sizeAdvice").className = "muted pill ok";
    }
    $("sizeAdvice").textContent = advice;
  }

  $("files").addEventListener("change", updateFileInfo);
  $("camera").addEventListener("change", updateFileInfo);

  // ===== Chunk texto =====
  $("chunkTextBtn").addEventListener("click", () => {
    const txt = $("freeText").value || "";
    if (!txt.trim()) { textChunks = []; $("chunksInfo").textContent = "Cole algum texto para dividir."; return; }

    textChunks = [];
    for (let i=0; i<txt.length; i+=TEXT_CHUNK_CHARS) {
      textChunks.push(txt.slice(i, i+TEXT_CHUNK_CHARS));
    }
    $("chunksInfo").textContent = `Texto dividido em ${textChunks.length} parte(s) (~${TEXT_CHUNK_CHARS} chars cada).`;
  });

  // ===== Execução =====
  $("runBtn").addEventListener("click", async () => {
    setStatus("");
    setLatency("");
    setOutput("Preparando envio...");

    const mode = $("mode").value;
    const jurisdiction = $("jurisdiction").value.trim();
    const format = $("format").value;

    // arquivos
    const files = [...$("files").files, ...$("camera").files];

    // texto/chunks
    const freeText = ($("freeText").value || "").trim();
    const useChunks = textChunks.length > 0 && freeText.length > TEXT_CHUNK_CHARS;

    // playbook
    let playbook = null;
    const playbookRaw = ($("playbook").value || "").trim();
    if (playbookRaw) {
      try { playbook = JSON.parse(playbookRaw); }
      catch (e) {
        setOutput("❌ Playbook JSON inválido. Corrija e tente de novo.\n\n" + e.message);
        return;
      }
    }

    if (!files.length && !freeText) {
      setOutput("❌ Você precisa subir um arquivo ou colar texto.");
      return;
    }

    // Monta FormData (para suportar arquivos grandes melhor do que JSON puro)
    const fd = new FormData();
    fd.append("mode", mode);
    fd.append("jurisdiction", jurisdiction);
    fd.append("format", format);
    fd.append("tones", JSON.stringify(selectedTones()));
    fd.append("playbook", JSON.stringify(playbook || {}));
    fd.append("freeText", freeText);

    if (useChunks) {
      fd.append("textChunks", JSON.stringify(textChunks));
    }

    files.forEach((f) => fd.append("files", f, f.name));

    // Observação de limites
    const totalMB = files.reduce((s,f)=>s+f.size, 0) / (1024*1024);
    if (totalMB > HARD_FILE_LIMIT_MB) {
      setOutput("⚠️ Arquivos muito grandes para o modo simples.\nSugestão: dividir PDF (iLovePDF) ou habilitar upload multipart no backend.\n\nMesmo assim vou tentar enviar...");
    }

    $("runBtn").disabled = true;
    const t0 = performance.now();
    setStatus("Enviando para análise...");

    try {
      const res = await fetch(API_ENDPOINT, { method: "POST", body: fd });
      const t1 = performance.now();
      setLatency(Math.round(t1 - t0));

      if (!res.ok) {
        const txt = await res.text().catch(()=> "");
        setOutput(`❌ Erro HTTP ${res.status}\n\n${txt || "Sem detalhes."}`);
        return;
      }

      // Espera resposta estruturada (JSON)
      const data = await res.json();

      // Exibição “bonita” (texto) — você pode renderizar em cards depois
      const out = [];
      out.push(`MODE: ${data.mode || mode}`);
      if (data.meta?.warnings?.length) out.push(`\nWARNINGS:\n- ${data.meta.warnings.join("\n- ")}`);

      if (data.results && Array.isArray(data.results)) {
        for (const r of data.results) {
          out.push("\n" + "=".repeat(70));
          out.push(`PERSPECTIVA: ${r.tone || "n/a"}`);
          out.push("-".repeat(70));
          out.push(r.content || JSON.stringify(r, null, 2));
        }
      } else {
        out.push("\nRESULT:\n" + JSON.stringify(data, null, 2));
      }

      setOutput(out.join("\n"));
      setStatus("Concluído.");
    } catch (err) {
      setOutput("❌ Falha ao chamar o backend.\n\n" + (err?.message || String(err)));
    } finally {
      $("runBtn").disabled = false;
    }
  });

  $("clearBtn").addEventListener("click", () => {
    $("files").value = "";
    $("camera").value = "";
    $("freeText").value = "";
    $("playbook").value = "";
    $("jurisdiction").value = "";
    textChunks = [];
    $("chunksInfo").textContent = "";
    updateFileInfo();
    setOutput("Nenhuma análise ainda.");
    setStatus("");
    setLatency("");
  });

  updateFileInfo();
</script>
</body>
</html>
```

### Como o backend deve responder (contrato simples)

Pra esse HTML funcionar bem, seu `/api/analyze` pode responder assim:

```json
{
  "mode": "review-contract",
  "meta": { "warnings": ["Arquivo foi analisado em 6 partes (chunking)."] },
  "results": [
    { "tone": "formal_juridico", "content": "..." },
    { "tone": "executivo_objetivo", "content": "..." },
    { "tone": "contrapontos", "content": "..." }
  ]
}
```

* * *

Próximo passo (prático) — encaixar “Cloud Legal API”
----------------------------------------------------

Como não achei documentação pública de uma “Cloud Legal API” com endpoints formais além das **capacidades descritas do plugin** (slash commands e playbook), eu recomendo este desenho (que funciona com qualquer API real que você tiver):

1.  **Frontend (HTML)** → manda `FormData` com arquivos/texto/playbook/mode/tões.
2.  **Backend** (proxy) faz:
    *   upload em partes p/ storage se necessário
*   OCR (se imagens) se necessário
*   chunking (se texto/PDF) se necessário
*   chama a API/serviço (Cloud Legal / Claude) com:
    *   `mode` (review/nda/vendor/brief/respond)
    *   `playbook`
    *   `context` (jurisdição, tipo de caso)
    *   e pede **3 variantes** de saída

Se você quiser, eu também já te escrevo um `/api/analyze` **bem pequeno** (Node/Express ou serverless) com:

*   limite, validação,
*   chunking,
*   e “fan-out” pra gerar as 3 perspectivas.

Mas antes: você tem alguma doc/link da **Cloud Legal API** (endpoints, auth, limites) ou ela é exatamente esse **Legal plugin do Claude/Cowork**? Pelas fontes públicas, o que existe descrito com detalhes é o plugin do Claude. [Claude+2LawSites+2](https://claude.com/plugins/legal)



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)