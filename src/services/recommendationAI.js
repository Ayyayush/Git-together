// services/recommendationAI.js

// All LangChain / Groq / zod packages are required lazily and defensively:
// if any of them are not installed or fail to load, this file must NOT
// throw at require-time, because that would prevent routes/user.js (which
// requires this module) from loading at all — taking down every route in
// userRouter, including GET /user/recommendations, with it.
let ChatGroq = null;
let ChatPromptTemplate = null;
let RunnableSequence = null;
let StructuredOutputParser = null;
let z = null;

try {
  ({ ChatGroq } = require("@langchain/groq"));
  ({ ChatPromptTemplate } = require("@langchain/core/prompts"));
  ({ RunnableSequence } = require("@langchain/core/runnables"));
  ({ StructuredOutputParser } = require("langchain/output_parsers"));
  ({ z } = require("zod"));
} catch (loadErr) {
  console.error(
    "recommendationAI: LangChain/Groq dependencies unavailable, AI explanations disabled.",
    loadErr.message
  );
}

// ======================================================
// Groq Model Configuration
// ======================================================

const modelName =
  process.env.MODEL_NAME || "llama-3.3-70b-versatile";

const apiKey = process.env.GROQ_API_KEY;

let model = null;

if (apiKey && ChatGroq) {
  try {
    model = new ChatGroq({
      apiKey,
      // IMPORTANT:
// Current @langchain/groq expects the model through `model`.
// Using only `modelName` can result in Groq receiving a request
// without the required `model` property.
      model: modelName,
      temperature: 0.3,
      maxTokens: 300,
    });

    console.log(
      `recommendationAI: Groq initialized with model ${modelName}`
    );
  } catch (initErr) {
    console.error(
      "recommendationAI: Failed to initialize ChatGroq model, AI explanations disabled.",
      initErr.message
    );

    model = null;
  }
} else {
  if (!apiKey) {
    console.warn(
      "recommendationAI: GROQ_API_KEY is missing. AI explanations disabled."
    );
  }

  if (!ChatGroq) {
    console.warn(
      "recommendationAI: ChatGroq dependency unavailable. AI explanations disabled."
    );
  }
}

// ======================================================
// Structured Output Schema
// ======================================================

let outputParser = null;

if (StructuredOutputParser && z) {
  try {
    outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        title: z
          .string()
          .describe(
            "A short, punchy title for the match, e.g. 'Excellent Full Stack Match'"
          ),

        summary: z
          .string()
          .describe(
            "A one to two sentence summary of why these two developers are a strong match"
          ),

        strengths: z
          .array(z.string())
          .describe(
            "An array of 2-4 short bullet points describing the strongest overlaps between both developers"
          ),

        collaborationIdeas: z
          .array(z.string())
          .describe(
            "An array of 1-3 short, concrete ideas for how the two developers could collaborate"
          ),
      })
    );
  } catch (parserErr) {
    console.error(
      "recommendationAI: Failed to build StructuredOutputParser, AI explanations disabled.",
      parserErr.message
    );

    outputParser = null;
  }
}

// ======================================================
// Prompt Template
// ======================================================

let promptTemplate = null;

if (ChatPromptTemplate && outputParser) {
  try {
    promptTemplate = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are an expert networking algorithm for 'Git-Together', a professional platform for developers. " +
          "Your task is to generate a concise, professional, and engaging match explanation between two developers, " +
          "focusing on their shared skills, professional alignment, and collaboration potential.\n\n" +
          "CRITICAL: Respond with ONLY valid JSON matching the schema below. " +
          "Do not include any intros, outros, markdown formatting (no ```), or any text outside the JSON object.\n\n" +
          "{format_instructions}",
      ],

      [
        "human",
        "Generate a match explanation based on this data:\n\n" +

          "Logged-in Developer Profile:\n" +
          "- Skills: {userSkills}\n" +
          "- Company: {userCompany}\n" +
          "- College: {userCollege}\n" +
          "- Location: {userLocation}\n" +
          "- Experience Level: {userExperience}\n" +
          "- Availability: {userAvailability}\n\n" +

          "Recommended Developer Profile:\n" +
          "- Name: {candidateName}\n" +
          "- Skills: {candidateSkills}\n" +
          "- Company: {candidateCompany}\n" +
          "- College: {candidateCollege}\n" +
          "- Location: {candidateLocation}\n" +
          "- Experience Level: {candidateExperience}\n" +
          "- Availability: {candidateAvailability}\n\n" +

          "Match Overview:\n" +
          "- Calculated Recommendation Score: {score}\n" +
          "- Matched Skills Count: {commonSkills}\n" +
          "- Reasons For Recommendation: {reasons}",
      ],
    ]);
  } catch (promptErr) {
    console.error(
      "recommendationAI: Failed to build ChatPromptTemplate, AI explanations disabled.",
      promptErr.message
    );

    promptTemplate = null;
  }
}

