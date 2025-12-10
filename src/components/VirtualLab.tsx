import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Line, Sphere, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// 1. MÔ HÌNH TOÁN HỌC (GIỮ NGUYÊN)
// ==========================================

const TetrahedronModel: React.FC = () => {
    const A = useMemo(() => new THREE.Vector3(0, 2.5, 0), []);
    const B = useMemo(() => new THREE.Vector3(-2, -1.5, 1.5), []);
    const C = useMemo(() => new THREE.Vector3(2, -1.5, 1.5), []);
    const D = useMemo(() => new THREE.Vector3(0, -1.5, -2), []);

    const M = useMemo(() => new THREE.Vector3().lerpVectors(A, B, 0.6), [A, B]);
    const N = useMemo(() => new THREE.Vector3().lerpVectors(B, C, 0.3), [B, C]);
    const P = useMemo(() => new THREE.Vector3().lerpVectors(C, D, 0.7), [C, D]);
    const Q = useMemo(() => new THREE.Vector3().lerpVectors(D, A, 0.4), [D, A]);

    const edges = useMemo(() => [[A, B], [A, C], [A, D], [B, C], [C, D], [D, B]], [A, B, C, D]);
    const sectionLines = useMemo(() => [[M, N], [N, P], [P, Q], [Q, M]], [M, N, P, Q]);

    return (
        <group position={[0, 0, 0]} rotation={[0, Math.PI / 8, 0]}>
            <Grid infiniteGrid fadeDistance={30} fadeStrength={5} cellColor="white" sectionColor="white" sectionThickness={1} cellThickness={0.5} position={[0, -2, 0]} />
            {edges.map((pts, i) => <Line key={`edge-${i}`} points={pts} color="white" lineWidth={3} />)}
            {[A, B, C, D].map((p, i) => (
                <mesh key={i} position={p}><sphereGeometry args={[0.1]} /><meshBasicMaterial color="white" /></mesh>
            ))}
            <Text position={[A.x, A.y + 0.3, A.z]} color="white" fontSize={0.4}>A</Text>
            <Text position={[B.x - 0.3, B.y, B.z]} color="white" fontSize={0.4}>B</Text>
            <Text position={[C.x + 0.3, C.y, C.z]} color="white" fontSize={0.4}>C</Text>
            <Text position={[D.x, D.y, D.z - 0.3]} color="white" fontSize={0.4}>D</Text>

            {sectionLines.map((pts, i) => <Line key={`sect-${i}`} points={pts} color="#ff0055" lineWidth={4} />)}
            <mesh>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={6} array={new Float32Array([M.x, M.y, M.z, N.x, N.y, N.z, Q.x, Q.y, Q.z, P.x, P.y, P.z, Q.x, Q.y, Q.z, N.x, N.y, N.z])} itemSize={3} />
                </bufferGeometry>
                <meshBasicMaterial color="#ff0055" side={THREE.DoubleSide} transparent opacity={0.3} />
            </mesh>
        </group>
    );
};

// ==========================================
// 2. MÔ HÌNH SÓNG ĐIỆN TỪ (GIỮ NGUYÊN)
// ==========================================

const WaveField: React.FC<{ type: 'E' | 'B'; color: string }> = ({ type, color }) => {
    const count = 60;
    const spacing = 0.3;
    const amplitude = 2;
    const k = 1.5;
    const w = 4;
    const arrowsRef = useRef<(THREE.ArrowHelper | null)[]>([]);
    const dirVec = useMemo(() => new THREE.Vector3(0, type === 'E' ? 1 : 0, type === 'B' ? 1 : 0), [type]);
    const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        for (let i = 0; i < count; i++) {
            const x = (i - count / 2) * spacing;
            const waveVal = Math.sin(k * x - w * time) * amplitude;
            const absVal = Math.abs(waveVal);
            const arrow = arrowsRef.current[i];
            if (arrow) {
                arrow.position.set(x, 0, 0);
                const currentDir = dirVec.clone().multiplyScalar(waveVal > 0 ? 1 : -1);
                arrow.setDirection(currentDir);
                if (absVal > 0.01) {
                    arrow.setLength(absVal, 0.2 * amplitude, 0.1 * amplitude);
                    arrow.visible = true;
                } else {
                    arrow.visible = false;
                }
            }
        }
    });

    return (
        <group>
            {Array.from({ length: count }).map((_, i) => (
                <arrowHelper key={i} ref={(el) => (arrowsRef.current[i] = el)} args={[dirVec, origin, 0, color]} />
            ))}
        </group>
    );
};

