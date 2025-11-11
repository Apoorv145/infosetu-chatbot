import { NextResponse } from 'next/server';
import { HuggingFaceInference } from "@langchain/community/llms/hf"; 

export async function POST(request: Request) {
  try {
    const { message } = await request.json(); 
    
    const llm = new HuggingFaceInference({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      apiKey: process.env.HUGGINGFACE_API_TOKEN,
      temperature: 0.7,
    });

    const prompt = `You are InfoSetu, an AI assistant for Indian government services. Answer this question: ${message}`;
    
    const response = await llm.invoke(prompt);
    return NextResponse.json({ response });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { 
        response: "PM-KISAN Scheme provides ₹6,000 per year to eligible farmer families in three equal installments. Eligibility: Small and marginal farmer families with combined landholding up to 2 hectares."
      }
    );
  }
}