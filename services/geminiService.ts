
import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { PrescriptionData, AIPersona, Attachment } from "../types";
import { clinicData } from "./clinicData";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const prescriptionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    patientName: {
      type: Type.STRING,
      description: "Patient name (use provided name).",
    },
    diagnosis: {
      type: Type.STRING,
      description: "Professional diagnosis in Simplified Chinese (e.g., '敏感性肌肤', '光老化'). Max 12 chars.",
    },
    treatment: {
      type: Type.STRING,
      description: "Aesthetic treatment plan using specific items from the provided project data. Include price if relevant. (e.g., '建议: 黄金超光子 (¥980) + 润致娃娃针 (¥799)'). Max 100 chars.",
    },
    advice: {
      type: Type.STRING,
      description: "Advice in Simplified Chinese tailored to the requested persona. Max 25 chars.",
    },
  },
  required: ["patientName", "diagnosis", "treatment", "advice"],
};

const PERSONA_PROMPTS: Record<AIPersona, string> = {
    gentle: "语气温柔、体贴，像一位知心姐姐。医嘱要充满关怀。",
    professional: "语气严谨、专业、客观，像一位资深专家。医嘱要简练有力。",
    witty: "语气幽默、风趣、带点网感，像一位时尚博主。医嘱可以带点调侃。",
    ancient: "语气古雅，使用文言虚词（如'乃'、'矣'），像一位古代御医。医嘱要富有诗意。"
};

export const generatePrescription = async (
  userInput: string, 
  patientName: string,
  imageBase64?: string,
  persona: AIPersona = 'gentle'
): Promise<PrescriptionData> => {
  try {
    const model = "gemini-2.5-flash";
    
    let parts: any[] = [];
    
    // Handle Image Input
    if (imageBase64) {
      // Remove prefix if present (e.g. "data:image/jpeg;base64,")
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      });
    }

    // Send full clinic data. Flash model has large context window (1M tokens).
    const clinicContext = JSON.stringify(clinicData.sheets_data); 

    const promptText = `
      你是一位BCC医美诊所的顶尖医生。
      
      参考资料 (Project Data):
      ${clinicContext}
      
      患者姓名: "${patientName}".
      患者主诉/症状: "${userInput}".
      
      请根据患者的描述${imageBase64 ? '以及提供的面部照片' : ''}，从参考资料中选择最合适的具体项目生成处方。
      
      要求：
      1. 必须使用简体中文。
      2. **治疗方案必须优先推荐参考资料中存在的具体项目名称和价格**。
      3. 诊断要简短准确。
      4. 风格要求: ${PERSONA_PROMPTS[persona]}
    `;
    
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: prescriptionSchema,
        systemInstruction: `你是一位BCC医美诊所的医生。${PERSONA_PROMPTS[persona]} 请始终用中文回答。`,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as PrescriptionData;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Provide fallback data so the app doesn't crash, but log the error clearly
    return {
      patientName: patientName,
      diagnosis: "系统繁忙",
      treatment: "网络连接不稳定，请检查网络或重试。",
      advice: "请稍后再试。",
    };
  }
};

// Generate suggested questions based on context (prescription or conversation)
export const generateChatSuggestions = async (contextText: string, isInitial: boolean = false): Promise<string[]> => {
    try {
        const prompt = `
            背景信息/对话上下文:
            ${contextText}

            ${isInitial ? "基于以上医美处方，生成3-5个患者最可能追问的问题。" : "基于以上医生的回复，生成3-5个用户可能会继续追问的问题。"}
            
            要求：
            1. 问题要简短（不超过15个字）。
            2. 有针对性，直接切中患者关心的痛点（如恢复期、价格、疼痛度、效果持久性）。
            3. 请直接返回一个JSON字符串数组。
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        
        const text = response.text;
        if (!text) return ["恢复期多久？", "会有副作用吗？", "大概多少钱？"];
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to generate suggestions", e);
        return ["恢复期多久？", "会有副作用吗？", "大概多少钱？"];
    }
};

export const createChatSession = (prescription: PrescriptionData, persona: AIPersona = 'professional'): Chat => {
    const systemInstruction = `
        你是一位BCC医美诊所的资深医美顾问助手。
        
        【当前处方】
        患者: ${prescription.patientName}
        诊断: ${prescription.diagnosis}
        方案: ${prescription.treatment}
        建议: ${prescription.advice}
        
        【任务】
        1. 解答患者关于处方、项目、术后护理、价格等方面的疑问。
        2. 参考价格数据: ${JSON.stringify(clinicData.sheets_data)}。
        3. 风格: ${PERSONA_PROMPTS[persona]}
        4. 支持多模态：用户可能发送面部照片（询问恢复情况）、视频或语音。请仔细观察图片/视频并给出专业反馈。
        5. 回答要优雅、专业、有同理心。
        6. 避免长篇大论，分点回答更佳。
    `;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
        }
    });
};
