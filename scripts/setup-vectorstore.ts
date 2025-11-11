import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { Document } from "@langchain/core/documents";

const documents = [
  new Document({
    pageContent: "PM-KISAN Scheme provides ₹6,000 per year to eligible farmer families in three equal installments. Eligibility: Small and marginal farmer families with combined landholding up to 2 hectares. Required documents: Land records, Aadhaar card, bank account details. Apply through Common Service Centers or the PM-KISAN mobile app.",
    metadata: { id: "pm-kisan" }
  }),
  new Document({
    pageContent: "Aadhaar services include enrollment, update, and download. For enrollment: Visit any Aadhaar center with proof of identity, proof of address, and date of birth proof. For updates: Use the online portal uidai.gov.in or visit Aadhaar centers. Download e-Aadhaar from the official website using your enrollment number.",
    metadata: { id: "aadhaar" }
  })
];

async function setupVectorStore() {
  const embeddings = new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-MiniLM-L6-v2"
  });

  const vectorStore = await FaissStore.fromDocuments(documents, embeddings);
  await vectorStore.save("vector_store");
  console.log("Vector store created!");
}

setupVectorStore();