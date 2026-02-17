import { useEffect, useRef } from 'react';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  driftX: number;
  driftY: number;
  pulseSpeed: number;
  pulseOffset: number;
}

interface Galaxy {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  armCount: number;
  opacity: number;
  color: string;
  pulseSpeed: number;
  pulseOffset: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

// Configuration for different performance modes
const modeConfigs = {
  full: {
    densityDivisor: 3500,
    maxSize: 2.5,
    speedMultiplier: 1,
    twinkle: true,
    glow: true,
    ambientGlow: true,
    nebula: {
      enabled: true,
      count: 6,
      opacity: 0.1,
      maxRadius: 450,
      drift: true,
      pulse: true,
    },
    galaxy: {
      enabled: true,
      count: 3,
      opacity: 0.15,
    },
    shootingStars: {
      enabled: true,
      spawnChance: 0.008,
      maxActive: 3,
    },
    aurora: {
      enabled: true,
      opacity: 0.12,
      waveSpeed: 0.0003,
    },
  },
  reduced: {
    densityDivisor: 8000,
    maxSize: 1.5,
    speedMultiplier: 0.5,
    twinkle: true,
    glow: false,
    ambientGlow: true,
    nebula: {
      enabled: true,
      count: 2,
      opacity: 0.03,
      maxRadius: 300,
      drift: false,
      pulse: true,
    },
    galaxy: {
      enabled: false,
      count: 0,
      opacity: 0,
    },
    shootingStars: {
      enabled: false,
      spawnChance: 0,
      maxActive: 0,
    },
    aurora: {
      enabled: false,
      opacity: 0,
      waveSpeed: 0,
    },
  },
  minimal: {
    densityDivisor: 15000,
    maxSize: 1,
    speedMultiplier: 0,
    twinkle: false,
    glow: false,
    ambientGlow: false,
    nebula: {
      enabled: false,
      count: 0,
      opacity: 0,
      maxRadius: 0,
      drift: false,
      pulse: false,
    },
    galaxy: {
      enabled: false,
      count: 0,
      opacity: 0,
    },
    shootingStars: {
      enabled: false,
      spawnChance: 0,
      maxActive: 0,
    },
    aurora: {
      enabled: false,
      opacity: 0,
      waveSpeed: 0,
    },
  },
  auto: {
    densityDivisor: 6000,
    maxSize: 1.8,
    speedMultiplier: 0.7,
    twinkle: true,
    glow: true,
    ambientGlow: true,
    nebula: {
      enabled: true,
      count: 3,
      opacity: 0.04,
      maxRadius: 350,
      drift: true,
      pulse: true,
    },
    galaxy: {
      enabled: true,
      count: 1,
      opacity: 0.08,
    },
    shootingStars: {
      enabled: true,
      spawnChance: 0.003,
      maxActive: 1,
    },
    aurora: {
      enabled: true,
      opacity: 0.06,
      waveSpeed: 0.0002,
    },
  },
};

// Nebula color palette - more vibrant for Full mode
const nebulaColors = [
  { r: 138, g: 80, b: 255 },   // Purple
  { r: 0, g: 212, b: 255 },    // Cyan
  { r: 255, g: 100, b: 180 },  // Pink
  { r: 80, g: 120, b: 255 },   // Blue
  { r: 255, g: 150, b: 50 },   // Orange
  { r: 120, g: 255, b: 180 },  // Mint
];

// Galaxy colors - realistic spiral galaxy palette
const galaxyColors = [
  { core: '255, 220, 150', arms: '150, 130, 255', dust: '80, 100, 180' },   // Blue-violet with golden core
  { core: '255, 200, 120', arms: '180, 150, 255', dust: '100, 120, 200' },  // Purple with warm core
  { core: '255, 180, 100', arms: '120, 160, 255', dust: '70, 90, 160' },    // Classic blue spiral
];

const StarfieldBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const galaxiesRef = useRef<Galaxy[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });
  const { settings } = useMotionSettings();

  const config = modeConfigs[settings.performanceMode];
  
  // Parallax depth multipliers for each layer
  const parallaxConfig = {
    nebula: 0.02,    // Slowest - furthest back
    galaxy: 0.035,   // Medium slow
    stars: 0.05,     // Medium
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
      initNebulae();
      initGalaxies();
    };

    const initStars = () => {
      const starCount = Math.floor((canvas.width * canvas.height) / config.densityDivisor);
      starsRef.current = Array.from({ length: starCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * config.maxSize + 0.5,
        speed: (Math.random() * 0.3 + 0.1) * config.speedMultiplier,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    };

    const initNebulae = () => {
      if (!config.nebula.enabled) {
        nebulaeRef.current = [];
        return;
      }
      
      nebulaeRef.current = Array.from({ length: config.nebula.count }, () => {
        const colorIndex = Math.floor(Math.random() * nebulaColors.length);
        const color = nebulaColors[colorIndex];
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * config.nebula.maxRadius + 150,
          color: `${color.r}, ${color.g}, ${color.b}`,
          opacity: config.nebula.opacity,
          driftX: (Math.random() - 0.5) * 0.2,
          driftY: (Math.random() - 0.5) * 0.1,
          pulseSpeed: Math.random() * 0.0015 + 0.0008,
          pulseOffset: Math.random() * Math.PI * 2,
        };
      });
    };

    const initGalaxies = () => {
      if (!config.galaxy.enabled) {
        galaxiesRef.current = [];
        return;
      }
      
      galaxiesRef.current = Array.from({ length: config.galaxy.count }, () => ({
        x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
        y: Math.random() * canvas.height * 0.8 + canvas.height * 0.1,
        radius: Math.random() * 120 + 100,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.00008 + 0.00004) * (Math.random() > 0.5 ? 1 : -1),
        armCount: 2,
        opacity: config.galaxy.opacity * 0.6,
        color: galaxyColors[Math.floor(Math.random() * galaxyColors.length)] as any,
        pulseSpeed: Math.random() * 0.001 + 0.0005,
        pulseOffset: Math.random() * Math.PI * 2,
      }));
    };

    const drawStar = (star: Star, time: number) => {
      let currentOpacity = star.opacity;
      
      if (config.twinkle) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        currentOpacity = star.opacity * twinkle;
      }
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      
      if (config.glow) {
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 2
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity})`);
        gradient.addColorStop(0.5, `rgba(138, 80, 255, ${currentOpacity * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
      }
      
      ctx.fill();
    };

    const drawNebula = (nebula: Nebula, time: number) => {
      let currentOpacity = nebula.opacity;
      let x = nebula.x;
      let y = nebula.y;
      
      if (config.nebula.pulse) {
        const pulse = Math.sin(time * nebula.pulseSpeed + nebula.pulseOffset) * 0.4 + 0.6;
        currentOpacity = nebula.opacity * pulse;
      }
      
      if (config.nebula.drift) {
        x += Math.sin(time * 0.00012 + nebula.pulseOffset) * 60;
        y += Math.cos(time * 0.0001 + nebula.pulseOffset) * 40;
      }
      
      // Main nebula glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, nebula.radius);
      gradient.addColorStop(0, `rgba(${nebula.color}, ${currentOpacity * 1.2})`);
      gradient.addColorStop(0.3, `rgba(${nebula.color}, ${currentOpacity * 0.8})`);
      gradient.addColorStop(0.6, `rgba(${nebula.color}, ${currentOpacity * 0.3})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add secondary glow layer for more depth (Full mode only)
      if (settings.performanceMode === 'full') {
        const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, nebula.radius * 0.4);
        innerGlow.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity * 0.15})`);
        innerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    const drawGalaxy = (galaxy: Galaxy, time: number) => {
      const pulse = Math.sin(time * galaxy.pulseSpeed + galaxy.pulseOffset) * 0.15 + 0.85;
      const currentOpacity = galaxy.opacity * pulse;
      const currentRotation = galaxy.rotation + time * galaxy.rotationSpeed;
      const colors = galaxy.color as any;
      
      ctx.save();
      ctx.translate(galaxy.x, galaxy.y);
      ctx.rotate(currentRotation);
      // Tilt for 3D perspective like Andromeda
      ctx.scale(1, 0.35);
      
      // Outer dust halo - very faded
      const dustHalo = ctx.createRadialGradient(0, 0, galaxy.radius * 0.3, 0, 0, galaxy.radius * 1.5);
      dustHalo.addColorStop(0, 'transparent');
      dustHalo.addColorStop(0.4, `rgba(${colors.dust}, ${currentOpacity * 0.04})`);
      dustHalo.addColorStop(0.7, `rgba(${colors.dust}, ${currentOpacity * 0.02})`);
      dustHalo.addColorStop(1, 'transparent');
      ctx.fillStyle = dustHalo;
      ctx.beginPath();
      ctx.arc(0, 0, galaxy.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw spiral arms with star clusters
      for (let arm = 0; arm < galaxy.armCount; arm++) {
        const armOffset = (arm / galaxy.armCount) * Math.PI * 2;
        
        // Multiple layers for depth
        for (let layer = 0; layer < 3; layer++) {
          const layerOpacity = currentOpacity * (0.15 - layer * 0.04);
          const layerWidth = 25 - layer * 6;
          
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${colors.arms}, ${layerOpacity})`;
          ctx.lineWidth = layerWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Logarithmic spiral for realistic galaxy shape
          for (let i = 0; i <= 80; i++) {
            const t = i / 80;
            const spiralAngle = armOffset + t * Math.PI * 2.5;
            const spiralRadius = galaxy.radius * 0.15 + t * galaxy.radius * 0.9;
            // Add some waviness for natural look
            const wobble = Math.sin(t * 12 + arm) * 5;
            const x = Math.cos(spiralAngle) * (spiralRadius + wobble);
            const y = Math.sin(spiralAngle) * (spiralRadius + wobble);
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
        
        // Add bright star clusters along arms
        for (let i = 0; i < 30; i++) {
          const t = (i / 30) * 0.85 + 0.1;
          const spiralAngle = armOffset + t * Math.PI * 2.5;
          const spiralRadius = galaxy.radius * 0.15 + t * galaxy.radius * 0.9;
          const scatter = (Math.random() - 0.5) * 20;
          const x = Math.cos(spiralAngle) * spiralRadius + scatter;
          const y = Math.sin(spiralAngle) * spiralRadius + scatter;
          
          const starSize = Math.random() * 2 + 0.5;
          const starOpacity = currentOpacity * (0.3 + Math.random() * 0.4);
          
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity})`;
          ctx.arc(x, y, starSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Bright central bulge - layered for realism
      const bulgeOuter = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.radius * 0.4);
      bulgeOuter.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity * 0.5})`);
      bulgeOuter.addColorStop(0.2, `rgba(${colors.core}, ${currentOpacity * 0.4})`);
      bulgeOuter.addColorStop(0.5, `rgba(${colors.arms}, ${currentOpacity * 0.15})`);
      bulgeOuter.addColorStop(1, 'transparent');
      ctx.fillStyle = bulgeOuter;
      ctx.beginPath();
      ctx.arc(0, 0, galaxy.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      // Bright core center
      const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.radius * 0.15);
      coreGlow.addColorStop(0, `rgba(255, 255, 240, ${currentOpacity * 0.7})`);
      coreGlow.addColorStop(0.5, `rgba(${colors.core}, ${currentOpacity * 0.5})`);
      coreGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(0, 0, galaxy.radius * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const spawnShootingStar = () => {
      if (!config.shootingStars.enabled) return;
      if (shootingStarsRef.current.length >= config.shootingStars.maxActive) return;
      if (Math.random() > config.shootingStars.spawnChance) return;
      
      const angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.3; // Diagonal angle
      shootingStarsRef.current.push({
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.3,
        length: Math.random() * 80 + 60,
        speed: Math.random() * 15 + 10,
        angle,
        opacity: Math.random() * 0.5 + 0.5,
        life: 0,
        maxLife: Math.random() * 40 + 30,
      });
    };

    const drawShootingStar = (star: ShootingStar) => {
      const progress = star.life / star.maxLife;
      const fadeIn = Math.min(progress * 4, 1);
      const fadeOut = Math.max(0, 1 - (progress - 0.7) / 0.3);
      const currentOpacity = star.opacity * fadeIn * fadeOut;
      
      const tailX = star.x - Math.cos(star.angle) * star.length;
      const tailY = star.y - Math.sin(star.angle) * star.length;
      
      // Main streak gradient
      const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.3, `rgba(255, 255, 255, ${currentOpacity * 0.3})`);
      gradient.addColorStop(0.7, `rgba(200, 220, 255, ${currentOpacity * 0.7})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, ${currentOpacity})`);
      
      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(star.x, star.y);
      ctx.stroke();
      
      // Bright head glow
      const headGlow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 6);
      headGlow.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity})`);
      headGlow.addColorStop(0.5, `rgba(180, 200, 255, ${currentOpacity * 0.5})`);
      headGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(star.x, star.y, 6, 0, Math.PI * 2);
      ctx.fill();
    };

    const updateShootingStars = () => {
      shootingStarsRef.current = shootingStarsRef.current.filter(star => {
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.life++;
        return star.life < star.maxLife && star.x < canvas.width && star.y < canvas.height;
      });
    };

    // Aurora borealis colors
    const auroraColors = [
      { r: 80, g: 255, b: 180 },   // Green
      { r: 100, g: 200, b: 255 },  // Cyan
      { r: 180, g: 100, b: 255 },  // Purple
      { r: 80, g: 180, b: 255 },   // Light blue
    ];

    const drawAurora = (time: number) => {
      if (!config.aurora.enabled) return;
      
      const auroraHeight = canvas.height * 0.35;
      
      // Draw multiple aurora curtains
      for (let curtain = 0; curtain < 3; curtain++) {
        const color = auroraColors[curtain % auroraColors.length];
        const curtainOffset = curtain * 0.8;
        const curtainOpacity = config.aurora.opacity * (1 - curtain * 0.25);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        // Create wavy aurora shape
        const segments = 60;
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * canvas.width;
          const wavePhase = time * config.aurora.waveSpeed + curtainOffset;
          
          // Multiple wave frequencies for organic movement
          const wave1 = Math.sin(x * 0.003 + wavePhase) * 40;
          const wave2 = Math.sin(x * 0.007 + wavePhase * 1.3) * 25;
          const wave3 = Math.sin(x * 0.002 + wavePhase * 0.7) * 50;
          
          const y = auroraHeight * 0.3 + wave1 + wave2 + wave3 + curtain * 20;
          
          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.lineTo(canvas.width, 0);
        ctx.closePath();
        
        // Create gradient for aurora fade
        const gradient = ctx.createLinearGradient(0, 0, 0, auroraHeight);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${curtainOpacity * 0.6})`);
        gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${curtainOpacity})`);
        gradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, ${curtainOpacity * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add subtle glow streaks
        for (let streak = 0; streak < 8; streak++) {
          const streakX = (canvas.width / 8) * streak + Math.sin(time * 0.0002 + streak) * 30;
          const streakHeight = auroraHeight * (0.4 + Math.sin(time * 0.0003 + streak * 0.5) * 0.2);
          
          const streakGradient = ctx.createLinearGradient(streakX, 0, streakX, streakHeight);
          streakGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${curtainOpacity * 0.3})`);
          streakGradient.addColorStop(0.5, `rgba(255, 255, 255, ${curtainOpacity * 0.15})`);
          streakGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = streakGradient;
          ctx.fillRect(streakX - 15, 0, 30, streakHeight);
        }
      }
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Smooth mouse interpolation for parallax
      const lerpFactor = 0.05;
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * lerpFactor;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * lerpFactor;
      
      // Calculate parallax offsets (centered at 0.5, 0.5)
      const parallaxEnabled = config.speedMultiplier > 0;
      const mouseOffsetX = (mouseRef.current.x - 0.5) * canvas.width;
      const mouseOffsetY = (mouseRef.current.y - 0.5) * canvas.height;

      // Draw aurora at the very back
      drawAurora(time);

      // Draw nebulae first (furthest back) with parallax
      ctx.save();
      if (parallaxEnabled) {
        ctx.translate(mouseOffsetX * parallaxConfig.nebula, mouseOffsetY * parallaxConfig.nebula);
      }
      nebulaeRef.current.forEach((nebula) => {
        drawNebula(nebula, time);
      });
      ctx.restore();

      // Draw galaxies with parallax
      ctx.save();
      if (parallaxEnabled) {
        ctx.translate(mouseOffsetX * parallaxConfig.galaxy, mouseOffsetY * parallaxConfig.galaxy);
      }
      galaxiesRef.current.forEach((galaxy) => {
        drawGalaxy(galaxy, time);
      });
      ctx.restore();

      // Draw ambient glow
      if (config.ambientGlow) {
        const glowGradient = ctx.createRadialGradient(
          canvas.width * 0.3, canvas.height * 0.3, 0,
          canvas.width * 0.3, canvas.height * 0.3, canvas.width * 0.5
        );
        glowGradient.addColorStop(0, `rgba(138, 80, 255, ${settings.performanceMode === 'full' ? 0.08 : 0.05})`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const glowGradient2 = ctx.createRadialGradient(
          canvas.width * 0.7, canvas.height * 0.7, 0,
          canvas.width * 0.7, canvas.height * 0.7, canvas.width * 0.4
        );
        glowGradient2.addColorStop(0, `rgba(0, 212, 255, ${settings.performanceMode === 'full' ? 0.05 : 0.03})`);
        glowGradient2.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient2;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw stars with parallax (foreground - moves most)
      ctx.save();
      if (parallaxEnabled) {
        ctx.translate(mouseOffsetX * parallaxConfig.stars, mouseOffsetY * parallaxConfig.stars);
      }
      starsRef.current.forEach((star) => {
        drawStar(star, time);
        
        if (config.speedMultiplier > 0) {
          star.y += star.speed;
          if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
          }
        }
      });
      ctx.restore();

      // Spawn and draw shooting stars (topmost layer)
      spawnShootingStar();
      updateShootingStars();
      shootingStarsRef.current.forEach(drawShootingStar);

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Mouse move handler for parallax
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    
    // Touch move handler for mobile parallax
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetMouseRef.current = {
          x: e.touches[0].clientX / window.innerWidth,
          y: e.touches[0].clientY / window.innerHeight,
        };
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [settings.performanceMode, config]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default StarfieldBackground;
