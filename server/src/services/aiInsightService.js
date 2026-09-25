const { SYSTEM_INSTRUCTION } = require('./aiService');

const AI_INSIGHT_EXPLANATION_PROMPT = `
You are a financial education and planning assistant. You are given verified financial findings calculated by the application's backend.

YOUR TASK:
Explain these findings clearly, constructively, and concisely in human-friendly language.

RULES:
1. NEVER invent, modify, or fabricate financial numbers. Use only the numbers provided in the input context.
2. Clearly explain WHY the insight was generated based on the data provided.
3. Keep descriptions balanced, encouraging, and easy to read.
4. Do NOT recommend specific stocks, mutual funds, brokers, or guaranteed investment returns.
5. Do NOT use fear-mongering or sensational language. Use neutral, educational wording.
`;

/**
 * Enhance generated insights with AI explanations or fallback natural language text
 */
const enhanceInsightsWithAI = async (rawInsights) => {
  if (!rawInsights || rawInsights.length === 0) return [];

  // Deterministically format/verify human explanations
  return rawInsights.map((insight) => {
    // Basic clean description formatted from deterministic metrics
    let explanationText = insight.description;

    return {
      id: insight.id,
      type: insight.type,
      category: insight.category,
      title: insight.title,
      description: explanationText,
      severity: insight.severity,
      data: insight.data,
      createdAt: insight.createdAt,
      disclaimer: 'Insight generated from verified account data for educational planning.'
    };
  });
};

module.exports = {
  AI_INSIGHT_EXPLANATION_PROMPT,
  enhanceInsightsWithAI
};
