import { NextResponse } from 'next/server';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { HuggingFaceInference } from "@langchain/community/llms/hf"; 
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
// --- THIS IS THE CORRECT PATH FOR YOUR PACKAGE VERSION ---
import { formatDocumentsAsString } from "langchain/document";
// --- END OF FIX ---
import { pipeline, Pipeline } from '@xenova/transformers';

// --- (Keep existing setup) ---
const embeddings = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/all-MiniLM-L6-v2"
});

const vectorStore = await FaissStore.load(
  "vector_store",
  embeddings
);

const retriever = vectorStore.asRetriever();

const llm = new HuggingFaceInference({
  model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  apiKey: process.env.HUGGINGFACE_API_TOKEN,
  temperature: 0.7,
});

const promptTemplate = `
You are "InfoSetu", an AI assistant for Indian government services.
Answer the user's question based *only* on the "Context" provided.
If the context doesn't have the answer, say "I'm sorry, I don't have information on that topic. I can help with PM-KISAN, Aadhaar, pension, and other government services."
Be helpful, concise, and polite.

Context:
{context}

Question:
{question}

Helpful Answer:
`;

const prompt = PromptTemplate.fromTemplate(promptTemplate);

const chain = RunnableSequence.from([
  {
    context: (input) => retriever.pipe(formatDocumentsAsString).invoke(input.question),
    question: (input) => input.question,
  },
  prompt,
  llm,
]);

// --- Translation Pipelines ---
class TranslationPipelineSingleton {
  static task = 'translation';
  static model_en_to_hi = 'Helsinki-NLP/opus-mt-en-hi';
  static model_hi_to_en = 'Helsinki-NLP/opus-mt-hi-en';
  
  static en_to_hi_pipe: Pipeline | null = null;
  static hi_to_en_pipe: Pipeline | null = null;

  static async getEnToHi() {
    if (this.en_to_hi_pipe === null) {
      this.en_to_hi_pipe = await pipeline(this.task, this.model_en_to_hi);
    }
    return this.en_to_hi_pipe;
  }

  static async getHiToEn() {
    if (this.hi_to_en_pipe === null) {
      this.hi_to_en_pipe = await pipeline(this.task, this.model_hi_to_en);
    }
    return this.hi_to_en_pipe;
  }
}

const translate = async (text: string, source_lang: string, target_lang: string) => {
  if (source_lang === target_lang) {
    return text;
  }

  let translator: Pipeline | null = null;

  if (source_lang === 'hi' && target_lang === 'en') {
    translator = await TranslationPipelineSingleton.getHiToEn();
  } else if (source_lang === 'en' && target_lang === 'hi') {
    translator = await TranslationPipelineSingleton.getEnToHi();
  }

  if (!translator) {
    return text;
  }

  const result = await translator(text, {
    src_lang: source_lang,
    tgt_lang: target_lang
  });

  return (result as any)[0].translation_text;
};

export async function POST(request: Request) {
  try {
    const { message, language } = await request.json(); 

    const englishQuery = await translate(message, language, 'en');

    const englishResponse = await chain.invoke({
      question: englishQuery
    });

    const localizedResponse = await translate(englishResponse, 'en', language);
    
    return NextResponse.json({ response: localizedResponse });

  } catch (error) {
    console.error("Chat API Error:", error);
    let errorMessage = "I'm sorry, I'm having trouble retrieving that information right now. Please try again later.";
    
    try {
      // Use a safer way to get language, in case request body is already read
      const requestData = await request.json().catch(() => ({ language: 'en' }));
      const language = requestData.language || 'en';
      if (language === 'hi') {
        errorMessage = "क्षमा करें, मुझे अभी जानकारी प्राप्त करने में कठिनाई हो रही है। कृपया बाद में पुनः प्रयास करें।";
      }
    } catch (e) {}
    
    return NextResponse.json(
      { 
        response: errorMessage
      },
      { status: 500 }
    );
  }
}