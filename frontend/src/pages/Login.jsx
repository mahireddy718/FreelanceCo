import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Particles from '../components/ui/background';
import loginIllustration from '../assets/login_illustration_1764590330755.png';
import SEOHelmet from '../components/SEOHelmet';
import { Turnstile } from '@marsidev/react-turnstile';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState(null);
    const turnstileRef = useRef(null);
    const { login, loginWithGoogle, loginWithGithub } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    // Check for session expired message
    useEffect(() => {
        const sessionExpiredMsg = sessionStorage.getItem('sessionExpiredMessage');
        if (sessionExpiredMsg) {
            setError(sessionExpiredMsg);
            sessionStorage.removeItem('sessionExpiredMessage');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Basic validation
        if (!email || !password) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        // Turnstile validation
        if (!turnstileToken) {
            setError('Please complete the CAPTCHA verification.');
            setIsLoading(false);
            return;
        }

        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', email);
        console.log('Password:', password.substring(0, 3) + '***');

        const result = await login(email, password, turnstileToken);

        console.log('=== LOGIN RESULT ===');
        console.log('Success:', result.success);
        console.log('Full result:', result);
        console.log('result.data:', result.data);
        console.log('result.data.isAdmin:', result.data?.isAdmin);

        // Reset turnstile after each attempt
        turnstileRef.current?.reset();
        setTurnstileToken(null);

        if (result.success) {
            // Check isAdmin from the response data
            if (result.data?.isAdmin === true) {
                console.log('✅ Admin login detected, redirecting to /admin');
                // Use window.location for immediate redirect
                window.location.href = '/admin';
            } else {
                console.log('👤 Regular user login, redirecting to /dashboard');
                navigate('/dashboard');
            }
        } else {
            setError(result.error?.message || 'Login failed. Please try again.');
        }

        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);

        try {
            const result = await loginWithGoogle();

            if (result.success) {
                navigate('/dashboard');
            } else {
                console.error('Google login error:', result.error);
                setError(result.error?.message || 'Google login failed.');
            }
        } catch (err) {
            console.error('Google login exception:', err);
            setError('Google login failed. Please try again.');
        }

        setIsLoading(false);
    };

    const handleGithubLogin = async () => {
        setError('');
        setIsLoading(true);

        const result = await loginWithGithub();

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error?.message || 'GitHub login failed.');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-black transition-colors duration-200">
            <SEOHelmet
                title="Login to FreelanceCo"
                description="Login to your FreelanceCo account to access your dashboard, manage projects, and connect with freelancers or clients."
                keywords="login, sign in, freelanceco login, freelance login"
                noindex={true}
            />
            {/* Left Side - Illustration with Particles */}
            <div className="rounded-3xl hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 items-center justify-center p-12 overflow-hidden">
                {/* Background Particles */}
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

                {/* Illustration */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 max-w-lg"
                >
                    <img src={loginIllustration} alt="Login" className="w-full h-auto" />
                    <div className="mt-8 text-center">
                        <h2 className="text-2xl font-light text-gray-700 dark:text-gray-200 mb-2">Welcome Back</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                            Continue your journey with Pro&lt;lancer&gt;
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    // initial={{ opacity: 0, x: 20 }}
                    // animate={{ opacity: 1, x: 0 }}
                    // transition={{ duration: 0.5 }}
                    className="w-full max-w-md min-h-[500px]"
                >
                    {/* Tabs Navigation */}
                    <div className="mb-8">
                        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl mb-6 relative">
                            <Link
                                to="/login"
                                className="flex-1 text-center py-2.5 rounded-lg text-sm font-light transition-colors relative z-10"
                            >
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                                <span className="relative z-10 text-gray-900 dark:text-gray-100">Login</span>
                            </Link>
                            <Link
                                to="/signup"
                                className="flex-1 text-center py-2.5 rounded-lg text-sm font-light transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 relative z-10"
                            >
                                <span className="relative z-10">Sign Up</span>
                            </Link>
                        </div>
                        {/* <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                            Enter your credentials to access your account
                        </p> */}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-light">
                            {error}
                        </motion.div>
                    )}

                    {/* Email/Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:border-green-600 dark:focus:border-green-500 focus:outline-none transition-all font-light text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900"
                                placeholder="your.email@example.com"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:border-green-600 dark:focus:border-green-500 focus:outline-none transition-all font-light text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 pr-10"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div className="mt-2 text-right">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition font-light"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {/* Cloudflare Turnstile */}
                        <div className="flex justify-center">
                            <Turnstile
                                ref={turnstileRef}
                                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                onSuccess={(token) => setTurnstileToken(token)}
                                onExpire={() => setTurnstileToken(null)}
                                onError={() => {
                                    setTurnstileToken(null);
                                    setError('CAPTCHA verification failed. Please try again.');
                                }}
                                options={{ theme }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !turnstileToken}
                            className="w-full bg-green-600 text-white font-light py-2.5 text-sm rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                        <span className="px-4 text-xs text-gray-400 dark:text-gray-500 font-light">or continue with</span>
                        <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3" >
                        {/* Google Login */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            type="button"
                            className="cursor-pointer w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-light rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-900"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300">Continue with Google</span>
                        </motion.button>

                        {/* GitHub Login */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGithubLogin}
                            disabled={isLoading}
                            type="button"
                            className="hidden cursor-pointer w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-light rounded-lg border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    fillRule="evenodd"
                                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="text-gray-700">Continue with GitHub</span>
                        </motion.button>
                    </div>

                    {/* Back to Home */}
                    <div className="text-center mt-6">
                        <Link
                            to="/"
                            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition font-light"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
