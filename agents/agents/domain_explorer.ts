import { AgentRunner } from "../runtime/runner";
import { ai_client } from "../../packages/shared/ai-client"; // Assuming OpenRouter client is here

export const domain_explorer = {
  id: "domain_explorer",
  name: "Domain Explorer",
  description: "Pesquisa profundamente um domínio para extrair features, ferramentas de baixo nível (primitivas) e gerar taxonomia estruturada.",
  
  async run(runner: AgentRunner, args: { query: string; context?: string }) {
    runner.logger.info(`Iniciando exploração agnóstica do domínio: ${args.query}`);
    
    const prompt = `
      Você é um explorador de domínio especialista e Arquiteto de Software, nos moldes do Andrew Mason (CEO do Descript).
      Seu objetivo é mapear o domínio a seguir e reduzi-lo a um banco de dados estruturado de primitivas (blocos de montar) e ferramentas open-source que podem ser usadas para construir isso.
      
      Domínio: "${args.query}"
      Contexto adicional: ${args.context || "Nenhum"}
      
      Retorne APENAS um JSON válido estruturado da seguinte forma:
      {
        "domain": "nome do dominio",
        "core_primitives": ["lista das operações fundamentais de mais baixo nível, ex: cortar vídeo, parsear áudio, ler pdf"],
        "underlying_tools": ["ferramentas open source consolidadas que já fazem isso, ex: FFmpeg, Tesseract, pdf.js"],
        "data_models": ["modelos de dados essenciais para gerenciar o estado no Supabase/Notion"],
        "suggested_mvp_features": ["3 features para o MVP"]
      }
    `;

    runner.logger.info("Enviando requisição para a IA...");
    let responseText = "";
    
    try {
      if (args.query === "dry-run-test") {
        responseText = JSON.stringify({
          domain: "Video Editor",
          core_primitives: ["Trim", "Rotate", "Extract Audio"],
          underlying_tools: ["FFmpeg.wasm"],
          data_models: ["Project", "Asset", "TimelineClip"],
          suggested_mvp_features: ["Rotate video in browser", "Trim start/end"]
        });
      } else {
         responseText = await ai_client.generate(prompt, { temperature: 0.2, maxTokens: 2000 });
      }
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!parsedData) {
        throw new Error("Failed to parse JSON from AI response.");
      }

      runner.logger.info("Domínio mapeado com sucesso.");
      
      return {
        status: "success",
        findings: parsedData,
        message: "Domínio mapeado e convertido em primitivas. Pronto para o primitive_architect."
      };
    } catch (e) {
      runner.logger.error(`Falha na exploração: ${e}`);
      return { status: "error", error: String(e) };
    }
  }
};
