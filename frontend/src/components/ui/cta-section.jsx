import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function CTASection() {
    return (
        <div className="w-full py-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* For Clients */}
                    <div className="p-8 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">
                            For Clients
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Find the perfect freelancer to bring your vision to life
                        </p>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-start gap-3">
                                <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Post projects for free</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Get proposals in 24 hours</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Pay only when satisfied</span>
                            </div>
                        </div>

                        <Link
                            to="/signup"
                            className="inline-block w-full text-center px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-300"
                        >
                            Post a Project
                        </Link>
                    </div>

                    {/* For Freelancers */}
                    <div className="p-8 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">
                            For Freelancers
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Find work that matches your skills and grow your business
                        </p>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-start gap-3">
                                <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Access quality projects</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Secure & timely payments</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Build your reputation</span>
                            </div>
                        </div>

                        <Link
                            to="/signup"
                            className="inline-block w-full text-center px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-green-50 hover:border-green-400 hover:text-green-700 rounded-lg transition-all duration-300"
                        >
                            Start Freelancing
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
