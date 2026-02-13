# Revisor Jornalístico HTML

**User:** Enio Rocha (enioxt@gmail.com)  
**Created:** 2/10/2026 21:23:11  
**Updated:** 2/10/2026 22:31:51  
**Exported:** 2/12/2026 22:58:58  
**Link:** [https://chatgpt.com/c/698bcbcd-6b08-832b-add0-4e1684542a16](https://chatgpt.com/c/698bcbcd-6b08-832b-add0-4e1684542a16)  

## Prompt:
Veja essa conversa e melhore toda a idéia e já execute ela.

Estou pensando em criar um html simples que será um revisor de matérias jornalísticas, seguindo padrões simples, sem enfeitar muito , mas organizando os textos para melhor compreensão, sempre sugerindo 3 opções de texto, em tons diferentes para cada assunto.

Pegue de exemplo esse https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html 

**Perfeita ideia!** Um revisor simples, clean e funcional é exatamente o que muita gente precisa em redações pequenas ou para jornalistas freelancers.

Criei para você um **HTML único, leve e bem organizado** (sem frameworks pesados, só Tailwind via CDN) que faz exatamente o que você pediu:

- Interface minimalista e profissional  
- Organiza o texto automaticamente (título sugerido, lead, fatos chave em bullets, corpo limpo)  
- Sempre sugere **3 opções de tom** diferentes  
- Inclui botão para carregar o exemplo que você enviou  
- Botões de copiar texto  
- Totalmente editável (o usuário pode ajustar tudo)

### O que os 3 tons que escolhi são:

1. **Neutro e Factual** → Tom jornalístico clássico, imparcial (ideal para publicação)
2. **Emocional / Humanizado** → Mais sensível, respeitoso, bom para engajar leitor
3. **Conciso e Direto** → Curto, objetivo, perfeito para redes sociais, WhatsApp, newsletter rápida

Aqui está o código completo. É só copiar, salvar como revisor-jornalistico.html e abrir no navegador.

html
<!DOCTYPE html>
<html lang="pt-BR" class="bg-gray-50">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revisor Jornalístico</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .card { transition: all 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
  </style>
</head>
<body class="min-h-screen py-8">
  <div class="max-w-5xl mx-auto px-4">
    <h1 class="text-4xl font-bold text-gray-900 mb-2 text-center">Revisor Jornalístico</h1>
    <p class="text-gray-600 text-center mb-8">Organize • Estruture • Varie o tom</p>

    <div class="flex gap-3 justify-center mb-8">
      <button onclick="carregarExemplo()" 
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
        📄 Carregar Exemplo (Patos Hoje)
      </button>
      <button onclick="limparTudo()" 
              class="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg font-medium">
        Limpar
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow p-6 mb-8">
      <textarea id="inputText" rows="12" 
                class="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 font-serif text-lg"
                placeholder="Cole aqui a matéria original..."></textarea>
      
      <button onclick="processar()" 
              class="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-semibold text-lg">
        Processar Matéria →
      </button>
    </div>

    <div id="output" class="hidden">
      <!-- Versão Organizada -->
      <div class="bg-white rounded-2xl shadow p-8 mb-10">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">📋 Versão Organizada</h2>
        <div id="organizedContent" class="prose max-w-none"></div>
      </div>

      <!-- Três Tons -->
      <h2 class="text-2xl font-bold mb-6 text-gray-800">✍️ 3 Opções de Tom</h2>
      <div class="grid md:grid-cols-3 gap-6">

        <!-- Tom 1: Neutro -->
        <div class="card bg-white rounded-2xl shadow p-6 border-t-4 border-blue-500">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">1</div>
            <h3 class="font-semibold text-xl">Neutro e Factual</h3>
          </div>
          <textarea id="tone1" class="w-full h-80 p-4 border border-gray-200 rounded-xl text-sm leading-relaxed"></textarea>
          <button onclick="copiar('tone1')" class="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">📋 Copiar</button>
        </div>

        <!-- Tom 2: Emocional -->
        <div class="card bg-white rounded-2xl shadow p-6 border-t-4 border-rose-500">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-bold">2</div>
            <h3 class="font-semibold text-xl">Emocional / Humanizado</h3>
          </div>
          <textarea id="tone2" class="w-full h-80 p-4 border border-gray-200 rounded-xl text-sm leading-relaxed"></textarea>
          <button onclick="copiar('tone2')" class="mt-3 text-rose-600 hover:text-rose-700 text-sm font-medium">📋 Copiar</button>
        </div>

        <!-- Tom 3: Conciso -->
        <div class="card bg-white rounded-2xl shadow p-6 border-t-4 border-amber-500">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold">3</div>
            <h3 class="font-semibold text-xl">Conciso e Direto</h3>
          </div>
          <textarea id="tone3" class="w-full h-80 p-4 border border-gray-200 rounded-xl text-sm leading-relaxed"></textarea>
          <button onclick="copiar('tone3')" class="mt-3 text-amber-600 hover:text-amber-700 text-sm font-medium">📋 Copiar</button>
        </div>
      </div>

      <p class="text-center text-gray-500 text-sm mt-10">
        Dica: Para outras matérias, cole o texto e use uma IA (Grok, Claude, GPT) com o prompt:<br>
        <span class="font-mono bg-gray-100 px-2 py-1 rounded">"Reescreva esta notícia em tom neutro / emocional / conciso"</span>
      </p>
    </div>
  </div>

  <script>
    const exemplo = `Um jovem de 26 anos foi encontrado morto dentro de um apartamento localizado no bairro Sorriso em Patos de Minas. A Polícia Militar isolou o local e aguarda a chegada da perícia para apurar melhor os fatos. A suspeita é de que ele tenha sido assassinado durante a noite.

O apartamento fica no segundo andar de um prédio localizado na rua São Geraldo. Uma vizinha teria escutado uma confusão durante a noite e, nesta manhã, ao observar pela janela, ela percebeu que havia uma mancha de sangue. Desconfiada de que algo grave havia acontecido, a mulher acionou a Polícia Militar, que encontrou o jovem já sem vida.

A informação é de que há muito sangue no apartamento. A suspeita é de que o jovem tenha sido assassinado a golpes de faca. A Polícia Civil também está no local iniciando as investigações para descobrir o que de fato aconteceu.

A vítima foi identificada como Kenedy Rodrigues Campos, de 26 anos. O corpo foi encaminhado para o IML de Patos de Minas para ser constatada a causa da morte.`;

    function carregarExemplo() {
      document.getElementById('inputText').value = exemplo;
      processar();
    }

    function processar() {
      const texto = document.getElementById('inputText').value.trim();
      if (!texto) return alert("Cole uma matéria primeiro!");

      // Versão Organizada
      const paragrafos = texto.split('\n\n').filter(p => p.trim());
      let htmlOrganizado = `
        <h3 class="text-2xl font-bold mb-3">Jovem de 26 anos é assassinado em apartamento em Patos de Minas</h3>
        <p class="text-lg text-gray-700 mb-6"><strong>Lead:</strong> Kenedy Rodrigues Campos, de 26 anos, foi encontrado morto dentro de seu apartamento no bairro Sorriso, em Patos de Minas. A polícia suspeita de assassinato.</p>
        
        <h4 class="font-semibold text-lg mb-3">Fatos principais:</h4>
        <ul class="list-disc pl-6 space-y-2 mb-8 text-gray-700">
          <li>Vítima: Kenedy Rodrigues Campos, 26 anos</li>
          <li>Local: Apartamento no 2º andar, rua São Geraldo, bairro Sorriso</li>
          <li>Descoberta: Vizinha ouviu confusão à noite e viu mancha de sangue pela manhã</li>
          <li>Causa suspeita: Golpes de faca</li>
          <li>Investigação: PM isolou o local, perícia e Polícia Civil atuam</li>
        </ul>
        
        <h4 class="font-semibold text-lg mb-3">Corpo da matéria:</h4>
      `;

      paragrafos.forEach(p => {
        htmlOrganizado += `<p class="mb-4 text-gray-700">${p}</p>`;
      });

      document.getElementById('organizedContent').innerHTML = htmlOrganizado;

      // Preenche os tons (com o exemplo)
      document.getElementById('tone1').value = `Na manhã desta terça-feira, a Polícia Militar encontrou o corpo de Kenedy Rodrigues Campos, de 26 anos, em um apartamento no bairro Sorriso, em Patos de Minas. A suspeita é de assassinato a golpes de faca durante a noite anterior. Uma vizinha ouviu confusão e acionou a polícia após ver manchas de sangue. O local foi isolado e a perícia foi chamada. A Polícia Civil investiga o caso.`;
      
      document.getElementById('tone2').value = `Uma tragédia abalou o bairro Sorriso, em Patos de Minas. O jovem Kenedy Rodrigues Campos, de apenas 26 anos, foi encontrado morto dentro de seu apartamento. Vizinhos relatam que ouviram sons de discussão durante a noite. Pela manhã, uma moradora viu manchas de sangue e, desesperada, chamou a polícia. A família agora enfrenta a dor de uma perda violenta e ainda sem respostas.`;
      
      document.getElementById('tone3').value = `Kenedy Rodrigues Campos, 26 anos, foi encontrado morto a facadas em apartamento no bairro Sorriso, Patos de Minas.\n\nVizinha ouviu confusão à noite e viu sangue pela manhã. PM isolou o local. Polícia Civil investiga suspeita de homicídio.`;

      document.getElementById('output').classList.remove('hidden');
      window.scrollTo({ top: document.getElementById('output').offsetTop - 50, behavior: 'smooth' });
    }

    function copiar(id) {
      const textarea = document.getElementById(id);
      textarea.select();
      document.execCommand('copy');
      alert('Texto copiado!');
    }

    function limparTudo() {
      document.getElementById('inputText').value = '';
      document.getElementById('output').classList.add('hidden');
    }
  </script>
</body>
</html>

Quer que eu ajuste algo?  
Por exemplo: mudar os tons, adicionar um quarto tom (investigativo, sensacionalista controlado, etc.), colocar modo escuro, ou transformar em versão com mais campos (autor, data, fonte, etc.)?

É só falar que eu melhoro rapidinho!

**Excelente evolução!** Vamos transformar seu revisor em uma ferramenta profissional com IA via **OpenRouter**.

Adicionei:

- Campo para inserir sua **API Key** do OpenRouter (salva apenas no navegador via localStorage)
- Seleção de modelos (Claude 3.5 Sonnet é o default recomendado para texto jornalístico — excelente estilo e ética)
- Botão **"Gerar com IA"** que envia a matéria para a API
- **System prompt extremamente bem construído** (testado mentalmente para máxima qualidade e ética jornalística)
- A IA retorna JSON estruturado → preenche automaticamente a versão organizada + as 3 versões em tons diferentes
- Mantive o processamento local como fallback
- Loading state e tratamento básico de erros

### Código atualizado completo (substitua o anterior)

html
<!DOCTYPE html>
<html lang="pt-BR" class="bg-gray-50">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revisor Jornalístico • IA</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .card { transition: all 0.2s; }
    .card:hover { transform: translateY(-4px); }
  </style>
</head>
<body class="min-h-screen py-8">
  <div class="max-w-6xl mx-auto px-4">
    <h1 class="text-4xl font-bold text-gray-900 mb-2 text-center">Revisor Jornalístico com IA</h1>
    <p class="text-gray-600 text-center mb-8">OpenRouter • System Prompt Otimizado</p>

    <!-- Configurações API -->
    <div class="bg-white rounded-2xl shadow p-6 mb-8">
      <h3 class="font-semibold mb-4">Configuração OpenRouter</h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">API Key</label>
          <input id="apiKey" type="password" placeholder="sk-or-..." 
                 class="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500">
          <p class="text-xs text-gray-500 mt-1">Salva apenas no seu navegador</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Modelo</label>
          <select id="modelSelect" class="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500">
            <option value="anthropic/claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (melhor qualidade)</option>
            <option value="google/gemini-2.0-flash-exp">Gemini 2.0 Flash (rápido e barato)</option>
            <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B</option>
            <option value="qwen/qwen2.5-72b-instruct">Qwen 2.5 72B</option>
          </select>
        </div>
      </div>
      <button onclick="salvarConfig()" 
              class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
        Salvar Configurações
      </button>
    </div>

    <!-- Input -->
    <div class="bg-white rounded-2xl shadow p-6 mb-8">
      <textarea id="inputText" rows="12" 
                class="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 font-serif text-lg"
                placeholder="Cole a matéria original aqui..."></textarea>
      
      <div class="flex gap-4 mt-4">
        <button onclick="processarLocal()" 
                class="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-4 rounded-xl font-semibold">
          Processar Local (básico)
        </button>
        <button onclick="gerarComIA()" 
                class="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2">
          <span>✨ Gerar com IA (OpenRouter)</span>
          <span id="loading" class="hidden animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
        </button>
      </div>
    </div>

    <div id="output" class="hidden">
      <!-- Versão Organizada -->
      <div class="bg-white rounded-2xl shadow p-8 mb-10">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">📋 Versão Organizada</h2>
        <div id="organizedContent" class="prose max-w-none"></div>
      </div>

      <!-- Três Tons -->
      <h2 class="text-2xl font-bold mb-6 text-gray-800">✍️ Versões Geradas pela IA</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="card bg-white rounded-2xl shadow p-6 border-t-4 border-blue-500">
          <h3 class="font-semibold text-xl mb-4">Neutro e Factual</h3>
          <textarea id="tone1" class="w-full h-80 p-4 border border-gray-200 rounded-xl text-sm leading-relaxed"></textarea>
          <button onclick="copiar('tone1')" class="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">📋 Copiar</button>
        </div>

        <div class="card bg-white rounded-2xl shadow p-6 border-t-4 border-rose-500">
          <h3 class="font-semibold text-xl mb-4">Emocional e Humanizado</h3>
          <textarea id="tone2" class="w-full h-80 p-4 border border-gray-200 rounded-xl text-sm leading-relaxed"></textarea>
          <button onclick="copiar('tone2')" class="mt-3 text-rose-600 hover:text-rose-700 text-sm font-medium">📋 Copiar</button>
        </div>

        <div class="card bg-white rounded-2xl shadow p-6 border-t-4 border-amber-500">
          <h3 class="font-semibold text-xl mb-4">Conciso e Direto</h3>
          <textarea id="tone3" class="w-full h-80 p-4 border border-gray-200 rounded-xl text-sm leading-relaxed"></textarea>
          <button onclick="copiar('tone3')" class="mt-3 text-amber-600 hover:text-amber-700 text-sm font-medium">📋 Copiar</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const SYSTEM_PROMPT = `Você é um editor-chefe jornalístico brasileiro experiente, ético e premiado, com passagem por grandes redações.

Sua missão é transformar matérias cruas em textos profissionais, claros, éticos e atraentes.

Regras obrigatórias:
- Fidelidade absoluta aos fatos. Nunca invente ou exagere.
- Em casos de crime, morte ou tragédia: seja respeitoso com vítimas e familiares. Evite sensacionalismo.
- Português brasileiro claro, correto e fluido.

Para o texto fornecido, faça:
1. Versão organizada (título + lead forte + fatos principais em bullets + corpo fluido)
2. Três versões completas:
   - Neutro e Factual: estilo jornalístico tradicional, imparcial e profissional
   - Emocional e Humanizado: toque humano sensível e respeitoso, sem explorar a dor
   - Conciso e Direto: curto, impactante, ideal para redes sociais e destaques

Responda EXCLUSIVAMENTE com um JSON válido neste formato exato:

{
  "titulo": "Título sugerido",
  "lead": "Lead forte",
  "fatos_principais": ["fato 1", "fato 2", ...],
  "versao_organizada": "Texto completo da versão organizada",
  "versao_neutro": "Texto completo em tom neutro",
  "versao_emocional": "Texto completo em tom emocional",
  "versao_conciso": "Texto completo em tom conciso"
}`;

    function salvarConfig() {
      const key = document.getElementById('apiKey').value.trim();
      if (key) {
        localStorage.setItem('openrouter_key', key);
        alert('API Key salva com sucesso!');
      }
    }

    async function gerarComIA() {
      const key = localStorage.getItem('openrouter_key') || document.getElementById('apiKey').value.trim();
      if (!key) {
        alert("Insira sua API Key do OpenRouter primeiro.");
        return;
      }

      const model = document.getElementById('modelSelect').value;
      const texto = document.getElementById('inputText').value.trim();
      if (!texto) return alert("Cole uma matéria primeiro!");

      const loading = document.getElementById('loading');
      loading.classList.remove('hidden');

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://revisor-jornalistico.local',
            'X-Title': 'Revisor Jornalístico IA'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: texto }
            ],
            response_format: { type: "json_object" },
            temperature: 0.65,
            max_tokens: 4500
          })
        });

        if (!response.ok) throw new Error('Erro na API');

        const data = await response.json();
        const content = data.choices[0].message.content;
        const json = JSON.parse(content);

        // Preenche tudo
        preencherOrganizado(json);
        document.getElementById('tone1').value = json.versao_neutro || '';
        document.getElementById('tone2').value = json.versao_emocional || '';
        document.getElementById('tone3').value = json.versao_conciso || '';

        document.getElementById('output').classList.remove('hidden');
        window.scrollTo({ top: document.getElementById('output').offsetTop - 50, behavior: 'smooth' });

      } catch (err) {
        alert("Erro ao chamar a IA: " + err.message + "\n\nVerifique sua chave e limite de crédito.");
        console.error(err);
      } finally {
        loading.classList.add('hidden');
      }
    }

    function preencherOrganizado(json) {
      let html = `
        <h3 class="text-2xl font-bold mb-3">${json.titulo || 'Título gerado pela IA'}</h3>
        <p class="text-lg text-gray-700 mb-6"><strong>Lead:</strong> ${json.lead || ''}</p>
        
        <h4 class="font-semibold text-lg mb-3">Fatos principais:</h4>
        <ul class="list-disc pl-6 space-y-2 mb-8 text-gray-700">
          ${(json.fatos_principais || []).map(f => `<li>${f}</li>`).join('')}
        </ul>
        
        <div class="prose">${(json.versao_organizada || '').replace(/\n/g, '<br>')}</div>
      `;
      document.getElementById('organizedContent').innerHTML = html;
    }

    function processarLocal() {
      // Mantém o processamento básico antigo (pode expandir depois)
      alert("Processamento local básico ativado. Use o botão 'Gerar com IA' para resultados muito melhores.");
      // Aqui você pode manter ou expandir o código antigo se quiser
    }

    function copiar(id) {
      const ta = document.getElementById(id);
      ta.select();
      document.execCommand('copy');
      alert('Copiado!');
    }

    // Carrega key salva
    window.onload = () => {
      const savedKey = localStorage.getItem('openrouter_key');
      if (savedKey) document.getElementById('apiKey').value = savedKey;
    };
  </script>
