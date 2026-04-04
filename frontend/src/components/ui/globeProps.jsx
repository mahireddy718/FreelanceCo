import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { World } from "./globe";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function GlobeDemo() {
    const containerRef = useRef(null);
    const globeContainerRef = useRef(null);
    const contentRef = useRef(null);

    const globeConfig = {
        pointSize: 4,
        globeColor: "#062056",
        showAtmosphere: true,
        atmosphereColor: "#FFFFFF",
        atmosphereAltitude: 0.1,
        emissive: "#062056",
        emissiveIntensity: 0.1,
        shininess: 0.9,
        polygonColor: "rgba(255,255,255,0.7)",
        ambientLight: "#38bdf8",
        directionalLeftLight: "#ffffff",
        directionalTopLight: "#ffffff",
        pointLight: "#ffffff",
        arcTime: 1000,
        arcLength: 0.9,
        rings: 1,
        maxRings: 3,
        initialPosition: { lat: 22.3193, lng: 114.1694 },
        autoRotate: true,
        autoRotateSpeed: 0.5,
    };

    const colors = ["#06b6d4", "#3b82f6", "#6366f1"];
    const sampleArcs = [
        {
            order: 1,
            startLat: -19.885592,
            startLng: -43.951191,
            endLat: -22.9068,
            endLng: -43.1729,
            arcAlt: 0.1,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 1,
            startLat: 28.6139,
            startLng: 77.209,
            endLat: 3.139,
            endLng: 101.6869,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 1,
            startLat: -19.885592,
            startLng: -43.951191,
            endLat: -1.303396,
            endLng: 36.852443,
            arcAlt: 0.5,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 2,
            startLat: 1.3521,
            startLng: 103.8198,
            endLat: 35.6762,
            endLng: 139.6503,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 2,
            startLat: 51.5072,
            startLng: -0.1276,
            endLat: 3.139,
            endLng: 101.6869,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 2,
            startLat: -15.785493,
            startLng: -47.909029,
            endLat: 36.162809,
            endLng: -115.119411,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 3,
            startLat: -33.8688,
            startLng: 151.2093,
            endLat: 22.3193,
            endLng: 114.1694,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 3,
            startLat: 21.3099,
            startLng: -157.8581,
            endLat: 40.7128,
            endLng: -74.006,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 3,
            startLat: -6.2088,
            startLng: 106.8456,
            endLat: 51.5072,
            endLng: -0.1276,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 4,
            startLat: 11.986597,
            startLng: 8.571831,
            endLat: -15.595412,
            endLng: -56.05918,
            arcAlt: 0.5,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 4,
            startLat: -34.6037,
            startLng: -58.3816,
            endLat: 22.3193,
            endLng: 114.1694,
            arcAlt: 0.7,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 4,
            startLat: 51.5072,
            startLng: -0.1276,
            endLat: 48.8566,
            endLng: -2.3522,
            arcAlt: 0.1,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 5,
            startLat: 14.5995,
            startLng: 120.9842,
            endLat: 51.5072,
            endLng: -0.1276,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 5,
            startLat: 1.3521,
            startLng: 103.8198,
            endLat: -33.8688,
            endLng: 151.2093,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 5,
            startLat: 34.0522,
            startLng: -118.2437,
            endLat: 48.8566,
            endLng: -2.3522,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 6,
            startLat: -15.432563,
            startLng: 28.315853,
            endLat: 1.094136,
            endLng: -63.34546,
            arcAlt: 0.7,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 6,
            startLat: 37.5665,
            startLng: 126.978,
            endLat: 35.6762,
            endLng: 139.6503,
            arcAlt: 0.1,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 6,
            startLat: 22.3193,
            startLng: 114.1694,
            endLat: 51.5072,
            endLng: -0.1276,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 7,
            startLat: -19.885592,
            startLng: -43.951191,
            endLat: -15.595412,
            endLng: -56.05918,
            arcAlt: 0.1,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 7,
            startLat: 48.8566,
            startLng: -2.3522,
            endLat: 52.52,
            endLng: 13.405,
            arcAlt: 0.1,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 7,
            startLat: 52.52,
            startLng: 13.405,
            endLat: 34.0522,
            endLng: -118.2437,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 8,
            startLat: -8.833221,
            startLng: 13.264837,
            endLat: -33.936138,
            endLng: 18.436529,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 8,
            startLat: 49.2827,
            startLng: -123.1207,
            endLat: 52.3676,
            endLng: 4.9041,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 8,
            startLat: 1.3521,
            startLng: 103.8198,
            endLat: 40.7128,
            endLng: -74.006,
            arcAlt: 0.5,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 9,
            startLat: 51.5072,
            startLng: -0.1276,
            endLat: 34.0522,
            endLng: -118.2437,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 9,
            startLat: 22.3193,
            startLng: 114.1694,
            endLat: -22.9068,
            endLng: -43.1729,
            arcAlt: 0.7,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 9,
            startLat: 1.3521,
            startLng: 103.8198,
            endLat: -34.6037,
            endLng: -58.3816,
            arcAlt: 0.5,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 10,
            startLat: -22.9068,
            startLng: -43.1729,
            endLat: 28.6139,
            endLng: 77.209,
            arcAlt: 0.7,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 10,
            startLat: 34.0522,
            startLng: -118.2437,
            endLat: 31.2304,
            endLng: 121.4737,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 10,
            startLat: -6.2088,
            startLng: 106.8456,
            endLat: 52.3676,
            endLng: 4.9041,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 11,
            startLat: 41.9028,
            startLng: 12.4964,
            endLat: 34.0522,
            endLng: -118.2437,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 11,
            startLat: -6.2088,
            startLng: 106.8456,
            endLat: 31.2304,
            endLng: 121.4737,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 11,
            startLat: 22.3193,
            startLng: 114.1694,
            endLat: 1.3521,
            endLng: 103.8198,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 12,
            startLat: 34.0522,
            startLng: -118.2437,
            endLat: 37.7749,
            endLng: -122.4194,
            arcAlt: 0.1,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 12,
            startLat: 35.6762,
            startLng: 139.6503,
            endLat: 22.3193,
            endLng: 114.1694,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 12,
            startLat: 22.3193,
            startLng: 114.1694,
            endLat: 34.0522,
            endLng: -118.2437,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 13,
            startLat: 52.52,
            startLng: 13.405,
            endLat: 22.3193,
            endLng: 114.1694,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 13,
            startLat: 11.986597,
            startLng: 8.571831,
            endLat: 35.6762,
            endLng: 139.6503,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 13,
            startLat: -22.9068,
            startLng: -43.1729,
            endLat: -34.6037,
            endLng: -58.3816,
            arcAlt: 0.1,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 14,
            startLat: -33.936138,
            startLng: 18.436529,
            endLat: 21.395643,
            endLng: 39.883798,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
    ];

    // Content sections for the left side
    const contentSections = [
        {
            title: "Connect with Talent",
            titleGradient: "Worldwide",
            description: "FreelanceCo brings together talented freelancers and clients from every corner of the globe. Post projects, find the perfect match, and build something amazing together.",
            features: [
                // { text: "Access global talent pool", color: "bg-blue-500" },
                // { text: "Secure payment processing", color: "bg-cyan-400" },
                // { text: "24/7 project collaboration", color: "bg-blue-500" }
            ]
        },
        {
            title: "Find the Perfect",
            titleGradient: "Match",
            description: "Our intelligent matching system connects you with freelancers who have the exact skills you need. Browse profiles, review portfolios, and hire with confidence.",
            features: [
                // { text: "AI-powered skill matching", color: "bg-green-400" },
                // { text: "Verified freelancer profiles", color: "bg-cyan-400" },
                // { text: "Real-time availability status", color: "bg-green-400" }
            ]
        },
        {
            title: "Build Amazing",
            titleGradient: "Projects",
            description: "From web development to design, content writing to marketing - bring your vision to life with talented professionals ready to help you succeed.",
            features: [
                // { text: "Milestone-based payments", color: "bg-blue-500" },
                // { text: "Integrated communication tools", color: "bg-cyan-400" },
                // { text: "Quality assurance guarantee", color: "bg-blue-500" }
            ]
        },
        {
            title: "Scale Your",
            titleGradient: "Business",
            description: "Whether you're a startup or an enterprise, FreelanceCo provides the tools and talent you need to grow. Access freelancers across all time zones and skill levels.",
            features: [
                // { text: "Enterprise-grade security", color: "bg-green-400" },
                // { text: "Dedicated account support", color: "bg-cyan-400" },
                // { text: "Custom team solutions", color: "bg-green-400" }
            ]
        }
    ];

    useEffect(() => {
        if (!containerRef.current || !globeContainerRef.current || !contentRef.current) return;

        const sections = contentRef.current.querySelectorAll('.content-section');

        // Create the pinned scroll animation
        const scrollTrigger = ScrollTrigger.create({
            trigger: containerRef.current,
            start: "top top",
            end: () => `+=${contentRef.current.scrollHeight - window.innerHeight}`,
            pin: globeContainerRef.current,
            pinSpacing: false,
            anticipatePin: 1,
        });

        // Animate each content section with staggered child elements
        sections.forEach((section, index) => {
            const title = section.querySelector('h2');
            const description = section.querySelector('p.text-light');
            const featureItems = section.querySelectorAll('.feature-item');

            // Animate the entire section container (fade in and out)
            gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: "top 80%",
                    end: "bottom 20%",
                    scrub: 1,
                }
            })
                .fromTo(section,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.5 }
                )
                .to(section,
                    { opacity: 0, duration: 0.5 },
                    ">"
                );

            // Animate title with slide up and down
            if (title) {
                gsap.timeline({
                    scrollTrigger: {
                        trigger: section,
                        start: "top 70%",
                        end: "bottom 30%",
                        scrub: 1,
                    }
                })
                    .fromTo(title,
                        { opacity: 0, y: 50 },
                        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
                    )
                    .to(title,
                        { opacity: 0, y: -50, duration: 0.4, ease: "power2.in" },
                        ">"
                    );
            }

            // Animate description (fade in and out)
            if (description) {
                gsap.timeline({
                    scrollTrigger: {
                        trigger: section,
                        start: "top 65%",
                        end: "bottom 35%",
                        scrub: 1,
                    }
                })
                    .fromTo(description,
                        { opacity: 0, y: 30 },
                        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
                    )
                    .to(description,
                        { opacity: 0, y: -30, duration: 0.4, ease: "power2.in" },
                        ">"
                    );
            }

            // Animate feature items with stagger (in and out)
            featureItems.forEach((item, itemIndex) => {
                gsap.timeline({
                    scrollTrigger: {
                        trigger: section,
                        start: "top 60%",
                        end: "bottom 40%",
                        scrub: 1,
                    }
                })
                    .fromTo(item,
                        { opacity: 0, x: -20 },
                        {
                            opacity: 1,
                            x: 0,
                            duration: 0.3,
                            ease: "power2.out",
                            delay: itemIndex * 0.05
                        }
                    )
                    .to(item,
                        {
                            opacity: 0,
                            x: 20,
                            duration: 0.3,
                            ease: "power2.in",
                        },
                        ">"
                    );
            });
        });

        return () => {
            scrollTrigger.kill();
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    return (
        <div ref={containerRef} className="relative w-full bg-white dark:bg-black">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Side - Scrolling Content */}
                    <div ref={contentRef} className="relative z-10 py-20 px-4">
                        {contentSections.map((section, index) => (
                            <div
                                key={index}
                                className="content-section min-h-[70vh] flex flex-col justify-center space-y-6 mb-16"
                            >
                                <h2 className="text-4xl text-left md:text-5xl lg:text-6xl font-bold text-black dark:text-white leading-tight">
                                    {section.title}
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
                                        {section.titleGradient}
                                    </span>
                                </h2>
                                <p className="text-light text-left text-gray-400 max-w-lg">
                                    {section.description}
                                </p>
                                <div className="space-y-3">
                                    {section.features.map((feature, featureIndex) => (
                                        <div key={featureIndex} className="feature-item flex items-center gap-3">
                                            <div className={`w-2 h-2 ${feature.color} rounded-full`}></div>
                                            <p className="text-gray-700 dark:text-gray-300">{feature.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Side - Fixed/Pinned Globe */}
                    <div ref={globeContainerRef} className="relative h-screen">
                        <div className="sticky top-0 h-screen flex items-center justify-center">
                            <div className="relative w-full h-[600px] cursor-move">
                                <World data={sampleArcs} globeConfig={globeConfig} />
                                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
