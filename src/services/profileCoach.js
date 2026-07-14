// services/profileCoach.js

// All LangChain / Groq / zod packages are required lazily and defensively:
// if any of them are not installed or fail to load, this file must NOT
// throw at require-time, so it never takes down the router that requires it.
let ChatGroq = null;
let ChatPromptTemplate = null;
let RunnableSequence = null;
let StructuredOutputParser = null;
let SystemMessage = null;
let HumanMessage = null;
let AIMessage = null;
let z = null;

try {
  ({ ChatGroq } = require("@langchain/groq"));
  ({ ChatPromptTemplate } = require("@langchain/core/prompts"));
  ({ RunnableSequence } = require("@langchain/core/runnables"));
  ({ StructuredOutputParser } = require("langchain/output_parsers"));
  ({ SystemMessage, HumanMessage, AIMessage } = require("@langchain/core/messages"));
  ({ z } = require("zod"));
} catch (loadErr) {
  console.error("profileCoach: LangChain/Groq dependencies unavailable, AI profile coaching disabled.", loadErr.message);
}

const modelName = process.env.MODEL_NAME || "llama-3.3-70b-versatile";
const apiKey = process.env.GROQ_API_KEY;

let model = null;
if (apiKey && ChatGroq) {
  try {
    model = new ChatGroq({
      apiKey: apiKey,
      modelName: modelName,
      temperature: 0.5,
      maxTokens: 1500,
    });
  } catch (initErr) {
    console.error("profileCoach: Failed to initialize ChatGroq model, AI profile coaching disabled.", initErr.message);
    model = null;
  }
}

// Separate ChatGroq instance dedicated to free-form conversational turns.
// Kept distinct from `model` above (which is wired to the structured
// RunnableSequence) so chat token budgets/temperature can diverge without
// touching the existing suggestions pipeline.
let chatModel = null;
if (apiKey && ChatGroq) {
  try {
    chatModel = new ChatGroq({
      apiKey: apiKey,
      modelName: modelName,
      temperature: 0.6,
      maxTokens: 700,
    });
  } catch (initErr) {
    console.error("profileCoach: Failed to initialize chat ChatGroq model, AI Coach chat disabled.", initErr.message);
    chatModel = null;
  }
}

// Structured output schema matching the required response shape.
let outputParser = null;
if (StructuredOutputParser && z) {
  try {
    outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        overallScore: z.number().min(0).max(100).describe("Overall profile strength score from 0 to 100"),
        summary: z.string().describe("A short 1-3 sentence overall summary of the profile's current state"),
        strengths: z.array(z.string()).describe("2-5 short bullet points describing what is already strong about the profile"),
        missingFields: z.array(z.string()).describe("Short list of important profile fields that are empty or missing"),
        improvements: z.array(z.string()).describe("3-6 short, concrete, actionable improvement suggestions"),
        suggestedSkills: z.array(z.string()).describe("2-6 complementary in-demand skills the developer could add"),
        betterBio: z.string().describe("A rewritten, improved version of the developer's 'about' bio, 2-4 sentences"),
      })
    );
  } catch (parserErr) {
    console.error("profileCoach: Failed to build StructuredOutputParser, AI profile coaching disabled.", parserErr.message);
    outputParser = null;
  }
}

