import { useState } from 'react'
import Particles from '../components/ui/background'
import { LayoutTextFlip } from '../components/ui/layout-text-flip'
import { TimelineDemo } from '../components/ui/timelineProps'
import DualSection from '../components/ui/dual-section'
import Footer from '../components/ui/footer'
import ClickSpark from '../components/ClickSpark'
import { GlobeDemo } from '../components/ui/globeProps'
import ScrollVelocity from '../components/ui/scroll-velocity'
import SEOHelmet from '../components/SEOHelmet'

import '../App.css'

function Home() {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        "url": `${siteUrl}/`,
        "name": "FreelanceCo - Connect Freelancers with Clients Worldwide",
        "description": "Join FreelanceCo, the premier freelance marketplace connecting talented freelancers with clients worldwide. Find projects, hire experts, and grow your business.",
        "isPartOf": {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`
        }
    };

    return (
        <>
            <SEOHelmet
                title="FreelanceCo - Connect Freelancers with Clients Worldwide"
                description="Join FreelanceCo, the premier freelance marketplace connecting talented freelancers with clients worldwide. Find projects, hire experts, and grow your business."
                keywords="freelance, marketplace, freelancers, hire freelancers, remote work, projects, gig economy, freelance jobs, talent, clients, freelance platform"
                ogType="website"
                structuredData={structuredData}
            />


            {/* Hero Section with Particles Background - Responsive */}
            <div className="w-full h-[400px] md:h-[600px] absolute pointer-events-none">
                <Particles
                    particleColors={['#2dd4bf', '#84cc16', '#0f766e']}
                    particleCount={isMobile ? 30 : 120}
                    particleSpread={11}
                    speed={0.16}
                    particleBaseSize={isMobile ? 70 : 120}
                    moveParticlesOnHover={true}
                    alphaParticles={true}
                    disableRotation={false}
                />
            </div>
            <div className="absolute inset-0 h-[720px] bg-linear-to-b from-transparent via-emerald-100/30 to-transparent dark:via-emerald-500/10 pointer-events-none" />
            <ClickSpark sparkColor="#000000ff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400} easing="ease-out" extraScale={1.0}>
                {/* Hero - Text Flip Animation */}
                <div className="px-4 md:px-0 relative">
                    <LayoutTextFlip />
                </div>

                {/* Scroll Velocity - Hidden on mobile */}
                <div className="hidden md:block">
                    <ScrollVelocity
                        texts={['Match Align Sync Blend', 'Discover Explore Hunt Scout', 'Advance Thrive Ascend']}
                        velocity={50}
                        className="custom-scroll-text text-gray-300"
                    />
                </div>

                {/* Globe Demo - Hidden on mobile, visible on md and up */}
                <div className="hidden md:block mt-20 relative z-10">
                    <GlobeDemo />
                </div>

                {/* Dual Section - For Freelancers & Clients - Responsive */}
                <div className="px-4 md:px-0 pt-10 md:pt-16">
                    <DualSection />
                </div>

            </ClickSpark>
            {/* Footer */}
            <Footer />
        </>
    )
}

export default Home

