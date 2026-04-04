import React from 'react';
import { FiTrendingUp, FiShield, FiZap, FiUsers, FiAward, FiClock } from 'react-icons/fi';

export default function FeaturesSection() {
    const features = [
        {
            icon: <FiShield className="w-6 h-6" />,
            title: "Secure Payments",
            description: "Your funds are protected with escrow until you approve the work"
        },
        {
            icon: <FiZap className="w-6 h-6" />,
            title: "Fast Hiring",
            description: "Get qualified proposals within 24 hours of posting"
        },
        {
            icon: <FiUsers className="w-6 h-6" />,
            title: "Verified Talent",
            description: "Work with pre-vetted professionals with proven track records"
        },
        {
            icon: <FiAward className="w-6 h-6" />,
            title: "Quality Assurance",
            description: "Review work and request revisions until you're satisfied"
        },
        {
            icon: <FiTrendingUp className="w-6 h-6" />,
            title: "Scale Easily",
            description: "From single tasks to ongoing projects, scale as needed"
        },
        {
            icon: <FiClock className="w-6 h-6" />,
            title: "24/7 Support",
            description: "Our team is always here to help you succeed"
        }
    ];

    return (
        <div className="w-full py-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Why Choose FreelanceCo
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        A platform built for seamless collaboration between clients and freelancers
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-6 rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all duration-300 bg-white"
                        >
                            <div className="text-green-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
