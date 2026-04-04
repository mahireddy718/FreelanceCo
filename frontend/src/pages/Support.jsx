import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import SplineScene from "../components/ui/spline";
import SEOHelmet from "../components/SEOHelmet";
import { HiOutlineMail, HiOutlineChatAlt2, HiOutlineDocumentText, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';


export default function Support() {
    const [openFaqIndex, setOpenFaqIndex] = useState(0);
    const supportEmail = 'veenu7184@gmail.com';
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supportEmail)}&su=${encodeURIComponent('FreelanceCo Support')}`;
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiAnswer, setAiAnswer] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    const aiSuggestions = [
        'How do I post a project?',
        'Where can I chat with someone?',
        'How do payments work?',
        'How do I update my profile?'
    ];

    const faqItems = [
        {
            category: 'Account',
            question: 'How do I update my account details?',
            answer: 'Go to Settings, open Profile Information, and update your name, username, avatar, or professional details. Changes are saved securely and reflected across the platform.'
        },
        {
            category: 'Projects',
            question: 'How do I post or apply for a project?',
            answer: 'Clients can use Post Project to create a listing, while freelancers can browse opportunities under Browse Projects and submit proposals with their rates and timeline.'
        },
        {
            category: 'Payments',
            question: 'How are payments handled?',
            answer: 'Payments are managed through secure escrow-style workflows. Funds are held safely while work is in progress, then released according to the agreed contract milestones.'
        },
        {
            category: 'Security',
            question: 'How do you protect my data and messages?',
            answer: 'We use authenticated sessions, role-based access, protected routes, and encrypted provider integrations where applicable. Sensitive actions are guarded with confirmation flows and session checks.'
        },
        {
            category: 'Messaging',
            question: 'Where can I talk to clients or freelancers?',
            answer: 'Use the Messages section for real-time chat. Global chat is available for community discussion, while one-to-one conversations are used for direct project communication.'
        },
        {
            category: 'Support',
            question: 'What if I still need help?',
            answer: 'Use the email address below for detailed requests or open a chat conversation for faster support. We recommend including the project name, screenshots, and a short summary of the issue.'
        }
    ];

    const scrollToHelpDocs = () => {
        document.getElementById('help-docs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const scrollToAiSupport = () => {
        document.getElementById('ai-support')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const askAiSupport = async (question) => {
        const query = (question || aiQuestion).trim();

        if (!query) return;

        setAiLoading(true);
        setAiError('');
        setAiAnswer('');

        try {
            const response = await axios.post(`${API_BASE_URL}/api/ai/support-assistant`, { question: query });
            setAiAnswer(response.data.answer || 'I could not generate a response. Please try again.');
        } catch (error) {
            setAiError(error?.response?.data?.message || 'Unable to reach AI support right now. Please try again later.');
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent relative overflow-hidden">
            <SEOHelmet
                title="Support - Get Help | FreelanceCo"
                description="Get help and support for your FreelanceCo account. Contact us for assistance with projects, payments, or any other questions."
                keywords="support, help, contact, freelanceco support, customer service"
            />
            {/* Spline 3D Background */}
            <div className="absolute inset-0 z-0 opacity-55 transition-all duration-1000 ease-in-out pointer-events-none">
                <SplineScene />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 py-16 md:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-surface rounded-3xl p-8 md:p-10 shadow-xl shadow-emerald-900/10"
                >
                    <h1 className="text-4xl md:text-5xl font-semibold text-slate-800 dark:text-slate-100 text-center">
                        Support That Actually Helps
                    </h1>
                    <p className="mt-4 text-center text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                        Reach out with account, project, payment, or security questions. We will guide you quickly and clearly.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <div className="glass-surface rounded-2xl p-5 border border-emerald-100/80 dark:border-emerald-900/60">
                            <HiOutlineMail className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                            <h2 className="mt-3 text-lg font-medium text-slate-800 dark:text-slate-100">Email Support</h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">For account and billing issues.</p>
                            <a
                                href={gmailComposeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition"
                                title={`Email ${supportEmail}`}
                            >
                                {supportEmail}
                                <span aria-hidden="true">→</span>
                            </a>
                            <a
                                href={`mailto:${supportEmail}?subject=${encodeURIComponent('FreelanceCo Support')}`}
                                className="mt-2 block text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                            >
                                Open in your default mail app
                            </a>
                        </div>

                        <div className="glass-surface rounded-2xl p-5 border border-emerald-100/80 dark:border-emerald-900/60">
                            <HiOutlineChatAlt2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                            <h2 className="mt-3 text-lg font-medium text-slate-800 dark:text-slate-100">Live Chat</h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">For urgent project or dispute help.</p>
                            <Link
                                to="/messages"
                                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition"
                            >
                                Open Messages
                                <span aria-hidden="true">→</span>
                            </Link>
                        </div>

                        <div className="glass-surface rounded-2xl p-5 border border-emerald-100/80 dark:border-emerald-900/60">
                            <HiOutlineDocumentText className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                            <h2 className="mt-3 text-lg font-medium text-slate-800 dark:text-slate-100">Help Docs</h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Guides for projects, contracts, and payments.</p>
                            <button
                                type="button"
                                onClick={scrollToHelpDocs}
                                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition"
                            >
                                Open Help Docs
                                <span aria-hidden="true">↓</span>
                            </button>
                        </div>

                        <div className="glass-surface rounded-2xl p-5 border border-emerald-100/80 dark:border-emerald-900/60">
                            <div className="flex items-center justify-between gap-3">
                                <HiOutlineChatAlt2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                                <span className="text-[11px] uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400 font-semibold">Smart Help</span>
                            </div>
                            <h2 className="mt-3 text-lg font-medium text-slate-800 dark:text-slate-100">AI Support</h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Ask our AI about the website and get direct guidance from the app itself.</p>
                            <button
                                type="button"
                                onClick={scrollToAiSupport}
                                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition"
                            >
                                Start AI Support
                                <span aria-hidden="true">↓</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    id="help-docs"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="mt-8 glass-surface rounded-3xl p-6 md:p-8 shadow-xl shadow-emerald-900/10"
                >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400 font-semibold">Help Docs</p>
                            <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100">Frequently Asked Questions</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                                Short answers to the most common questions about accounts, projects, payments, security, and messaging.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {faqItems.map((item, index) => {
                            const isOpen = openFaqIndex === index;

                            return (
                                <div key={item.question} className="rounded-2xl border border-emerald-100/70 dark:border-emerald-900/50 overflow-hidden bg-white/50 dark:bg-emerald-950/20">
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                                    >
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">{item.category}</p>
                                            <h3 className="mt-1 text-base md:text-lg font-medium text-slate-800 dark:text-slate-100">{item.question}</h3>
                                        </div>
                                        {isOpen ? (
                                            <HiOutlineChevronUp className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                        ) : (
                                            <HiOutlineChevronDown className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                        )}
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                    {item.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div
                    id="ai-support"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="mt-8 glass-surface rounded-3xl p-6 md:p-8 shadow-xl shadow-emerald-900/10"
                >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400 font-semibold">AI Support</p>
                            <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100">Talk to AI Support</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                                Ask questions about FreelanceCo features, and the assistant will answer using the website's actual pages and workflows.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAiQuestion('')}
                            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5 items-start">
                        <div className="rounded-2xl border border-emerald-100/70 dark:border-emerald-900/50 bg-white/50 dark:bg-emerald-950/20 p-5">
                            <label htmlFor="ai-question" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                                What do you need help with?
                            </label>
                            <textarea
                                id="ai-question"
                                value={aiQuestion}
                                onChange={(e) => setAiQuestion(e.target.value)}
                                placeholder="Example: How do I post a project and start receiving applications?"
                                className="w-full min-h-32 px-4 py-3 text-sm rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-white/85 dark:bg-emerald-950/35 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 resize-none"
                            />

                            <div className="mt-4 flex flex-wrap gap-2">
                                {aiSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => setAiQuestion(suggestion)}
                                        className="px-3 py-1.5 text-xs rounded-full border border-emerald-100 dark:border-emerald-900/50 bg-white/70 dark:bg-emerald-950/35 text-slate-700 dark:text-slate-200 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-5 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => askAiSupport()}
                                    disabled={aiLoading}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {aiLoading ? 'Thinking...' : 'Ask AI Support'}
                                </button>
                                <Link
                                    to="/messages"
                                    className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition"
                                >
                                    Open Messages instead
                                </Link>
                            </div>

                            {aiError && (
                                <div className="mt-4 p-3 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800">
                                    {aiError}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-emerald-100/70 dark:border-emerald-900/50 bg-white/50 dark:bg-emerald-950/20 p-5 h-full">
                            <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400 font-semibold">AI Response</p>
                            <div className="mt-3 min-h-48 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-emerald-950/30 p-4">
                                {aiLoading ? (
                                    <div className="h-full flex items-center justify-center py-10 text-sm text-slate-500 dark:text-slate-400">
                                        Generating helpful answer...
                                    </div>
                                ) : aiAnswer ? (
                                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                                        {aiAnswer}
                                    </p>
                                ) : (
                                    <div className="text-sm text-slate-500 dark:text-slate-400 leading-6">
                                        Your answer will appear here. Ask about posting projects, finding freelancers, payments, security, settings, or messages.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