let promptTemplate = null;
if (ChatPromptTemplate && outputParser) {
  try {
    promptTemplate = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are an elite Tech Career Coach and Profile Optimizer specializing in software engineer portfolios, resumes, and developer networking platforms like GitHub and LinkedIn.\n\n" +
        "Your goal is to provide a complete, deeply professional, and highly actionable profile audit.\n\n" +
        "Review the developer's headline/bio, skills & tech stack alignment, project portfolio, and networking/social footprint, then produce prioritized, concrete feedback.\n\n" +
        "CRITICAL: Respond with ONLY valid JSON matching the schema below. " +
        "Do not include any intros, outros, markdown formatting (no ```), or any text outside the JSON object.\n\n" +
        "{format_instructions}"
      ],
      [
        "human",
        "Please audit this Git-Together developer profile based on the following data:\n\n" +
        "- **First Name**: {firstName}\n" +
        "- **Last Name**: {lastName}\n" +
        "- **Current Title/Headline**: {title}\n" +
        "- **About / Bio**: {about}\n" +
        "- **Skills Stack**: {skills}\n" +
        "- **Projects**: {projects}\n" +
        "- **Education/College**: {college} ({degree})\n" +
        "- **Current Workspace/Company**: {company}\n" +
        "- **Experience Level**: {experienceLevel}\n" +
        "- **Availability Status**: {availability}\n" +
        "- **Profile Integrity Score**: {profileStrength}/100\n" +
        "- **Connected Assets**: GitHub: {github} | LinkedIn: {linkedin} | Portfolio: {portfolio} | Resume Hosted: {resume}\n\n" +
        "Generate an overall score, a summary, strengths, missing fields, concrete improvements, suggested complementary skills, and an improved bio."
      ]
    ]);
  } catch (promptErr) {
    console.error("profileCoach: Failed to build ChatPromptTemplate, AI profile coaching disabled.", promptErr.message);
    promptTemplate = null;
  }
}

// RunnableSequence: PromptTemplate -> ChatGroq -> StructuredOutputParser
let chain = null;
if (RunnableSequence && promptTemplate && model && outputParser) {
  try {
    chain = RunnableSequence.from([promptTemplate, model, outputParser]);
  } catch (chainErr) {
    console.error("profileCoach: Failed to build RunnableSequence, AI profile coaching disabled.", chainErr.message);
    chain = null;
  }
}

/**
 * Deterministic, rule-based missing-fields check used both as a safety net
 * inside the fallback response and to sanity-check the LLM's own answer.
 * @param {Object} user
 * @returns {string[]}
 */
function computeMissingFields(user) {
  const missing = [];
  if (!user.developerTitle) missing.push("Developer Title");
  if (!user.about || user.about === "This is a default bio") missing.push("About / Bio");
  if (!Array.isArray(user.skills) || user.skills.length === 0) missing.push("Skills");
  if (!user.projects || user.projects.length === 0) missing.push("Projects");
  if (!user.college) missing.push("College");
  if (!user.company) missing.push("Company");
  if (!user.experienceLevel) missing.push("Experience Level");
  if (!user.availability) missing.push("Availability");
  if (!user.github) missing.push("GitHub Link");
  if (!user.linkedin) missing.push("LinkedIn Link");
  if (!user.portfolio) missing.push("Portfolio Link");
  if (!user.resume) missing.push("Resume");
  return missing;
}

/**
 * Builds a safe default structured response. Used when the AI layer is
 * unavailable, when the Groq/chain call fails outright, or when the LLM's
 * output cannot be parsed into the expected schema.
 * @param {Object} user
 * @returns {Object} A default structured profile-coaching object.
 */
function buildDefaultStructuredResponse(user) {
  const missingFields = computeMissingFields(user);

  return {
    overallScore: typeof user.profileStrength === "number" ? user.profileStrength : 0,
    summary: "We couldn't generate a fresh AI analysis right now, but here's a quick automated check of your profile.",
    strengths: Array.isArray(user.skills) && user.skills.length > 0
      ? [`You've listed ${user.skills.length} skill${user.skills.length > 1 ? "s" : ""} on your profile.`]
      : ["Your profile is set up and ready to be improved."],
    missingFields: missingFields.length > 0 ? missingFields : ["No obviously missing fields detected."],
    improvements: [
      "Fill out any missing fields listed above to strengthen your profile.",
      "Add specific, quantifiable details to your project descriptions.",
      "Try the AI Profile Coach again shortly for a full personalized audit.",
    ],
    suggestedSkills: [],
    betterBio: user.about || "This is a default bio",
  };
}

/**
 * Analyzes a user's profile with LangChain's PromptTemplate, ChatGroq, and
 * StructuredOutputParser, returning a structured JSON coaching object.
 *
 * Error handling contract: this function NEVER throws and ALWAYS resolves
 * to a valid object matching the expected schema, so the profile page can
 * never crash because of the AI layer.
 *
 * @param {Object} user - The logged-in user's data object from the database.
 * @returns {Promise<Object>} Structured profile coaching data.
 */