const EMWaveModel: React.FC = () => {
    return (
        <group>
            <Grid infiniteGrid fadeDistance={30} fadeStrength={5} cellColor="white" sectionColor="white" sectionThickness={1} cellThickness={0.5} position={[0, -2, 0]}/>
            <WaveField type="E" color="#ff2222" />
                        <Text position={[-8, 2.5, 0]} color="#ff2222" fontSize={0.8} fontWeight="bold">E</Text>
            <WaveField type="B" color="#2222ff" />
                        <Text position={[-8, 0, 2.5]} color="#2222ff" fontSize={0.8} fontWeight="bold">B</Text>
            <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(-10, 0, 0), 20, 0xffffff]} />
            <Text position={[11, 0, 0]} color="white" fontSize={0.5} anchorX="left">v</Text>
        </group>
    );
};

// ==========================================
// 3. HỆ MẶT TRỜI (SỬA LỖI NGHIÊNG & THÊM TỐC ĐỘ)
// ==========================================

interface PlanetData {
    name: string;
    size: number;
    distanceA: number;
    distanceB: number;
    speed: number;
    color: string;
    desc: string;
    info: string;
    startAngle: number;
    hasRings?: boolean;
    ringColor?: string;
    ringSize?: [number, number];
    ringTilt?: [number, number, number];
}

const PLANETS: PlanetData[] = [
    { name: "Thủy Tinh", size: 0.2, distanceA: 4, distanceB: 3.8, speed: 1.5, color: "#A5A5A5", desc: "Gần Mặt Trời nhất.", info: "Nhiệt độ bề mặt biến đổi khắc nghiệt.", startAngle: Math.PI * 0.2 },
    { name: "Kim Tinh", size: 0.35, distanceA: 6, distanceB: 5.8, speed: 1.2, color: "#E3BB76", desc: "Nóng nhất hệ.", info: "Bầu khí quyển dày đặc CO2.", startAngle: Math.PI * 0.8 },
    { name: "Trái Đất", size: 0.38, distanceA: 8, distanceB: 7.8, speed: 1, color: "#22A6B3", desc: "Hành tinh sống.", info: "Có một vệ tinh tự nhiên là Mặt Trăng.", startAngle: Math.PI * 1.4 },
    { name: "Hỏa Tinh", size: 0.3, distanceA: 10, distanceB: 9.5, speed: 0.8, color: "#EB4D4B", desc: "Hành tinh Đỏ.", info: "Có thể từng có nước lỏng.", startAngle: Math.PI * 0.5 },
    { name: "Mộc Tinh", size: 1.2, distanceA: 16, distanceB: 15, speed: 0.4, color: "#D0AF86", desc: "Lớn nhất hệ.", info: "Khối khí khổng lồ với Vết Đỏ Lớn.", startAngle: Math.PI * 1.1 },
    { name: "Thổ Tinh", size: 1.0, distanceA: 20, distanceB: 19, speed: 0.3, color: "#E1C77F", desc: "Vành đai tráng lệ.", info: "Vành đai làm từ băng và đá.", startAngle: Math.PI * 1.8, hasRings: true, ringColor: "#CBA36D", ringSize: [1.4, 2.5], ringTilt: [Math.PI / 2, 0, 0] },    { name: "Thiên Vương", size: 0.7, distanceA: 24, distanceB: 23, speed: 0.2, color: "#7BCCC4", desc: "Hành tinh băng.", info: "Trục quay nghiêng mạnh.", startAngle: Math.PI * 0.3, hasRings: true, ringColor: "#FFFFFF", ringSize: [0.8, 1.2], ringTilt: [Math.PI / 2.1, 0, 0] },
    { name: "Hải Vương", size: 0.7, distanceA: 28, distanceB: 27, speed: 0.15, color: "#3E54E8", desc: "Xa nhất hệ.", info: "Có những cơn gió mạnh nhất.", startAngle: Math.PI * 1.6 },
];

