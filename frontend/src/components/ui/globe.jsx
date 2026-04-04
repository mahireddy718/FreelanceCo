import { useEffect, useMemo, useRef, useState } from "react";
import { Color, Scene, Fog, PerspectiveCamera, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "../../data/globe.json";

extend({ ThreeGlobe: ThreeGlobe });

const RING_PROPAGATION_SPEED = 3;
const aspect = 1.2;
const cameraZ = 300;

let numbersOfRings = [0];

const isFiniteNumber = (value) => Number.isFinite(Number(value));

const isValidFeature = (feature) => {
    const geometry = feature?.geometry;
    if (!geometry || !geometry.coordinates) return false;

    if (geometry.type === "Polygon") {
        return geometry.coordinates.every((ring) =>
            Array.isArray(ring) && ring.every((coord) =>
                Array.isArray(coord) && coord.length >= 2 && isFiniteNumber(coord[0]) && isFiniteNumber(coord[1])
            )
        );
    }

    if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.every((polygon) =>
            Array.isArray(polygon) && polygon.every((ring) =>
                Array.isArray(ring) && ring.every((coord) =>
                    Array.isArray(coord) && coord.length >= 2 && isFiniteNumber(coord[0]) && isFiniteNumber(coord[1])
                )
            )
        );
    }

    return false;
};