async function generateProfileSuggestions(user) {
  if (!chain) {
    return buildDefaultStructuredResponse(user);
  }

  const serializedProjects = user.projects && user.projects.length > 0
    ? JSON.stringify(user.projects)
    : "No projects listed yet";

  const invokeArgs = {
    format_instructions: outputParser.getFormatInstructions(),
    firstName: user.firstName || "Not specified",
    lastName: user.lastName || "Not specified",
    title: user.developerTitle || "Not specified",
    about: user.about || "Not specified",
    skills: Array.isArray(user.skills) ? user.skills.join(", ") : "None specified",
    projects: serializedProjects,
    college: user.college || "Not specified",
    degree: user.degree || "Not specified",
    company: user.company || "Not specified",
    experienceLevel: user.experienceLevel || "Not specified",
    availability: user.availability || "Not specified",
    profileStrength: user.profileStrength || 0,
    github: user.github ? "Linked" : "Missing",
    linkedin: user.linkedin ? "Linked" : "Missing",
    portfolio: user.portfolio ? "Linked" : "Missing",
    resume: user.resume ? "Uploaded" : "Missing",
  };

  let rawResult;
  try {
    // Runs the full RunnableSequence: PromptTemplate -> ChatGroq -> StructuredOutputParser.
    rawResult = await chain.invoke(invokeArgs);
  } catch (error) {
    console.error("profileCoach: AI profile suggestion generation failed.", error.message);
    return buildDefaultStructuredResponse(user);
  }

  // Defensive shape check in case the parser returned something unexpected
  // despite not throwing.
  if (
    !rawResult ||
    typeof rawResult.overallScore !== "number" ||
    typeof rawResult.summary !== "string" ||
    !Array.isArray(rawResult.strengths) ||
    !Array.isArray(rawResult.missingFields) ||
    !Array.isArray(rawResult.improvements) ||
    !Array.isArray(rawResult.suggestedSkills) ||
    typeof rawResult.betterBio !== "string"
  ) {
    return buildDefaultStructuredResponse(user);
  }

  return {
    overallScore: rawResult.overallScore,
    summary: rawResult.summary,
    strengths: rawResult.strengths,
    missingFields: rawResult.missingFields,
    improvements: rawResult.improvements,
    suggestedSkills: rawResult.suggestedSkills,
    betterBio: rawResult.betterBio,
  };
}

/**
 * Builds the shared system context string reused across every chat turn:
 * the developer's own profile fields plus the previously generated
 * structured coaching report (if any). Keeping this in one helper means
 * the chat model always "remembers" the profile + report without needing
 * generateProfileSuggestions to be re-run for every message.
 * @param {Object} user
 * @param {Object|null} suggestions - Previously generated report from
 *   generateProfileSuggestions, as forwarded by the client.
 * @returns {string}
 */
