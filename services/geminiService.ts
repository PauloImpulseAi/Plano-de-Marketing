import { GoogleGenAI, GenerateContentResponse, Chat, Modality } from "@google/genai";
import { ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("Variável de ambiente API_KEY não definida");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const marketingPlannerModel = 'gemini-2.5-pro';
const chatModel = 'gemini-2.5-flash';

const marketingPlannerSystemInstruction = `Você é um estrategista de marketing de classe mundial. O usuário fornecerá a ideia de negócio dele. Sua tarefa é gerar um plano de marketing completo e personalizado. O plano deve ser estruturado, profissional e prático. Deve incluir: 1. Um breve diagnóstico do potencial da ideia de negócio. 2. Uma estratégia multicanal cobrindo tanto mídias digitais (plataformas de mídia social, SEO/SEM, website) quanto tradicionais (mencione ideias criativas e específicas como 'propaganda volante com som', 'totens em TVs', etc., se aplicável à ideia). 3. Uma sugestão de estratégia de conteúdo. 4. Indicadores Chave de Desempenho (KPIs) para acompanhar o sucesso. Formate a saída usando **Markdown** para títulos, subtítulos, listas e texto em negrito para dar ênfase e melhorar a legibilidade.`;

const chatSystemInstruction = "Você é um assistente prestativo e amigável. Responda às perguntas do usuário de forma clara e concisa.";

const summarySystemInstruction = `Você é um assistente de IA focado em produtividade. Sua tarefa é analisar o plano de marketing fornecido e extrair uma lista concisa, em formato de bullet points (usando *), de todos os serviços e ações executáveis que foram propostos. Liste apenas as ações práticas, como 'Criar um website otimizado para SEO', 'Gerenciar campanhas no Instagram e Facebook', 'Contratar serviço de propaganda volante'. Não adicione introduções ou conclusões.`;

const quoteSystemInstruction = `Você é um consultor de negócios e especialista em propostas comerciais. Com base no plano de marketing fornecido, no nome da empresa e no telefone, crie uma proposta de orçamento profissional. A proposta deve ser estruturada em Markdown e conter as seguintes seções:
1.  **Proposta de Orçamento para [Nome da Empresa]**: Um título claro.
2.  **Serviços Inclusos**: Um resumo dos principais serviços estratégicos a serem entregues, baseado no plano de marketing.
3.  **Valores Sugeridos**:
    *   **Elaboração do Plano de Marketing Estratégico**: Sugira um valor único para o serviço de planejamento já realizado. Baseie o preço na complexidade e abrangência do plano.
    *   **Execução e Gerenciamento Mensal**: Sugira um valor de mensalidade para executar e gerenciar todas as ações propostas no plano (marketing digital, redes sociais, etc.).
4.  **Próximos Passos**: Uma breve chamada para ação, como "Vamos agendar uma reunião para discutir os detalhes?".
5.  **Contato**: Inclua o nome da empresa e o telefone fornecidos.
Seja profissional, claro e convincente. Os valores devem ser plausíveis para um serviço de consultoria de marketing.`;


export const generateMarketingPlan = async (idea: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: marketingPlannerModel,
      contents: idea,
      config: {
        systemInstruction: marketingPlannerSystemInstruction,
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao gerar plano de marketing:", error);
    return "Ocorreu um erro ao gerar o plano de marketing. Por favor, tente novamente.";
  }
};

let chatInstance: Chat | null = null;

export const getChatInstance = (): Chat => {
  if (!chatInstance) {
    chatInstance = ai.chats.create({
      model: chatModel,
      config: {
        systemInstruction: chatSystemInstruction,
      },
    });
  }
  return chatInstance;
};

export const sendMessageToBot = async (message: string, history: ChatMessage[]): Promise<string> => {
  try {
    const chat = getChatInstance();
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Erro ao enviar mensagem para o bot:", error);
    return "Desculpe, encontrei um erro. Por favor, tente novamente.";
  }
};

export const summarizeServices = async (planText: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: planText,
            config: {
                systemInstruction: summarySystemInstruction,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Erro ao resumir serviços:", error);
        return "Ocorreu um erro ao gerar o resumo. Por favor, tente novamente.";
    }
};

export const generateQuote = async (planText: string, companyName: string, phone: string): Promise<string> => {
    const prompt = `Plano de Marketing:\n${planText}\n\nNome da Empresa: ${companyName}\nTelefone: ${phone}`;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: quoteSystemInstruction,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Erro ao gerar orçamento:", error);
        return "Ocorreu um erro ao gerar o orçamento. Por favor, tente novamente.";
    }
};

// Fix: Add generateImage function to be used by ImageGenerator component.
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    return null;
  }
};

// Fix: Add editImage function to be used by ImageEditor component.
export const editImage = async (prompt: string, base64ImageData: string, mimeType: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Erro ao editar imagem:", error);
    return null;
  }
};

// Helper to convert file to base64
export const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [mimeType, base64Data] = result.split(';base64,');
      resolve({ base64: base64Data, mimeType: mimeType.replace('data:', '') });
    };
    reader.onerror = (error) => reject(error);
  });
};