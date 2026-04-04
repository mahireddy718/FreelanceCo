import { useEffect, useState } from "react";

const AnimatedCounter = ({ value, prefix = "", suffix = "", duration = 1500 }) => {
    const targetValue = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return (
        <span style={{ display: "inline-flex", alignItems: "baseline" }} >
            {prefix}
            {targetValue.split("").map((char, idx) => {
                if (char === ",") {
                    return (
                        <span key={`comma-${idx}`} style={{ margin: "0 1px" }}>
                            ,
                        </span>
                    );
                }

                return (
                    <RollingDigit
                        key={`digit-${idx}`}
                        targetDigit={parseInt(char)}
                        duration={duration}
                        delay={idx * 100}
                    />
                );
            })}
            {suffix}
        </span>
    );
};

const RollingDigit = ({ targetDigit, duration, delay = 0 }) => {
    // We'll spin through multiple cycles plus land on target
    // Total positions = 10 (one full cycle) + targetDigit + 10 (extra spin)
    const totalSpins = 20 + targetDigit; // Spin through digits multiple times
    const [position, setPosition] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        const startTimer = setTimeout(() => {
            setHasStarted(true);
            setPosition(totalSpins);
        }, delay + 50);

        return () => clearTimeout(startTimer);
    }, [targetDigit, delay, totalSpins]);

    // Create array of digits that repeat to allow spinning
    const digits = [];
    for (let i = 0; i <= 30; i++) {
        digits.push(i % 10);
    }

    return (
        <span
            style={{
                position: "relative",
                overflow: "hidden",
                height: "1.2em",
                width: "0.6em",
                display: "inline-block",
                verticalAlign: "baseline"
            }}
        >
            <span
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(-${position * (100 / digits.length)}%)`,
                    transition: hasStarted
                        ? `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`
                        : "none"
                }}
            >
                {digits.map((num, idx) => (
                    <div
                        key={idx}
                        style={{
                            height: "1.2em",
                            lineHeight: "1.2em",
                            textAlign: "center"
                        }}
                    >
                        {num}
                    </div>
                ))}
            </span>
        </span>
    );
};

export default AnimatedCounter;
