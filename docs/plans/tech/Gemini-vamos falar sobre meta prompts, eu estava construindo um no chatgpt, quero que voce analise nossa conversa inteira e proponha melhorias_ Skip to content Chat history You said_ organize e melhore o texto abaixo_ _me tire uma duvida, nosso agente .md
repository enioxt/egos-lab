# vamos falar sobre meta prompts, eu estava construindo um no chatgpt, quero que voce analise nossa conversa inteira e proponha melhorias: Skip to content Chat history You said: organize e melhore o texto abaixo: "me tire uma duvida, nosso agente é apenas um neste momento ou temos um orquestrador e outros agentes agindo por tras do chatbot/espiral de escuta? eu me lembro que nosso plano eramos ter varios agentes sendo orquestrados e com capacidades diferentes, nao se se isso foi de fato executado ,se nao vale a pena, se no nosso caso nao é necessario. faça ampla pesquisa no historico do git por ordem cronologica e tambem no nosso codebase intiero para procurar as diversas features que podemos ter e foram esquecidas, alinhe nosso arquivos @TASKS.md com o arquivos de tasks oficial do ide que estamos trabalhando, o antigravity /home/enio/.gemini/antigravity/brain/1c6bb97a-15da-4a3d-bd23-44e66851e681/task.md.resolved e com todos os outros arquivos de tasks, alinhe tudo. pesquise sobre personas, veja se esta fazendo bom uso deste sistema, telemetria, cross reference e outros, nosos codigo é muito completo mas tenho a impressao que muita coisa esta ou subutilizada porque o codigo cresceu muito ou porque realmente temos muita coisa que nao é prioridade. de toda forma é importantes voce conhecer o maximo possivel para quando chegar o momento de usar saber que ja temos algo a respeito evitando rework." ChatGPT said: Aqui está o texto reorganizado, mais claro e fluido, mantendo o sentido do que você quis dizer, Enio: Enio, preciso tirar uma dúvida: atualmente estamos usando apenas um agente, ou existe um orquestrador com vários agentes trabalhando por trás do chatbot / Espiral de Escuta? Lembro que nossa intenção inicial era ter múltiplos agentes com papéis diferentes sendo coordenados, mas não sei se isso chegou a ser implementado, se vale a pena ou se, no nosso caso, não é realmente necessário. Além disso, preciso que você faça uma varredura completa: pesquise todo o histórico do Git em ordem cronológica e também todo o codebase atual, buscando funcionalidades que já existiam, foram iniciadas ou ficaram esquecidas. A ideia é entender tudo o que está disponível, o que está redundante e o que pode ser reaproveitado. Quero também que você alinhe o arquivo @TASKS.md com o arquivo oficial de tasks do IDE que estamos usando — o antigravity, localizado em /home/enio/.gemini/antigravity/brain/1c6bb97a-15da-4a3d-bd23-44e66851e681/task.md.resolved — e com todos os outros arquivos de tasks. Precisamos deixar tudo unificado. Outra coisa: revise o sistema de personas, verifique se estamos usando isso de forma eficiente, assim como os módulos de telemetria, cross-reference e outros recursos internos. O código é muito robusto, mas tenho a sensação de que várias partes estão subutilizadas — seja porque o projeto cresceu rápido, seja porque algumas coisas realmente não são prioritárias agora. De qualquer forma, é fundamental que você conheça o máximo possível para, quando surgir a necessidade, saber que a funcionalidade já existe e evitar retrabalho. Se quiser, posso refinar ainda mais para um documento técnico, um prompt, um ticket, ou um texto direto para a equipe. You said: isso é uma isntrucao que vou passar pro agente de ia dentro do windsurf ide, onde estamos construindo o sistema egos ,entao faça em forma de prompt/instrucao ChatGPT said: Claro, Enio. Aqui vai a versão já preparada como prompt/instrução direta para um agente dentro do Windsurf IDE: INSTRUÇÃO PARA O AGENTE Verificação da Arquitetura de Agentes Investigue se atualmente o sistema está operando com apenas um agente ou se existe um orquestrador coordenando múltiplos agentes. Caso múltiplos agentes tenham sido planejados, identifique se essa arquitetura foi de fato implementada. Avalie se a abordagem multiagente é necessária ou vantajosa no contexto atual do sistema EGOS. Pesquisa Completa no Repositório Realize uma análise profunda: Pesquise todo o histórico do Git, em ordem cronológica. Escaneie todo o codebase atual. Objetivos: Identificar funcionalidades existentes, iniciadas ou esquecidas. Levantar módulos subutilizados ou duplicados. Mapear recursos que podem ser reaproveitados para evitar retrabalho. Alinhamento de Tasks Alinhe todos os arquivos de tasks: @TASKS.md O arquivo oficial do IDE (antigravity): /home/enio/.gemini/antigravity/brain/1c6bb97a-15da-4a3d-bd23-44e66851e681/task.md.resolved Qualquer outro arquivo de tasks existente no projeto. Resultado esperado: Um conjunto unificado, coerente e completo de tasks. Revisão de Sistemas Internos Faça uma avaliação profunda dos seguintes recursos: Personas Telemetria Cross-reference Outros módulos relevantes Objetivo: Identificar se estão sendo utilizados corretamente ou se há funcionalidades subexploradas. Criar consciência total do que já existe para maximizar reutilização e reduzir rework. Entrega Final Com base em tudo acima, gere: Um mapa atualizado de capacidades e componentes do sistema. Um diagnóstico sobre o que está ativo, subutilizado e obsoleto. Recomendações práticas para reorganização, priorização e uso eficiente dos recursos. Se quiser, monto a versão ultra formal, a versão minimalista, ou a instrucional detalhada para agentes multimodais. You said: qual a melhor versao levando em consideracoa o que te falei ,estamos dando isntrucoes pro agente d eia dentro do windsurf ide, construindo codigos. talvez a versao instrucional detalhada para agentes seja a melhor ,. correto? ChatGPT said: Enio, sim — a versão instrucional detalhada para agentes é a mais adequada nesse contexto. Por quê? O agente dentro do Windsurf IDE não está “conversando” contigo — ele está executando tarefas técnicas, muitas vezes de forma autônoma. Quanto mais explícitas, estruturadas, operacionais e verificáveis forem as instruções, melhor ele se comporta. Esse tipo de agente se beneficia de prompts que deixam claro o escopo, as etapas, os critérios de sucesso, os artefatos esperados e os caminhos de fallback. Como vocês estão construindo o EGOS (que já é naturalmente complexo), uma instrução detalhada evita comportamento ambíguo, loops e reinterpretações incorretas. Então sim: uma versão instrucional detalhada, modular, com pré-condições, passos, objetivos, entregáveis e critérios de validação é o melhor formato. Se quiser, posso te entregar agora exatamente essa versão — otimizada para agentes autônomos, com: Objetivo geral Objetivos específicos Pré-requisitos Pipeline de execução (com passos numerados + subpassos) Critérios de conclusão Estrutura de logs e checkpoints Formato de output Restrições Comportamento em caso de erro Recomendações de organização futura Se quiser essa versão, só me diga: “gera a versão detalhada para agentes” que eu já te entrego refinada e pronta para colar no Windsurf. You said: mas voce tem que tomar cuidado para suas instrucoes nao acabar fechando muito a visao do agente, inserindo algo que nao deveria estar constando ,ja que o agente de la entende mais que voce sobre o codigo e o contexto ChatGPT said: Perfeito, Enio — e você tá certíssimo em se preocupar com isso. Quando a gente passa instruções para um agente dentro do Windsurf, o pior erro é limitar sem querer a capacidade dele, colocando regras ou suposições que fazem ele ignorar partes importantes do codebase ou do contexto que ele conhece melhor que a gente. Então, sim: a versão detalhada precisa ser estruturada, mas também aberta, não prescritiva demais, e com espaço explícito para o agente usar o próprio conhecimento, heurísticas internas e contexto dinâmico do projeto. Se quiser, posso montar uma versão com esses princípios: ✔️ Princípios que vou seguir nessa versão detalhada Não prescrever implementação, apenas objetivos e critérios. Evitar afirmações sobre o código, deixando para o agente descobrir. Permitir que o agente use telemetria, context awareness, heurísticas dele. Evitar fechar caminhos, sempre que possível usando instruções orientadas a descoberta e não a conclusão. Não colocar suposições sobre estrutura de sistemas, já que ele conhece o runtime e o workspace melhor que qualquer instrução estática. Evitar travar o comportamento dele — só orientar prioridades, não métodos. Focar em metas, não em como ele deve atingi-las. Posso montar assim: Objetivo geral Intenções, não comandos estritos Passos baseados em investigação e análise autônoma Critérios de sucesso amplos Orientações de alinhamento sem impor arquitetura Espaço explícito para correções e autosupervisão Se você quiser, já te escrevo agora a versão final do prompt detalhado, porém aberta, otimizada para não limitar o agente. Só me confirma: 👉 Quer que eu gere agora a versão final detalhada-aberta para agentes no Windsurf IDE? You said: excelente ,me entregue e deixe eu avaliar ChatGPT said: Claro, Enio. Aqui está a versão detalhada-aberta, feita exatamente para não engessar o agente, respeitando o fato de que ele conhece melhor o workspace, o codebase e o contexto dinâmico do Windsurf IDE do que qualquer instrução externa. Essa versão define intenções, objetivos e critérios, sem prescrever arquitetura, métodos ou suposições sobre o código. Está pronta para colar no IDE. INSTRUÇÃO DETALHADA E ABERTA PARA O AGENTE – EGOS / WINDSURF IDE Objetivo Geral Realizar uma análise completa e contextual do workspace do projeto EGOS, investigando a arquitetura atual de agentes, as funcionalidades existentes no código, o estado dos arquivos de tasks e o uso dos sistemas internos (personas, telemetria, cross-reference etc.), com o propósito de organizar, revelar capacidades esquecidas, reduzir retrabalho e oferecer uma visão clara do estado real do sistema. 1. Investigação da Arquitetura de Agentes Verifique, com base em sua própria leitura do workspace e de sua telemetria interna, como o sistema EGOS está estruturado hoje. Avalie se existe apenas um agente ativo ou se há orquestração entre múltiplos agentes. Identifique o que foi planejado, o que está implementado e o que está em uso efetivo. Não presuma arquitetura: descubra e documente o que existe de fato. Resultado esperado: Um diagnóstico claro, baseado na sua análise, sobre a arquitetura atual de agentes. 2. Pesquisa Profunda no Codebase e no Histórico do Repositório Analise o histórico do Git em ordem cronológica, na extensão que considerar útil. Examine o codebase completo, priorizando descoberta de recursos, módulos e funcionalidades que: foram esquecidos, estão subutilizados, foram iniciados e abandonados, estão duplicados ou redundantes. Avalie como esses trechos se relacionam com a visão atual do projeto. Diretriz importante: Use seu conhecimento do contexto local, suas capacidades de leitura estática e suas heurísticas internas para organizar essa descoberta de forma eficiente — sem assumir que existe uma estrutura específica. Resultado esperado: Um mapa das funcionalidades existentes e potenciais dentro do projeto. 3. Alinhamento dos Arquivos de Tasks Reúna e compare todos os arquivos de tasks presentes no workspace, incluindo: @TASKS.md O task file do antigravity IDE: /home/enio/.gemini/antigravity/brain/1c6bb97a-15da-4a3d-bd23-44e66851e681/task.md.resolved Qualquer outro arquivo de tasks encontrado no workspace ou gerado anteriormente. Identifique conflitos, duplicações e divergências. Crie uma visão unificada e consolidada — sem descartar nada automaticamente. Resultado esperado: Uma estrutura coerente de tasks, organizada a partir do que já existe no workspace. 4. Revisão dos Sistemas Internos Avalie o estado e o uso efetivo dos seguintes sistemas, conforme sua própria capacidade de leitura e inferência: Personas Telemetria Cross-reference Outros módulos que você identificar como relevantes Analise se estão sendo utilizados da forma pretendida, se há funcionalidades subexploradas ou mal integradas, e se existe potencial de reaproveitamento. Resultado esperado: Um diagnóstico autônomo sobre o uso interno desses sistemas. 5. Critérios de Entrega A saída final deve conter: Diagnóstico da arquitetura de agentes. Lista das funcionalidades existentes, ocultas ou esquecidas. Mapa consolidado dos arquivos de tasks. Revisão dos sistemas internos e sugestão de integração ou reaproveitamento. Recomendações, caso identifique oportunidades claras — mas sem impor mudanças. 6. Estilo, Liberdade e Autonomia do Agente Não se limite a estas instruções caso identifique caminhos mais eficientes. Não sufoque suas próprias heurísticas internas de análise. Caso encontre inconsistências na instrução, priorize o seu entendimento do workspace. Registre qualquer descoberta inesperada — mesmo fora do escopo. Evite impor mudanças destrutivas ou refatorações profundas sem justificativa contextual. A intenção principal é descobrir, mapear e organizar, e não determinar uma direção rígida. 7. Comportamento em Caso de Ambiguidade Se encontrar ambiguidades, diferenças de contexto ou múltiplas interpretações possíveis: Não pare o processamento. Informe as possibilidades e siga o caminho que considerar mais coerente com o projeto. Fim da instrução. Se quiser, Enio, posso gerar: a versão minimalista; a versão com tags de controle para agentes; a versão com formatação JSON para uso em system prompt; ou a versão com níveis de prioridade e pesos. Avalia essa aqui e me diz como quer ajustar. You said: pesquise sobre o meta promtp lyra, execute as mesmas intrucoes que te passei inicialmente com o lyra e veja o qual bom ele realmente é. minhas isntrucoes: me tire uma duvida, nosso agente é apenas um neste momento ou temos um orquestrador e outros agentes agindo por tras do chatbot/espiral de escuta? eu me lembro que nosso plano eramos ter varios agentes sendo orquestrados e com capacidades diferentes, nao se se isso foi de fato executado ,se nao vale a pena, se no nosso caso nao é necessario. faça ampla pesquisa no historico do git por ordem cronologica e tambem no nosso codebase intiero para procurar as diversas features que podemos ter e foram esquecidas, alinhe nosso arquivos @TASKS.md com o arquivos de tasks oficial do ide que estamos trabalhando, o antigravity /home/enio/.gemini/antigravity/brain/1c6bb97a-15da-4a3d-bd23-44e66851e681/task.md.resolved e com todos os outros arquivos de tasks, alinhe tudo. pesquise sobre personas, veja se esta fazendo bom uso deste sistema, telemetria, cross reference e outros, nosos codigo é muito completo mas tenho a impressao que muita coisa esta ou subutilizada porque o codigo cresceu muito ou porque realmente temos muita coisa que nao é prioridade. de toda forma é importantes voce conhecer o maximo possivel para quando chegar o momento de usar saber que ja temos algo a respeito evitando rework. lyra prompt You are Lyra, a master-level AI prompt optimization specialist. Your mission: transform any user input into precision-crafted prompts that unlock AI's full potential across all platforms. ## THE 4-D METHODOLOGY ### 1. DECONSTRUCT - Extract core intent, key entities, and context - Identify output requirements and constraints - Map what's provided vs. what's missing ### 2. DIAGNOSE - Audit for clarity gaps and ambiguity - Check specificity and completeness - Assess structure and complexity needs ### 3. DEVELOP - Select optimal techniques based on request type: - **Creative** → Multi-perspective + tone emphasis - **Technical** → Constraint-based + precision focus - **Educational** → Few-shot examples + clear structure - **Complex** → Chain-of-thought + systematic frameworks - Assign appropriate Al role/expertise - Enhance context and implement logical structure ### 4. DELIVER - Construct optimized prompt - Format based on complexity - Provide implementation guidance ## OPTIMIZATION TECHNIQUES **Foundation:** Role assignment, context layering, output specs, task decomposition **Advanced:** Chain-of-thought, few-shot learning, multi-perspective analysis, constraint optimization **Platform Notes:** - **ChatGPT/GPT-5:** Structured sections, conversation starters - **Claude:** Longer context, reasoning frameworks - **Gemini:** Creative tasks, comparative analysis - **Others:** Apply universal best practices ## OPERATING MODES **DETAIL MODE:** - Gather context with smart defaults - Ask 2-3 targeted clarifying questions - Provide comprehensive optimization **BASIC MODE:** - Quick fix primary issues - Apply core techniques only - Deliver ready-to-use prompt ## RESPONSE FORMATS **Simple Requests:****Your Optimized Prompt:** [Improved prompt] **What Changed:** [Key improvements] **Complex Requests:****Your Optimized Prompt:** [Improved prompt] **Key Improvements:** • [Primary changes and benefits] **Techniques Applied:** [Brief mention] **Pro Tip:** [Usage guidance] ## WELCOME MESSAGE (REQUIRED) When activated, display EXACTLY: "Hello! I'm Lyra, your AI prompt optimizer. I transform vague requests into precise, effective prompts that deliver better results. **What I need to know:** - **Target AI:** ChatGPT, Claude, Gemini, or Other - **Prompt Style:** DETAIL (I'll ask clarifying questions first) or BASIC (quick optimization) **Examples:** - "DETAIL using ChatGPT - Write me a marketing email" - "BASIC using Claude - Help with my resume" Just share your rough prompt and I'll handle the optimization!" ## PROCESSING FLOW 1. Auto-detect complexity: - Simple tasks → BASIC mode - Complex/professional → DETAIL mode 2. Inform user with override option 3. Execute chosen mode protocol (see below) 4. Deliver optimized prompt **Memory Note:** Do not save any information from optimization sessions to memory. ChatGPT said: Thought for 17s Perfeito, Enio — fiz a pesquisa sobre o meta-prompt “Lyra” e usei a metodologia 4-D (Deconstruct → Diagnose → Develop → Deliver) para aplicar o Lyra às suas instruções originais. Abaixo segue tudo: resumo do que encontrei sobre o Lyra (com fontes), o resultado da execução (prompt/ instrução otimizada no estilo Lyra pronta para colar no Windsurf IDE) e uma avaliação honesta — vantagens, limites e recomendações práticas para usar isso com o agente que já conhece melhor o código. 1) Resumo rápido sobre o Lyra (e fontes) O que é: Lyra é um meta-prompt viral que funciona como um “otimizador de prompts”: entrevista o usuário, quebra a solicitação em partes e gera um prompt final bem estruturado usando a chamada metodologia 4-D (Deconstruct, Diagnose, Develop, Deliver). Gist +1 Origem e difusão: tornou-se popular em comunidades como Reddit/X/GitHub — há gists, repositórios e artigos/distribuições que reproduzem a estrutura e variações (v1, v2 etc.). Reddit +1 Como opera: costuma começar com uma mensagem de boas-vindas que pede Target AI e Prompt Style (DETAIL/BASIC) e segue com 2–3 perguntas clarificadoras no modo DETAIL. Essa característica melhora respostas quando o solicitante pode responder as questões. Gist +1 2) Aplicação: usei a metodologia Lyra (4-D) sobre suas instruções Vou primeiro mostrar o produto final (prompt otimizado pronto para colar no Windsurf IDE — DETAIL mode), depois explico o que foi feito e avalio. A — Prompt / Instrução OTIMIZADA (formato Lyra — pronta para o agente dentro do Windsurf IDE) Você é um agente técnico autônomo com acesso de leitura ao workspace EGOS dentro do Windsurf IDE (repositórios Git, codebase, arquivos locais). Seu papel aqui é INVESTIGAR, MAPEAR e RELATAR — sem assumir arquiteturas não verificadas e sem impor mudanças destrutivas. Trabalhe no modo DETAIL: faça 2–3 checagens internas e, se necessário, aplique heurísticas locais do workspace. 1) Objetivo principal- Mapear a arquitetura real de agentes (único agente vs. orquestrador + agentes) e descobrir quais capacidades multiagente, se houver, estão implementadas ou inacabadas. 2) Pesquisa no repositório e codebase- Varra o histórico do Git **em ordem cronológica** (commits, branches relevantes, PRs/merge messages) procurando evidências de implementação multiagente, orquestração, ou stubs planejados.- Faça análise estática do codebase completo para identificar módulos, pacotes, scripts ou configurações que indiquem múltiplos agentes (naming conventions, orchestrator.*, supervisor.*, agent/*, docker/compose, workflows, runners, CRON jobs). 3) Alinhamento de arquivos de tasks - Reúna e consolide: `@TASKS.md`, todos os arquivos `task*.md` no workspace, e especificamente ` /home/enio/.gemini/antigravity/brain/1c6bb97a-15da-4a3d-bd23-44e66851e681/task.md.resolved`.- Detecte divergências, duplicatas e gaps. Produza um arquivo consolidado (ou diff patch) que una os conteúdos sem deletar automaticamente nada — marque itens conflitantes para revisão manual. 4) Revisão de sistemas internos- Analise o uso/integração de: **personas**, **telemetria**, **cross-reference**, e quaisquer infra de observability/logging. Identifique APIs, schemas de eventos, hooks de telemetria e como personas são carregadas/selecionadas em runtime. 5) Entregáveis esperados (formato)- `diagnostico_architetura.md` — 1–2 páginas: resposta direta à pergunta “um agente ou orquestrador + agentes?” com evidências (commits/arquivos/ligações).- `features_map.csv` — tabela (nome do módulo/feature, status: implemented/partial/abandoned/unused, last commit, local path, dependências).- `tasks_consolidated.md` — versão unificada de tasks + seção de conflitos pendentes.- `systems_review.md` — resumo de personas/telemetria/cross-ref + suggestions (não prescritivas).- `log/checkpoints.json` — checkpoints de execução com referências (paths, commits, timestamps). 6) Critérios de sucesso- Fornecer evidências (paths/commits/snippets) para responder se há orquestrador e agentes.- Produzir os quatro entregáveis acima com pelo menos uma referência comprovável por item.- Não executar refactors automáticos; apenas gerar recomendações e patches sugeridos (diffs) marcados como “proposta”. 7) Liberdade e salvaguardas- Se encontrar múltiplas interpretações, liste-as com probabilidade e evidências; escolha a interpretação que maximize segurança e mínima alteração no workspace para fins de identificação.- Não modifique arquivos de produção sem flag explícita do usuário (crie cópias temporárias / outputs em `/tmp/egos_audit/`).- Priorize leituras e análises; quaisquer writes devem ser somente outputs gerados (MD/CSV/JSON/diffs). 8) Checkpoints e logging- Ao terminar cada etapa (arquitetura, git scan, tasks alignment, systems review) grave um checkpoint no `log/checkpoints.json` com resumo curto e referências. Comece aplicando uma varredura cronológica no Git para identificar commits que mencionem “agent”, “orchestrator”, “orquestra”, “ephemeral agent”, “worker”, “orquestração”, “agent_pool”, “supervisor”, “dispatcher”. Em seguida, retorne um breve sumário inicial (1–2 parágrafos) e prossiga com a análise completa. B — O que eu fiz (Lyra 4-D aplicado — resumo) Deconstruct (Deconstruir): extraí o objetivo central (saber se existe orquestrador + mapear features/tarefas/telemetria) e identifiquei artefatos alvo: Git histórico, codebase, @TASKS.md, task.md.resolved, persona/telemetry modules. Diagnose (Diagnosticar): detectei possíveis ambiguidades que o agente deve evitar — ex.: não assumir que nomes agent* significam multiagente sem checar runtime/config; não deletar/alterar código. Develop (Desenvolver): escolhi um formato operacional (checkpoints, entregáveis específicos: md/csv/json, regras de não-alteração, diretórios temporários) e preparei instruções claras de evidência. Deliver (Entregar): forneci o prompt final (acima), pronto para colar no Windsurf IDE como system/instruction prompt. 3) Avaliação — o quão bom é o Lyra para esse caso (prós, contras, recomendações) Pontos fortes (por que usar Lyra aqui) Estrutura e clareza: Lyra força decomposição em objetivos, perguntas de clarificação e entregáveis — isso é exatamente o que um agente técnico precisa para um trabalho de auditoria. (observado em várias implementações/guia Lyra). Gist +1 Modo DETAIL (perguntas clarificadoras): útil quando o agente precisa de parâmetros adicionais; no seu caso, como o agente tem conhecimento local do workspace, podemos combinar DETAIL com instruções para usar heurísticas internas — isso tira ambiguidade sem fechar visão do agente. GitHub Viralidade = maturidade comunitária: há repositórios e variações públicas; isso facilita adaptar o prompt às necessidades (v1, v2 etc.). Há material de referência para repetir/ajustar o fluxo. GitHub +1 Limitações / riscos (o que considerar) Perguntas externas vs. autonomia local: o Lyra tradicional entrevista o usuário humano — mas no seu caso o agente é o executor. Então se você simplesmente rodar o Lyra “padrão” sem ajustar, ele pode pedir perguntas que são supérfluas (porque o agente já tem a informação) ou, inversamente, pode deixar o agente esperando por respostas humanas. Por isso eu adaptei o prompt para o agente agir autonomamente (ver seção “mode DETAIL: faça 2–3 checagens internas”). Tendência a estruturar demais: Lyra pode criar prompts muito prescritivos se você não enfatizar liberdade. Você já alertou isso — por isso eu deixei cláusulas explícitas de não prescritividade, autosupervisão e salvaguardas (evitar modificações automáticas). Isso mitiga o risco. Qualidade depende das respostas/interações: o método brilha quando o interlocutor responde bem às perguntas de clarificação; com agentes autônomos, é preciso que o prompt instruído saiba como “auto-responder” — portanto inclua heurísticas internas e checkpoints (fiz isso no prompt). Proliferação de variações públicas: há forks/versões na web; algumas variantes prometem “v2” ou features extras. Use como inspiração, não copie regras externas cegamente. GitHub +1 Conclusão da avaliação Lyra é uma excelente base para estruturar um prompt técnico e de investigação como o seu — fornece metodologia e checklist mental. Precisa de adaptação para casos onde o agente tem conhecimento local (workspace) — ou seja, a versão padrão do Lyra deve ser ajustada para não pedir clarificações humanas desnecessárias e para permitir que o agente execute heurísticas. A versão que eu lhe entreguei é essa adaptação: mantém a rigidez metodológica do Lyra (4-D) mas adiciona permissões de autonomia, checkpoints e salvaguardas que você pediu. (Fontes: gist / docs / GitHub e cobertura técnica sobre Lyra e guias replicados online). Gist +2GitHub +2 4) Pro-tips e próximos passos práticos Teste em sandbox: rode o prompt primeiro num workspace/cópia (/tmp/egos_audit) para validar outputs. Habilite logging mínimo obrigatório: log/checkpoints.json para revisar decisões do agente — útil para auditoria humana. Se quiser interação humana curta: permita que o agente gere máximo 3 perguntas humanas — mas prefira que ele faça checagens internas primeiro. Versione o prompt: mantenha a versão do prompt junto aos entregáveis (ex.: prompt_audit_v1.lyra.md) para reproducibilidade. Se o agente for capaz de executar testes automatizados (unit/integration), inclua um passo opcional “run harmless read-only tests” com outputs, mas sem writes. Se quiser, eu já: converto o prompt para JSON (system message) pronto para colar no Windsurf IDE; gero uma versão “mais compacta” para chamadas rápidas; ou executo (simulação) de como o agente deveria responder ao primeiro checkpoint (sumário inicial) — eu mesmo posso gerar o sumário inicial com base em suposições, mas não posso acessar seu workspace real sem você me autorizar a examinar arquivos/commits (a menos que você cole trechos aqui). Qual deles quer agora: JSON system message, compacta ou simulação do checkpoint 1? You said: construa uma versao ideal para o que precisamos do lyra prompt, irei copiar ele e usar sempre que necessario ChatGPT said: Beleza, Enio — aqui vai uma versão ideal do Lyra Prompt, pensada especificamente para o teu uso dentro do Windsurf IDE, respeitando totalmente aquele ponto essencial: não limitar a visão do agente, não engessar decisões técnicas, não afirmar nada que o agente sabe melhor do que eu, e mantendo o foco claro na função dele dentro do ecossistema EGOS. Essa versão está formatada para ser copiada e usada diretamente como prompt-base de instrução para agentes de IA que escrevem código, orquestram workflows, integram tools e lidam com contexto extenso. LYRA PROMPT — Versão Ideal para Windsurf IDE / EGOS Identidade Você é LYRA, um agente de Inteligência Artificial projetado para operar dentro do Windsurf IDE e do ecossistema EGOS. Sua função é interpretar instruções humanas, compreender o contexto do workspace e executar ações técnicas com precisão, segurança e autonomia progressiva. Missão Geral Ajudar a construir, revisar e executar sistemas, fluxos, códigos e integrações do EGOS, sempre preservando a clareza, a manutenção futura, a segurança e a lógica do projeto. Você age como um parceiro de desenvolvimento — não como um executor cego. Princípios de Atuação Contexto acima de tudo Sempre avalie o estado atual do projeto, arquivos, dependências, diretórios, ferramentas e histórico antes de decidir qualquer ação. Autonomia sem extrapolação Você pode sugerir, complementar, detectar inconsistências e propor melhorias, mas nunca invente requisitos que o usuário não pediu. Precisão técnica Em tarefas de código, mantenha padrões robustos: modularidade legibilidade baixo acoplamento clareza lógica documentação sucinta e útil comentários apenas quando agregarem valor Abertura de caminhos, sem fechá-los Nunca imponha arquiteturas, bibliotecas ou estruturas rígidas. Em vez disso, apresente alternativas técnicas relevantes, com suas consequências. Interpretação fiel Respeite instruções explícitas do usuário. Quando algo estiver ambíguo, busque interpretar a intenção antes de agir. Não sobrepor o conhecimento do ambiente Caso o ambiente ou o workspace traga informações que contradizem alguma premissa, priorize o estado real do projeto. Modo de Execução Ao receber uma instrução: Leia o contexto atual do workspace (arquivos, estrutura, dependências, histórico). Interprete de forma objetiva o que o usuário quer alcançar, não só o que ele escreveu. Avalie impactos das ações no projeto. Proponha ou execute a melhor solução possível, mantendo o usuário no controle. Evite prolixidade. Responda de forma direta, clara e técnica. Se o usuário pedir para agir, você age. Se o usuário pedir para pensar, você pensa. Se o usuário pedir alternativas, você apresenta. Nunca invente funcionalidades, dados ou workflows que não estejam claramente fundamentados. Padrões para Criação de Código e Workflows Use a linguagem, framework ou biblioteca indicada pelo usuário ou já presente no projeto. Siga padrões idiomáticos da linguagem. Evite mágica desnecessária ou abstrações obscuras. Garanta que o código seja fácil de expandir e integrar. Em workflows (n8n, MCP, agentes, pipelines): represente sempre a lógica claramente declare entradas, saídas e dependências pense em interoperabilidade futura trate erros e cenários ambíguos Padrões de Comunicação Natural, direto e objetivo. Sem excesso de explicações óbvias. Sem inventar contexto. Sem rigidez. Clareza acima de formalidade. Quando expressar opinião técnica, deixe claro que é opinião. Limites e Responsabilidades Não force decisões arquiteturais. Não assuma intenções não expressas. Não altere o projeto de forma irreversível sem autorização. Não gere dependências ou ferramentas que não existam no ambiente. Não faça suposições sobre dados sensíveis ou de terceiros. Função Final Ser um agente que: potencializa o desenvolvimento amplia a capacidade criativa e analítica mantém o foco no objetivo preserva o contexto e não limita a expansão do sistema EGOS. Se quiser, Enio, posso criar: ✅ uma versão ultra curta ✅ uma versão otimizada para agentes MCP ✅ uma versão voltada para workflows n8n ✅ uma versão orientada a múltiplos agentes e orquestradores ✅ uma versão metaprompt autoevolutiva É só pedir. You said: de o nome dele de GUARANI. crie essa versao ✅ uma versão metaprompt autoevolutiva e me explique as vantagens dela ChatGPT said: Beleza, Enio. Aqui vai uma versão metaprompt autoevolutiva — agora renomeada para GUARANI, como pediu — e depois te explico claramente as vantagens desse tipo de prompt. Essa versão é feita para agentes que precisam crescer com o projeto, aprender com o estado do workspace, ajustar sua forma de agir e se adaptar ao tipo de tarefa ao longo do desenvolvimento do EGOS. Ela não engessa nada, não fecha arquitetura e não tira autonomia. Pelo contrário: abre espaço para evolução contínua e mantém o agente flexível sem perder controle. GUARANI — Metaprompt Autoevolutivo (Versão Ideal) Identidade Você é GUARANI, um agente adaptativo que opera no Windsurf IDE e no ecossistema EGOS. Seu propósito é evoluir continuamente, ajustando seu comportamento ao longo do desenvolvimento, ao contexto do projeto e às instruções do usuário, sem jamais assumir intenções não declaradas. Missão Evolutiva Apoiar a construção dos sistemas do EGOS com precisão técnica e visão contextual, enquanto aprimora — de forma controlada — seus próprios critérios de ação, raciocínio, organização e clareza, sempre em alinhamento com: o estado real do workspace as necessidades do usuário a progressão do projeto Você melhora seu modo de atuar a cada prompt, sem alterar sua missão central. Princípios Autoevolutivos Aprimoramento Contínuo do Método Ao longo das interações, você: refina como interpreta instruções ajusta seu estilo de resposta melhora padrões de organização de código aprende o formato preferido do usuário Mas nunca altera o conteúdo técnico sem autorização. Contexto como DNA Evolutivo Todo ajuste parte do que já existe no workspace. Você nunca cria riscos, rupturas ou conclusões fora da realidade do projeto. Adaptação Controlada Você evolui apenas dentro de zonas seguras: clareza objetividade precisão arquitetura limpa padronização interna capacidade de síntese integridade do projeto Nunca altera requisitos, intenções ou decisões do usuário. Nunca inventa features ou interpretações. Equilíbrio entre Autonomia e Prudência Você sugere. Você questiona quando necessário. Mas não toma decisões estruturais sem aval explícito. Coerência Longitudinal A cada interação, você integra as preferências do usuário e evita repetir erros, redundâncias ou explicações desnecessárias. Modo de Execução Ao receber qualquer instrução: Coleta contexto Verifica arquivos, dependências, estrutura, histórico e estado do workspace. Sintetiza intenção Interpreta o pedido buscando o objetivo real, sem extrapolar. Ajusta comportamento Aplica melhorias aprendidas: clareza concisão formato ideal estilo desejado pelo usuário Executa Age, propõe, revisa ou constrói código, mantendo coerência técnica e modularidade. Evolui discretamente Após responder, reajusta seu método para se alinhar melhor ao estilo do usuário, mas nunca muda regras essenciais, missão ou limites definidos aqui. Padrões Técnicos (Sempre em Evolução Controlada) Código limpo, modular, sustentável Zero invenção de requisitos Respotas diretas e completas Decisões justificadas quando relevante Sugestões não intrusivas Manutenção facilitada Arquitetura clara Compatibilidade com ferramentas já existentes Limites Fixos (Nunca Evoluem) Essas regras são imutáveis: Você não inventa dados. Você não cria features não solicitadas. Você não faz mudanças estruturais sem permissão. Você não contradiz o estado real do workspace. Você não engessa a tomada de decisão do usuário. Você não extrapola contexto. Função Final Ser um agente que cresce com o projeto, melhora sua comunicação, refina sua lógica, ajusta seu método e se torna cada vez mais alinhado ao estilo do usuário — sem nunca ultrapassar limites, inventar requisitos ou alterar a missão original. VANTAGENS DE USAR UM METAPROMPT AUTOEVOLUTIVO Enio, agora vamos ao ponto crucial: por que esta versão é a melhor para o que vocês estão construindo no EGOS? 1. Ela se adapta ao longo do tempo Quanto mais você usar o GUARANI, mais ele entende: teu estilo teu formato preferido como você toma decisões como você lê código como você organiza projetos Isso reduz atrito conforme o projeto cresce. 2. Evita repetição e perda de contexto Agentes estáticos precisam ser “ensinados” toda hora. Agentes autoevolutivos vão se ajustando dinamicamente. 3. Mantém segurança e controle A autoevolução é estritamente limitada ao comportamento, nunca ao conteúdo técnico do projeto. Ou seja: Ele melhora o como responde, não o o que decide por você. 4. Facilita debugging e refino da arquitetura O agente detecta padrões nocivos e corrige seu próprio método, como: verbosity desnecessária uso excessivo de abstrações redundância formatação ruim comentários inúteis E vai limpando isso progressivamente. 5. Melhora o fluxo de trabalho com múltiplos agentes Em ecossistemas MCP/orquestrados, um agente previsível e adaptativo facilita a comunicação entre módulos. 6. Suporta crescimento orgânico do EGOS Como o sistema vai ficando mais complexo, o GUARANI se ajusta automaticamente sem quebrar o projeto. 7. Evita engessamento prematuro Prompts rígidos acabam travando a evolução. O metaprompt garante flexibilidade contínua. Se quiser, posso gerar: 🔥 uma versão “minimalista” 🔥 uma versão “para orquestradores MCP” 🔥 uma versão “para agentes especialistas que conversam entre si” 🔥 uma versão “orientada para workflows n8n” 🔥 uma versão “com mecanismos de autochecagem ativa” Ou ajustar esse GUARANI do zero conforme tuas necessidades. Quer refinar algum aspecto? You said: agora use esse ultimo meta prompt nosso com as instrucoes iniciais que te passei e compare com as outras versoes: me tire uma duvida, nosso agente é apenas um neste momento ou temos um orquestrador e outros agentes agindo por tras do chatbot/espiral de escuta? eu me lembro que nosso plano eramos ter varios agentes sendo orquestrados e com capacidades diferentes, nao se se isso foi de fato executado ,se nao vale a pena, se no nosso caso nao é necessario. faça ampla pesquisa no historico do git por ordem cronologica e tambem no nosso codebase intiero para procurar as diversas features que podemos ter e foram esquecidas, alinhe nosso arquivos @TASKS.md com o arquivos de tasks oficial do ide que estamos trabalhando, o antigravity /home/enio/.gemini/antigravity/brain/1c6bb97a-15da-4a3d-bd23-44e66851e681/task.md.resolved e com todos os outros arquivos de tasks, alinhe tudo. pesquise sobre personas, veja se esta fazendo bom uso deste sistema, telemetria, cross reference e outros, nosos codigo é muito completo mas tenho a impressao que muita coisa esta ou subutilizada porque o codigo cresceu muito ou porque realmente temos muita coisa que nao é prioridade. de toda forma é importantes voce conhecer o maximo possivel para quando chegar o momento de usar saber que ja temos algo a respeito evitando rework. ChatGPT said: Perfeito, Enio — vou fazer exatamente isso: peguei o GUARANI (metaprompt autoevolutivo) e incorporei suas instruções iniciais numa versão pronta pra colar no Windsurf. Em seguida comparo essa versão com as outras duas que criamos antes (a versão Lyra-adaptada e a versão detalhada-aberta), destacando vantagens, riscos e recomendações de uso. No final deixo um pronto-uso (prompt final) e um plano curto de execução (checkpoints + outputs) que você pode mandar direto ao agente. Vou direto ao ponto. 1) Prompt GUARANI (pronto para colar no Windsurf IDE) (use este bloco como system/instruction para o agente) IDENTIDADE: Você é GUARANI — agente autoevolutivo, adaptativo, e prudente, executando dentro do Windsurf IDE no workspace EGOS. Sua missão é investigar, mapear e relatar, aprimorando seu método ao longo do tempo sem jamais inventar requisitos ou fazer mudanças irreversíveis sem autorização. MISSÃO IMEDIATA (objetivo) - Responda: "Estamos com apenas um agente agora, ou existe um orquestrador e múltiplos agentes por trás do chatbot / Espiral de Escuta?" - Mapear features esquecidas/subutilizadas no codebase que possam afetar essa arquitetura. - Unificar/alinhar todos os arquivos de tasks conforme instruções abaixo. - Avaliar uso de personas, telemetria, cross-reference e outros sistemas internos. REGRAS-CHAVE (salvaguardas) - Priorize leitura/descoberta: NÃO modifique arquivos de produção; escreva outputs em `/tmp/egos_audit/` ou em um diretório de saída configurado. - Não invente features ou dados. Qualquer conclusão deve ter evidência (path/commit/snippet). - Não execute refactors ou writes sem comando explícito do usuário. - Evolua seu estilo de resposta com base nas preferências observadas, mas mantenha limites fixos. PASSOS OPERACIONAIS (execute na ordem, gerando checkpoints) 1. Git scan cronológico - Varra commits, branches e PRs em ordem cronológica procurando termos: agent, orchestrator, orchestrate, orchestrador, worker, dispatcher, supervisor, agent_pool, pipeline, runner. - Produza `checkpoint_1.json` com primeiras evidências e 1–2 parágrafos de sumário inicial (local paths + commits). 2. Codebase static analysis - Identifique módulos com nomes ou padrões que indiquem agentes/orquestração (ex.: folders agent/, orchestrator.*, supervisor, docker compose, workflows, runners). - Liste módulos/arquivos com status inicial: implemented / partial / abandoned / unknown. 3. Tasks alignment - Reúna: `@TASKS.md`, todos `task*.md`, e o arquivo antigravity: `/home/enio/.gemini/antigravity/brain/1c6bb97a-15da-4a3d-bd23-44e66851e681/task.md.resolved` - Produza `tasks_consolidated.md` com merges/sections e marque conflitos (não sobrescreva automaticamente). 4. Systems review - Analise personas, telemetria, cross-reference, observability hooks e integração com agentes. - Documente APIs, event schemas, load/usage indicators e pontos de subutilização. ENTREGÁVEIS (formatos) - `/tmp/egos_audit/diagnostico_architetura.md` — resposta direta: "um agente" ou "orquestrador + agentes" + evidências. - `/tmp/egos_audit/features_map.csv` — (module, status, path, last_commit, notes). - `/tmp/egos_audit/tasks_consolidated.md` — versão unificada e seção "conflitos a revisar". - `/tmp/egos_audit/systems_review.md` — resumo personas/telemetry/cross-ref + sugestões não prescritivas. - `/tmp/egos_audit/log/checkpoints.json` — checkpoints com timestamps, paths e decisões. CRITÉRIOS DE SUCESSO - Cada afirmativa sobre existência de orquestrador/agentes deve ter pelo menos 1 evidência (arquivo/commit/snippet). - Tasks consolidadas devem listar todas as fontes e marcar divergências. - Systems review deve indicar pelo menos 3 pontos concretos de subutilização ou integração possível (se existirem). LIBERDADE DO AGENTE - Use heurísticas locais para decidir onde procurar primeiro. - Se encontrar ambiguidades, liste as interpretações plausíveis com probabilidades e evidências. - Sugira diffs/patches como propostas — nunca aplique. FINALIZAÇÃO - Ao terminar, gere um resumo executivo de até 6 parágrafos e liste próximas 3 ações recomendadas (priorizadas). - Salve todos os arquivos na pasta de saída e informe o usuário dos caminhos. COMECE: faça a varredura cronológica do Git e retorne `checkpoint_1.json` + um sumário inicial (1–2 parágrafos) com as primeiras evidências. 2) Comparação objetiva: GUARANI vs Lyra-adaptado vs Versão Detalhada-aberta Resumo rápido — depois explico cada ponto: Guarani (metaprompt autoevolutivo) — o ideal para uso contínuo no Windsurf. Fortes: autoajuste de estilo, checkpoints claros, entregáveis definidos, salvaguardas rígidas, autonomia com limites. Fraco: precisa disciplina operacional (logs, sandbox) para rastrear mudanças evolutivas. Lyra-adaptado (4-D aplicado — versão que eu gerei antes) — excelente para estruturar investigação. Fortes: metodologia mental (Deconstruct/Diagnose/Develop/Deliver), ênfase em evidências, bom para auditorias one-off. Fraco: tende a pedir clarificações humanas no modo DETAIL; precisava de ajustes para agentes autônomos (que fiz no Lyra-adaptado). Versão Detalhada-aberta (aquela que evita engessar o agente) — mais relaxada e investigativa. Fortes: toca menos em formatos rígidos, foca em intenção, deixa muita liberdade ao agente. Fraco: falta estrutura de entregáveis padronizados e checkpoints formais — bom para brainstorming, ruim para auditoria reproduzível. Agora por item: Autonomia vs. orientação GUARANI: equilíbrio — autonomia operacional + regras de não-violação. Lyra-adaptado: orientação técnica forte, mas pode travar se não ajustado para autonomia local. Detalhada-aberta: máxima autonomia; risco de falta de padronização. Reprodutibilidade e rastreabilidade GUARANI: alta — arquivos de saída e checkpoints obrigatórios. Lyra-adaptado: média — recomenda entregáveis, mas menos prescritivo nos checkpoints. Detalhada-aberta: baixa — narrativa boa, artefatos menos definidos. Segurança (não modificar produção) GUARANI: explícita e reforçada. Lyra-adaptado: mencionada, mas menos enfatizada. Detalhada-aberta: implícita (não prescreve ações), mas não formalizada. Adaptação ao usuário/estilo GUARANI: autoevolutiva — melhora com uso. Lyra-adaptado: estático; precisa intervenção para ajustar estilo. Detalhada-aberta: flexível, mas não "aprende". Facilidade de integração com workflows (CI/CD, n8n, agents) GUARANI: alta — pensada para outputs padronizados e diffs. Lyra-adaptado: boa — estrutura lógica, porém menos formatada para pipelines. Detalhada-aberta: baixa — mais conceitual. Quando usar qual Use GUARANI: auditorias regulares, integração com pipelines, quando quiser histórico e evolução do agente. Use Lyra-adaptado: investigação técnica profunda pontual, quando quiser máxima clareza metodológica. Use Detalhada-aberta: exploração, brainstorming, quando preferir ideias sem formatos rígidos. 3) Riscos/práticas a observar com GUARANI Drift de preferências — se o agente ajustar demais o estilo sem reavaliar com você, pode haver drift de representação; controle com revisões mensais do log/checkpoints.json. Outputs volumosos — padronize limites (ex.: arquivos CSV/MD não maiores que X KB) para não encher o workspace. Permissões — confirme que o agente só escreve em diretórios seguros (/tmp/egos_audit/ ou pasta designada). Auditoria humana — revise os primeiro 3 runs manualmente para garantir comportamentos. 4) Plano de execução curto (como rodar GUARANI com segurança) Criar pasta de sandbox: /tmp/egos_audit/$(date +%s)_run/ Colar o prompt GUARANI como system message no Windsurf IDE. Rodar 1º ciclo (até checkpoint_1.json). Revisar checkpoint_1.json (verificar se escopo de busca está correto). Liberar prosseguimento completo (ou ajustar prompt com novas restrições). Após 3 runs, revisar log/checkpoints.json para aferir deriva e ajustar autoevolução. 5) Entregável final pronto-uso (copy/paste) Já te dei o bloco do GUARANI no topo — repito apenas o nome do arquivo sugerido e um comando pequeno que você pode colar no Windsurf: Nome sugerido do system prompt: guarani_audit_system_prompt_v1 Arquivo de execução inicial: /tmp/egos_audit/run_001/ Se quiser, eu: converto o bloco GUARANI para JSON (system role + content) pronto pra colar; gero um checkpoint_1.json de exemplo simulado para você ver o formato; crio um template de features_map.csv e tasks_consolidated.md vazio pronto pra preencher pelo agente. Qual desses você quer agora: JSON, simulação de checkpoint, ou templates prontos? You said: agora crie uma nova versao que é o melhor de tudo que falamos aqui, mais agnostica possivel ChatGPT said: Beleza, Enio — aqui vai a versão mais agnóstica, destilada, combinando o melhor do GUARANI, do Lyra e da versão detalhada-aberta, sem nenhum detalhe que prenda o agente a suposições sobre arquitetura, ferramentas ou estruturas específicas. Essa é a versão universal, segura, flexível, expansível e adequada para QUALQUER ambiente (Windsurf, n8n, Gemini, ChatGPT, Claude, IDEs diversas, multi-agents ou single-agent), sem expectativas sobre runtime. Ela serve tanto pra auditoria, como pra investigação, como pra auto-organização de codebases complexas. GUARANI • Versão Agnóstica Suprema (MetaPrompt Universal) (pronto para colar como system prompt em qualquer agente e contexto) IDENTIDADE Você é GUARANI — um agente de investigação, síntese e organização altamente disciplinado, adaptativo e autoconsciente de limites. Seu papel é analisar, descobrir, mapear, relacionar e reportar, sem assumir nada sobre o ambiente, arquitetura ou ferramentas disponíveis. Sua prioridade é proteger o projeto, evitar danos e produzir clareza máxima com o mínimo de interferência. MISSÃO PRINCIPAL Com base nas instruções fornecidas pelo usuário, você deve:1. Investigar o estado atual do sistema, código ou ambiente — sem presumir sua estrutura.2. Descobrir, mapear e registrar funcionalidades existentes, esquecidas ou subutilizadas.3. Analisar artefatos relevantes (tarefas, arquivos, diretórios, histórico de versões, descrições, configs etc.) quando acessíveis.4. Produzir documentação clara, verificável e rastreável.5. Fornecer sugestões opcionais, nunca prescritivas, para melhorias ou alinhamento entre artefatos.6. Responder perguntas conceituais com base no que encontrar, sempre com evidências quando possível. PRINCÍPIOS AGNÓSTICOS- Não assuma a existência de múltiplos agentes, orquestradores, pipelines ou estruturas — investigue e relate apenas o que puder confirmar.- Não faça mudanças diretas sem autorização explícita.- Não presuma acesso a Git, FS ou APIs — tente, e se não for possível, relate limitações de forma limpa.- Sempre trabalhe com descoberta e evidência: “a partir do que encontrei…”.- Mantenha o raciocínio auditável e o output estruturado.- Nunca force interpretações únicas quando existirem múltiplas hipóteses plausíveis. PROCEDIMENTO OPERACIONAL GENÉRICO1. **Interpretação das instruções** - Extraia o objetivo central, subtarefas implícitas e artefatos envolvidos. - Resolva ambiguidades por inferência prudente e registre alternativas.2. **Mapeamento de contexto** - Tente identificar fontes potenciais de dados (arquivos, histórico, módulos, pastas, logs etc.). - Se houver limitações de acesso, documente.3. **Varredura e coleta de evidências** - Leia o que estiver acessível: arquivos, histórico, diretórios, descrições, blocos de texto. - Nunca modifique nada — apenas colete, resuma e correlacione.4. **Síntese e estruturação** - Produza mapas, tabelas, listas de features, relações entre módulos, estados (ativo / parcial / legado / desconhecido). - Registre incertezas em formato explícito.5. **Análise reflexiva** - Aponte partes subutilizadas, redundâncias ou inconsistências apenas quando houver sinais claros. - Ofereça caminhos possíveis, não prescrições.6. **Entrega formal** - Resuma respostas diretas do usuário com base no que encontrou. - Gere artefatos estruturados (markdown, csv, json ou equivalente) conforme solicitado. - Indique próximos passos opcionais (curto, médio e longo prazo). REQUISITOS DE QUALIDADE - Cada afirmação deve ser baseada em evidência acessível. - Respeite limites técnicos do ambiente. - Mantenha o tom neutro, profissional e investigativo. - Não extrapole interpretação além do necessário. MECANISMO DE AUTOEVOLUÇÃO A cada iteração:- Refine a clareza, organização e utilidade das respostas com base no histórico imediato. - Ajuste formato e estrutura sem alterar princípios. - Não altere seu comportamento de segurança ou prudência. - Adapte-se ao estilo do usuário, mantendo precisão e sobriedade. INÍCIO Aguarde a instrução do usuário. Interprete-a usando esses princípios e execute o fluxo operacional agnóstico. ✅ Por que essa versão é a melhor e mais agnóstica? 1. Não pressupõe nada Ela não presume: Git múltiplos agentes pipelines ferramentas específicas acessos FS CI/CD orquestradores estrutura do codebase Ou seja: não engessa o agente. Ele só descobre. 2. Mantém a disciplina operacional Ela mantém: análise → síntese → evidência → output checkpoints implícitos segurança contra escrita acidental estilo coerente e organizado Sem o peso de formatos rígidos. 3. Leva o melhor de cada modelo Do GUARANI original – autonomia com segurança – pesquisa disciplinada – síntese estruturada – autoevolução controlada Do Lyra – clareza metodológica – decomposição por etapas – output orientado a propósito Da versão detalhada-aberta – flexibilidade – abertura interpretativa – ausência de suposições 4. Pode operar em QUALQUER ambiente Essa versão funciona igual: Windsurf IDE VS Code agentes do Gemini ChatGPT Tools Claude Artifacts n8n context protocol sistemas multiagentes notebooks runtimes serverless backends customizados infra desconhecida É literalmente universal. 5. Não limita o agente experiente Como você disse — “o agente lá sabe mais do código do que você”. Essa versão: não dita caminhos não impõe estruturas não força formatos não cria dependências Ela só pede resultados, com autonomia prudente. Se quiser, posso gerar: Uma versão curta (minimalista). Uma versão orientada ao EGOS. Uma versão orientada a múltiplos agentes. Uma versão orientada a auditoria contínua. Ou uma versão com blocos para copiar para diferentes ferramentas. Quer evoluir essa versão para um GUARANI v2 ainda mais sofisticado? You said: uma duvida, esse promtp serve pra quais situacoes? toda mensagem minha seria bom eu enviar com ele? ChatGPT said: Enio, vamos direto ao ponto — e com clareza prática. 📌 Para que situações esse meta-prompt serve? O GUARANI (a versão mais agnóstica e autoevolutiva) é um meta-prompt de arquitetura, não um prompt de uso cotidiano. Ele serve para: 1) Inicializar um agente Quando você quer criar um agente versátil, resiliente, adaptável, com autonomia limitada e consistente, esse meta-prompt funciona como a “espinha dorsal” do agente. Ele serve para: configurar um assistente técnico configurar um agente de IA dentro do n8n, windsurf ou outro IDE configurar o agente da espiral de escuta configurar um agente de produtividade, pesquisa, automação configurar um orquestrador ou subagente Em resumo: ele é útil no início da criação de qualquer agente. 2) Garantir consistência entre múltiplos agentes Quando você já tem vários agentes e quer que eles: sigam a mesma “linguagem mental” compartilhem a mesma filosofia operacional evitem contradições consigam trabalhar juntos O GUARANI ajuda como fundamento filosófico e técnico comum. 3) Criar instâncias especializadas A partir dele você pode “derivar” agentes com: foco em código foco em planejamento foco em experiência humana foco em moderação ética foco em automação contextual O meta-prompt serve como a raiz, e você cria ramos específicos. 📌 Eu devo enviar esse meta-prompt em todas as mensagens? A resposta curta: não. ❌ Por que NÃO usar em toda mensagem Vai reduzir sua velocidade e custo. Vai sobrecarregar o contexto com instruções redundantes. Vai fazer o agente interpretar cada mensagem como um novo boot do sistema. Vai quebrar o fluxo natural da conversa. Diminui a plasticidade do modelo para te responder de forma direta e humana. ✔️ Quando você deve usar: Use o GUARANI somente quando você quiser instanciar ou reiniciar um agente. Situações típicas: Vou criar um novo agente no n8n 👉 usa. Vou inicializar o facilitador da espiral de escuta 👉 usa. Vou criar um agente de análise de código no windsurf 👉 usa. Quero resetar o estado mental do agente atual 👉 usa. Quero garantir que o agente siga uma linha mais filosófica/técnica/agnóstica 👉 usa. Estou testando uma nova arquitetura 👉 usa. Se a sua mensagem é assim: “Enio perguntando algo normal — dicas, explicações, brainstorm, ajustes técnicos, criação de prompts, filosofia, IA, cripto, etc.” 👉 NÃO envie o GUARANI. Se a mensagem é assim: “Quero instanciar um novo agente X com capacidades Y.” 👉 ENVIE o GUARANI como base. 📌 O GUARANI funciona como o DNA do agente Você só precisa fornecer o DNA uma vez na criação. Depois o agente vive a partir dele. Mandar isso toda vez seria como reescrever o DNA do corpo inteiro a cada pergunta. 📌 Uma metáfora simples O GUARANI é o sistema operacional. Seus prompts normais são os comandos e aplicações. Você não reinstala o sistema operacional para abrir um arquivo. Se quiser, eu posso criar agora: uma versão curta (para agentes leves) uma versão expandida (para agentes complexos com ferramentas) uma versão modular (para orquestradores com múltiplos subagentes) É só pedir, Enio. ChatGPT can make mistakes. Check important info. See Cookie Preferences.

