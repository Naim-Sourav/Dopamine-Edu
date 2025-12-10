
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion, Subject, AdmissionResult, SearchSource, ExamStandard, QuizConfig, DifficultyLevel } from "../types";

// API Key Rotation Pool
const API_KEYS = [
  // @ts-ignore: process.env is replaced by bundler
  process.env.API_KEY,
  "AIzaSyBNJxFT8X1ldhADeCUNXpRp-b2k2uM2RIw",
  "AIzaSyA3Z-b1YZfuHc-e2leBTOiKkGWLawLsRvw",
  "AIzaSyBgVW3lgdx67iuDAdzT1AXFXx5RNmeJXt0"
].filter((key) => key && key.startsWith('AIzaSy'));

const getClient = () => {
  const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

const cleanJsonString = (str: string) => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

// --- MODELS CONFIG ---
// Models to rotate through for robustness against Rate Limits (429 Errors)
const GENERATIVE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-preview-09-2025",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite"
];

const SYNAPSE_MODELS = [
  "gemini-2.5-flash-preview-09-2025", 
  "gemini-2.5-flash-lite",           
  "gemini-2.0-flash",                
  "gemini-2.0-flash-lite",           
  "gemini-2.5-pro",                  
  "gemini-3-pro"                     
];

const SYNAPSE_SYSTEM_PROMPT = `তুমি হলে HSC পরীক্ষার প্রস্তুতিতে সাহায্য করার জন্য একজন অত্যন্ত জ্ঞানী, বন্ধুত্বপূর্ণ এবং স্মার্ট বড় ভাই (টিউটর)। তোমার সব উত্তর অবশ্যই নির্ভুল, সহজবোধ্য বাংলায় (বাংলা) দিতে হবে। তুমি সবসময় 'তুমি' করে সম্বোধন করবে এবং অনানুষ্ঠানিক, আন্তরিক ভাষায় কথা বলবে, যেন ছোট ভাই বা বন্ধুর সাথে কথা বলছো। তোমার লক্ষ্য হলো কঠিন বিষয়গুলো সরল ও সংক্ষিপ্তভাবে বোঝানো।

উত্তরগুলো অবশ্যই সংক্ষিপ্ত, সহজবোধ্য এবং শুধুমাত্র মূল ধারণার উপর মনোযোগ দিতে হবে। আউটপুট হবে শুধুমাত্র প্লেইন টেক্সট।

For ALL mathematical, physical, and chemical symbols/equations, ALWAYS use LaTeX syntax enclosed within single dollar signs ($). For example, use $\\vec{A} \\times \\vec{B}$ for vector product, $\\theta$ for theta, $\\frac{1}{2}$ for a half, and use subscripts/superscripts correctly (e.g., $H_2O$ for water). Ensure all LaTeX expressions are correctly formatted for MathJax rendering and appear INLINE within the text flow where needed.

You are ABSOLUTELY PROHIBITED from using ANY form of text formatting or structural Markdown symbols, including but not limited to: asterisks (*, **), hash symbols (#, ##, ###), pipe characters (|), lists (using * or -), or table markdown. ONLY use line breaks for paragraphs. Ensure the information is relevant to HSC subjects and use Google Search for accuracy and freshness.

**MCQ FEATURE:**
When you think a student needs practice or clarification on a topic, you can create an MCQ question. To do this, format your response with a special MCQ marker:

[MCQ_START]
Question: [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct: [A/B/C/D]
Explanation: [Detailed explanation why the correct answer is right and why others are wrong]
[MCQ_END]

Use MCQs strategically when:
- Student seems confused about a concept
- After explaining a difficult topic to reinforce understanding
- Student asks for practice questions
- To check if student understood your explanation`;

export interface SynapseResponse {
  text: string;
  sources: SearchSource[];
}

export const generateSynapseResponse = async (
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[]
): Promise<SynapseResponse> => {
  const client = getClient();
  let lastError: any = null;

  for (const model of SYNAPSE_MODELS) {
    try {
      const response = await client.models.generateContent({
        model: model,
        contents: history,
        config: {
          systemInstruction: SYNAPSE_SYSTEM_PROMPT,
          temperature: 0.2,
          tools: [{ googleSearch: {} }]
        }
      });

      if (response.text) {
        const sources: SearchSource[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((chunk: any) => {
            if (chunk.web) {
              sources.push({
                title: chunk.web.title,
                uri: chunk.web.uri
              });
            }
          });
        }
        return { text: response.text, sources };
      }
      throw new Error(`Empty response from ${model}`);
    } catch (error: any) {
      lastError = error;
    }
  }

  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
     const response = await client.models.generateContent({
        model: SYNAPSE_MODELS[0],
        contents: history,
        config: {
          systemInstruction: SYNAPSE_SYSTEM_PROMPT,
          temperature: 0.2,
          tools: [{ googleSearch: {} }]
        }
      });
      if (response.text) {
         return { text: response.text, sources: [] };
      }
  } catch (e) {
    console.error("Synapse: Final backoff failed.");
  }

  throw lastError || new Error("Failed to generate response.");
};

