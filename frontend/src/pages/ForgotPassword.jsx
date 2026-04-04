import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Particles from '../components/ui/background';

export default function ForgotPassword() {
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [isInCooldown, setIsInCooldown] = useState(false);
    const navigate = useNavigate();

    // Format seconds to display time
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Check for existing cooldown on mount
    useEffect(() => {
        if (identifier.trim()) {
            const cooldownKey = `otp_cooldown_${identifier.trim()}`;
            const cooldownData = localStorage.getItem(cooldownKey);

            if (cooldownData) {
                const data = JSON.parse(cooldownData);
                const now = Date.now();
                const remaining = Math.ceil((data.nextAllowedTime - now) / 1000);

                if (remaining > 0) {
                    setCooldownSeconds(remaining);
                    setIsInCooldown(true);
                } else {
                    localStorage.removeItem(cooldownKey);
                    setIsInCooldown(false);
                    setCooldownSeconds(0);
                }
            }
        }
    }, [identifier]);

    // Countdown timer
    useEffect(() => {
        if (cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isInCooldown && cooldownSeconds === 0) {
            setIsInCooldown(false);
        }
    }, [cooldownSeconds, isInCooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (!identifier.trim()) {
            setError('Please enter your email or username');
            setIsLoading(false);
            return;
        }

        // Check localStorage for existing cooldown
        const cooldownKey = `otp_cooldown_${identifier.trim()}`;
        const cooldownData = localStorage.getItem(cooldownKey);

        if (cooldownData) {
            const data = JSON.parse(cooldownData);
            const now = Date.now();
            const remaining = Math.ceil((data.nextAllowedTime - now) / 1000);

            if (remaining > 0) {
                // User is still in cooldown
                setError(`Please wait ${formatTime(remaining)} before requesting another OTP`);
                setCooldownSeconds(remaining);
                setIsInCooldown(true);
                setIsLoading(false);
                return;
            } else {
                // Cooldown expired, clear it
                localStorage.removeItem(cooldownKey);
                setIsInCooldown(false);
                setCooldownSeconds(0);
            }
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier: identifier.trim() }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(data.message);

                // Initialize localStorage cooldown for first request
                localStorage.setItem(cooldownKey, JSON.stringify({
                    requestCount: 1,
                    lastRequestTime: Date.now(),
                    nextAllowedTime: Date.now() + (60 * 1000) // 60 seconds for first resend
                }));

                // Navigate to OTP verification page after 2 seconds
                setTimeout(() => {
                    navigate('/verify-otp', {
                        state: {
                            identifier: identifier.trim(),
                            email: data.email
                        }
                    });
                }, 2000);
            } else {
                // Show error messages
                setError(data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-gray-950">
            {/* Left Side - Illustration with Particles */}
            <div className="hidden rounded-3xl lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-950 items-center justify-center p-12 overflow-hidden">
                <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                    <Particles
                        particleColors={['#b2ffc8', '#b2ffc8']}
                        particleCount={300}
                        particleSpread={10}
                        speed={0.1}
                        particleBaseSize={100}
                        moveParticlesOnHover={true}
                        alphaParticles={false}
                        disableRotation={false}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 text-center"
                >
                    <div className="mb-8">
                        <svg className="w-32 h-32 mx-auto text-green-600 dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-light text-gray-700 dark:text-gray-300 mb-2">Reset Your Password</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light max-w-md">
                        We'll send you a verification code to your email address
                    </p>
                </motion.div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-6">
                        <h1 className="text-2xl font-light text-gray-700 dark:text-gray-200 mb-2">Forgot Password</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                            Enter your email or username to receive a verification code
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 text-sm font-light"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-3 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg text-green-600 dark:text-green-400 text-sm font-light"
                        >
                            {success}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-green-600 dark:focus:border-green-500 focus:outline-none transition-all font-light text-gray-700 dark:text-gray-200"
                                placeholder="Email or Username"
                                disabled={isLoading || success}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || success || isInCooldown}
                            className="w-full bg-green-600 dark:bg-green-700 text-white font-light py-2.5 text-sm rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : success ? 'Redirecting...' : isInCooldown ? `Wait ${formatTime(cooldownSeconds)}` : 'Send Verification Code'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition font-light"
                        >
                            ← Back to Login
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
