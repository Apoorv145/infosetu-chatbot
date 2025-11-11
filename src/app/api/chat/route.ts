import { NextResponse } from 'next/server';

const governmentData = {
  "aadhaar": "Aadhaar services include enrollment, update, and download. For enrollment: Visit any Aadhaar center with proof of identity, proof of address, and date of birth proof. For updates: Use the online portal uidai.gov.in or visit Aadhaar centers. Download e-Aadhaar from the official website using your enrollment number.",
  "pm-kisan": "PM-KISAN Scheme provides ₹6,000 per year to eligible farmer families in three equal installments.",
  "pension": "Government pension schemes include NSAP, Atal Pension Yojana, and Employees' Pension Scheme.",
  "employment": "Employment programs include MNREGA, National Career Service, Skill India Mission, and StartUp India.",
  "ration-card": "Digital Ration Card provides subsidized food grains under National Food Security Act.",
  "health-insurance": "Ayushman Bharat PM-JAY provides health insurance coverage of ₹5 lakhs per family annually."
};

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Simple keyword matching
    const lowerMessage = message.toLowerCase();
    let response = "";
    
    if (lowerMessage.includes('aadhaar')) response = governmentData.aadhaar;
    else if (lowerMessage.includes('pm-kisan') || lowerMessage.includes('kisan')) response = governmentData["pm-kisan"];
    else if (lowerMessage.includes('pension')) response = governmentData.pension;
    else if (lowerMessage.includes('employment') || lowerMessage.includes('job')) response = governmentData.employment;
    else if (lowerMessage.includes('ration') || lowerMessage.includes('food')) response = governmentData["ration-card"];
    else if (lowerMessage.includes('health') || lowerMessage.includes('insurance')) response = governmentData["health-insurance"];
    else response = "I can help with Aadhaar services, PM-KISAN scheme, pension schemes, employment programs, digital ration cards, and health insurance. Which service do you need information about?";
    
    console.log("Sending response:", response);
    return NextResponse.json({ response });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ 
      response: "Aadhaar services include enrollment, update, and download. Visit any Aadhaar center with proof of identity, address, and date of birth documents." 
    });
  }
}