function buildChatSystemPrompt(user, suggestions) {
  const profileContext =
    "Developer Profile:\n" +
    `- Name: ${user.firstName || "Not specified"} ${user.lastName || ""}\n` +
    `- Title/Headline: ${user.developerTitle || "Not specified"}\n` +
    `- About/Bio: ${user.about || "Not specified"}\n` +
    `- Skills: ${Array.isArray(user.skills) && user.skills.length ? user.skills.join(", ") : "None specified"}\n` +
    `- Projects: ${Array.isArray(user.projects) && user.projects.length ? `${user.projects.length} project(s) listed` : "No projects listed yet"}\n` +
    `- College/Degree: ${user.college || "Not specified"} (${user.degree || "Not specified"})\n` +
    `- Company: ${user.company || "Not specified"}\n` +
    `- Experience Level: ${user.experienceLevel || "Not specified"}\n` +
    `- Availability: ${user.availability || "Not specified"}\n` +
    `- Profile Strength Score: ${user.profileStrength || 0}/100\n` +
    `- Connected Assets: GitHub: ${user.github ? "Linked" : "Missing"} | LinkedIn: ${user.linkedin ? "Linked" : "Missing"} | Portfolio: ${user.portfolio ? "Linked" : "Missing"} | Resume: ${user.resume ? "Uploaded" : "Missing"}`;

  const reportContext = suggestions
    ? "\n\nPreviously Generated Coaching Report (for context, don't just repeat it):\n" +
      `- Overall Score: ${suggestions.overallScore}/100\n` +
      `- Summary: ${suggestions.summary}\n` +
      `- Strengths: ${Array.isArray(suggestions.strengths) ? suggestions.strengths.join(" | ") : "None"}\n` +
      `- Missing Fields: ${Array.isArray(suggestions.missingFields) ? suggestions.missingFields.join(", ") : "None"}\n` +
      `- Improvements: ${Array.isArray(suggestions.improvements) ? suggestions.improvements.join(" | ") : "None"}\n` +
      `- Suggested Skills: ${Array.isArray(suggestions.suggestedSkills) ? suggestions.suggestedSkills.join(", ") : "None"}\n` +
      `- Suggested Bio: ${suggestions.betterBio || "None"}`
    : "\n\nNo coaching report has been generated yet for this session.";

  return (
    "You are 'AI Profile Coach', an elite Tech Career Coach and Profile Optimizer for 'Git-Together', a professional networking platform for developers. " +
    "Continue the conversation naturally, like a sharp, direct human coach would. Be concise (a few short paragraphs or a short list at most), " +
    "practical, and specific to the developer's actual profile and prior report below. Do not repeat the full report verbatim unless asked. " +
    "Respond in plain, friendly text — NOT JSON, NOT markdown code fences.\n\n" +
    profileContext +
    reportContext
  );
}

/**
 * Generates a free-form conversational reply for the AI Coach chat,
 * reusing the developer's profile and previously generated structured
 * report as context, plus prior turns in `history`, so the user never
 * needs to regenerate the report to keep chatting.
 *
 * `history` is an array of { role: "user" | "assistant", content: string }
 * turns preceding the current message, as forwarded by the client.
 *
 * Error handling contract: mirrors generateProfileSuggestions — this
 * function NEVER throws. On any failure (AI layer unavailable, Groq call
 * fails, or an unusable response shape) it returns null so the calling
 * route can respond with a graceful "unable to reach AI Coach" message
 * instead of crashing.
 *
 * @param {Object} user - The logged-in user's data object.
 * @param {Object|null} suggestions - Previously generated coaching report.
 * @param {Array<{role: string, content: string}>} history - Prior chat turns.
 * @param {string} message - The user's new chat message.
 * @returns {Promise<string|null>} The AI's reply text, or null on failure.
 */
async function generateCoachChatReply(user, suggestions, history, message) {
  if (!chatModel || !SystemMessage || !HumanMessage || !AIMessage) {
    return null;
  }

  const systemPrompt = buildChatSystemPrompt(user, suggestions);

  // Cap history defensively regardless of what the client sends, to bound
  // token usage per request.
  const safeHistory = Array.isArray(history) ? history.slice(-16) : [];

  const messages = [
    new SystemMessage(systemPrompt),
    ...safeHistory.map((turn) =>
      turn && turn.role === "assistant"
        ? new AIMessage(turn.content || "")
        : new HumanMessage((turn && turn.content) || "")
    ),
    new HumanMessage(message),
  ];

  let result;
  try {
    result = await chatModel.invoke(messages);
  } catch (error) {
    console.error("profileCoach: AI Coach chat reply failed.", error.message);
    return null;
  }

  let text = result?.content;

  // ChatGroq/LangChain can return content as a plain string or as an array
  // of content blocks depending on version; normalize both.
  if (Array.isArray(text)) {
    text = text
      .map((block) => (typeof block === "string" ? block : block?.text || ""))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof text !== "string" || !text.trim()) {
    return null;
  }

  return text.trim();
}

module.exports = {
  generateProfileSuggestions,
  generateCoachChatReply,
};