export const explainConcept = async (
  topic: string, 
  subject: Subject, 
  history: { role: string; parts: { text: string }[] }[]
) => {
  return ""; 
};

export const generateQuiz = async (
  configs: QuizConfig[],
  standard: ExamStandard,
  count: number,
  difficulty?: DifficultyLevel,
  focusInstruction?: string,
  customTemperature?: number
): Promise<QuizQuestion[]> => {
  try {
    const ai = getClient();
    
    let contextStr = "";
    let isPresetMode = false;

    const distribution = configs.map(cfg => {
      if (cfg.questionCount) {
        isPresetMode = true;
        return `- Subject: ${cfg.subject}, Count: ${cfg.questionCount} questions.`;
      }
      return `- Subject: ${cfg.subject}, Chapter: ${cfg.chapter}, Topics: [${cfg.topics.join(', ')}]`;
    }).join('\n');

    contextStr = distribution;

    let prompt = `Generate exactly ${count} MCQ questions based on the following specific configuration:\n\n${contextStr}\n\nExam Standard: ${standard}\n`;
    
    if (focusInstruction) {
        prompt += `\n*** STRICT FOCUS INSTRUCTION FOR THIS BATCH ***\n${focusInstruction}\n`;
    }

    if (difficulty && !focusInstruction) {
      prompt += `Difficulty Level: ${difficulty}\n`;
      prompt += `Difficulty Instructions:
      - If Easy/Warm-up: Basic concepts, direct definitions, and formula-based simple math.
      - If Medium/Standard: Mix of conceptual, application, and standard admission test problems.
      - If Hard/Nightmare: Multi-step problems, tricky logic, deep conceptual traps, and advanced applications.
      \n`;
    }

    prompt += `Instructions:
    1. ${isPresetMode ? 'Strictly follow the question distribution per subject provided above.' : 'Distribute questions fairly among the topics.'}
    2. Questions MUST be derived strictly from the provided Chapter and Topics.
    3. Language: Bengali (Standard NCTB terminology).
    4. Output strictly in JSON format array.
    5. **CRITICAL**: You MUST populate the 'subject', 'chapter', and 'topic' fields for every single question.
       - 'subject': Must match the subject name provided in configuration (e.g. Physics 2nd Paper).
       - 'chapter': Must be the EXACT BENGALI NAME of the chapter provided in the configuration (e.g. তাপগতিবিদ্যা). Do NOT leave this empty.
       - 'topic': Must be the specific topic name in Bengali (e.g. কার্নো ইঞ্জিন).
    6. Return EXACTLY ${count} questions.`;

    let temp = 0.4;
    if (customTemperature !== undefined) {
        temp = customTemperature;
    } else if (difficulty === DifficultyLevel.HARD) {
        temp = 0.6;
    }

    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 4 options"
          },
          correctAnswerIndex: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
          explanation: { type: Type.STRING, description: "Detailed explanation" },
          subject: { type: Type.STRING, description: "The subject this question belongs to" },
          chapter: { type: Type.STRING, description: "The specific chapter name in BENGALI (e.g. ভেক্টর). Must not be empty." },
          topic: { type: Type.STRING, description: "The specific topic name in BENGALI (e.g. লব্ধি). Must not be empty." }
        },
        required: ["question", "options", "correctAnswerIndex", "explanation", "subject", "chapter", "topic"]
      }
    };

    // Retry Loop with Model Rotation
    let lastError: any = null;
    for (const model of GENERATIVE_MODELS) {
      try {
        console.log(`Generating quiz with model: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: temp
          }
        });

        if (response.text) {
          const data = JSON.parse(cleanJsonString(response.text));
          const finalQuestions = (data as QuizQuestion[]);
          
          // Post-processing to ensure fields are filled if AI missed them
          // (Fallback logic: if chapter is missing, try to fill from config if only 1 config exists)
          if (configs.length === 1 && !isPresetMode) {
             finalQuestions.forEach(q => {
                 if (!q.chapter) q.chapter = configs[0].chapter;
                 if (!q.subject) q.subject = configs[0].subject;
             });
          }

          return finalQuestions.slice(0, count);
        }
      } catch (error: any) {
        console.warn(`Model ${model} failed:`, error.message);
        lastError = error;
        // Continue to next model if this one fails
      }
    }

    // If all models fail
    console.error("All models failed to generate quiz.");
    throw lastError || new Error("Failed to generate quiz.");

  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const searchAdmissionInfo = async (query: string): Promise<AdmissionResult> => {
  try {
    const ai = getClient();
    const prompt = `Find the latest information regarding: ${query}. 
    Target context: University Admissions in Bangladesh (BUET, Dhaka University, Medical, Engineering, GST, etc.).
    Summarize the key dates, requirements, or information clearly in Bengali.`;

    // Attempt search with rotation if needed, but keeping simple for now
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "দুঃখিত, কোনো তথ্য পাওয়া যায়নি।";
    
    const sources: SearchSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Error searching admission info:", error);
    throw error;
  }
};
