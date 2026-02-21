# EGOS Social MVPs: Escalando a Consciência de Classe com IA

**Origem:** Análise do chat "Consciência de classe moderna"
**Objetivo:** Utilizar a infraestrutura do EGOS (IA, Intelink, Psycho Engine) para criar ferramentas gratuitas ou de baixíssimo custo que ajudem trabalhadores a enxergar problemas estruturais, calcular seu valor real e se proteger contra precarização.
**Data:** 2026-02-21

---

## 1. O Problema Sistêmico (A Dor)
A conversa revelou que a falta de consciência de classe moderna se manifesta principalmente através de **assimetria de informação** e **culpabilização individual**. 
- Trabalhadores PJ não sabem calcular seu custo real.
- Profissionais em burnout acham que o problema é falta de "gestão de tempo".
- Entregadores não percebem a transferência de risco da plataforma.
- Ofertas de emprego e contratos mascaram abusos sob o selo de "flexibilidade".

**Nossa Solução:** Transformar a IA em um "Sindicato Cognitivo". Ferramentas que pegam a situação individual do usuário e mostram a matemática e a estrutura por trás dela.

---

## 2. As 5 Ferramentas / MVPs (Propostas)

### MVP 1: Calculadora de Valor Real (O Desmascarador PJ)
**O que é:** Uma ferramenta onde o usuário cola uma proposta de emprego PJ ou um freela. A IA destrincha a proposta e calcula o *valor real* da hora, embutindo custos invisíveis (férias, 13º, impostos, depreciação de equipamento, tempo comercial não pago).
**Como ajuda:** Combate o exemplo #2 e #6 do chat. Transforma o "bico" em negociação consciente.
**Tecnologia EGOS:** Agente simples + LLM para extração de dados da proposta + Matemática financeira básica.

### MVP 2: Scanner de Precarização (Red Flag Detector)
**O que é:** O usuário faz upload de um contrato de trabalho ou cola a descrição de uma vaga (ex: LinkedIn). O agente analisa o texto buscando armadilhas: "PJ com horário fixo", "Transferência de risco operacional", "Metas abstratas".
**Como ajuda:** Combate a ideologia patronal mascarada de inovação.
**Tecnologia EGOS:** Intelink OCR (se for PDF) + `intelink/document-extraction.ts` com um prompt focado em leis trabalhistas e abusos contratuais.

### MVP 3: Desmistificador de Burnout (Powered by Psycho Engine)
**O que é:** Um bot (Telegram ou Web) onde o usuário faz um desabafo sobre sua rotina, cansaço e cobranças. O Psycho Engine analisa o relato e separa o que é *responsabilidade individual* (ex: dormir pouco) do que é *violência estrutural* (ex: equipe reduzida pela metade, metas inatingíveis, slack no fim de semana).
**Como ajuda:** Combate o exemplo #4. Tira o peso da culpa individual e mostra a falha do design do trabalho.
**Tecnologia EGOS:** `PSYCHO_ENGINE.md` (integrando os novos padrões de "Síndrome do Impostor" e "Medo da Falha").

### MVP 4: Raio-X da Plataforma (Gig Economy Reality Check)
**O que é:** Uma ferramenta para motoristas e entregadores (Uber, iFood). Eles sobem o print do extrato da semana. A IA cruza com o preço da gasolina local, desgaste do veículo (pneus, óleo) e horas logadas (não apenas horas em corrida).
**Como ajuda:** Combate o exemplo #1. Mostra o lucro real vs a ilusão de "ser o próprio chefe".
**Tecnologia EGOS:** OCR para ler os prints dos apps + base de dados de custos de veículos.

### MVP 5: Mapa de Transparência Salarial Anônima
**O que é:** Um formulário seguro onde pessoas informam cargo, empresa e salário real. Usa o sistema Pramana para validar que a pessoa realmente trabalha lá (ex: e-mail corporativo criptografado sem reter o e-mail), gerando um score de certeza para a denúncia de desigualdade.
**Como ajuda:** Combate o exemplo #3. Evidencia desigualdades de gênero, raça e região dentro de empresas específicas.
**Tecnologia EGOS:** Pramana (Grau de Certeza) + Supabase RLS (Row Level Security) rigoroso para garantir anonimato absoluto.

---

## 3. Plano de Execução (Roadmap)

### Fase 1: O MVP mais barato e de maior impacto (Calculadora PJ)
- **Ação:** Construir uma página simples no `egos-web` (ex: `egos.ia.br/valor-real`).
- **UX:** Uma caixa de texto gigante: "Cole aqui sua proposta PJ ou vaga".
- **Backend:** Rota de API chamando LLM para extrair `[Salário Bruto, Benefícios (se houver), Exigências]`.
- **Output:** Um relatório visual claro: "Para essa vaga PJ valer a pena comparada a um CLT de X, eles teriam que pagar Y. Eles estão economizando Z nas suas costas."

### Fase 2: O Bot do Desabafo (Psycho Engine)
- **Ação:** Criar um bot no Telegram `@TrabalhoRealBot`.
- **UX:** O usuário manda áudio reclamando do chefe ou da rotina. Whisper transcreve. Psycho Engine processa.
- **Output:** Áudio ou texto acolhedor separando o estrutural do individual.

### Fase 3: A Biblioteca de Contratos (Intelink)
- **Ação:** Integrar o Scanner de Precarização ao Intelink, permitindo que usuários submetam contratos abusivos anonimamente, criando um "banco de dados público de vagas arrombadas".

---

## 4. Conclusão Estratégica
Essas ferramentas não são apenas produtos sociais; elas **demonstram o poder da infraestrutura B2B do EGOS na prática**. Mostrar que o EGOS consegue ler um contrato, detectar abuso, analisar o psicológico de um áudio e calcular riscos é o melhor portfólio possível para vender a tecnologia para grandes corporações e sindicatos modernos.
