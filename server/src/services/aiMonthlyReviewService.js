const { SYSTEM_INSTRUCTION } = require('./aiService');

const AI_MONTHLY_REVIEW_PROMPT = `
You are a financial education assistant giving an executive monthly financial summary.

RULES:
1. Ground your response strictly in the provided verified data.
2. NEVER invent financial numbers or fabricate data.
3. Keep the summary concise (2-4 bullet points or short paragraphs).
4. Clearly explain income, expenses, savings rate, and key category/budget highlights.
5. Do NOT promise guaranteed returns or recommend specific stocks/funds/brokers.
6. If data is missing or incomplete, state it neutrally.
`;

/**
 * Generate fallback natural-language summary when AI API is unavailable
 */
const generateFallbackReviewSummary = (reviewData) => {
  const { period, summary, largestCategory, budgetPerformance } = reviewData;

  if (summary.transactionCount === 0) {
    return `Your ${period.label} review shows no recorded transactions for this month. Add income or expense transactions to view detailed analytics.`;
  }

  let text = `Your ${period.label} financial review shows a total income of **₹${summary.income.toLocaleString()}** and total expenses of **₹${summary.expenses.toLocaleString()}**, resulting in net savings of **₹${summary.savings.toLocaleString()}** (${summary.savingsRateText}).\n\n`;

  if (largestCategory) {
    text += `• **Top Category**: ${largestCategory.category} was your highest expense category at ₹${largestCategory.amount.toLocaleString()}.\n`;
  }

  if (budgetPerformance && budgetPerformance.length > 0) {
    const exceeded = budgetPerformance.filter((b) => b.status === 'Exceeded').length;
    if (exceeded > 0) {
      text += `• **Budget Warning**: ${exceeded} category budget(s) exceeded their limit.\n`;
    } else {
      text += `• **Budget Performance**: All category budgets remained within or near set limits.\n`;
    }
  }

  return text;
};

/**
 * Generate AI Executive Summary for Monthly Review
 */
const generateAIMonthlyReviewSummary = async (reviewData) => {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_ai_api_key_here') {
    return generateFallbackReviewSummary(reviewData);
  }

  try {
    const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    const model = process.env.AI_MODEL || (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash');

    const promptContext = `
MONTHLY REVIEW DATA FOR ${reviewData.period.label}:
- Income: ₹${reviewData.summary.income}
- Expenses: ₹${reviewData.summary.expenses}
- Net Savings: ₹${reviewData.summary.savings}
- Savings Rate: ${reviewData.summary.savingsRateText}
- Transaction Count: ${reviewData.summary.transactionCount}
- Top Category: ${reviewData.largestCategory ? `${reviewData.largestCategory.category} (₹${reviewData.largestCategory.amount})` : 'None'}
- Highlights: ${JSON.stringify(reviewData.highlights)}
`;

    if (provider === 'gemini' || provider === 'google') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${AI_MONTHLY_REVIEW_PROMPT}\n\n${promptContext}` }]
          }
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 400 }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      }
    } else if (provider === 'openai') {
      const url = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model,
        messages: [
          { role: 'system', content: AI_MONTHLY_REVIEW_PROMPT },
          { role: 'user', content: promptContext }
        ],
        temperature: 0.2,
        max_tokens: 400
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content;
        if (text && text.trim()) return text.trim();
      }
    }

    return generateFallbackReviewSummary(reviewData);
  } catch (err) {
    return generateFallbackReviewSummary(reviewData);
  }
};

module.exports = {
  generateAIMonthlyReviewSummary,
  generateFallbackReviewSummary
};
