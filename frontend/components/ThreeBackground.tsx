"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Stars } from "@react-three/drei";
import { Physics, useBox, usePlane, useSphere } from "@react-three/cannon";
import { useMemo, useState, useRef } from "react";
import * as THREE from "three";

// Define physical materials for bouncy interactions
const bouncyMaterial = { name: 'bouncy', friction: 0, restitution: 1.1 }; // Restitution > 1 for extra bounciness

// A physical cube that floats and reacts to collisions
function PhysicsCube({ position, color, size }: { position: [number, number, number], color: string, size: number }) {
    // useBox hook creates a physics body
    const [ref, api] = useBox(() => ({
        mass: 1,
        position,
        args: [size, size, size],
        material: bouncyMaterial, // Assign bouncy material
        linearDamping: 0.01, // Low damping to keep moving
        angularDamping: 0.95, // Keep spin slow
        // Give them a push at the start
        velocity: [(Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 0] // Increase initial speed
    }));

    useFrame(() => {
        // Apply a tiny, constant torque to keep them slowly rotating
        api.applyTorque(
            [(Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1]
        );

        // Occasional random pushes to keep energy in the system
        if (Math.random() > 0.95) {
            api.applyForce(
                [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0],
                [0, 0, 0]
            );
        }
    });

    return (
        <mesh ref={ref as any}>
            <boxGeometry args={[size, size, size]} />
            <meshPhysicalMaterial
                color={color}
                thickness={size}
                roughness={0.3}
                clearcoat={1}
                clearcoatRoughness={0.1}
                transmission={0.9}
                ior={1.5}
                transparent
                opacity={0.8}
            />
        </mesh>
    );
}

// Invisible walls to keep cubes inside the profile card area
function Boundaries() {
    const { viewport } = useThree();
    const height = viewport.height;
    const width = viewport.width;

    // Assign bouncy material to walls too
    usePlane(() => ({ position: [0, -height / 2, 0], rotation: [-Math.PI / 2, 0, 0], material: bouncyMaterial })); // Floor
    usePlane(() => ({ position: [0, height / 2, 0], rotation: [Math.PI / 2, 0, 0], material: bouncyMaterial })); // Ceiling
    usePlane(() => ({ position: [-width / 2, 0, 0], rotation: [0, Math.PI / 2, 0], material: bouncyMaterial })); // Left
    usePlane(() => ({ position: [width / 2, 0, 0], rotation: [0, -Math.PI / 2, 0], material: bouncyMaterial })); // Right
    usePlane(() => ({ position: [0, 0, -2], rotation: [0, 0, 0], material: bouncyMaterial })); // Back wall
    usePlane(() => ({ position: [0, 0, 2], rotation: [0, -Math.PI, 0], material: bouncyMaterial })); // Front glass

    return null;
}

function PhysicalCubes() {
    const cubes = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            position: [
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 4,
                0
            ] as [number, number, number],
            color: i % 2 === 0 ? "#3b82f6" : "#a855f7",
            size: Math.random() * 0.6 + 0.4
        }));
    }, []);

    return (
        <>
            {cubes.map((props, i) => (
                <PhysicsCube key={i} {...props} />
            ))}
        </>
    );
}

export function ThreeBackground() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }} gl={{ alpha: true, antialias: true }}>
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#3b82f6" />
                <pointLight position={[-10, -10, -10]} intensity={1.5} color="#a855f7" />

                <Physics gravity={[0, 0, 0]} defaultContactMaterial={{ restitution: 1.1, friction: 0 }}>
                    <Boundaries />
                    <PhysicalCubes />
                </Physics>

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