// ======================================================
// LangChain Pipeline
// Prompt -> Groq -> Structured Output Parser
// ======================================================

let chain = null;

if (
  RunnableSequence &&
  promptTemplate &&
  model &&
  outputParser
) {
  try {
    chain = RunnableSequence.from([
      promptTemplate,
      model,
      outputParser,
    ]);
  } catch (chainErr) {
    console.error(
      "recommendationAI: Failed to build RunnableSequence, AI explanations disabled.",
      chainErr.message
    );

    chain = null;
  }
}

/**
 * Builds a safe default structured response.
 *
 * Used when an AI response cannot be represented using the
 * expected structured format.
 */
function buildDefaultStructuredResponse(analysis) {
  const reasons =
    Array.isArray(analysis?.reasons) &&
    analysis.reasons.length > 0
      ? analysis.reasons
      : ["Shared interest in technical collaboration"];

  return {
    title: "Good Networking Match",

    summary: reasons.join(", ") + ".",

    strengths: reasons,

    collaborationIdeas: [
      "Reach out to discuss shared interests and potential collaboration.",
    ],
  };
}
/**
 * Generates an AI-driven professional networking match explanation using
 * LangChain's PromptTemplate, ChatGroq, and StructuredOutputParser.
 *
 * Error handling:
 * - If the AI layer is unavailable, returns null.
 * - If Groq/API invocation fails, returns null.
 * - If the parsed response has an unexpected structure, returns a safe
 *   fallback response.
 *
 * @param {Object} currentUser - Logged-in developer.
 * @param {Object} candidate - Recommended developer.
 * @param {Object} analysis - Calculated recommendation details.
 * @returns {Promise<Object|null>}
 */
async function generateAIExplanation(
  currentUser,
  candidate,
  analysis
) {
  // AI layer unavailable/configuration failed
  if (!chain) {
    return null;
  }

  // Defensive defaults
  currentUser = currentUser || {};
  candidate = candidate || {};
  analysis = analysis || {};

  const candidateName =
    `${candidate.firstName || ""} ${
      candidate.lastName || ""
    }`.trim() ||
    candidate.username ||
    "This developer";

  // ======================================================
  // Prepare Prompt Variables
  // ======================================================

  const invokeArgs = {
    format_instructions:
      outputParser.getFormatInstructions(),

    // Logged-in developer
    userSkills:
      Array.isArray(currentUser.skills) &&
      currentUser.skills.length > 0
        ? currentUser.skills.join(", ")
        : "Not specified",

    userCompany:
      currentUser.company || "Not specified",

    userCollege:
      currentUser.college || "Not specified",

    userLocation:
      currentUser.location || "Not specified",

    userExperience:
      currentUser.experienceLevel || "Not specified",

    userAvailability:
      currentUser.availability || "Not specified",

    // Candidate developer
    candidateName,

    candidateSkills:
      Array.isArray(candidate.skills) &&
      candidate.skills.length > 0
        ? candidate.skills.join(", ")
        : "Not specified",

    candidateCompany:
      candidate.company || "Not specified",

    candidateCollege:
      candidate.college || "Not specified",

    candidateLocation:
      candidate.location || "Not specified",

    candidateExperience:
      candidate.experienceLevel || "Not specified",

    candidateAvailability:
      candidate.availability || "Not specified",

    // Recommendation analysis
    score:
      analysis.score ?? 0,

    commonSkills:
      analysis.commonSkills ?? 0,

    reasons:
      Array.isArray(analysis.reasons) &&
      analysis.reasons.length > 0
        ? analysis.reasons.join(", ")
        : "General professional compatibility",
  };

  // ======================================================
  // Execute LangChain Pipeline
  // Prompt -> ChatGroq -> StructuredOutputParser
  // ======================================================

  let rawResult;

  try {
    rawResult = await chain.invoke(invokeArgs);
  } catch (groqOrChainError) {
    console.error(
      "recommendationAI: AI explanation generation failed.",
      groqOrChainError?.message || groqOrChainError
    );

    // Recommendation endpoint should continue working even
    // if Groq is temporarily unavailable.
    return null;
  }

  // ======================================================
  // Validate Structured Response
  // ======================================================

  if (
    !rawResult ||
    typeof rawResult !== "object" ||
    typeof rawResult.title !== "string" ||
    typeof rawResult.summary !== "string" ||
    !Array.isArray(rawResult.strengths) ||
    !Array.isArray(rawResult.collaborationIdeas)
  ) {
    console.warn(
      "recommendationAI: Unexpected structured response. Using fallback."
    );

    return buildDefaultStructuredResponse(analysis);
  }

  // ======================================================
  // Return Clean Structured Result
  // ======================================================

  return {
    title: rawResult.title,
    summary: rawResult.summary,
    strengths: rawResult.strengths,
    collaborationIdeas: rawResult.collaborationIdeas,
  };
}

// ======================================================
// Exports
// ======================================================

module.exports = {
  generateAIExplanation,
};