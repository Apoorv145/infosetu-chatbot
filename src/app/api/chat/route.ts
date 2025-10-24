import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Smart mock responses based on user query
    const lowerMessage = message.toLowerCase();
    
    let response = "";
    
    if (lowerMessage.includes('kisan') || lowerMessage.includes('farmer')) {
      response = "PM-KISAN Scheme provides ?6,000 per year to eligible farmer families in three equal installments. Eligibility: Small and marginal farmer families with combined landholding up to 2 hectares. Required documents: Land records, Aadhaar card, bank account details. Apply through Common Service Centers or the PM-KISAN mobile app.";
    }
    else if (lowerMessage.includes('aadhaar') || lowerMessage.includes('uidai')) {
      response = "Aadhaar services include enrollment, update, and download. For enrollment: Visit any Aadhaar center with proof of identity, proof of address, and date of birth proof. For updates: Use the online portal uidai.gov.in or visit Aadhaar centers. Download e-Aadhaar from the official website using your enrollment number.";
    }
    else if (lowerMessage.includes('pension') || lowerMessage.includes('retirement')) {
      response = "Government pension schemes include: 1) National Social Assistance Programme (NSAP) for elderly, widows, disabled 2) Atal Pension Yojana for unorganized sector workers 3) Employees' Pension Scheme for organized sector. Eligibility varies by scheme but generally requires age 60+ and income criteria.";
    }
    else if (lowerMessage.includes('employment') || lowerMessage.includes('job')) {
      response = "Employment programs: 1) MNREGA - 100 days guaranteed rural employment 2) National Career Service - Job portal and career counseling 3) Skill India Mission - Vocational training 4) StartUp India - Entrepreneurship support. Visit your local employment exchange or the National Career Service portal for registration.";
    }
    else if (lowerMessage.includes('ration') || lowerMessage.includes('food')) {
      response = "Digital Ration Card application: 1) Apply through your state's food department portal 2) Visit Common Service Centers 3) Use the Ration Card mobile app. Required: Aadhaar card, address proof, income certificate, passport photos. The card provides subsidized food grains under the National Food Security Act.";
    }
    else if (lowerMessage.includes('health') || lowerMessage.includes('insurance')) {
      response = "Ayushman Bharat PM-JAY provides health insurance coverage of ?5 lakhs per family annually. Eligibility: Based on socio-economic caste census data. Coverage: Hospitalization, surgery, and medical treatments. Apply at empaneled hospitals or Common Service Centers. Bring Aadhaar and income certificate for verification.";
    }
    else {
      response = "Thank you for your query! I can help you with various government services including PM-KISAN for farmers, Aadhaar services, pension schemes, employment programs, digital ration cards, and health insurance. Could you please specify which service you need assistance with?";
    }
    
    return NextResponse.json({ response });
    
  } catch (error) {
    return NextResponse.json(
      { 
        response: "I'm here to help! Please ask me about government schemes like PM-KISAN, pension programs, or Aadhaar services."
      }
    );
  }
}