const AsteroidBelt: React.FC<{ timeSpeed: number }> = ({ timeSpeed }) => {
    const asteroidCount = 800;
    const beltRef = useRef<THREE.InstancedMesh>(null);
    const asteroids = useMemo(() => {
        const temp = [];
        for (let i = 0; i < asteroidCount; i++) {
            const angle = (i / asteroidCount) * 2 * Math.PI;
            const radius = THREE.MathUtils.randFloat(11.5, 13.5);
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle) * 0.9;
            const y = THREE.MathUtils.randFloatSpread(0.5);
            const scale = THREE.MathUtils.randFloat(0.05, 0.15);
            temp.push({ position: [x, y, z], scale, rotation: [Math.random(), Math.random(), Math.random()] });
        }
        return temp;
    }, []);

    useFrame(() => {
        if (beltRef.current) beltRef.current.rotation.y += 0.0005 * timeSpeed;
    });

    return (
        <instancedMesh ref={beltRef} args={[undefined, undefined, asteroidCount]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#888888" roughness={0.8} />
            {asteroids.map((data, i) => (
                <Instance key={i} position={data.position as any} scale={data.scale} rotation={data.rotation as any} />
            ))}
        </instancedMesh>
    );
};

const Instance: React.FC<{ position: [number,number,number], scale: number, rotation: [number,number,number] }> = ({ position, scale, rotation }) => {
    return <group position={position} rotation={rotation} scale={scale} />
}

const ShootingStar: React.FC<{ timeSpeed: number }> = ({ timeSpeed }) => {
    const cometRef = useRef<THREE.Group>(null);
    const startPos = useMemo(() => new THREE.Vector3(-60, 10, -20), []);
    const endPos = useMemo(() => new THREE.Vector3(60, -5, 20), []);
    const progressRef = useRef(0); // Dùng ref để lưu progress thay vì phụ thuộc clock tuyệt đối

    useFrame((state, delta) => {
        // Tăng progress dựa trên delta time và timeSpeed
        // Chu kỳ bay gốc là 15 giây. Khi timeSpeed tăng, nó bay nhanh hơn.
        const speedFactor = timeSpeed > 0 ? timeSpeed : 1; // Luôn bay dù pause
        progressRef.current += (delta * speedFactor) / 15; 
        
        if (progressRef.current > 1) progressRef.current = 0; // Reset vòng lặp

        if (cometRef.current) {
            cometRef.current.position.lerpVectors(startPos, endPos, progressRef.current);
            cometRef.current.lookAt(endPos);
        }
    });

    return (
        <group ref={cometRef}>
            <mesh><sphereGeometry args={[0.3, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
            <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0, 0.5, 6, 16]} /><meshBasicMaterial color="cyan" transparent opacity={0.3} /></mesh>
            <pointLight color="cyan" intensity={1} distance={10} />
        </group>
    );
}

const Planet: React.FC<{ 
    data: PlanetData; 
    isSelected: boolean; 
    onSelect: (data: PlanetData) => void; 
    timeSpeed: number;
}> = ({ data, isSelected, onSelect, timeSpeed }) => {
    const planetGroupRef = useRef<THREE.Group>(null);
    const planetSphereRef = useRef<THREE.Mesh>(null);
    const orbitProgressRef = useRef(Math.random() * Math.PI * 2); // Vị trí ngẫu nhiên ban đầu

    const points = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= 128; i++) {
            const theta = (i / 128) * 2 * Math.PI;
            pts.push(new THREE.Vector3(data.distanceA * Math.cos(theta), 0, data.distanceB * Math.sin(theta)));
        }
        return pts;
    }, [data]);

    useFrame((state, delta) => {
        // Cập nhật vị trí dựa trên timeSpeed
        orbitProgressRef.current += delta * data.speed * 0.05 * timeSpeed;
        
        const x = data.distanceA * Math.cos(orbitProgressRef.current);
        const z = data.distanceB * Math.sin(orbitProgressRef.current); 
        
        if (planetGroupRef.current) {
            planetGroupRef.current.position.set(x, 0, z);
        }
        if (planetSphereRef.current) {
            planetSphereRef.current.rotation.y += 0.01 * timeSpeed; // Tự quay cũng nhanh theo
        }
    });

    return (
        <>
            <Line points={points} color="white" transparent opacity={0.15} lineWidth={1} />
            
            {/* Nhóm chứa hành tinh và vành đai */}
            <group ref={planetGroupRef}>
                {/* Quả cầu hành tinh (Thẳng đứng) */}
                <mesh 
                    ref={planetSphereRef}
                    onClick={(e) => { e.stopPropagation(); onSelect(data); }} 
                    onPointerOver={() => { document.body.style.cursor = 'pointer'; }} 
                    onPointerOut={() => { document.body.style.cursor = 'auto'; }}
                >
                    <sphereGeometry args={[data.size, 64, 64]} />
                    <meshStandardMaterial 
                        color={data.color} 
                        emissive={isSelected ? data.color : 'black'} 
                        emissiveIntensity={0.5} 
                    />
                </mesh>
                
                {/* Vành đai (Nghiêng riêng) - KHÔNG BỊ ẢNH HƯỞNG BỞI XOAY HÀNH TINH */}
                {data.hasRings && (
                    <mesh rotation={data.ringTilt as any}> 
                        <ringGeometry args={[data.ringSize![0], data.ringSize![1], 64]} />
                        <meshStandardMaterial color={data.ringColor} side={THREE.DoubleSide} transparent opacity={0.8} />
                    </mesh>
                )}

                {isSelected && (
                    <Html distanceFactor={15}>
                        <div className="bg-black/90 text-white p-4 rounded-xl border border-blue-500/50 w-64 backdrop-blur-md shadow-2xl pointer-events-none select-none">
                            <h3 className="text-lg font-bold text-yellow-400 mb-1">{data.name}</h3>
                            <p className="text-xs text-gray-300 mb-2">{data.desc}</p>
                            <p className="text-xs italic text-blue-300">{data.info}</p>
                        </div>
                    </Html>
                )}
            </group>
        </>
    );
}

