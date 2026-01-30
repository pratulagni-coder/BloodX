import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BloodCell = ({ position, rotation, speed }: { 
  position: [number, number, number]; 
  rotation: [number, number, number];
  speed: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const offset = useMemo(() => 0.01 + Math.random() * 0.04, []);

  // Create the blood cell shape using LatheGeometry
  const geometry = useMemo(() => {
    const curve = new THREE.SplineCurve([
      new THREE.Vector2(0, 10),
      new THREE.Vector2(30, 11),
      new THREE.Vector2(60, 20),
      new THREE.Vector2(90, 36),
      new THREE.Vector2(110, 0),
      new THREE.Vector2(90, -36),
      new THREE.Vector2(60, -20),
      new THREE.Vector2(30, -11),
      new THREE.Vector2(0, -10)
    ]);
    const splinePoints = curve.getPoints(30);
    return new THREE.LatheGeometry(splinePoints, 30);
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += offset + speed / 10000;
      meshRef.current.rotation.x += 0.008;
      meshRef.current.position.y -= 3;
      meshRef.current.position.x -= 3;

      if (meshRef.current.position.y <= -1000) {
        meshRef.current.position.y = 1000;
      }
      if (meshRef.current.position.x <= -1000) {
        meshRef.current.position.x = 1000;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      rotation={rotation}
      scale={[0.5, 0.4, 0.5]}
      castShadow
      receiveShadow
    >
      <meshLambertMaterial color={0xcc1414} side={THREE.DoubleSide} />
    </mesh>
  );
};

const BloodCells = () => {
  const cells = useMemo(() => {
    return Array.from({ length: 150 }, (_, i) => ({
      id: i,
      position: [
        -1000 + Math.random() * 2000,
        -1000 + Math.random() * 2000,
        -500 + Math.random() * 1000
      ] as [number, number, number],
      rotation: [
        -Math.random() * 3,
        -Math.random() * 3,
        -Math.random() * 3
      ] as [number, number, number],
      speed: i
    }));
  }, []);

  return (
    <>
      {cells.map((cell) => (
        <BloodCell
          key={cell.id}
          position={cell.position}
          rotation={cell.rotation}
          speed={cell.speed}
        />
      ))}
    </>
  );
};

const Scene = () => {
  return (
    <>
      <hemisphereLight args={[0xffffff, 0x555555, 0.2]} />
      <directionalLight
        position={[100, 100, 100]}
        intensity={1}
        castShadow
      />
      <fog attach="fog" args={[0x1e0303, 200, 750]} />
      <BloodCells />
    </>
  );
};

export const BloodCellsBackground = () => {
  return (
    <div 
      className="fixed inset-0 -z-10"
      style={{ 
        background: "linear-gradient(to top left, #1e0303, #1e0303, #6d0b0b)" 
      }}
    >
      <Canvas
        camera={{ 
          position: [-300, 100, 250], 
          fov: 70, 
          near: 1, 
          far: 2000 
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          shadowMapEnabled: true
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};
