import { useEffect, useRef, useState } from 'react';

export default function AnimatedBeam() {
    const svgRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 150 });

    useEffect(() => {
        const updateDimensions = () => {
            if (svgRef.current) {
                const parent = svgRef.current.parentElement;
                if (parent) {
                    setDimensions({
                        width: parent.offsetWidth,
                        height: 150
                    });
                }
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const { width, height } = dimensions;

    // Move icons 50% closer to center
    const spacing = (width - 80); // 50% closer means half the original distance from edges
    const startX = spacing;
    const endX = width - spacing;

    const centerY = height / 2;
    const curveHeight = 1;

    // Path for top curve
    const topPath = `M ${startX} ${centerY} Q ${width / 2} ${centerY - curveHeight} ${endX} ${centerY}`;

    // Path for bottom curve
    const bottomPath = `M ${startX} ${centerY} Q ${width / 2} ${centerY + curveHeight} ${endX} ${centerY}`;

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
                ref={svgRef}
                className="w-full"
                style={{ height: `${height}px` }}
                viewBox={`0 0 ${width} ${height}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Top curve line */}
                <path
                    d={topPath}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    fill="none"
                />

                {/* Bottom curve line */}
                <path
                    d={bottomPath}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    fill="none"
                />

                {/* Animated gradient beam on top path */}
                <defs>
                    {/* Drop shadow filter */}
                    <filter id="circleShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="0" dy="2" result="offsetblur" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.2" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                        <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        <animate
                            attributeName="x1"
                            values="-100%;100%"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="x2"
                            values="0%;200%"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </linearGradient>

                    <linearGradient id="beamGradientReverse" x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                        <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        <animate
                            attributeName="x1"
                            values="200%;0%"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="x2"
                            values="100%;-100%"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </linearGradient>
                </defs>

                {/* Animated beam on top path (left to right) */}
                <path
                    d={topPath}
                    stroke="url(#beamGradient)"
                    strokeWidth="1"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Animated beam on bottom path (right to left) */}
                <path
                    d={bottomPath}
                    stroke="url(#beamGradientReverse)"
                    strokeWidth="1"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Left circle with user icon */}
                <circle
                    cx={startX}
                    cy={centerY}
                    r="20"
                    fill="white"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    filter="url(#circleShadow)"
                />
                <g transform={`translate(${startX - 9}, ${centerY - 9})`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="black" strokeWidth="2" />
                        <path d="M4 20c0-4 3-7 8-7s8 3 8 7" stroke="black" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </g>

                {/* Right circle with pattern icon */}
                <circle
                    cx={endX}
                    cy={centerY}
                    r="20"
                    fill="white"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    filter="url(#circleShadow)"
                />
                <g transform={`translate(${endX - 9}, ${centerY - 9})`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="black" strokeWidth="2" />
                        <path d="M4 20c0-4 3-7 8-7s8 3 8 7" stroke="black" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </g>
            </svg>
        </div>
    );
}