const SolarSystemModel: React.FC<{ timeSpeed: number }> = ({ timeSpeed }) => {
    const [selected, setSelected] = useState<PlanetData | null>(null);
    const sunData: PlanetData = { name: "Mặt Trời", size: 2.5, distanceA: 0, distanceB: 0, speed: 0, color: "#FFD700", desc: "Ngôi sao trung tâm.", info: "Nguồn năng lượng chính.", startAngle: 0 };

    return (
        <group onPointerMissed={() => setSelected(null)}>
            <mesh onClick={(e) => { e.stopPropagation(); setSelected(sunData); }}>
                <sphereGeometry args={[sunData.size, 64, 64]} />
                <meshBasicMaterial color="#FF8C00" />
                <mesh scale={[1.05, 1.05, 1.05]}>
                     <sphereGeometry args={[sunData.size, 64, 64]} />
                     <meshBasicMaterial color="#FFD700" transparent opacity={0.3} />
                </mesh>
                <pointLight intensity={3} distance={200} color="#FFD700" decay={1.5} />
                
                {selected?.name === sunData.name && (
                     <Html distanceFactor={15}>
                        <div className="bg-black/90 text-white p-4 rounded-xl border border-yellow-500/50 w-64 backdrop-blur-md shadow-2xl pointer-events-none select-none">
                            <h3 className="text-lg font-bold text-yellow-400 mb-1">{sunData.name}</h3>
                            <p className="text-xs text-gray-300 mb-2">{sunData.desc}</p>
                            <p className="text-xs italic text-yellow-300">{sunData.info}</p>
                        </div>
                    </Html>
                )}
            </mesh>
            <ambientLight intensity={0.05} />
            {PLANETS.map((planet) => (
                <Planet 
                    key={planet.name} 
                    data={planet} 
                    isSelected={selected?.name === planet.name}
                    onSelect={setSelected} 
                    timeSpeed={timeSpeed} // Truyền tốc độ vào
                />
            ))}
            <AsteroidBelt timeSpeed={timeSpeed} />
            <ShootingStar timeSpeed={timeSpeed} />
        </group>
    );
};

// ==========================================
// 4. MAIN & AR SETUP
// ==========================================

const WebcamBackground: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        let stream: MediaStream | null = null;
        const startWebcam = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
            } catch (err) { console.error(err); }
        };
        startWebcam();
        return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
    }, []);
    return <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-50" />;
};

