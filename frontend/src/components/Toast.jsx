import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HiOutlineX, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineXCircle } from 'react-icons/hi';

let showToastGlobal = null;

export const showToast = (message, type = 'info') => {
    if (showToastGlobal) {
        showToastGlobal(message, type);
    }
};

export default function Toast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        showToastGlobal = (message, type) => {
            const id = Date.now();
            setToasts(prev => [...prev, { id, message, type }]);

            setTimeout(() => {
                setToasts(prev => prev.filter(toast => toast.id !== id));
            }, 5000);
        };

        return () => {
            showToastGlobal = null;
        };
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const getToastConfig = (type) => {
        switch (type) {
            case 'success':
                return {
                    icon: HiOutlineCheckCircle,
                    className: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                };
            case 'error':
                return {
                    icon: HiOutlineXCircle,
                    className: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                };
            case 'warning':
                return {
                    icon: HiOutlineExclamationCircle,
                    className: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200'
                };
            default:
                return {
                    icon: HiOutlineInformationCircle,
                    className: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                };
        }
    };

    return (
        <div className="fixed top-25 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => {
                    const config = getToastConfig(toast.type);
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-md ${config.className}`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-light flex-1">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 hover:opacity-70 transition cursor-pointer"
                            >
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
