import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BusinessState, InsightType } from '../types';

interface SceneProps {
  businessState: BusinessState;
}

const Scene: React.FC<SceneProps> = ({ businessState }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number>(0);

  // Initialize Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); 
    scene.fog = new THREE.FogExp2(0x0f172a, 0.05);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // Group for complex data object
    const group = new THREE.Group();
    
    // Core Data Sphere
    const geometry = new THREE.IcosahedronGeometry(2, 2);
    const material = new THREE.MeshPhongMaterial({
      color: 0x6366f1, // Indigo
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      emissive: 0x312e81,
      emissiveIntensity: 0.5,
    });
    const core = new THREE.Mesh(geometry, material);
    group.add(core);

    // Orbiting "Data Points"
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 200;
    const posArray = new Float32Array(particleCount * 3);
    for(let i=0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
        size: 0.05,
        color: 0xa5b4fc,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    scene.add(group);
    meshRef.current = group;

    // Lights
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      if (meshRef.current) {
        // Rotate the group
        meshRef.current.rotation.y += 0.003;
        meshRef.current.rotation.x += 0.001;
        
        // Pulse effect
        const core = meshRef.current.children[0] as THREE.Mesh;
        if(core) {
           // We animate scale in useEffect based on state, but here keeps base rotation
        }
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // Visual Logic for State
  useEffect(() => {
    if (!meshRef.current) return;

    const core = meshRef.current.children[0] as THREE.Mesh;
    const material = core.material as THREE.MeshPhongMaterial;
    
    let targetColor = 0x6366f1; // Indigo (General)
    let scale = 1;

    switch (businessState.insightType) {
      case InsightType.FINANCIAL:
        targetColor = 0x10b981; // Emerald Green
        scale = 1.2;
        break;
      case InsightType.INVENTORY:
        targetColor = 0x3b82f6; // Blue
        scale = 1.1;
        break;
      case InsightType.ALERT:
        targetColor = 0xef4444; // Red
        scale = 1.3;
        break;
      case InsightType.GENERAL:
      default:
        targetColor = 0x6366f1; // Indigo
        scale = 1;
        break;
    }

    material.color.setHex(targetColor);
    material.emissive.setHex(targetColor);
    
    // Animate scale gently
    // Note: In a real app we'd use GSAP or react-spring, here just setting it
    core.scale.set(scale, scale, scale);

    // Increase rotation speed if analyzing
    if (businessState.status === 'ANALYZING') {
       meshRef.current.rotation.y += 0.1; 
    }

  }, [businessState]);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full min-h-[300px] rounded-lg border border-slate-700 bg-slate-900/50 backdrop-blur shadow-inner overflow-hidden relative"
    >
      <div className="absolute top-4 left-4 z-10 font-mono text-xs text-slate-400">
        <p>DATA_ENGINE_V2</p>
        <p>VISUALIZATION: {businessState.insightType}</p>
      </div>
    </div>
  );
};

export default Scene;
