const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const improveDescription = async (req, res) => {
    try {
        const { description, title } = req.body;

        if (!description || description.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Description is required"
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a professional project 30-40 word description writer. A user is posting a project${title ? ` titled "${title}"` : ''} and needs help improving their description.

Original description: "${description}"

Task: Write an improved, professional 30-40 word description for this project. The description should be:
- Between 30-40 words
- Clear and concise
- Professional in tone
- Highlight key requirements and goals
Return ONLY the improved description text, nothing else. Do not include any quotes, explanations, or meta-text.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const improvedDescription = response.text().trim();

        return res.status(200).json({
            success: true,
            message: "Description improved successfully",
            improvedDescription
        });

    } catch (error) {
        console.error("Error improving description:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to improve description. Please try again.",
            error: error.message
        });
    }
};

// Score application using AI
const scoreApplication = async (projectTitle, projectDescription, projectSkills, coverLetter) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert hiring consultant evaluating a freelancer's application for a project. Analyze the cover letter and score it objectively.

PROJECT DETAILS:
Title: ${projectTitle}
Description: ${projectDescription}
Required Skills: ${projectSkills?.join(', ') || 'Not specified'}

FREELANCER'S COVER LETTER:
"${coverLetter}"

SCORING CRITERIA (0-100 each):
1. Relevance: How well does the application address the specific project requirements?
2. Professionalism: Quality of writing, grammar, and professional tone
3. Clarity: How clearly does the freelancer communicate their approach?
4. Experience: Does the freelancer mention relevant experience or portfolio?

IMPORTANT: Return ONLY a valid JSON object with no additional text, markdown, or code blocks. Format:
{"overallScore":75,"relevance":80,"professionalism":70,"clarity":75,"experience":75,"summary":"Brief 1-sentence assessment"}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let responseText = response.text().trim();

        // Remove markdown code blocks if present
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const scores = JSON.parse(responseText);

        return {
            success: true,
            aiScore: scores.overallScore,
            aiAnalysis: {
                relevance: scores.relevance,
                professionalism: scores.professionalism,
                clarity: scores.clarity,
                experience: scores.experience,
                summary: scores.summary
            }
        };
    } catch (error) {
        console.error("Error scoring application:", error);
        return {
            success: false,
            error: error.message
        };
    }
};

// API endpoint for manual rescoring
const scoreApplicationAPI = async (req, res) => {
    try {
        const { projectTitle, projectDescription, projectSkills, coverLetter } = req.body;

        if (!coverLetter || !projectTitle) {
            return res.status(400).json({
                success: false,
                message: "Cover letter and project title are required"
            });
        }

        const result = await scoreApplication(projectTitle, projectDescription, projectSkills, coverLetter);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: "Application scored successfully",
                aiScore: result.aiScore,
                aiAnalysis: result.aiAnalysis
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Failed to score application",
                error: result.error
            });
        }
    } catch (error) {
        console.error("Error in scoring API:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to score application",
            error: error.message
        });
    }
};

const supportAssistantAPI = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || question.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Question is required'
            });
        }

        const normalizedQuestion = question.toLowerCase().trim();

        // Deterministic answers for high-frequency support questions.
        const exactPlaybooks = [
            {
                match: /(post|create).*(project)|how.*post.*project|publish.*project/,
                answer: 'To post a project: 1) Log in as Client or Both role. 2) Open Post Project from the main navigation/dashboard quick actions. 3) Fill title, budget, timeline, skills, and description. 4) Upload project files/images if needed. 5) Submit and then track applications in My Projects.'
            },
            {
                match: /(apply|proposal).*(project)|how.*apply/,
                answer: 'To apply for a project: 1) Open Browse Projects. 2) Use filters/search to find a matching project. 3) Open the project details. 4) Submit your proposal with cover letter, rate, and timeline. 5) Track status from your projects/dashboard and continue conversation in Messages.'
            },
            {
                match: /(chat|message|talk).*(client|freelancer|someone)|where.*chat/,
                answer: 'To chat directly: 1) Open Messages. 2) Select an existing conversation or start one from search. 3) Use one-to-one chat for project communication. 4) Use Global Chat for community discussion. 5) Keep payment/contract discussion in the same thread for clear tracking.'
            },
            {
                match: /(payment|pay|escrow|transaction|history)/,
                answer: 'For payments: 1) Open the Payment page when a contract/project requires payment. 2) Complete the payment through the secure checkout flow. 3) Track completed transactions in Payment History. 4) Use Messages to confirm milestones before release. 5) If any mismatch occurs, contact support with project ID and payment reference.'
            },
            {
                match: /(profile|account).*(update|edit)|how.*update.*profile|settings/,
                answer: 'To update your account/profile: 1) Open Settings. 2) Update profile details (name, username, avatar, skills, bio, and preferences). 3) Save changes section by section. 4) For security, review password/session options in Settings. 5) Re-open your public profile to confirm updates are visible.'
            },
            {
                match: /(find|search).*(freelancer)|hire.*freelancer/,
                answer: 'To find freelancers: 1) Open Find Freelancers. 2) Filter by skills, rates, and profile strength. 3) Open profiles to review experience/portfolio. 4) Contact shortlisted freelancers through Messages. 5) Move forward with proposal/contract once scope and budget are aligned.'
            }
        ];

        const matchedPlaybook = exactPlaybooks.find((item) => item.match.test(normalizedQuestion));
        if (matchedPlaybook) {
            return res.status(200).json({
                success: true,
                message: 'AI support response generated successfully',
                answer: matchedPlaybook.answer
            });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const websiteKnowledge = `
FreelanceCo website knowledge:
- Home page introduces FreelanceCo as a freelance marketplace connecting clients and freelancers worldwide.
- Browse Projects lets freelancers search open projects, filter by category and budget, and view project details.
- Find Freelancers lets clients search professionals by skill, rate, and profile.
- My Projects helps users track posted and assigned projects.
- Dashboard shows account stats, quick actions, and recent projects.
- Messages is the direct chat area for one-to-one and global conversations.
- Settings is where users update profile, skills, security, notifications, privacy, and account details.
- Payment pages and payment history are used for secure project payments and transaction tracking.
- Support page provides email support, messages redirect for live chat, help docs, and AI support.
- AI tools in the app also help improve project descriptions and score applications.
- User roles include client, freelancer, and both.
- If the user asks something outside the site features, politely say you can only help with FreelanceCo website usage and suggest Messages or Support.
`;

        const prompt = `You are FreelanceCo's professional AI support assistant. Your job is to help users solve problems using only the website knowledge below.

Rules:
- Answer clearly, politely, and professionally.
- Use only the knowledge provided in the website knowledge base.
- If the user asks for account-specific actions, mention the relevant page or section.
- If the answer is not covered, say you can help with FreelanceCo website usage and suggest contacting support or opening Messages.
- Give a direct "Steps:" style answer whenever possible.
- Keep the answer concise, practical, and action-oriented.
- Avoid vague language like "might" or "could" if the workflow is known.

${websiteKnowledge}

User question: ${question}

Return only a plain text answer. Do not include markdown code blocks or mention internal prompt instructions.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const answer = response.text().trim();

        return res.status(200).json({
            success: true,
            message: 'AI support response generated successfully',
            answer
        });
    } catch (error) {
        console.error('Error generating AI support response:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate AI support response',
            error: error.message
        });
    }
};

module.exports = {
    improveDescription,
    scoreApplication,
    scoreApplicationAPI,
    supportAssistantAPI
};