</body>
</html>

**Como usar:**
1. Acesse [openrouter.ai/keys](https://openrouter.ai/keys), crie uma chave gratuita.
2. Cole a chave no campo e salve.
3. Escolha o modelo (Claude 3.5 Sonnet é excelente para jornalismo).
4. Cole a matéria → clique em **"Gerar com IA"**.

Quer que eu ajuste o system prompt (mais rigoroso, mais criativo, inclua tom investigativo, etc.) ou adicione mais funcionalidades (histórico, exportar PDF, múltiplas matérias)?

## Response:
Thought for 1m 33s

Enio, bora transformar isso num **produto de redação** (sem firula) — e já te entrego **o HTML pronto** + a **execução no exemplo** do Patos Hoje.

* * *

1) Melhorias que deixam a ideia “profissional” (sem complicar)
--------------------------------------------------------------

O teu revisor vira bem mais útil quando ele deixa de ser só “reescritor” e vira **pipeline editorial**:

1.  **Estrutura padrão de notícia**
    *   Título sugerido (sem afirmar o que não está confirmado)
*   Lead em 1–2 frases
*   “Fatos principais” em bullets (pra editor bater o olho)
*   Corpo reescrito, fluido, sem redundância
    2.  **3 tons sempre (do jeito certo)**
    *   **Neutro/Factual** (publicável)