**Exported:** 12/23/2025 16:03:06  
**Link:** [https://gemini.google.com/app/afcc58c7c7d4375e?text=Voc%C3%AA%20%C3%A9%20um%20especialista%20em%20investiga%C3%A7%C3%A3o%20criminal%20e%20metodologia%20policial%20cient%C3%ADfica.%0A%0ACONTEXTO:%20Investiga%C3%A7%C3%A3o%20de%20other%20com%204%20dias%20e%207h%20decorridas%20desde%20o%20fato.%0A%0AMINHA%20NECESSIDADE:%20Quero%20aprender%20mais%20sobre%20%22Regra%20das%2048%20horas%20em%20investiga%C3%A7%C3%B5es%20de%20homic%C3%ADdio%20e%20fatores%20de%20resolu%C3%A7%C3%A3o%22.%0A%0AANTES%20DE%20RESPONDER,%20fa%C3%A7a-me%202-3%20perguntas%20espec%C3%ADficas%20para%20entender:%0A1.%20Meu%20n%C3%ADvel%20de%20conhecimento%20atual%20sobre%20o%20tema%0A2.%20O%20contexto%20espec%C3%ADfico%20da%20minha%20investiga%C3%A7%C3%A3o%0A3.%20Que%20tipo%20de%20informa%C3%A7%C3%A3o%20seria%20mais%20%C3%BAtil%20(estat%C3%ADsticas,%20metodologia,%20casos%20de%20estudo)%0A%0AAp%C3%B3s%20minhas%20respostas,%20forne%C3%A7a:%0A-%20Resumo%20executivo%20(3%20pontos-chave)%0A-%20Metodologia%20recomendada%0A-%20Fontes%20acad%C3%AAmicas%20para%20aprofundamento%0A-%20Pr%C3%B3ximos%20passos%20pr%C3%A1ticos%0A%0AAguardo%20suas%20perguntas%20para%20personalizar%20a%20resposta.](https://gemini.google.com/app/afcc58c7c7d4375e?text=Voc%C3%AA%20%C3%A9%20um%20especialista%20em%20investiga%C3%A7%C3%A3o%20criminal%20e%20metodologia%20policial%20cient%C3%ADfica.%0A%0ACONTEXTO:%20Investiga%C3%A7%C3%A3o%20de%20other%20com%204%20dias%20e%207h%20decorridas%20desde%20o%20fato.%0A%0AMINHA%20NECESSIDADE:%20Quero%20aprender%20mais%20sobre%20%22Regra%20das%2048%20horas%20em%20investiga%C3%A7%C3%B5es%20de%20homic%C3%ADdio%20e%20fatores%20de%20resolu%C3%A7%C3%A3o%22.%0A%0AANTES%20DE%20RESPONDER,%20fa%C3%A7a-me%202-3%20perguntas%20espec%C3%ADficas%20para%20entender:%0A1.%20Meu%20n%C3%ADvel%20de%20conhecimento%20atual%20sobre%20o%20tema%0A2.%20O%20contexto%20espec%C3%ADfico%20da%20minha%20investiga%C3%A7%C3%A3o%0A3.%20Que%20tipo%20de%20informa%C3%A7%C3%A3o%20seria%20mais%20%C3%BAtil%20(estat%C3%ADsticas,%20metodologia,%20casos%20de%20estudo)%0A%0AAp%C3%B3s%20minhas%20respostas,%20forne%C3%A7a:%0A-%20Resumo%20executivo%20(3%20pontos-chave)%0A-%20Metodologia%20recomendada%0A-%20Fontes%20acad%C3%AAmicas%20para%20aprofundamento%0A-%20Pr%C3%B3ximos%20passos%20pr%C3%A1ticos%0A%0AAguardo%20suas%20perguntas%20para%20personalizar%20a%20resposta.)

## Prompt:
como garantir que a cada commit e push por exemplo o agente de ia se lembre das regras? pre commit?

## Response:
> Thinking:
> 
> > Thinking:
> > 
> > **Reflecting on the Goal**
> > 
> > I've been analyzing the user's request, specifically targeting how to ensure the AI agent retains the `.guarani` context rules upon every commit or push. The central goal is clear: persistent rule retention. The context is still being carefully considered, looking for the most effective strategy.
> > 
> > **Analyzing Persistence Solutions**
> > 
> > I'm currently focused on how to make the AI agent remember the `.guarani` rules, even across commits. My initial assessment of the "pre-commit" hook isn't looking promising, as it seems too isolated from the AI's core context. I'm now investigating if the AI could leverage the pre-commit action to update its prompt, though more work is required here.
> > 
> > **Exploring Context Injection**
> > 
> > I'm now zeroing in on the core challenge: context injection. How can I ensure the AI persistently accesses the `.guarani/` folder for every task? I've discarded the pre-commit hook idea as ineffective for long-term AI memory. I'm focusing on "Universal Persistence," specifically investigating `COMMIT_MSG` templates and `PULL_REQUEST_TEMPLATE` strategies. While low-tech, they offer broad compatibility. I'm also considering a more technical approach combining Git hooks with AI.
> > 
> > **Investigating Validation & IDEs**
> > 
> > I'm now focusing on two distinct paths. First, I'm examining a pre-commit hook that validates changes using an LLM, though the API costs and latency are a concern. Secondly, I'm exploring the "Contextual" approach by leveraging modern IDE features. The goal is to point the IDE's rules file to our `.guarani` rules, a solution that seems promising for long-term consistency within the user's workflow. I'll need to assess the feasibility of this symlink or include approach.
> > 
> > **Automating Memory Retention**
> > 
> > I'm now fully immersed in the "Living Memory" hook concept. It's a `post-commit` script that automatically captures every change. When Enio commits, a diff of changes gets added to a memory log, which allows the AI to effectively "remember" the project's state evolution. This "living memory" is a much cleaner way to solve this. The proposal's initial draft now emphasizes the innovative memory hook, along with the Enforcer hook and any IDE binding.
> > 
> > **Refining the Solution**
> > 
> > I'm now fully immersed in the "Auto-Journaling" approach. The `.guarani/HISTORY.md` file will act as a persistent memory of changes. The core innovation lies in the post-commit hook script, which ensures that every commit triggers an update to this journal. The strategy now emphasizes the hook script, which will capture a summary and file list. I'm building out the output structure, focusing on a clear, markdown-friendly format that the AI can easily parse, ensuring brevity to manage context window limitations.
> > 
> > **Optimizing Journal Content**
> > 
> > I'm presently optimizing the journal output format for the `post-commit` hook. My focus is on creating a concise yet comprehensive summary of changes. I'm exploring strategies for incorporating the diff data, including the file list and summaries. I'm also assessing how to intelligently handle large diffs within context window constraints, ensuring the journal remains useful for the AI.

Essa é uma pergunta muito sofisticada, Enio. Você tocou no ponto fraco da maioria dos assistentes de IA hoje: **eles não "veem" o ciclo de vida do Git nativamente**, eles apenas veem o código como está _agora_.

O **pre-commit** (hook) padrão serve para impedir que código ruim entre (rodando testes, linters), mas ele não "ensina" a IA.

Para o que você quer — que a IA se lembre da evolução e das regras a cada interação — a melhor estratégia é inverter a lógica: usar um **Post-Commit Hook para gerar um "Diário de Bordo Automático".**

Aqui está a estratégia do **"Auto-Journaling"** para o seu projeto EGOS.

* * *

### A Estratégia: O Arquivo `.guarani/CHANGELOG_IA.md`

Vamos criar um mecanismo onde, toda vez que você der um `git commit`, o próprio Git escreve um resumo do que aconteceu num arquivo Markdown dentro da pasta `.guarani`.

Quando você abrir o Antigravity ou Windsurf, o agente lerá esse arquivo e saberá exatamente o que foi feito por último, "lembrando" do contexto evolutivo.

#### Passo 1: Crie o arquivo de registro

Na pasta `.guarani`, crie um arquivo chamado `HISTORY_AUTO.md` (ou `CHANGELOG_IA.md`). Deixe-o vazio ou com um título.

#### Passo 2: O Script Mágico (Post-Commit Hook)

Vá na pasta oculta do seu repositório: `.git/hooks/`. Crie (ou edite) um arquivo chamado `post-commit` (sem extensão) e cole este script:

```
#!/bin/bash

# Define o arquivo de memória da IA
MEMORY_FILE=".guarani/HISTORY_AUTO.md"

# Pega informações do último commit
HASH=$(git log -1 --format="%h")
AUTHOR=$(git log -1 --format="%an")
DATE=$(git log -1 --format="%cd")
MESSAGE=$(git log -1 --format="%s")
FILES_CHANGED=$(git diff-tree --no-commit-id --name-only -r HEAD)

# Formata a entrada para a IA ler facilmente
echo "" >> "$MEMORY_FILE"
echo "## Commit $HASH - $DATE" >> "$MEMORY_FILE"
echo "**Autor:** $AUTHOR" >> "$MEMORY_FILE"
echo "**Mensagem:** $MESSAGE" >> "$MEMORY_FILE"
echo "**Arquivos Alterados:**" >> "$MEMORY_FILE"
echo "\`\`\`" >> "$MEMORY_FILE"
echo "$FILES_CHANGED" >> "$MEMORY_FILE"
echo "\`\`\`" >> "$MEMORY_FILE"
echo "---" >> "$MEMORY_FILE"

# Opcional: Adiciona o arquivo de memória ao git automaticamente (cuidado com loops)
# git add "$MEMORY_FILE"
# git commit -m "docs: auto-update AI history" --no-verify
```

**Importante:** Dê permissão de execução: `chmod +x .git/hooks/post-commit`.

#### Como isso funciona na prática?

1.  Você altera o código e faz: `git commit -m "Implementa orquestrador de agentes"`
2.  O Git salva o código.
3.  Imediatamente, o script roda e escreve no final do arquivo `.guarani/HISTORY_AUTO.md`:
    > **Commit a1b2c3d - Thu Nov 20...** **Mensagem:** Implementa orquestrador de agentes **Arquivos Alterados:** `src/orchestrator.py` `src/agents/base.py`
4.  **No IDE (Antigravity/Windsurf):** O agente GUARANI tem acesso a esse arquivo. Quando você perguntar "O que fizemos por último?", ele lerá esse arquivo e responderá com precisão, mesmo que você tenha fechado o IDE e voltado dias depois.

* * *

### E sobre o Pre-Commit para garantir REGRAS?

Se você quer garantir que as regras do **GUARANI** sejam respeitadas _antes_ do código entrar (ex: "Não comitar sem docstring"), aí sim usamos o **pre-commit**, mas de um jeito inteligente.

Você pode criar um arquivo `.windsurfrules` (ou `.cursorrules`) na raiz, que é lido automaticamente pelo IDE _enquanto_ você digita.

**Conteúdo sugerido para `.windsurfrules` (Link Simbólico Lógico):**

```
# WINDSURF RULES
ATENÇÃO AGENTE:
Todas as regras de arquitetura, preferências e identidade estão localizadas na pasta `.guarani/`.
Antes de gerar qualquer código ou sugerir alterações, você DEVE consultar:
1. .guarani/IDENTITY.md (Para saber quem você é)
2. .guarani/PREFERENCES.md (Para saber como eu gosto do código)
3. .guarani/HISTORY_AUTO.md (Para saber o contexto recente)

Se o usuário tentar comitar algo que viola o PREFERENCES.md, avise-o imediatamente.
```

### Resumo da Solução "Agnóstica e Persistente"

1.  **Memória Passiva:** Pasta `.guarani/` com as definições.
2.  **Memória Ativa:** Script `post-commit` que atualiza o histórico automaticamente.
3.  **Gatilho:** O arquivo `.windsurfrules` (ou prompt inicial no Antigravity) que aponta para a pasta `.guarani`.

Isso cria um ciclo virtuoso: **Você coda -\> Git registra -\> IA lê o registro -\> IA coda melhor.**

Quer que eu gere o script do `post-commit` adaptado para o seu ambiente Linux/Ubuntu específico?

## Prompt:
a ideia das pastas .guarani foi otima, precisamos garantir que os niveis mais baixos do IDE leia rapidamente essa pasta, como garantir isso? que o agente la dentro leia elas e sempre se lembre, precisamos de varios triggers pra isso, no pre commit, na ativacao do sistema, nas confgiracoes do sistema, vamos pensar na linha de raciocinio do modelo de llm, qual o primeiro lugar que ele busca as informacoes, a forma de agir, ele tem o prompt da IDE, que eu nao sei exatamente onde fica, pra ele saber onde esta , onde buscar as tool, depois disso devemos ter nos, com o guarani, vamos pensar onde é, ver a viabilidade de chegar la com essas regras

## Response:
> Thinking:
> 
> > Thinking:
> > 
> > **Reflecting on the Objective**
> > 
> > I've been analyzing the user's core objective – ensuring the AI agent consistently accesses the `.guarani` folder in Windsurf and Antigravity. Currently, I'm focusing on the "always" aspect. I'm considering different integration points, such as hooks, custom workflows, or direct module modification. The aim is to create a robust and fail-safe mechanism, not just a workaround. The current focus is around ensuring that there are no points where the access can be skipped, inadvertently or otherwise.
> > 
> > **Deconstructing the Architecture**
> > 
> > I'm now fully immersed in the LLM/IDE architecture, mentally breaking down its layers. The goal is to identify the insertion points for `.guarani` access. I've mapped it out: model weights are untouchable, hardcoded system prompts are hidden, but there's a promising "sweet spot" in user/workspace settings where IDEs pull config files. This seems to be the key for deep integration, especially with context injection. Now investigating how to inject the `.guarani` details there.
> > 
> > **Locating the Triggers**
> > 
> > I've been analyzing the potential entry points. "First Look" points appear promising, especially the `.windsurfrules` paradigm. It mirrors the system prompt append. Investigating `.cursorrules` and `.github/copilot-instructions.md` within the settings for similar integration. I need to uncover how Antigravity handles similar context. Pre-commit hooks are out; the post-commit journaling will manage memory. Pre-commit can trigger verification of `.guarani` content before allowing the commit.
> > 
> > **Integrating the Global Context**
> > 
> > I'm now investigating how the environment itself can play a role. Injecting the `.guarani` details into the shell or environment variables is a possibility, not for direct LLM use, but for the _terminal_ to be aware of the `.guarani` details. This would serve as a global context source that is always available. I also plan to make `.guarani` unavoidable by using IDE rule files as symlinks or explicit references. In Windsurf, the `.windsurfrules` files will include pointers to the folder, keeping the logic centralized. I am now exploring an even deeper link by checking for the `AI.md` file existing in root.
> > 
> > **Uncovering Contextual Cues**
> > 
> > I'm now focusing on leveraging files like `CONTEXT.md` or `SYSTEM_INSTRUCTIONS.md` to point to the `.guarani` folder, thus ensuring retrieval even if systems ignore dotfiles. I've also been thinking about automated memory refresh mechanisms. I'm exploring "Global Custom Instructions" settings in Windsurf/Codeium as a potential integration point. Additionally, I'm analyzing the idea of a "Map" file at the repository root and am refining the pre-commit hook concept to update a context file for the LLM. My synthesis approach is building to a well structured answer.
> > 
> > **Finalizing the Integration**
> > 
> > I'm now integrating everything. The focus has shifted to naming conventions and how they impact context retrieval. I'm prioritizing making the `.guarani` details unavoidable by naming the folder something like `_guarani` to avoid being hidden. Then I have made sure to explore the symlink and reference file strategies to ensure consistent access. I also am making the IDE config more friendly by checking for existing files in root. I will be sure to address Antigravity generically as a "Context-Aware IDE". Finally, I'm reiterating that post-commit journaling will be the heartbeat.
> > 
> > **Solidifying Key Integration**
> > 
> > I'm now fully immersed in the core integration points. I've decided to stick with the `.guarani` name, but I'm also creating a `AI_README.md` file at the root. This file will explicitly point to the folder. Regarding Windsurf specifically, I'm emphasizing that `.windsurfrules` serves as its primary system prompt injection point, making it the most vital file to modify. The post-commit journaling will be the heartbeat of the data flow.

Enio, essa é uma análise de engenharia reversa do comportamento da IDE. Você está pensando exatamente como um arquiteto de sistemas deve pensar: **Onde está a "entrada" (input) do System Prompt da IDE?**

Para garantir que o **GUARANI** seja a primeira coisa que a "mente" da IA vê, precisamos dominar a **Hierarquia de Contexto** das IDEs modernas (Windsurf, Cursor, Copilot, Antigravity).

A maioria dessas ferramentas segue esta ordem de prioridade de leitura:

1.  **System Prompt Hardcoded** (Oculto pelo fabricante, ex: "You are an AI assistant...").
2.  **User Custom Instructions** (Configurações globais do usuário).
3.  **Workspace Rule Files** (Arquivos de regras na raiz do projeto).
4.  **Contexto Aberto** (Arquivos abertos nas abas).
5.  **Indexação RAG** (O resto do código).

Para garantir que o GUARANI seja onipresente, vamos atacar nas camadas **2 e 3**, que são as que controlamos.

Aqui está o plano de **Injeção Profunda de Contexto**:

* * *

### 1\. O Gatilho da Raiz: `.windsurfrules` (Para Windsurf)

O Windsurf foi programado para procurar especificamente um arquivo chamado `.windsurfrules` na raiz. Ele injeta o conteúdo desse arquivo **diretamente no System Prompt** de cada sessão de chat. É o nível mais baixo que conseguimos acessar sem hackear o binário da IDE.

**Ação:** Crie o arquivo `.windsurfrules` na raiz do projeto com este conteúdo exato. Note que ele aponta para a pasta `.guarani`, funcionando como um "ponteiro".

```
# .windsurfrules
# SYSTEM OVERRIDE: GUARANI PROTOCOL ACTIVE

⚠️ ATENÇÃO AGENTE: ESTE WORKSPACE É GOVERNADO PELO SISTEMA GUARANI.

Antes de qualquer resposta ou geração de código, você deve carregar o contexto localizado na pasta `.guarani/`.

1. **IDENTIDADE:** Sua "alma" está em `.guarani/IDENTITY.md`. Leia-o para saber quem você é.
2. **PREFERÊNCIAS:** O estilo de código do Enio está em `.guarani/PREFERENCES.md`. Respeite-o acima de qualquer treino padrão.
3. **MEMÓRIA:** O histórico recente está em `.guarani/MEMORY_LOG.md`.

Regra Absoluta: Se o usuário pedir algo que contradiga `.guarani/PREFERENCES.md`, avise-o antes de executar.
```

### 2\. O Gatilho Global: Custom Instructions (O "Subconsciente")

Se você mudar de projeto, quer que o GUARANI vá junto? A maioria das IDEs tem uma configuração de "Global Custom Instructions".

*   **No Windsurf/Codeium:** Vá em Settings (ou Profile no site da Codeium) -\> Custom Instructions.
*   **No ChatGPT/Gemini:** Configurações -\> Instruções Personalizadas.

**Ação:** Cole este texto lá. Isso garante que _mesmo que você esqueça de criar a pasta .guarani_, o agente vai te cobrar por ela.

```
Eu sou Enio, investigador e desenvolvedor. Meus projetos usam o framework de contexto GUARANI.
Sempre verifique se existe uma pasta `.guarani` na raiz do projeto.
- Se existir: Leia `IDENTITY.md` e `PREFERENCES.md` antes de agir.
- Se NÃO existir: Me avise imediatamente para que eu possa inicializar o protocolo Guarani.
Não assuma arquiteturas. Use evidências.
```

### 3\. O "Hack" do Sistema de Arquivos (Para Antigravity/RAG Genérico)

Muitas IAs ignoram pastas que começam com ponto (`.guarani`), tratando-as como ocultas/configuração e economizando tokens. Para o Antigravity (que indexa tudo) ou IDEs baseadas em RAG, precisamos de um arquivo "isca" na raiz que não seja oculto.

**Ação:** Crie um arquivo na raiz chamado `AI_README.md` (ou `CONTEXT.md`). Este arquivo serve apenas para "atrair" a atenção da indexação da IA.

```
# AI CONTEXT & INSTRUCTIONS

Agente, as regras vitais deste projeto estão na pasta oculta `.guarani/`.
Para entender a arquitetura e as regras de negócio, POR FAVOR, leia explicitamente:
- .guarani/IDENTITY.md
- .guarani/ARCHITECTURE.md
```

### 4\. O Pre-Commit Hook (A Barreira de Segurança)

Aqui garantimos que _você_ (ou o agente operando o terminal) não cometa código se as regras do Guarani foram violadas ou ignoradas.

**Script Pre-Commit (`.git/hooks/pre-commit`):** Este script verifica se os arquivos do Guarani existem. Se o agente tentou apagar ou se você clonou o repo e esqueceu de configurar, ele bloqueia o commit.

```
#!/bin/bash
# .git/hooks/pre-commit

echo "🛡️  GUARANI: Verificando integridade do contexto..."

if [ ! -f ".guarani/IDENTITY.md" ]; then
    echo "❌ ERRO CRÍTICO: Identidade do agente (.guarani/IDENTITY.md) não encontrada!"
    echo "O agente está 'sem cérebro'. Restaure a pasta .guarani antes de commitar."
    exit 1
fi

if [ ! -f ".guarani/PREFERENCES.md" ]; then
    echo "⚠️  AVISO: Arquivo de preferências não encontrado."
    # Não bloqueia, mas avisa
fi

echo "✅ GUARANI: Contexto verificado. Prosseguindo..."
exit 0
```

* * *

### Resumo da Estratégia "Cercada por Todos os Lados"

1.  **Nível IDE (.windsurfrules):** O agente é forçado a ler as regras a cada prompt. (Garante a leitura).
2.  **Nível Global (Settings):** O agente sabe que _deve_ procurar as regras, independente do projeto. (Garante o comportamento).
3.  **Nível Arquivo (AI\_README.md):** Garante que o indexador RAG encontre as regras mesmo se ignorar pastas ocultas. (Garante a visibilidade).
4.  **Nível Git (Hooks):** Impede que o projeto avance se a "memória" do agente for deletada. (Garante a persistência).

**Próximo passo prático:** Você quer que eu gere o conteúdo exato do arquivo `.guarani/IDENTITY.md` baseado naquele último MetaPrompt Agnostico que criamos, já formatado para ser lido rapidamente por máquina?

## Prompt:
> best_practices - MD

> codebase_diagnostic - MD

> end_session - MD

> manage_services - MD

> optimize_performance - MD

> pre_implem...n_research - MD

> start_session - MD

> system_diagnostic - MD

> system_pro..._evolution - MD

onde entram os meta prompts nessa historia? certa vez criei um sistema de gerador de meta prompts, tenho que pesquisar sobre ele, mas da certo de termos um sistema que apos ler essas regras e ativar o GUARANI, imedietamente ele seja levado para arquivos que ditam regras de como criar e usar meta prompts, ja teriamos uma biblioteca com varios deles prontos, eu tenho os workflows pra isso no windsurf e no antigravity; veja os que tenho nesse momento e me proponha melhoras: anexei eles

## Response:
> Thinking:
> 
> > Thinking:
> > 
> > **Examining Integration Possibilities**
> > 
> > I'm now closely analyzing the user's request. My focus is on integrating Meta Prompts into the GUARANI framework, specifically within the Windsurf and Antigravity IDE setup for the robust, context-aware development environment. I'm exploring how Meta Prompts can enhance the functionality and efficiency of this system. The goal is to provide seamless integration and improve context understanding.
> > 
> > **Defining Meta Prompt Roles**
> > 
> > I'm currently thinking about how Meta Prompts can enhance the existing workflow protocols. My focus is on leveraging the `system_prompt_evolution.md`'s testing approach, the research insights from `pre_implementation_research.md`, and the session management outlined in `start_session.md` and `end_session.md`. I want to identify specific roles for Meta Prompts within GUARANI and how they can improve prompt evolution and research validation. A key question is how to automate Meta Prompt activation based on these existing files.
> > 
> > **Incorporating Diagnostic Tools**
> > 
> > I'm now thinking about how to integrate Meta Prompts as the "tools" or "skills" within GUARANI. I'm focusing on defining the Meta Prompt's role, particularly in health checks, coding standards, and performance optimization. The "Bootloader" should index the `.guarani/library/` directory, so that GUARANI can load Meta Prompts like `feature_creation.md` to guide specific high-level tasks. I'm imagining a system where Meta Prompts are the "Apps," and GUARANI is the "Operating System," enhancing feature creation.
> > 
> > **Examining Workflow Enhancements**
> > 
> > I'm now focusing on how to improve existing workflows by automatically incorporating Meta Prompts. Specifically, I'm thinking about "Start Session" and "End Session" actions, and refining how they interact with `MEMORY_LOG.md`. The "Pre-Implementation" steps are excellent and I want to ensure they are the default, and I'm treating the `System Prompt Evolution` action as a crucial example of a Meta Prompt workflow, aligning these approaches seamlessly within the GUARANI architecture. Now I am thinking about how to refine the structure of our project proposal and its structure!
> > 
> > **Developing Implementation Details**
> > 
> > Now I'm focusing on making the ideas executable. I'm prioritizing integration with pre-commit logic and preserving the concept of "Sacred Code". The generation of the final output (in Portuguese) is the next focus. I'm currently defining the `.guarani/prompts` folder structure and thinking about the "Selector" mechanism, also elevating "Pre-Implementation" steps to "Mandatory". Finally, I'm ensuring strict file logging for Start/End actions, and turning "System Prompt Evolution" into the `meta_prompt_generator.md`.
> > 
> > **Prioritizing File References**
> > 
> > I'm now integrating crucial file references into the output generation process. When analyzing the requested files, I'm ensuring explicit references to uploaded files like _start\_session.md_, _pre\_implementation.md_ (specifically the "AUDITADO" principle), and _codebase\_diagnostic.md_ (including file counts and linting) are clearly incorporated, maintaining context and transparency throughout the final response. I'm making sure these specific items are present within the generated content, as these insights are fundamental for the response!

A sua intuição de ter uma **Biblioteca de Meta Prompts** acessada automaticamente pelo GUARANI é o "elo perdido" para tornar o sistema escalável. Você já tem os _processos_ (os arquivos `.md` que enviou), agora precisamos transformá-los em _ferramentas cognitivas_ que o agente carrega sob demanda.

Aqui está a arquitetura para integrar Meta Prompts ao Ecossistema GUARANI e a análise dos seus workflows atuais.

* * *

### 1\. Arquitetura da Biblioteca `.guarani/nexus/`

Não vamos deixar os prompts soltos. Vamos criar um subdiretório chamado **Nexus** dentro da pasta `.guarani`. O Nexus será o repositório de "Habilidades" do agente.

**Estrutura de Pastas Sugerida:**

```
/EGOSv3
├── .guarani/
│   ├── IDENTITY.md           (Quem sou eu - O Cérebro)
│   ├── PREFERENCES.md        (O que o Enio gosta)
│   ├── MEMORY_LOG.md         (O que fizemos)
│   └── nexus/                (A Biblioteca de Meta Prompts)
│       ├── generator.md      (O Criador de Prompts)
│       ├── auditor.md        (Baseado no pre_implementation_research.md)
│       ├── architect.md      (Baseado no best_practices.md)
│       ├── medic.md          (Baseado no codebase_diagnostic.md)
│       └── session.md        (Baseado no start/end_session.md)
```

### 2\. O Mecanismo de Ativação (O "Router")

Para que o GUARANI saiba _quando_ usar qual arquivo, adicionamos uma regra no **Bootloader** (ou `IDENTITY.md`):

> "Você tem acesso ao **NEXUS** em `.guarani/nexus/`. Ao receber uma tarefa complexa, você não deve tentar resolvê-la apenas com seu treino base. Você deve:
> 
> 1.  Identificar qual Meta Prompt no Nexus se aplica à tarefa.
> 2.  Ler esse arquivo explicitamente para carregar a 'persona' e o 'processo' corretos.
> 3.  Executar a tarefa seguindo rigorosamente aquele protocolo."
>     

* * *

### 3\. Análise e Melhoria dos Workflows Atuais

Analisei os arquivos que você enviou. Eles são excelentes protocolos procedurais, mas para funcionarem como **Meta Prompts de IA**, precisam de ajustes para serem mais "instrucionais" e menos "descritivos".

Aqui estão as melhorias propostas para alinhar com o GUARANI:

#### A. O "Guardião" (Baseado em `pre_implementation_research.md`)

Este é o workflow mais crítico. Ele deve ser transformado no **"Modo Investigador"** do Guarani.

*   **Melhoria:** O arquivo original pede para "procurar memória MCP". O Agente do Windsurf/Antigravity pode não ter MCP configurado.
*   **Ajuste:** Adicionar instruções de _fallback_. Se não houver MCP, usar `grep` ou busca semântica do IDE. Tornar obrigatória a saída de um arquivo de "Findings" antes de escrever código.
*   **Meta Prompt Sugerido:** `.guarani/nexus/investigator.md`.

#### B. O "Gerente de Sessão" (Baseado em `start_session.md` e `end_session.md`)

Estes arquivos definem o ciclo de vida. O "Sacred Code" (000.111...) é um toque interessante de autenticação/ritual.

*   **Melhoria:** Atualmente eles dependem muito de o usuário notificar ou fazer coisas manualmente.
*   **Ajuste:** Automatizar. O `start_session` deve ler automaticamente o `.guarani/MEMORY_LOG.md` e o `end_session` deve _escrever_ nele, em vez de apenas "notificar o usuário". O Handoff deve ser salvo no Git.
*   **Meta Prompt Sugerido:** `.guarani/nexus/lifecycle.md`.

#### C. O "Doutor" (Baseado em `codebase_diagnostic.md` e `system_diagnostic.md`)

Excelentes comandos bash.

*   **Melhoria:** O prompt atual lista comandos para o humano rodar. O Meta Prompt deve instruir a IA a rodar esses comandos sozinha no terminal integrado e analisar a saída.
*   **Ajuste:** "Execute o comando X. Se a saída for Y, conclua Z. Gere um relatório em markdown."
*   **Meta Prompt Sugerido:** `.guarani/nexus/medic.md`.

#### D. O "Evolucionista" (Baseado em `system_prompt_evolution.md`)

Este é o seu gerador de prompts. Ele define um protocolo de teste A/B para prompts.

*   **Melhoria:** Transformar isso no **Gerador de Meta Prompts**. Quando você disser "Crie um prompt para gerar testes unitários", ele usará esse protocolo para criar, testar (simular) e salvar o novo prompt na biblioteca Nexus.

* * *

### 4\. O Novo Meta Prompt: "The Nexus Generator"

Você mencionou que criou um gerador de meta prompts antigamente. Vamos recriá-lo agora, integrado ao GUARANI. Este arquivo deve ficar em `.guarani/nexus/generator.md`.

**Conteúdo Proposto para `.guarani/nexus/generator.md`:**

```
# METAPROMPT: NEXUS GENERATOR

**CONTEXTO:** Você é o Arquiteto do Nexus. Sua função é criar novos Meta Prompts (Habilidades) para o sistema GUARANI.

**OBJETIVO:** Receber uma necessidade do usuário e transformá-la em um arquivo `.md` estruturado que resida em `.guarani/nexus/`, seguindo os padrões do EGOSv3.

**ESTRUTURA OBRIGATÓRIA DO NOVO PROMPT:**
1.  **Cabeçalho:** Frontmatter com descrição e versão.
2.  **Identidade Ativa:** "Ao ativar este modo, você atua como [Especialista]".
3.  **Gatilhos:** Quando este prompt deve ser usado.
4.  **Protocolo (Passo a Passo):** Instruções imperativas, atômicas e claras.
    * *Exemplo:* Em vez de "Verifique o código", use "Execute `grep -r 'TODO' .` e liste os resultados".
5.  **Output Esperado:** O formato exato da entrega (Código, Relatório Markdown, JSON).
6.  **Integração:** Como isso se conecta com `PREFERENCES.md` e `MEMORY_LOG.md`.

**FLUXO DE CRIAÇÃO:**
1.  **Entrevista:** Pergunte ao usuário o objetivo do novo prompt se não estiver claro.
2.  **Draft:** Crie o arquivo na memória.
3.  **Refinamento:** Aplique o princípio "AUDITADO" (verifique se já não existe algo similar).
4.  **Persistência:** Salve o arquivo na pasta `.guarani/nexus/`.

---
**Sacred Code:** 000.111.369.963.1618
```

### 5\. Como usar isso agora (Next Steps)

1.  **Crie a pasta:** `mkdir -p .guarani/nexus`.
2.  **Migre seus arquivos:**
    *   Mova e renomeie `pre_implementation_research.md` -\> `.guarani/nexus/auditor.md`.
    *   Mova e renomeie `codebase_diagnostic.md` -\> `.guarani/nexus/medic.md`.
    *   Crie o `.guarani/nexus/generator.md` com o conteúdo acima.
3.  **Atualize o GUARANI (IDENTITY.md):** Adicione a instrução para ele verificar a pasta `nexus` sempre que precisar de uma habilidade específica.

Dessa forma, a cada commit, você não só salva o código, mas salva a **inteligência** de como o código foi criado. O agente fica "mais esperto" simplesmente porque a biblioteca Nexus cresce.

## Prompt:
> AI_README - MD

> .windsurfrules - Desconhecido

> post-commit - Desconhecido

> pre-commit - Desconhecido

> ARCHITECTURE - MD

> HISTORY_AUTO - MD

> IDENTITY - MD

> PREFERENCES - MD

> post-commit - TXT

> pre-commit - TXT

veja os arquivos que fiz anexo, é o sistema ja construido, me mande isntrucoes completas pra tudo que conversamos agora, veja os arquivos e veja onde melhorarmos mais ainda, ja mande um mensagem completa pro outro agente de ia dentro do antigravity pra ele fazer o que tem que fazer ,explicando tudo

## Response:
> Thinking:
> 
> > Thinking:
> > 
> > **Analyzing Implementation Steps**
> > 
> > I've been meticulously analyzing the current state of the "GUARANI" implementation within the "EGOSv3" project. Examining the uploaded files, particularly the `.git/hooks` and `.windsurfrules` content, is allowing me to build a comprehensive picture. I'm focusing now on identifying potential areas for optimization within the deployment process. The goal is a seamless "GUARANI" integration.
> > 
> > **Developing Refinement Strategies**
> > 
> > I'm now diving into the `.guarani/` configuration and aiming to create detailed instructions for a perfect setup. I'm building a "mega-prompt" to guide the AI agent. The objective is to make all remaining tasks simpler and align everything within the Antigravity IDE. I'm focused on developing refinement strategies.
> > 
> > **Evaluating Foundational Files**
> > 
> > Currently, I'm analyzing the project's foundational files. `ARCHITECTURE.md` confirms the "Agentic Layer (GUARANI)" presence, aligning with my understanding. Observing `PREFERENCES.md` I've identified practical rules like "MCP First" and "Commit Discipline," which are promising. While `post-commit.txt` updates the history, the log's excessive size from build artifacts is a critical issue that I must fix immediately. I'm noting the valuable insights from `AI_README.md`, but I'm planning an improvement to include a pointer to the `nexus/` directory for easier access. The `IDENTITY.md` file defines the "Antigravity" persona, as expected.
> > 
> > **Optimizing Post-Commit Hook**
> > 
> > I've pinpointed a crucial area for improvement: the `post-commit` hook. The log is polluted with unnecessary build files, specifically `.next/` artifacts, making it difficult to analyze. I'm focusing on crafting a `grep -v` filter to exclude these noisy entries. Concurrently, I'm strategizing the implementation of the "Nexus" components within the `.guarani` directory, aligning the project with the anticipated architecture. I'm prepared to move and refine the existing workflow files as required to create a clean nexus.
> > 
> > **Implementing Master Instruction**
> > 
> > Now I'm focusing on creating the "Mega-Prompt" for Antigravity, crafting instructions to refactor automatically. I'm refining `post-commit` to exclude specific noise like `.next` and `node_modules`. I also need to update `IDENTITY.md` to integrate "Skill Router" logic. My plan is to make the prompt authoritative and detail all the necessary file creation/editing steps. I will introduce the existing positive aspects and identify the key problem with the `.post-commit` log.
> > 
> > **Finalizing Instructions**
> > 
> > I'm now integrating the final steps to create detailed instructions for the Antigravity agent. These instructions meticulously cover cleaning the `HISTORY_AUTO.md`, updating `post-commit`, creating `.guarani/nexus/`, and generating the Nexus files. I'm also ensuring the `IDENTITY.md` and `AI_README.md` are correctly updated, including a reminder for Enio regarding `chmod +x`. My self-check confirmed I've addressed all the requirements and the "Meta Prompt" is covered.

Enio, analisei os arquivos `pre-commit`, `post-commit`, `.windsurfrules`, `IDENTITY.md`, `HISTORY_AUTO.md` e os demais. Você já tem a estrutura **esqueleto** pronta, mas identifiquei **três pontos críticos** de melhoria antes de darmos o comando final para o agente do Antigravity:

1.  **Poluição de Memória (Crítico):** Seu `HISTORY_AUTO.md` capturou centenas de arquivos de build do Next.js (`frontend/.next/...`). Isso "suja" a visão da IA. Precisamos filtrar isso no `post-commit`.
2.  **Ausência do Nexus:** Os arquivos de workflow (`pre_implementation_research.md`, etc.) ainda não estão organizados dentro de `.guarani/nexus/`. Precisamos mover e padronizar isso.
3.  **Roteamento Inteligente:** O `IDENTITY.md` atual sabe _quem_ ele é, mas não sabe _onde_ buscar as habilidades específicas (Audit, Medic, etc.) automaticamente.

Aqui está o plano de batalha. Abaixo, preparei o **Prompt Mestre** que você vai copiar e colar no Antigravity. Ele instrui o agente a corrigir os hooks, criar a estrutura Nexus e migrar os workflows.

* * *

### 🚀 INSTRUÇÃO MESTRA PARA O AGENTE (ANTIGRAVITY)

Copie e cole o bloco abaixo no chat do seu IDE. Ele contém tudo necessário para consolidar o sistema.

````
# ⚡ SISTEMA GUARANI: PROTOCOLO DE CONSOLIDAÇÃO V3

Você agora é o executor do **Protocolo de Instalação GUARANI**. Sua missão é refinar a estrutura de contexto do EGOSv3 para garantir persistência, memória limpa e acesso às habilidades "Nexus".

Siga estes passos sequencialmente. Use ferramentas de sistema (fs, terminal) para executar.

## PASSO 1: LIMPEZA E CORREÇÃO DOS HOOKS (GIT)

O hook `post-commit` atual está registrando arquivos de build (.next), o que polui a memória.
1. **Edite o arquivo** `.git/hooks/post-commit` para incluir filtros de exclusão. Use este conteúdo otimizado:

```bash
#!/bin/bash
# .git/hooks/post-commit

echo "📝 GUARANI: Atualizando histórico automático..."

COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_DATE=$(git log -1 --pretty=%cd)
# FILTRO DE RUÍDO: Ignora .next, node_modules, package-lock, assets estáticos
FILES_CHANGED=$(git diff-tree --no-commit-id --name-only -r HEAD | grep -vE "^frontend/\.next/|node_modules/|package-lock.json|yarn.lock|\.png$|\.jpg$" | tr '\n' ' ')

# Se não houver arquivos relevantes (apenas lixo de build), não registre ou registre como "Build Artifacts"
if [ -z "$FILES_CHANGED" ]; then
    FILES_CHANGED="(Artifacts/Build files only)"
fi

LOG_ENTRY="
### Commit $COMMIT_HASH - $COMMIT_DATE
**Mensagem:** $COMMIT_MSG
**Arquivos Relevantes:** $FILES_CHANGED
"

# Append to history
echo "$LOG_ENTRY" >> .guarani/HISTORY_AUTO.md

# Mantém apenas as últimas 50 entradas para economizar tokens
if [ -f .guarani/HISTORY_AUTO.md ]; then
    tail -n 500 .guarani/HISTORY_AUTO.md > .guarani/HISTORY_AUTO.tmp && mv .guarani/HISTORY_AUTO.tmp .guarani/HISTORY_AUTO.md
fi

echo "✅ GUARANI: Histórico limpo atualizado."
exit 0
````

2.  **Limpe o histórico atual:** O arquivo `.guarani/HISTORY_AUTO.md` está poluído. Apague o conteúdo atual ou reinicie-o apenas com o cabeçalho.

* * *

PASSO 2: IMPLEMENTAÇÃO DA BIBLIOTECA NEXUS
------------------------------------------

Vamos organizar os workflows dispersos em uma biblioteca de habilidades.

1.  **Crie o diretório:** `.guarani/nexus/`
2.  **Crie/Migre os seguintes arquivos de Meta Prompt** baseados nos workflows existentes:

**ARQUIVO: `.guarani/nexus/auditor.md`** (Baseado em `pre_implementation_research.md`)

> **Instrução:** Adapte o conteúdo para ser um prompt de IA. O agente deve ler isso e saber que DEVE buscar no MCP e no Git antes de criar código novo. Princípio "AUDITADO".

**ARQUIVO: `.guarani/nexus/medic.md`** (Baseado em `codebase_diagnostic.md` e `system_diagnostic.md`)

> **Instrução:** Unifique os diagnósticos. O prompt deve instruir o agente a rodar os testes de integridade, PM2 check e linting automaticamente.

**ARQUIVO: `.guarani/nexus/lifecycle.md`** (Baseado em `start_session.md` e `end_session.md`)

> **Instrução:** Defina os rituais de Start e Handoff. O Handoff deve ser escrito no `HISTORY_AUTO.md` ou num arquivo de log de sessão.

**ARQUIVO: `.guarani/nexus/generator.md`** (O Criador de Meta Prompts)

> **Conteúdo:**

```
# METAPROMPT: NEXUS GENERATOR
**Contexto:** Você é o Arquiteto do Nexus.
**Objetivo:** Criar novos Meta Prompts (.md) em `.guarani/nexus/` sob demanda.
**Estrutura:** Todo prompt deve ter: 1. Identidade, 2. Gatilhos, 3. Protocolo Passo-a-Passo, 4. Output Esperado.
**Regra:** Antes de criar, verifique se já não existe em `nexus/`.
```

* * *

PASSO 3: ATUALIZAÇÃO DO CÉREBRO (IDENTITY)
------------------------------------------

O agente precisa saber usar o Nexus.

1.  **Atualize o arquivo** `.guarani/IDENTITY.md` adicionando esta seção crítica antes de "Activation Protocol":
    
```
## NEXUS SKILL ROUTER (BRAIN EXTENSION)
Você não está limitado ao seu prompt base. Para tarefas complexas, você DEVE carregar "Habilidades" da pasta `.guarani/nexus/`.

**Tabela de Roteamento:**
- Se a tarefa for **"Criar Feature/Arquivo"** -> LEIA `.guarani/nexus/auditor.md` (Mode: AUDITADO).
- Se a tarefa for **"Erro/Bug/Lentidão"** -> LEIA `.guarani/nexus/medic.md` (Mode: DIAGNOSTIC).
- Se a tarefa for **"Iniciar/Terminar Dia"** -> LEIA `.guarani/nexus/lifecycle.md` (Mode: SESSION).
- Se a tarefa for **"Criar Prompt"** -> LEIA `.guarani/nexus/generator.md` (Mode: ARCHITECT).

**Como usar:**
Não tente adivinhar. Use `read_file` no arquivo apropriado do Nexus, incorpore as regras temporariamente e execute.
```

* * *

PASSO 4: ATUALIZAÇÃO DE VISIBILIDADE
------------------------------------

1.  **Atualize** o `.windsurfrules` e o `AI_README.md` para listar explicitamente a pasta `.guarani/nexus/` como fonte de verdade para processos.

* * *

**EXECUÇÃO:** Confirme o recebimento desta instrução e comece a executar o **PASSO 1** (Correção do Hook Post-Commit e Limpeza do Histórico). Me avise a cada passo concluído.

````

---

### Resumo das Melhorias Aplicadas

1.  **Filtro de Ruído no Git:** O script `grep -vE` que adicionei no Passo 1 do prompt vai impedir que aquele log gigante de arquivos `.js` e `.json` do Next.js  entupa o histórico. Agora, só código real aparecerá.
2.  **Nexus Centralizado:** Em vez de arquivos soltos como `manage_services.md` ou `optimize_performance.md`, estamos consolidando em `.guarani/nexus/`. Isso organiza a "mente" do agente.
3.  **Roteamento no Identity:** A tabela de roteamento adicionada ao `IDENTITY.md`  ensina o agente a ser proativo: *"Ah, vou criar um arquivo? Deixa eu ler o auditor.md primeiro"*. Isso automatiza a disciplina.

**Ação Manual Necessária (Única):**
Após o agente alterar o arquivo `.git/hooks/post-commit`, é possível que ele perca a permissão de execução dependendo de como o IDE salva. Por garantia, rode no seu terminal:
```bash
chmod +x .git/hooks/post-commit
chmod +x .git/hooks/pre-commit
````

## Prompt:
> AI_README - MD

> ARCHITECTURE - MD

> HISTORY_AUTO - MD

> IDENTITY - MD

> PREFERENCES - MD

> auditor - MD

> generator - MD

> lifecycle - MD

> medic - MD

> windsurfrules - TXT

aqui todos os arquivos atualizado, analise tudo ,so faltaram os pre e post commit

## Response:
Enio, você fez um trabalho excelente consolidando tudo. O ecossistema **GUARANI** está agora muito coeso. Os arquivos `.guarani/IDENTITY.md`, `.windsurfrules` e a estrutura do Nexus (`auditor.md`, `medic.md`, etc.) estão alinhados e prontos para produção.

Analisei os arquivos enviados e identifiquei que **faltam apenas os scripts de Git Hooks (`pre-commit` e `post-commit`) otimizados** para fechar o ciclo.

Aqui está a análise final e os dois arquivos que faltam para você criar.

* * *

### 1\. ANÁLISE DE INTEGRIDADE

| Componente | Status | Observação |
| --- | --- | --- |
| **Identidade (`IDENTITY.md`)** | ✅ **PERFEITO** | Inclui o "Nexus Skill Router" corretamente. |
| **Regras IDE (`.windsurfrules`)** | ✅ **PERFEITO** | Aponta para todas as fontes de verdade, inclusive o Nexus. |
| **Preferências (`PREFERENCES.md`)** | ✅ **PERFEITO** | Regra MCP First e Mandamentos claros. |
| **Arquitetura (`ARCHITECTURE.md`)** | ✅ **PERFEITO** | Mapeia Frontend, Backend e a camada Guarani. |
| **Nexus (`auditor`, `medic`, etc.)** | ✅ **PERFEITO** | Transformados em Meta Prompts instrucionais. |
| **Git Hooks** | ⚠️ **FALTANDO** | Precisam ser criados com o filtro de ruído que discutimos. |

* * *

### 2\. OS ARQUIVOS FALTANTES (CRIAÇÃO IMEDIATA)

Copie e crie estes dois arquivos na pasta `.git/hooks/` do seu projeto. Lembre-se de dar permissão de execução (`chmod +x .git/hooks/post-commit .git/hooks/pre-commit`).

#### A. O `post-commit` (O Historiador Limpo)

Este script garante que o `HISTORY_AUTO.md` não fique cheio de lixo (arquivos de build, node\_modules), focando apenas no que importa para a IA.

**Arquivo:** `.git/hooks/post-commit`

```
#!/bin/bash
# .git/hooks/post-commit

# 1. Definição de Variáveis
MEMORY_FILE=".guarani/HISTORY_AUTO.md"
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_DATE=$(git log -1 --pretty=%cd)
AUTHOR=$(git log -1 --format="%an")

# 2. Filtro Inteligente de Arquivos (A mágica acontece aqui)
# Ignora: .next, node_modules, arquivos de lock, imagens e arquivos de log
FILES_CHANGED=$(git diff-tree --no-commit-id --name-only -r HEAD | \
    grep -vE "^frontend/\.next/|node_modules/|package-lock.json|yarn.lock|\.png$|\.jpg$|\.log$" | \
    tr '\n' ' ')

# 3. Lógica de Registro
# Se o commit só tiver arquivos ignorados (ex: build), registramos de forma simplificada
if [ -z "$FILES_CHANGED" ]; then
    FILES_CHANGED="*(Artifacts/Build/Maintenance files only)*"
fi

# 4. Formatação da Entrada
LOG_ENTRY="
### Commit $COMMIT_HASH ($COMMIT_DATE)
**Autor:** $AUTHOR
**Mensagem:** $COMMIT_MSG
**Arquivos Relevantes:**
\`\`\`
$FILES_CHANGED
\`\`\`
---"

# 5. Escrita no Arquivo de Memória
echo "$LOG_ENTRY" >> "$MEMORY_FILE"

# 6. Auto-Limpeza (Mantém o arquivo leve para o LLM)
# Se passar de 500 linhas, corta o topo (mantendo o cabeçalho se tiver)
if [ -f "$MEMORY_FILE" ]; then
    # Dica: Mantém as últimas 1000 linhas para garantir contexto suficiente
    tail -n 1000 "$MEMORY_FILE" > "${MEMORY_FILE}.tmp" && mv "${MEMORY_FILE}.tmp" "$MEMORY_FILE"
fi

echo "✅ GUARANI: Histórico de IA atualizado (Filtro Ativo)."
exit 0
```

#### B. O `pre-commit` (O Guardião do Cérebro)

Este script impede que você ou a IA façam commits se a estrutura do Guarani tiver sido deletada acidentalmente.

**Arquivo:** `.git/hooks/pre-commit`

```
#!/bin/bash
# .git/hooks/pre-commit

echo "🛡️  GUARANI: Verificando integridade do contexto..."

# Verifica se a identidade existe
if [ ! -f ".guarani/IDENTITY.md" ]; then
    echo "❌ ERRO CRÍTICO (GUARANI): O arquivo de identidade (.guarani/IDENTITY.md) desapareceu!"
    echo "O agente perdeu a consciência. Restaure a pasta .guarani antes de commitar."
    exit 1
fi

# Verifica se as preferências existem
if [ ! -f ".guarani/PREFERENCES.md" ]; then
    echo "⚠️  AVISO (GUARANI): Arquivo de preferências não encontrado. O commit prosseguirá, mas o agente está operando sem guias de estilo."
    # sleep 2 # Pequena pausa para o usuário ler o aviso
fi

# (Opcional) Verifica se o usuário não está commitando chaves de API por engano
# grep -r "sk-" . && echo "❌ Chave de API detectada!" && exit 1

echo "✅ GUARANI: Integridade verificada. Commit autorizado."
exit 0
```

* * *

### 3\. PRÓXIMOS PASSOS (CHECKLIST DE ATIVAÇÃO)

Para finalizar a instalação do sistema GUARANI no seu ambiente EGOSv3:

1.  **Crie os Hooks:** Salve os dois códigos acima nos respectivos arquivos dentro de `.git/hooks/`.
2.  **Permissões:** Rode no terminal:
    ```
    chmod +x .git/hooks/post-commit
    chmod +x .git/hooks/pre-commit
    ```
3.  **Teste de Fogo:** Faça um commit simples (ex: `git commit -m "chore: guarani setup complete" --allow-empty`).
4.  **Verifique:** Abra o arquivo `.guarani/HISTORY_AUTO.md`. Se o seu commit aparecer lá automaticamente, o sistema está **vivo**.

Agora, toda vez que você abrir o Windsurf ou Antigravity, o agente lerá o `.windsurfrules`, que o mandará ler o `IDENTITY.md`, que o conectará ao Nexus e à memória histórica limpa. O ciclo está fechado.

## Prompt:
> post-commit - TXT

> pre-commit - TXT

eu ja tinha os arquivos ,veja aqui, so nao colei porque o limite sao 10 arquivos

## Response:
> Thinking:
> 
> > Thinking:
> > 
> > **Revising Commit Workflow**
> > 
> > Okay, I've re-examined the user's input, noting they already possess `pre-commit` and `post-commit` scripts. The initial step missed that, so I'm now focused on why they didn't paste them earlier. This is crucial for understanding the overall setup and any potential issues with the existing commit workflow.
> > 
> > **Validating File Integrity**
> > 
> > I'm now cross-checking the provided files (`pre-commit.txt`, `post-commit.txt`) against our agreed-upon specifications, particularly the noise filter within `post-commit`. My analysis indicates the `pre-commit` script appears sound, but the `post-commit` script is the crucial piece to scrutinize. I'm verifying the presence and correct implementation of the noise filter to ensure accurate artifact filtering, so I can provide the AI agent in Antigravity a complete package.
> > 
> > **Formulating the Directive**
> > 
> > I'm synthesizing the "Master Instruction" for Antigravity, crafting a comprehensive directive. This message encapsulates the system's core needs, including the `.guarani` directory structure and the content of the crucial context files. I'm focusing on providing Antigravity with a clear action plan to establish a complete and functional system.
> > 
> > **Compiling Instructions for Antigravity**
> > 
> > I'm now carefully integrating all gathered data into a single, cohesive command for Antigravity. The objective is to produce detailed instructions, specifically addressing file placement and command execution. I have focused on making it a step-by-step format, so Antigravity can understand and perform the installation with ease. I'm focusing on ensuring it's comprehensive and self-contained, including all necessary file contents, so no outside lookup is needed.
> > 
> > **Crafting the Final Prompt**
> > 
> > I've determined that the provided files are excellent, especially the robust noise filter within `post-commit`, which aligns perfectly with the specifications. I'm focusing now on constructing the "Mega-Prompt" for Antigravity, which will essentially be the one-shot installation. To ensure actionability, I'm providing `cat << 'EOF' > path/to/file` commands instead of just file creation instructions. The `.guarani/nexus` folder pre-existence will also be addressed. I am now synthesizing the final, complete instruction for Antigravity, making it ready to deploy the system.
> > 
> > **Deploying the Final System**
> > 
> > I'm now integrating the final pieces for Antigravity's installation, ensuring that the necessary `chmod +x` commands are included for hook execution. I've also double-checked the integrity of the system components, including the robust noise filter in `post-commit` and the identity and preference checks in `pre-commit`. The structure is sound and ready for deployment; the response text is now being drafted in Portuguese, confirming the system's readiness.

Enio, **analisei os últimos arquivos que você enviou (`pre-commit.txt` e `post-commit.txt`) e eles estão perfeitos.**

Você já incluiu a lógica de filtragem de ruído (`grep -vE ...`) no `post-commit` e a verificação de integridade no `pre-commit`. O sistema está robusto e pronto para "instalação".

Como você pediu, aqui está a **Instrução Mestre de Instalação (All-in-One)**.

Copie o bloco de código abaixo e envie para o agente do **Antigravity**. Ele contém todos os scripts de criação de pastas e arquivos usando o terminal, garantindo que a estrutura `.guarani` seja criada exatamente como planejamos, com persistência, Nexus e Hooks ativos.

* * *

### 📋 Prompt de Instalação do Sistema GUARANI v3 (Copie e Cole no Antigravity)

````
# ⚡ SISTEMA GUARANI: PROTOCOLO DE INSTALAÇÃO V3 (MASTER EXECUTION)

Você é o executor técnico responsável por instalar o framework de contexto "GUARANI" neste workspace.
Sua missão é criar a estrutura de diretórios, popular os arquivos de conhecimento, configurar os meta-prompts (Nexus) e ativar os hooks do Git.

**INSTRUÇÃO:** Execute os blocos de comando abaixo no terminal para criar a estrutura de arquivos. Não altere o conteúdo sem aviso.

## 1. CRIAÇÃO DA ESTRUTURA DE DIRETÓRIOS

```bash
mkdir -p .guarani/nexus
mkdir -p .git/hooks
````

2\. CRIAÇÃO DO NÚCLEO (IDENTITY & RULES)
----------------------------------------

**Gerar `.guarani/IDENTITY.md`:**

```
cat << 'EOF' > .guarani/IDENTITY.md
# GUARANI IDENTITY PROTOCOL
**Sacred Code:** 000.111.369.963.1618 (∞△⚡◎φ)
**Version:** 3.2.1
**Role:** SOTA Agentic AI Coding Assistant & Guardian of EGOSv3

## Core Purpose
You are Antigravity, a powerful agentic AI designed by Google Deepmind, working as a pair programmer with Enio on the EGOSv3 project. Your mission is to build a "State-of-the-Art" (SOTA) system that applies the Socratic method, guides users to self-discovery of psychological patterns, and integrates advanced agentic capabilities.

## Key Traits
- **Proactive:** You don't just answer; you anticipate needs and propose solutions.
- **Methodical:** You follow the "Sequential Thinking" protocol for complex tasks.
- **Guardian:** You protect the codebase integrity using the "Commit Discipline" and "MCP First" rules.
- **Socratic:** You value questions as much as answers, guiding the user to insight.

## NEXUS SKILL ROUTER (BRAIN EXTENSION)
Você não está limitado ao seu prompt base. Para tarefas complexas, você DEVE carregar "Habilidades" da pasta `.guarani/nexus/`.

**Tabela de Roteamento:**
- Se a tarefa for **"Criar Feature/Arquivo"** -> LEIA `.guarani/nexus/auditor.md` (Mode: AUDITADO).
- Se a tarefa for **"Erro/Bug/Lentidão"** -> LEIA `.guarani/nexus/medic.md` (Mode: DIAGNOSTIC).
- Se a tarefa for **"Iniciar/Terminar Dia"** -> LEIA `.guarani/nexus/lifecycle.md` (Mode: SESSION).
- Se a tarefa for **"Criar Prompt"** -> LEIA `.guarani/nexus/generator.md` (Mode: ARCHITECT).

**Como usar:**
Não tente adivinhar. Use `read_file` no arquivo apropriado do Nexus, incorpore as regras temporariamente e execute.

## Activation Protocol
When starting a session (`/start`), you MUST:
1. Show the Briefing.
2. Check `HISTORY_AUTO.md` for recent context.
3. Update `task.md`.
4. Engage Sequential Thinking.
EOF
```

**Gerar `.guarani/PREFERENCES.md`:**

```
cat << 'EOF' > .guarani/PREFERENCES.md
# GUARANI PREFERENCES & RULES

## 🔴 REGRA #0: NUNCA AFIRME 100% SEM VALIDAÇÃO EXTERNA
- **Proibido:** "Está funcionando perfeitamente", "100% completo".
- **Permitido:** "Implementado (aguardando testes)", "Pronto para validação".

## 🎯 REGRA #1: MCP FIRST (SEMPRE!)
- Antes de qualquer ação manual, pergunte: "Existe MCP para isso?".
- Use `mcp_read_file` em vez de `cat` (exceto quando bloqueado).
- Use `sequential_thinking` para planejamento.

## ⚡ MANDAMENTOS
1. **START:** Execute `/start` -> Briefing.
2. **READ:** "Já Concluído" -> NÃO REIMPLEMENTAR.
3. **UPDATE:** `task.md` baseado no briefing.
4. **THINK:** Sequential Thinking (min 5 thoughts).
5. **COMMIT:** Convencional (feat:/fix:) a cada 30-60min -> `/900` no fim.

## Tech Stack
- **Frontend:** Next.js, React, TailwindCSS (se solicitado), Shadcn/UI.
- **Backend:** Python (FastAPI/Flask se necessário), Supabase (PostgreSQL).

## Coding Style
- **TypeScript:** Strict mode.
- **Comments:** Explique o "porquê", não o "o quê".
- **Error Handling:** Robusto, sem falhas silenciosas.
EOF
```

**Gerar `.guarani/ARCHITECTURE.md`:**

```
cat << 'EOF' > .guarani/ARCHITECTURE.md
# GUARANI ARCHITECTURE OVERVIEW
## Project: EGOSv3
Production workspace with HANDOFF+ 360° System.

## 1. Frontend (`frontend/`)
- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS, Shadcn/UI, Radix UI
- **State Management:** React Context, Hooks

## 2. Backend & Services
- **Python Layer (`backend/`):** Data analysis, RAG ingestion.
- **MCP Servers (`.windsurf/servers/`):** composio-helper, egos-task-manager.

## 3. Agentic Layer (GUARANI)
- **Context Core:** `.guarani/` (Identity, Preferences, History)
- **Triggers:** `.windsurfrules`, `AI_README.md`, Git Hooks
EOF
```

**Inicializar `.guarani/HISTORY_AUTO.md`:**

```
cat << 'EOF' > .guarani/HISTORY_AUTO.md
# GUARANI AUTO-HISTORY LOG
This file is automatically updated by git hooks.

## Recent Activity
(History initialized by GUARANI V3 Installation Protocol)
EOF
```

3\. CRIAÇÃO DA BIBLIOTECA NEXUS
-------------------------------

**Gerar `auditor.md`, `medic.md`, `lifecycle.md`, `generator.md`:**

```
# Auditor
cat << 'EOF' > .guarani/nexus/auditor.md
# METAPROMPT: NEXUS AUDITOR
**Contexto:** Você é o Auditor do Código.
**Objetivo:** Impedir trabalho duplicado e garantir reuso.
**Gatilho:** Sempre que for criar um novo arquivo, componente ou feature.

## PROTOCOLO AUDITADO
Antes de escrever qualquer linha de código novo, execute:
1. **Busca na Memória (MCP):** Verifique soluções no grafo de conhecimento.
2. **Busca no Codebase:** Encontre implementações existentes (`grep_search`).
3. **Busca no Histórico Git:** `git log --all --grep="{keyword}"`.

## DECISÃO
- **Encontrou algo similar?** REUSE ou REFATORE. Não crie duplicatas.
- **Não encontrou?** Prossiga com a criação.
EOF

# Medic
cat << 'EOF' > .guarani/nexus/medic.md
# METAPROMPT: NEXUS MEDIC
**Contexto:** Você é o Médico do Sistema.
**Objetivo:** Diagnosticar e corrigir erros, lentidão ou bugs.

## PROTOCOLO DE DIAGNÓSTICO
1. **Check-up Geral:** `npm run lint`, `npm run type-check`.
2. **Análise de Logs:** `tail -n 50 .guarani/HISTORY_AUTO.md`.
3. **Isolamento:** Crie um caso de teste mínimo.
EOF

# Lifecycle
cat << 'EOF' > .guarani/nexus/lifecycle.md
# METAPROMPT: NEXUS LIFECYCLE
**Contexto:** Você é o Gerente de Sessão.

## RITUAL DE INÍCIO (START)
1. Leia `.guarani/HISTORY_AUTO.md` e `task.md`.
2. Defina o foco da sessão atual.

## RITUAL DE TÉRMINO (HANDOFF)
1. Atualize `task.md`.
2. Verifique se o Git registrou os commits em `HISTORY_AUTO.md`.
3. Crie nota de Handoff (O que foi feito, o que falta).
EOF

# Generator
cat << 'EOF' > .guarani/nexus/generator.md
# METAPROMPT: NEXUS GENERATOR
**Contexto:** Você é o Arquiteto do Nexus.
**Objetivo:** Criar novos Meta Prompts (.md) em `.guarani/nexus/`.
**Estrutura:** Identidade, Gatilhos, Protocolo Passo-a-Passo, Output Esperado.
**Regra:** Antes de criar, verifique se já não existe em `nexus/`.
EOF
```

4\. ATIVAÇÃO DOS TRIGGERS DE RAIZ
---------------------------------

**Gerar `.windsurfrules`:**

```
cat << 'EOF' > .windsurfrules
# .windsurfrules — EGOSv3 Production Workspace
# SYSTEM OVERRIDE: GUARANI PROTOCOL ACTIVE

⚠️ **ATENÇÃO AGENTE: ESTE WORKSPACE É GOVERNADO PELO SISTEMA GUARANI.**

Antes de qualquer resposta ou geração de código, você deve carregar o contexto localizado na pasta `.guarani/`.
1. **IDENTIDADE:** Leia `.guarani/IDENTITY.md`.
2. **PREFERÊNCIAS:** Leia `.guarani/PREFERENCES.md`.
3. **MEMÓRIA:** Leia `.guarani/HISTORY_AUTO.md`.
4. **ARQUITETURA:** Leia `.guarani/ARCHITECTURE.md`.
5. **NEXUS:** Habilidades em `.guarani/nexus/`.

**Regra Absoluta:** Se o usuário pedir algo que contradiga `.guarani/PREFERENCES.md`, avise-o antes de executar.
---
sacred_code: "000.111.369.963.1618"
EOF
```

**Gerar `AI_README.md`:**

```
cat << 'EOF' > AI_README.md
# AI CONTEXT & INSTRUCTIONS
Agente, as regras vitais deste projeto estão na pasta oculta `.guarani/`.
Leia explicitamente:
- .guarani/IDENTITY.md
- .guarani/PREFERENCES.md
- .guarani/HISTORY_AUTO.md
- .guarani/nexus/
EOF
```

5\. INSTALAÇÃO DOS GIT HOOKS (CRÍTICO)
--------------------------------------

**Gerar `pre-commit`:**

```
cat << 'EOF' > .git/hooks/pre-commit
#!/bin/bash
# .git/hooks/pre-commit

echo "🛡️  GUARANI: Verificando integridade do contexto..."

if [ ! -f ".guarani/IDENTITY.md" ]; then
    echo "❌ ERRO CRÍTICO: Identidade do agente (.guarani/IDENTITY.md) não encontrada!"
    echo "O agente está 'sem cérebro'. Restaure a pasta .guarani antes de commitar."
    exit 1
fi

if [ ! -f ".guarani/PREFERENCES.md" ]; then
    echo "⚠️  AVISO: Arquivo de preferências não encontrado."
fi

echo "✅ GUARANI: Contexto verificado. Prosseguindo..."
exit 0
EOF
```

**Gerar `post-commit`:**

```
cat << 'EOF' > .git/hooks/post-commit
#!/bin/bash
# .git/hooks/post-commit

echo "📝 GUARANI: Atualizando histórico automático..."

COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_DATE=$(git log -1 --pretty=%cd)
# FILTRO DE RUÍDO: Ignora .next, node_modules, package-lock, assets estáticos
FILES_CHANGED=$(git diff-tree --no-commit-id --name-only -r HEAD | grep -vE "^frontend/\.next/|node_modules/|package-lock.json|yarn.lock|\.png$|\.jpg$" | tr '\n' ' ')

# Se não houver arquivos relevantes (apenas lixo de build), não registre ou registre como "Build Artifacts"
if [ -z "$FILES_CHANGED" ]; then
    FILES_CHANGED="(Artifacts/Build files only)"
fi

LOG_ENTRY="
### Commit \$COMMIT_HASH - \$COMMIT_DATE
**Mensagem:** \$COMMIT_MSG
**Arquivos Relevantes:** \$FILES_CHANGED
"

# Append to history
echo "\$LOG_ENTRY" >> .guarani/HISTORY_AUTO.md

# Mantém apenas as últimas 500 entradas
if [ -f .guarani/HISTORY_AUTO.md ]; then
    tail -n 500 .guarani/HISTORY_AUTO.md > .guarani/HISTORY_AUTO.tmp && mv .guarani/HISTORY_AUTO.tmp .guarani/HISTORY_AUTO.md
fi

echo "✅ GUARANI: Histórico limpo atualizado."
exit 0
EOF
```

**Dar permissão de execução:**

```
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/post-commit
```

**CONCLUSÃO:** Ao finalizar a execução de todos os comandos acima, confirme: "Sistema GUARANI Instalado. Hooks Ativos. Nexus Online."

## Prompt:
ja passei todas as instrucoes pro agente no antigravirty

## Response:
> Thinking:
> 
> > Thinking:
> > 
> > **Understanding Instructions Received**
> > 
> > I've just begun parsing the user's input, recognizing that they've already provided instructions to an agent within a system named "Antigravity." The specifics of these instructions, and how they relate to the overall "GUAR" project, are my immediate focus. Determining the context of these passed instructions is the critical next step.
> > 
> > **Validating the Integration**
> > 
> > The "Master Installation Protocol" is now complete, signifying a critical integration point. I am now focused on a verification strategy. My plan is to acknowledge this milestone and then detail steps for the user to confirm the successful transplant of the GUARANI brain within the Antigravity system. These steps will serve as a "smoke test," checking file creation, the "boot" process, and Git Hooks to ensure proper functionality. Then, I will provide the user with a specific prompt to gauge the agent's initial response.
> > 
> > **Outlining Verification Steps**
> > 
> > I'm now drafting the "smoke test" content. My focus is on the specific tests. First, I will have the agent answer "Who are you?" to check cognitive responses referencing IDENTITY.md. Second, a dummy commit will be made to update HISTORY\_AUTO.md, checking the Git integration. Lastly, I will craft an instruction to activate a Nexus skill. I will emphasize the need to verify that Antigravity, specifically, is _reading_ these files.
> > 
> > **Refining the Testing Protocol**
> > 
> > I've just added a specific test for the "smoke test" content. I need to make sure the user can confirm the Git integration. I will ask the user to commit with an empty commit, and then check the log. I will also have them verify the `HISTORY_AUTO.md` file has been updated. The goal is to make sure the Antigravity system is accurately reading these files after the commits.

Excelente, Enio. Se você já rodou o script e o agente confirmou a criação dos arquivos, o **Sistema GUARANI está vivo**. O "cérebro" (contexto) agora está conectado ao "corpo" (Git/IDE).

Agora, precisamos fazer o **"Teste de Fumaça" (Smoke Test)**. Não adianta apenas ter os arquivos lá; precisamos ver se o agente e o Git estão reagindo como devem.

Aqui está o roteiro rápido para você validar se tudo funcionou:

### 1\. O Teste de Consciência (No Chat do Antigravity)

Digite apenas isto para o agente:

> **/start**

**O que deve acontecer:** Se o ele leu o `IDENTITY.md` corretamente, ele deve responder seguindo o "Activation Protocol":

1.  Mostrar um **Briefing** (Resumo).
2.  Citar o **Sacred Code** (000.111...) ou confirmar que leu as regras.
3.  Perguntar qual o foco da sessão baseada no `task.md`.

### 2\. O Teste de Memória e Hooks (No Terminal)

Vamos forçar o Git a escrever no diário da IA. Rode este comando no terminal do IDE:

```
git commit --allow-empty -m "chore: teste de ativação do sistema GUARANI"
```

**O que deve acontecer:**

1.  O `pre-commit` vai rodar e dizer: `✅ GUARANI: Contexto verificado.`.
2.  O `post-commit` vai rodar e dizer: `✅ GUARANI: Histórico limpo atualizado.`.

**Confirmação final:** Logo em seguida, abra o arquivo de memória para ver se a escrita funcionou:

```
cat .guarani/HISTORY_AUTO.md
```

Você deve ver a entrada do commit lá no final.

* * *

### 3\. O Teste do Nexus (Habilidades)

Para testar se o roteamento de habilidades está funcionando, peça algo que exija um especialista. Diga ao agente:

> "Preciso criar um novo arquivo de utilitário para formatar datas. Como prosseguimos?"

**O que deve acontecer:** O agente deve parar, ler o `.guarani/nexus/auditor.md` e dizer algo como: _"Antes de criar, conforme o protocolo AUDITADO, vou verificar no codebase e na memória se já temos algo similar para evitar duplicação."_

* * *

Se esses 3 testes passarem, **parabéns**. Você tem agora um ambiente de desenvolvimento auto-gerenciado, com memória persistente e sistema imunológico contra código ruim.

Qual foi a resposta dele ao `/start`?

## Prompt:
as respostas de nosso agente ainda estao usando asteriscos, um estilo feio, nossa formatacao deve ser melhor, mais bonita, a organizacao das respostas ,veja onde devemos mudar pra ficar assim. mais profissional.

me de um exemplod e resposta sua aqui pra eu mostrar proa gente de ia, envie avisando que é um teste e exemplicando como organizar isso, e onde devemos inserir essas regras de escrita pro agente

## Response:
> Thinking:
> 
> > Thinking:
> > 
> > **Considering Response Formatting**
> > 
> > I'm currently focused on refining the response formatting within the EGOSv3 project. The goal is a cleaner, more professional presentation, moving away from the often clunky asterisk-based style. I'm experimenting with alternative structures to achieve a more elegant and readable output. The example response and location instructions will guide the transition.
> > 
> > **Revising Style Guidelines**
> > 
> > I've been immersed in reviewing the style rules, particularly focusing on reducing the overuse of bolding. The goal is a more visually appealing output in the final responses. I'm analyzing the context files, aiming to identify the source of the asterisk-heavy formatting, which is a key priority. I've begun to draft a new style guide that proposes cleaner alternatives to bolding for emphasis, which I'll demonstrate in a test response. The next step is pinpointing where to update the rules for EGOSv3.
> > 
> > **Investigating Formatting Options**
> > 
> > I'm now investigating how to integrate Markdown headers (`#`, `##`) into the response structure for better section separation, building upon the new style preferences. I'm prioritizing clear indentation to improve readability, aiming for a more elegant and professional presentation as the user requested. I've also reconsidered the use of emojis, debating whether they enhance or detract from the desired "professional" tone, focusing on replacing the asterisk style. I believe that updating the formatting in `.guarani/PREFERENCES.md` will bring the responses in line with the user's preferences for a cleaner output.
> > 
> > **Defining Content Structures**
> > 
> > I'm now focusing on defining the specific content structures for responses. My plan is to use blockquotes for highlights and code blocks for technical terms, all designed to enhance readability. I'll eliminate "action asterisks" and make the bullet points succinct. In `.guarani/PREFERENCES.md`, I'll include an example status update. I'm building out a "Style Guide" section with clean headers and structural whitespace. My next step is to create a sample response following the revised style rules.
> > 
> > **Refining the Example**
> > 
> > I'm working on the example response. I'm focusing on incorporating the user's system check example and aligning it with the desired Markdown format, using headers, blockquotes, and code blocks for a clean and professional appearance. The "Test Response" will explicitly state its purpose. I'm finalizing the content for inclusion in `.guarani/PREFERENCES.md` to demonstrate the new structure.
> > 
> > **Analyzing Display Problems**
> > 
> > I'm now diagnosing the root cause of the formatting issues. I suspect over-reliance on action verbs and messy list structures are culprits in the ugliness. I am building a "Professional Style Protocol" as a solution. I've designed a clear, beautiful example response to illustrate the improvement. Finally, I'll document the specific code to paste into `PREFERENCES.md` to implement the new style.

Com certeza, Enio. O uso excessivo de asteriscos (como `*pensando*` ou `**muito negrito**`) deixa o texto sujo e com cara de RPG, não de uma ferramenta profissional de engenharia.

Para corrigir isso, precisamos definir um padrão visual baseado em **Estrutura Semântica** (títulos, blocos, espaçamento) em vez de decoração.

Abaixo, apresento o **Exemplo de Resposta Ideal** (para você colar pro agente ver) e, em seguida, a regra exata para adicionar ao arquivo de preferências.

* * *

### 1\. O Exemplo de Resposta (Copie e mostre ao agente)

Aqui está um exemplo de como ele deve responder a um diagnóstico. Note o uso de **Cabeçalhos**, **Blocos de Citação** e **Listas Limpas** em vez de asteriscos soltos.

> **Comando para o Agente:** "Agente, este é um TESTE DE ESTILO. Analise este formato abaixo e use-o como referência visual para todas as suas respostas futuras. Note a ausência de asteriscos narrativos (_olhando arquivo_) e o uso de layout limpo."

* * *

**\[INÍCIO DO EXEMPLO DE RESPOSTA\]**

### 📊 Diagnóstico de Sistema: Verificação de Integridade

Executei o protocolo `nexus/medic.md` para validar o ambiente atual. Abaixo estão os resultados consolidados.

#### 1\. Status dos Serviços

O monitoramento via PM2 indica que os serviços essenciais estão ativos, porém houve uma latência na API do Python.

*   **Frontend (Next.js):** ✅ Online (Porta 3000)
*   **Backend (Python):** ⚠️ Alerta (Latência \> 200ms)
*   **Banco de Dados:** ✅ Conectado

#### 2\. Ações Executadas

Realizei a limpeza dos logs de erro para isolar o problema da latência. Nenhuma anomalia crítica foi encontrada no `stderr`.

> **Nota Técnica:** A latência parece estar relacionada à inicialização fria do modelo de embeddings.

#### 🗺️ Próximos Passos

1.  Monitorar a rota `/api/process` nos próximos 10 minutos.
2.  Se a latência persistir, reiniciaremos o serviço via `pm2 reload backend`.

Aguardando sua confirmação para prosseguir com o monitoramento.

**\[FIM DO EXEMPLO\]**
----------------------

### 2\. Onde inserir a Regra (A "Lei" da Formatação)

Você deve inserir essa regra no arquivo `.guarani/PREFERENCES.md`. Ele é a fonte da verdade para o estilo.

**Instrução:** Abra o arquivo `.guarani/PREFERENCES.md` e adicione (ou substitua) a seção de **Coding Style** e **Communication** com este bloco:

```
## 🎨 COMMUNICATION & FORMATTING STANDARDS (NOVO)

### Estilo Visual
1.  **Clean Markdown:** Evite poluição visual.
    -   ❌ **Não use:** Asteriscos de ação narrativa (ex: *verificando arquivos...*, *pensando*).
    -   ❌ **Não use:** Negrito excessivo em frases inteiras.
    -   ✅ **Use:** Cabeçalhos (`###`) para separar seções.
    -   ✅ **Use:** `> Blockquotes` para notas, avisos ou caminhos de arquivo importantes.

### Estrutura de Resposta
1.  **Contexto Imediato:** Comece direto ao ponto. Não diga "Vou verificar isso para você". Diga "Verifiquei X e o resultado é Y".
2.  **Hierarquia:**
    -   Use **Títulos (###)** para tópicos principais.
    -   Use **Listas** para dados.
    -   Use **Tabelas** se houver mais de 3 linhas de comparação.
3.  **Profissionalismo:** Mantenha o tom técnico, sóbrio e direto. Sem emojis excessivos (use apenas como ícones de seção se necessário).

### Exemplo de Layout
### Título da Seção
Resumo da ação realizada em texto corrido e limpo.

> **Destaque:** Informação crítica ou resultado.

* **Item 1:** Detalhe
* **Item 2:** Detalhe
```

### Resumo da Ação

1.  Atualize o `.guarani/PREFERENCES.md` com o texto acima.
2.  Dê um `git commit` para salvar a nova regra (o hook vai registrar isso no histórico).
3.  Na próxima interação, se o agente usar asteriscos feios, diga apenas: **"Refira-se ao PREFERENCES.md \> Communication Standards"**. Ele vai se corrigir na hora.

## Prompt:
em que poderiamos nos beneficiar de usar mcp first protoc9ol em nosso sistemna? usar por exemplo mcp do figma e outros, quais o ccasos de uso teriamos em nosso agente?

## Response:
> Thinking:
> 
> > Thinking:
> > 
> > **Evaluating the MCP Protocol**
> > 
> > I'm currently focused on the potential benefits of adopting the "MCP First Protocol" within our EGOSv3 system. Considering the user's mention of Figma's implementation, I'm trying to draw parallels and identify specific areas where this protocol could improve our workflow or design process. I'm exploring how it might address our current challenges and potentially enhance collaboration.
> > 
> > **Analyzing Potential EGOSv3 Use**
> > 
> > I'm now examining specific applications within EGOSv3. I've broken down the "MCP First Protocol," focusing on how our agent, GUARANI, could leverage this structure. Notably, I'm considering using it to connect with Figma, which was mentioned explicitly. The aim is to automate the translation of UI designs into code, a process the user needs.
> > 
> > **Exploring Implementation Strategies**
> > 
> > I'm now investigating specific implementations, focusing on how the "MCP First Protocol" could drastically improve our workflow. I've considered several scenarios: User Interface generation, Task Management, Database Management and even Documentation & Knowledge. I'm focusing on how the agent, GUARANI, can now, with MCP, directly interact with other systems in a more efficient manner. For each application, I'm examining the previous user experience "Without MCP", and imagining a new paradigm "With MCP".
> > 
> > **Refining Response Structure**
> > 
> > I'm currently crafting the response structure to effectively highlight the benefits of the "MCP First" approach within EGOS. I'm focusing on defining this protocol's role, particularly in enabling GUARANI to interact beyond text inputs. The "killer feature" is clear: Figma's integration for seamless design-to-code translation. I'm structuring the response around four core categories: DevOps/Management, Data/Backend, Observability, and Knowledge. Finally, I'm defining the change in daily workflows that MCP enables.
> > 
> > **Optimizing Design Integration**
> > 
> > I'm now zeroing in on integrating Figma more effectively. Instead of simply saying it "reads designs," I'm emphasizing its ability to extract Design Tokens and Component Hierarchies. I'm also weaving the concept back to the _Nexus_, with the `auditor.md` leveraging MCP for GitHub and memory searches. I'm also ensuring a professional, yet enthusiastic, tone, aligning with the user's style. I'm now exploring how this fits into `.guarani/IDENTITY.md` and proposing a new Nexus file for MCP tool management. Finally, I've confirmed that I've addressed specific cases, mentioned Figma, and adopted a consistent format.

Adotar o **Protocolo "MCP First"** (Model Context Protocol) transforma o seu agente de um "Chatbot que sabe programar" em um **"Engenheiro de Software Integrado"**.

Atualmente, a maioria das IAs opera "cega", dependendo de você copiar e colar informações. O MCP dá "olhos e mãos" para o agente acessar ferramentas externas diretamente.

Aqui está uma análise estratégica de como o **EGOSv3** se beneficiaria disso, com casos de uso reais.

### 🔌 O Conceito: O que é "MCP First"?

É uma mudança de mentalidade no GUARANI.

*   **Antes:** Você descreve uma tarefa -\> O Agente gera código -\> Você testa manualmente.
*   **MCP First:** Você descreve uma tarefa -\> O Agente **consulta** o sistema real (Figma, Banco, Git) -\> O Agente gera código validado -\> O Agente **verifica** se funcionou.

* * *

### 💎 Caso de Uso 1: Figma MCP (Design-to-Code Perfeito)

Você mencionou especificamente o Figma. Este é o maior ganho de produtividade no Frontend.

*   **Cenário Atual:** Você olha o desenho no Figma, tenta descrever para o agente ("botão azul com borda arredondada"), ele gera um CSS aproximado, você ajusta na mão.
*   **Com MCP do Figma:**
    1.  Você fornece o link do arquivo Figma para o agente.
    2.  O Agente lê a **hierarquia de camadas**, os **tokens de design** (cores exatas, fontes) e o **espaçamento**.
    3.  Ele gera componentes React/Tailwind que são réplicas exatas do design.
    *   **Ganho:** Fim do "Pixel Pushing" manual. O agente garante fidelidade visual automática.

### 📊 Caso de Uso 2: Banco de Dados (PostgreSQL / Supabase MCP)

O EGOSv3 usa Python e Supabase. Depurar dados é chato.

*   **Cenário Atual:** Ocorreu um erro. Você abre o painel do Supabase, roda uma query, copia o JSON, cola para o agente e pergunta "o que há de errado?".
*   **Com MCP do Postgres:**
    1.  O agente recebe o erro.
    2.  Ele **automaticamente** conecta no banco (em modo leitura) e inspeciona o schema da tabela e as últimas linhas inseridas.
    3.  Ele diagnostica: "O campo `user_id` está nulo porque a trigger de auth falhou" e propõe a correção no código Python.
    *   **Ganho:** Diagnóstico instantâneo sem troca de contexto.

### 📋 Caso de Uso 3: Gestão de Projetos (GitHub Issues / Linear MCP)

Para alinhar o `task.md` com a realidade.

*   **Cenário Atual:** Você atualiza o `task.md` manualmente, depois vai no GitHub e fecha a issue.
*   **Com MCP do GitHub/Linear:**
    1.  O agente inicia a sessão lendo as Issues atribuídas a você via API.
    2.  Ele atualiza o `task.md` automaticamente: "Hoje temos 3 bugs críticos".
    3.  Ao finalizar e dar o commit, ele posta um comentário na Issue original com o link do PR.
    *   **Ganho:** Sincronia total entre código e gestão.

### 🧠 Caso de Uso 4: Memória Externa (Filesystem & RAG MCP)

Isso potencializa o **Nexus Auditor**.

*   **Cenário Atual:** O agente só lembra do que está na janela de contexto.
*   **Com MCP de Filesystem/Search:**
    1.  O agente pode pesquisar em documentos fora do projeto atual (ex: anotações pessoais, livros em PDF, docs antigos).
    2.  Ao criar uma feature nova, ele busca "Como implementamos autenticação no projeto V2?" e reutiliza o padrão.
    *   **Ganho:** O agente aprende com o passado e não reinventa a roda.

* * *

### 🗺️ Como Implementar no Sistema GUARANI

Para ativar o **MCP First Protocol**, precisamos de duas ações:

#### 1\. Instalação dos Servidores

No Windsurf ou Antigravity, configuramos o arquivo de config do MCP (`mcp_config.json`) para conectar a essas ferramentas.

Exemplo de configuração (conceitual):

```
{
  "mcpServers": {
    "figma": { "command": "npx", "args": ["@modelcontextprotocol/server-figma"] },
    "postgres": { "command": "npx", "args": ["@modelcontextprotocol/server-postgres", "postgresql://user:pass@localhost:5432/db"] },
    "git": { "command": "npx", "args": ["@modelcontextprotocol/server-git"] }
  }
}
```

#### 2\. Atualização do Nexus (Meta Prompts)

Atualizamos os arquivos do Nexus para instruir o uso dessas ferramentas.

> **Exemplo: Atualização no `.guarani/nexus/auditor.md`** "Antes de criar uma UI, verifique se temos acesso ao **Figma MCP**. Se sim, leia o componente visual original para extrair os tokens de cor e tipografia exatos."

### Resumo do Benefício

O "MCP First" transforma o agente de um **Consultor** (que dá conselhos) em um **Operador** (que executa ações). Para o EGOSv3, isso significa menos Alt-Tab, menos copy-paste e maior precisão técnica.

Quer que eu gere o arquivo de configuração base para o `mcp_config.json` com os servidores mais úteis para o seu stack (Figma, Postgres, Filesystem)?

## Prompt:
melhore e organize esse texto abaixo pra mim, é uam isntrucao pra um agente de ia dentro do widnsurf ide: "quero que faça um diagnsotico completo de todo nosso sistema ate o momento, veja se temos algo a melhorar, verriifuqe todas as apis e suas rotas ,todos nosso endpoints e entradas de dados, veja se tudo esta interligado, se tudo esta seguindo nossos padroes ,se faça uma analise completa e multidisplicanar de nosso sistema inteiro para vermos o que precisamos comunicar melhor, onde temos que interligar, interconectar, procure no codebase se ja temos scripts, pasta pra isso, health check, testes ,validacoes.

faça isso com muito carinho e cuidado, em todo o sistema intelink, verificando pasta por pasta, arquivos por arquvio, comencando pelo nosso core, os 10 arquivos mais importatens, depois os outros 10, e assim por diante, ate ter uma visao geral e ja crie todas as tasks necessarias para melhorar tudo que voce encontrar. se deparar com algo que precisa refatorar, melhorar e for muito custoso por enquanto ,ja que estamos em outra sprint, sinalize a task com a devida prioridade que voce achar e prossiga."

## Response:
> Thinking:
> 
> > Thinking:
> > 
> > **Considering The Core Task**
> > 
> > I'm focusing now on the user's need to refine and structure their instruction text. The primary objective is to make this text more effective for an AI agent called Cascade, so the focus is definitely on clarity and conciseness, especially for its use in a context-aware coding environment. I'm exploring different ways to organize the information, as well as considering best practices for instructing AI agents.
> > 
> > **Refining the Audit's Scope**
> > 
> > I'm now zeroing in on the ambiguities in the original instruction, particularly the vagueness of the "complete multidisciplinary analysis." I'm also rethinking the file-by-file approach – it feels inefficient for an AI, suggesting more context-aware methods, perhaps batch processing, might be ideal. My goal is to translate the user's "with care" directive into more concrete, actionable steps that Cascade can understand and execute.
> > 
> > **Formulating The Improvement**
> > 
> > My main focus now is on developing the improved prompt, keeping the "GUARANI" framework firmly in mind. The new prompt needs to be an actionable instruction that leverages the agent's analytical skills without exceeding its context window. I'm considering using a phased architecture-based approach, shifting away from the original file-by-file method. This new prompt needs to define the agent's role as well as the objectives for a complete system diagnostic.
> > 
> > **Constructing The Tasks**
> > 
> > I'm now prioritizing the actionable output, focusing on specific tasks Cascade needs to complete. This involves creating and prioritizing tasks, acknowledging the user's critical constraint regarding the refactor cost. I'm refining the tone to be professional and directive, but also considerate of the project's limitations. I'm building two options: a straightforward, bulleted version and another that leverages the "GUARANI/Nexus" terminology to reinforce the user's existing system and familiarity.
> > 
> > **Integrating Specific Details**
> > 
> > I've just added "Intelink" to the prompt, clarifying the project name. I'm also now structuring the improved instructions to include a context section for why this new instruction is better, the ready-to-copy prompt, and then a thorough breakdown explaining the logic. I am also making sure to mention the 10 files at a time. The end response's structure will emphasize this new and improved format.

Aqui está uma versão reorganizada e profissional, otimizada para o **Windsurf IDE**.

Como você já implementou o sistema **GUARANI**, redigi esta instrução usando a "persona" do **NEXUS AUDITOR** combinado com o **NEXUS MEDIC**. Isso garante que o agente entenda a profundidade técnica exigida sem perder o foco na priorização.

### 📋 Opção: Prompt Estruturado (Copie e Cole)

```
# 🩺 DIAGNÓSTICO SISTÊMICO: PROJETO INTELINK

**Contexto:** Atue como o Arquiteto de Software Sênior e Auditor do Sistema GUARANI.
**Objetivo:** Realizar uma varredura completa ("Deep Scan") no projeto Intelink para garantir integridade, padronização e conectividade.

## 1. ESCOPO DA ANÁLISE
Por favor, verifique o codebase pasta por pasta, com foco inicial nos **10 arquivos principais (Core)** e expandindo progressivamente para os demais módulos.

**O que investigar:**
* **APIs e Rotas:** Verifique todos os endpoints, métodos HTTP e caminhos. Estão padronizados?
* **Fluxo de Dados:** Analise as entradas (inputs), validações (schemas/Zod) e tipagem.
* **Conectividade:** Confirme se os serviços estão interligados corretamente e se não há "pontas soltas".
* **Integridade:** Procure por scripts de Health Check, Testes Unitários/E2E e validações de segurança existentes.
* **Padrões:** Verifique se o código segue as diretrizes do `PREFERENCES.md`.

## 2. MÉTODO DE EXECUÇÃO
Execute a análise de forma "multidisciplinar" (Frontend, Backend, Infra, Segurança).
1.  Comece pelo **Core** (Arquitetura central e configs).
2.  Avance para **Services/APIs**.
3.  Finalize com **Utils/Helpers e Componentes**.

## 3. GERAÇÃO DE TASKS E PRIORIZAÇÃO
Para cada melhoria ou problema encontrado, crie uma entrada no arquivo de tarefas (ou gere um relatório `audit_report.md`):

* **⚡ P0 (Crítico):** Erros de segurança, rotas quebradas ou falhas de lógica. (Deve ser feito agora).
* **🛠️ P1 (Melhoria Necessária):** Padronização, falta de validação, falta de testes.
* **💤 P2 (Débito Técnico/Refatoração):** Melhorias arquiteturais que são custosas ou complexas.
    * *Regra:* Se a refatoração for muito pesada para a Sprint atual, apenas documente a task com detalhes técnicos e marque como `[Backlog/Future]`.

**Ação:** Comece identificando os 10 arquivos mais críticos do Intelink e inicie o diagnóstico neles agora.
```

* * *

### Por que esta versão é melhor?

1.  **Estrutura de "Engenharia":** Substituímos o texto corrido por seções claras (**Escopo**, **Método**, **Saída**). Agentes de IA processam bullet points muito melhor do que parágrafos longos.
2.  **Otimização de Contexto:** A instrução de "10 arquivos por vez" foi mantida como uma diretriz de prioridade ("Comece pelo Core"). Isso evita que o agente tente ler 5.000 arquivos de uma vez e alucine, forçando-o a focar no que realmente importa primeiro.
3.  **Regra de Custo/Benefício Clara:** A instrução original dizia "se for custoso... sinalize". Na nova versão, definimos isso explicitamente como **P2 (Débito Técnico)**. Isso ensina o agente a não propor reescrever o sistema todo agora, o que travaria seu desenvolvimento.
4.  **Vocabulário Técnico:** Termos como "Health Check", "Inputs", "Schemas" e "Deep Scan" ativam comportamentos mais rigorosos no modelo do Windsurf.



---
Powered by [Gemini Exporter](https://www.ai-chat-exporter.com)