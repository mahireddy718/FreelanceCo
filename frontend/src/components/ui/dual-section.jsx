import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import AnimatedBeam from './AnimatedBeam';

export default function DualSection() {
    return (
        <div className="relative py-16 md:py-32 bg-transparent overflow-hidden transition-colors duration-200">
            {/* Dotted Pattern Background */}
            <div
                className="absolute inset-0 opacity-35"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(15,118,110,0.26) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Content */}
            <div className="relative mx-auto max-w-6xl px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-4 items-center">
                    {/* For Freelancers */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center glass-surface rounded-3xl px-6 py-8 md:py-10 shadow-xl shadow-emerald-900/10"
                    >
                        <p className="text-xs text-emerald-700 dark:text-emerald-200 font-medium mb-4 md:mb-6 border border-emerald-300/50 dark:border-emerald-500/50 rounded-xl w-28 md:w-36 mx-auto py-1">
                            Start earning today
                        </p>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-900 dark:text-white mb-2 md:mb-3">
                            For freelancers
                        </h2>
                        <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 font-normal mb-6 md:mb-8">
                            Find your next project
                        </p>
                        <Link
                            to="/signup"
                            className="inline-block px-6 md:px-8 py-2.5 md:py-3 bg-emerald-700 dark:bg-emerald-500 text-white dark:text-slate-950 text-sm font-medium rounded-full hover:bg-emerald-600 dark:hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-700/25"
                        >
                            Get Started
                        </Link>
                    </motion.div>

                    {/* Animated Beam in the Center */}
                    <div className="hidden lg:block relative h-48">
                        <AnimatedBeam />
                    </div>

                    {/* For Clients */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-center glass-surface rounded-3xl px-6 py-8 md:py-10 shadow-xl shadow-emerald-900/10"
                    >
                        <p className="text-xs text-teal-700 dark:text-teal-200 font-medium mb-4 md:mb-6 border border-teal-300/50 dark:border-teal-500/50 rounded-xl w-28 md:w-36 mx-auto py-1">
                            Hire top talent
                        </p>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-900 dark:text-white mb-2 md:mb-3">
                            For clients
                        </h2>
                        <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 font-normal mb-6 md:mb-8">
                            Build your dream team
                        </p>
                        <Link
                            to="/signup"
                            className="inline-block px-6 md:px-8 py-2.5 md:py-3 border border-teal-300 dark:border-teal-500 text-teal-800 dark:text-teal-200 text-sm font-medium rounded-full hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-all"
                        >
                            Post a Project
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