*   **Humanizado** (respeitoso, sem explorar dor)
*   **Conciso** (pra social/WhatsApp/push)
    3.  **Camada de “qualidade editorial”**
    *   Checklist (precisão, linguagem, risco jurídico/ético, lacunas)
*   Perguntas de apuração (o que falta pra fechar a matéria)
    4.  **Import por URL (sem dor de CORS)**
    *   HTML local não consegue buscar páginas direto por causa de CORS.
*   Solução simples e limpa: campo pra você colocar **um proxy** (Cloudflare Worker). O HTML já vem com isso pronto + exemplo no final do arquivo.
    5.  **IA opcional via OpenRouter (e modo local fallback)**
    *   Sem IA: organiza e gera versões “básicas” (heurísticas) só pra quebrar galho.
*   Com IA: retorna JSON estruturado e preenche tudo automaticamente.

* * *

2) Execução no exemplo (Patos Hoje) — já reescrito
--------------------------------------------------

Baseado no texto publicado em **10/02/2026 10:09**, que diz que a PM isolou o local, a perícia foi acionada, há **suspeita** de homicídio (arma branca) e a Polícia Civil investiga; vítima identificada e corpo encaminhado ao IML. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

### Versão organizada (padrão redação)

**Título sugerido**  
**Polícia apura morte de jovem encontrado em apartamento no bairro Sorriso, em Patos de Minas** [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

**Lead**  
Um jovem de 26 anos foi encontrado morto dentro de um apartamento no bairro Sorriso, em Patos de Minas, na manhã desta terça-feira (10). A Polícia Militar isolou o local e a suspeita é de que a morte tenha ocorrido durante a noite, em circunstâncias investigadas como possível homicídio. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

**Fatos principais**

*   Vítima: **Kenedy Rodrigues Campos**, 26 anos. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   Local: apartamento no **2º andar**, **rua São Geraldo**, bairro Sorriso. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   Acionamento: vizinha relatou ter ouvido confusão à noite e viu **mancha de sangue** pela manhã. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   Suspeita: homicídio, possivelmente por **golpes de faca** (informação tratada como suspeita no texto). [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   Providências: PM isolou; perícia acionada; Polícia Civil iniciou apuração. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   Encaminhamento: corpo levado ao **IML** para confirmação da causa da morte. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

**Corpo (fluido, sem repetir e sem “condenar” antes da hora)**  
A Polícia Militar foi acionada na manhã desta terça-feira (10) após uma moradora relatar ter ouvido uma confusão durante a noite em um prédio na rua São Geraldo, no bairro Sorriso. Ao observar o local pela janela, ela teria percebido uma mancha de sangue e chamou a polícia. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

No apartamento, os militares encontraram um jovem de 26 anos já sem vida. Segundo as informações iniciais, havia muito sangue no imóvel, e a hipótese considerada é a de que a morte possa ter ocorrido durante a noite, com suspeita de homicídio. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

A perícia foi acionada para os trabalhos técnicos e a Polícia Civil iniciou a investigação para esclarecer o que aconteceu e se houve participação de terceiros. A vítima foi identificada como Kenedy Rodrigues Campos, e o corpo foi encaminhado ao IML para confirmação da causa da morte. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

* * *

### 3 opções de tom

#### 1) Neutro e factual (publicável)

A Polícia Militar foi acionada na manhã desta terça-feira (10) após a denúncia de uma possível ocorrência em um prédio na rua São Geraldo, no bairro Sorriso, em Patos de Minas. No local, os militares encontraram um jovem de 26 anos morto dentro de um apartamento. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

Conforme as informações iniciais, uma vizinha relatou ter ouvido uma confusão durante a noite e, pela manhã, notou uma mancha de sangue ao observar o imóvel. A área foi isolada para o trabalho da perícia. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

Há suspeita de que o jovem tenha sido vítima de homicídio, possivelmente por golpes de faca, hipótese que será apurada pela Polícia Civil. A vítima foi identificada como Kenedy Rodrigues Campos, de 26 anos, e o corpo foi encaminhado ao IML para exames que devem apontar a causa da morte. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

#### 2) Humanizado (respeitoso, sem explorar dor)

Um jovem de 26 anos foi encontrado morto dentro do próprio apartamento no bairro Sorriso, em Patos de Minas, na manhã desta terça-feira (10). A Polícia Militar isolou o local e a perícia foi acionada para esclarecer as circunstâncias do caso. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

Segundo o relato inicial, uma vizinha ouviu uma confusão durante a noite e, ao perceber sinais de sangue pela manhã, chamou a polícia. A suspeita é de que a morte tenha ocorrido durante a madrugada, e a Polícia Civil já iniciou a investigação. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

A vítima foi identificada como Kenedy Rodrigues Campos. O corpo foi encaminhado ao IML, onde exames devem confirmar a causa da morte. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

#### 3) Conciso e direto (social/WhatsApp)

Patos de Minas: jovem de 26 anos é encontrado morto em apartamento no bairro Sorriso. PM isolou o local e a perícia foi acionada. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

Vizinha relatou confusão à noite e mancha de sangue pela manhã. Polícia Civil investiga suspeita de homicídio. Vítima: Kenedy Rodrigues Campos. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)

* * *

### Checklist rápido (pra elevar o padrão antes de publicar)

*   Evitar cravar “assassinato” como fato; manter **“suspeita/hipótese”**. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   Confirmar com fonte oficial: causa preliminar/arma, se houve prisão, se há suspeitos.
*   Checar grafia do nome da vítima (documento/PC/IML). [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   Atualizar se houver nota oficial (PM/PC/IML).
*   Cortar repetição (“muito sangue… suspeita…”) mantendo informação essencial. [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   Linguagem respeitosa (sem detalhes desnecessários).

### Perguntas de apuração (pra “fechar a matéria” direito)

*   Horário estimado da morte (perícia/IML)? [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   Houve sinais de arrombamento ou luta?
*   A vítima estava sozinha? Tinha visitas registradas?
*   Há câmeras no prédio/rua São Geraldo? [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   O IML já indicou causa provável (mesmo que preliminar)? [patoshoje.com.br](https://patoshoje.com.br/noticias/jovem-de-26-anos-e-encontrado-morto-em-patos-de-minas-policia-suspeita-de-assassinato-94368.html)
*   A Polícia Civil trabalha com quais linhas (roubo, conflito, motivação pessoal)?

* * *

3) O HTML melhorado (pronto pra usar)
-------------------------------------

Aqui está o arquivo já gerado pra você baixar e abrir no navegador:

Baixar o HTML do Revisor Jornalístico (OpenRouter)

Ele já vem com:

*   UI clean (sem Tailwind, leve)
*   **Modo local** + **Modo IA**
*   **3 tons + versão organizada**
*   Checklist + perguntas de apuração
*   Importação por URL via **proxy opcional**
*   Exportação **Markdown** e botões de copiar

Se você quiser, eu também consigo adaptar esse HTML pra virar um “mini-app” do EGOS (ex.: salvar histórico em JSON, versionar prompts, presets por editoria: Polícia, Política, Saúde, etc.).



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)