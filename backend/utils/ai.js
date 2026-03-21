const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generic helper to call OpenRouter (OpenAI compatible)
 */
const callOpenRouter = async (prompt, isJson = false) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";
  
  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing or not configured.");
  }

  console.log(`--- Falling back to OpenRouter (${model}) ---`);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://gyancode-platform.com", // Optional, for OpenRouter rankings
      "X-Title": "GyanCode Platform"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { 
          role: "system", 
          content: isJson ? "You are a helpful assistant that responds in valid JSON format." : "You are a helpful coding assistant."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API failed: ${response.status} ${errData.error?.message || ""}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  // Sometimes models wrap JSON in code blocks
  if (isJson && content.includes("```json")) {
    content = content.split("```json")[1].split("```")[0].trim();
  } else if (isJson && content.includes("```")) {
    content = content.split("```")[1].split("```")[0].trim();
  }

  return content;
};

/**
 * Wrapper to handle Gemini with OpenRouter Fallback
 */
const runAITask = async (prompt, options = {}) => {
  const { isJson = false, modelName = "gemini-2.5-flash-lite" } = options;

  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: isJson ? { responseMimeType: "application/json" } : undefined
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    // Check for 429 Quota Exceeded
    const isQuotaError = error.message?.includes("429") || error.status === 429 || (error.response && error.response.status === 429);
    
    if (isQuotaError) {
      console.warn("Gemini Quota Exceeded (429). Attempting fallback to OpenRouter...");
      try {
        return await callOpenRouter(prompt, isJson);
      } catch (fallbackError) {
        console.error("OpenRouter Fallback Failed:", fallbackError.message);
        throw error; // Re-throw original Gemini error if fallback also fails
      }
    }
    
    console.error("Gemini Task Error:", error.message);
    throw error;
  }
};

const generateHint = async (code, expected, actual) => {
  const prompt = `
    You are an expert coding tutor. A student is working on a problem.
    
    Problem: Expected output is "${expected}".
    Student's current code:
    \`\`\`
    ${code}
    \`\`\`
    Actual output received: "${actual}".
    
    Please provide a concise, actionable hint that guides the student toward the solution without giving them the direct code or the full answer. Be encouraging.
    Keep it under 3 sentences.
  `;

  try {
    return await runAITask(prompt);
  } catch (error) {
    return "Stuck? Re-check your logic and try running the code again.";
  }
};

const simulateExecutionAI = async (language, code, input) => {
  const prompt = `You are a strict code execution engine.
Execute the following ${language} code with the given standard input:
Input:
${input || "(none)"}

Code:
\`\`\`${language}
${code}
\`\`\`

Provide ONLY the exact standard output (STDOUT) it would produce. Do not explain. Do not wrap in markdown blocks. If there is a syntax or compilation error, provide the error message exactly as a compiler would.`;

  try {
    const output = await runAITask(prompt);
    return { output: output.trim() };
  } catch (error) {
    return { error: "Failed to securely execute code via AI." };
  }
};

const verifySubmissionAI = async (language, code, testCases) => {
  const formattedTestCases = testCases.map((tc, i) => `Test Case ${i + 1}:\nInput: ${tc.input}\nExpected Output: ${tc.output}`).join('\n\n');

  const prompt = `You are a strict code execution engine and an expert programming tutor.
You are given a piece of ${language} code submitted by a student.
Code:
\`\`\`${language}
${code}
\`\`\`

Test Cases:
${formattedTestCases}

Your Tasks:
1. Simulate the execution of the code for each test case and determine the exact STDOUT it produces.
2. Compare the actual output with the Expected Output. It passes if they strictly match after trimming whitespace.
3. Perform a Semantic Logic Check: Did the student genuinely attempt to solve the original algorithmic logic dynamically, or did they hardcode \`if/else\` or generic print statements just to bypass the test cases?

Respond precisely in this JSON format:
{
  "results": [
    { "input": "[the test case input]", "expected": "[the expected output]", "output": "[the actual simulated output]", "passed": true/false }
  ],
  "is_genuine": true/false,
  "semantic_feedback": "(if is_genuine is false, provide a 1-sentence explanation of why they are hardcoding or cheating. Otherwise null)"
}`;

  try {
    const responseText = await runAITask(prompt, { isJson: true });
    return JSON.parse(responseText);
  } catch (error) {
    console.error("AI Verification Error:", error);
    return null;
  }
};

module.exports = { generateHint, simulateExecutionAI, verifySubmissionAI, runAITask };