export function Globe({
    globeConfig,
    data
}) {
    const globeRef = useRef(null);
    const groupRef = useRef();
    const [isInitialized, setIsInitialized] = useState(false);

    const defaultProps = {
        pointSize: 1,
        atmosphereColor: "#ffffff",
        showAtmosphere: true,
        atmosphereAltitude: 0.1,
        polygonColor: "rgba(255,255,255,0.7)",
        globeColor: "#1d072e",
        emissive: "#000000",
        emissiveIntensity: 0.1,
        shininess: 0.9,
        arcTime: 2000,
        arcLength: 0.9,
        rings: 1,
        maxRings: 3,
        ...globeConfig,
    };

    const safeArcs = useMemo(() => {
        if (!Array.isArray(data)) return [];

        return data.filter((arc) =>
            isFiniteNumber(arc?.startLat) &&
            isFiniteNumber(arc?.startLng) &&
            isFiniteNumber(arc?.endLat) &&
            isFiniteNumber(arc?.endLng) &&
            isFiniteNumber(arc?.arcAlt) &&
            typeof arc?.color === "string"
        );
    }, [data]);

    // Initialize globe only once
    useEffect(() => {
        if (!globeRef.current && groupRef.current) {
            globeRef.current = new ThreeGlobe();
            (groupRef.current).add(globeRef.current);
            setIsInitialized(true);
        }
    }, []);

    // Build material when globe is initialized or when relevant props change
    useEffect(() => {
        if (!globeRef.current || !isInitialized) return;

        const globeMaterial = globeRef.current.globeMaterial();
        globeMaterial.color = new Color(globeConfig.globeColor);
        globeMaterial.emissive = new Color(globeConfig.emissive);
        globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
        globeMaterial.shininess = globeConfig.shininess || 0.9;
    }, [
        isInitialized,
        globeConfig.globeColor,
        globeConfig.emissive,
        globeConfig.emissiveIntensity,
        globeConfig.shininess,
    ]);

    // Build data when globe is initialized or when data changes
    useEffect(() => {
        if (!globeRef.current || !isInitialized || safeArcs.length === 0) return;

        const arcs = safeArcs;
        let points = [];
        for (let i = 0; i < arcs.length; i++) {
            const arc = arcs[i];
            const rgb = hexToRgb(arc.color);
            points.push({
                size: defaultProps.pointSize,
                order: arc.order,
                color: arc.color,
                lat: arc.startLat,
                lng: arc.startLng,
            });
            points.push({
                size: defaultProps.pointSize,
                order: arc.order,
                color: arc.color,
                lat: arc.endLat,
                lng: arc.endLng,
            });
        }

        // remove duplicates for same lat and lng
        const filteredPoints = points.filter((v, i, a) =>
            a.findIndex((v2) =>
                ["lat", "lng"].every((k) => v2[k] === v[k])) === i);

        const safeFeatures = Array.isArray(countries?.features)
            ? countries.features.filter(isValidFeature)
            : [];

        try {
            globeRef.current
                .hexPolygonsData(safeFeatures)
                .hexPolygonResolution(3)
                .hexPolygonMargin(0.7)
                .showAtmosphere(defaultProps.showAtmosphere)
                .atmosphereColor(defaultProps.atmosphereColor)
                .atmosphereAltitude(defaultProps.atmosphereAltitude)
                .hexPolygonColor(() => defaultProps.polygonColor);
        } catch (error) {
            console.warn("Globe polygon rendering disabled due to geometry error:", error);
            globeRef.current.hexPolygonsData([]);
        }

        globeRef.current
            .arcsData(safeArcs)
            .arcStartLat((d) => (d).startLat * 1)
            .arcStartLng((d) => (d).startLng * 1)
            .arcEndLat((d) => (d).endLat * 1)
            .arcEndLng((d) => (d).endLng * 1)
            .arcColor((e) => (e).color)
            .arcAltitude((e) => (e).arcAlt * 1)
            .arcStroke(() => [0.32, 0.28, 0.3][Math.round(Math.random() * 2)])
            .arcDashLength(defaultProps.arcLength)
            .arcDashInitialGap((e) => (e).order * 1)
            .arcDashGap(15)
            .arcDashAnimateTime(() => defaultProps.arcTime);

        globeRef.current
            .pointsData(filteredPoints)
            .pointColor((e) => (e).color)
            .pointsMerge(true)
            .pointAltitude(0.0)
            .pointRadius(2);

        globeRef.current
            .ringsData([])
            .ringColor(() => defaultProps.polygonColor)
            .ringMaxRadius(defaultProps.maxRings)
            .ringPropagationSpeed(RING_PROPAGATION_SPEED)
            .ringRepeatPeriod((defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings);
    }, [
        isInitialized,
        safeArcs,
        defaultProps.pointSize,
        defaultProps.showAtmosphere,
        defaultProps.atmosphereColor,
        defaultProps.atmosphereAltitude,
        defaultProps.polygonColor,
        defaultProps.arcLength,
        defaultProps.arcTime,
        defaultProps.rings,
        defaultProps.maxRings,
    ]);

    // Handle rings animation with cleanup
    useEffect(() => {
        if (!globeRef.current || !isInitialized || safeArcs.length === 0) return;

        const interval = setInterval(() => {
            if (!globeRef.current) return;

            const newNumbersOfRings = genRandomNumbers(0, safeArcs.length, Math.floor((safeArcs.length * 4) / 5));

            const ringsData = safeArcs
                .filter((d, i) => newNumbersOfRings.includes(i))
                .map((d) => ({
                    lat: d.startLat,
                    lng: d.startLng,
                    color: d.color,
                }));

            globeRef.current.ringsData(ringsData);
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, [isInitialized, safeArcs]);

    return <group ref={groupRef} />;
}

export function WebGLRendererConfig() {
    const { gl, size } = useThree();

    useEffect(() => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.setSize(size.width, size.height);
        gl.setClearColor(0xffaaff, 0);
    }, [gl, size]);

    return null;
}

export function World(props) {
    const { globeConfig } = props;
    const scene = useMemo(() => {
        const s = new Scene();
        s.fog = new Fog(0xffffff, 400, 2000);
        return s;
    }, []);

    const camera = useMemo(() => new PerspectiveCamera(50, aspect, 180, 1800), []);

    return (
        <Canvas scene={scene} camera={camera}>
            <WebGLRendererConfig />
            <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
            <directionalLight
                color={globeConfig.directionalLeftLight}
                position={new Vector3(-400, 100, 400)} />
            <directionalLight
                color={globeConfig.directionalTopLight}
                position={new Vector3(-200, 500, 200)} />
            <pointLight
                color={globeConfig.pointLight}
                position={new Vector3(-200, 500, 200)}
                intensity={0.8} />
            <Globe {...props} />
            <OrbitControls
                enablePan={false}
                enableZoom={false}
                minDistance={cameraZ}
                maxDistance={cameraZ}
                autoRotateSpeed={1}
                autoRotate={true}
                minPolarAngle={Math.PI / 3.5}
                maxPolarAngle={Math.PI - Math.PI / 3} />
        </Canvas>
    );
}

export function hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

export function genRandomNumbers(min, max, count) {
    const arr = [];
    while (arr.length < count) {
        const r = Math.floor(Math.random() * (max - min)) + min;
        if (arr.indexOf(r) === -1) arr.push(r);
    }

    return arr;
}