const VirtualLab: React.FC = () => {
    const [mode, setMode] = useState<'PHYSICS' | 'MATH'>('PHYSICS');
    const [physicsTopic, setPhysicsTopic] = useState<'SOLAR' | 'WAVE'>('SOLAR'); 
    const [arEnabled, setArEnabled] = useState(false);
    
    // --- STATE ĐIỀU CHỈNH TỐC ĐỘ ---
    const [timeSpeed, setTimeSpeed] = useState(1); // 1 = Bình thường, 0 = Dừng, >1 = Nhanh

    return (
        <div className="h-full w-full flex flex-col bg-[#02020a] rounded-xl shadow-xl overflow-hidden relative border border-gray-800">
            {/* Header */}
            <div className="bg-black/80 backdrop-blur-md text-white p-3 flex justify-between items-center z-20 border-b border-gray-800 absolute top-0 w-full">
                <div className="flex items-center">
                    <h2 className="text-lg font-bold mr-4 flex items-center text-blue-400 hidden md:flex">
                        <span className="mr-2">🌌</span> Lab 3D
                    </h2>
                    <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                        <button onClick={() => setMode('MATH')} className={`px-3 py-1 rounded text-xs font-bold transition ${mode === 'MATH' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>TOÁN</button>
                        <button onClick={() => setMode('PHYSICS')} className={`px-3 py-1 rounded text-xs font-bold transition ${mode === 'PHYSICS' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>VẬT LÝ</button>
                    </div>
                </div>

                <div className="flex space-x-2 items-center">
                    {mode === 'PHYSICS' && (
                        <div className="flex space-x-1 mr-2 bg-gray-900 p-1 rounded-lg">
                            <button onClick={() => setPhysicsTopic('SOLAR')} className={`text-xs px-2 py-1 rounded transition ${physicsTopic === 'SOLAR' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}>🪐 Hệ Mặt Trời</button>
                            <button onClick={() => setPhysicsTopic('WAVE')} className={`text-xs px-2 py-1 rounded transition ${physicsTopic === 'WAVE' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>〰️ Sóng</button>
                        </div>
                    )}
                    <button onClick={() => setArEnabled(!arEnabled)} className={`flex items-center px-3 py-1 rounded text-xs font-bold transition border ${arEnabled ? 'bg-red-600 border-red-600 text-white' : 'border-gray-600 text-gray-300 hover:border-white'}`}>
                        {arEnabled ? 'Tắt AR' : 'Bật AR'}
                    </button>
                </div>
            </div>

            {/* THANH ĐIỀU CHỈNH TỐC ĐỘ (Chỉ hiện ở Hệ Mặt Trời) */}
            {mode === 'PHYSICS' && physicsTopic === 'SOLAR' && (
                <div className="absolute top-16 left-4 z-20 bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-white/20 text-white w-48">
                    <label className="text-xs font-bold text-yellow-400 mb-1 block">Tốc độ thời gian: {timeSpeed}x</label>
                    <input 
                        type="range" 
                        min="0" 
                        max="5" 
                        step="0.5" 
                        value={timeSpeed} 
                        onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
                        className="w-full accent-yellow-500 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>Dừng</span>
                        <span>Chuẩn</span>
                        <span>Nhanh</span>
                    </div>
                </div>
            )}

            {/* 3D Scene */}
            <div className="absolute inset-0 z-0">
                {arEnabled && <WebcamBackground />}
                
                <div className="absolute inset-0 z-10 touch-none">
                    <Canvas camera={{ position: [0, 8, 25], fov: 45 }}>
                        {!arEnabled && <color attach="background" args={['#050510']} />}
                        
                        {!arEnabled && <Stars radius={100} depth={50} count={8000} factor={4} saturation={0} fade speed={0.5} />}

                        <ambientLight intensity={0.2} />
                        <pointLight position={[10, 10, 10]} intensity={1} />

                        {mode === 'MATH' && <TetrahedronModel />}
                        
                        {/* Truyền biến timeSpeed vào Solar System */}
                        {mode === 'PHYSICS' && physicsTopic === 'SOLAR' && <SolarSystemModel timeSpeed={timeSpeed} />}
                        
                        {mode === 'PHYSICS' && physicsTopic === 'WAVE' && <EMWaveModel />}

                        <OrbitControls makeDefault enablePan={true} minDistance={2} maxDistance={100} />
                    </Canvas>
                </div>
            </div>

            {/* Hướng dẫn */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-sm text-gray-300 p-3 rounded-lg text-xs border border-white/10 shadow-lg">
                    <p className="font-bold text-white mb-1">
                        {mode === 'PHYSICS' && physicsTopic === 'SOLAR' ? 'ℹ️ Chạm vào hành tinh để xem thông tin' : 'ℹ️ Dùng tay xoay mô hình'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VirtualLab;