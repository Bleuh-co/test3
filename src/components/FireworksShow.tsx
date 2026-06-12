"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================
 * FireworksShow — démo festive 🎆
 * Feux d'artifice + cotillons (confetti) sur canvas plein écran,
 * avec un grand message au centre. Aucune dépendance externe.
 * ============================================================ */

const FIREWORK_COLORS = [
  "#FFD166", // doré
  "#EF476F", // rose
  "#06D6A0", // vert
  "#118AB2", // bleu
  "#9B5DE5", // mauve
  "#F15BB5", // fuchsia
  "#FEE440", // jaune
  "#00F5D4", // turquoise
  "#FF9F1C", // orange
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  kind: "spark" | "confetti";
  rotation: number;
  rotationSpeed: number;
  wobble: number;
};

type Rocket = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
};

export function FireworksShow() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rocketsRef = useRef<Rocket[]>([]);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [launching, setLaunching] = useState(false);

  const randColor = () =>
    FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];

  const explode = useCallback((x: number, y: number, color: string) => {
    const count = 70 + Math.floor(Math.random() * 50);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        color: Math.random() < 0.8 ? color : randColor(),
        size: 1.5 + Math.random() * 2,
        kind: "spark",
        rotation: 0,
        rotationSpeed: 0,
        wobble: 0,
      });
    }
  }, []);

  const launchRocket = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    rocketsRef.current.push({
      x: w * (0.15 + Math.random() * 0.7),
      y: h + 10,
      vx: (Math.random() - 0.5) * 2,
      vy: -(9 + Math.random() * 4),
      targetY: h * (0.12 + Math.random() * 0.35),
      color: randColor(),
    });
  }, []);

  const burstConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    // Cotillons qui popent depuis les deux coins du bas + le haut
    const origins = [
      { x: 0, y: canvas.clientHeight, dir: -0.9 },
      { x: w, y: canvas.clientHeight, dir: -2.25 },
      { x: w / 2, y: -10, dir: 1.57 },
    ];
    for (const o of origins) {
      for (let i = 0; i < 30; i++) {
        const angle = o.dir + (Math.random() - 0.5) * 1.1;
        const speed = 6 + Math.random() * 9;
        particlesRef.current.push({
          x: o.x,
          y: o.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 160 + Math.random() * 90,
          color: randColor(),
          size: 4 + Math.random() * 5,
          kind: "confetti",
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          wobble: Math.random() * Math.PI * 2,
        });
      }
    }
  }, []);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Fusées
    const rockets = rocketsRef.current;
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.08;
      // Traînée
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = r.color;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      if (r.y <= r.targetY || r.vy >= -1) {
        explode(r.x, r.y, r.color);
        rockets.splice(i, 1);
      }
    }

    // Particules
    const parts = particlesRef.current;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++;
      if (p.life >= p.maxLife) {
        parts.splice(i, 1);
        continue;
      }
      const progress = p.life / p.maxLife;

      if (p.kind === "spark") {
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.05;
        p.x += p.vx;
        p.y += p.vy;
        ctx.globalAlpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Confetti : flottement + rotation
        p.wobble += 0.12;
        p.vx *= 0.985;
        p.vy = Math.min(p.vy + 0.12, 3.2);
        p.x += p.vx + Math.sin(p.wobble) * 1.4;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        ctx.globalAlpha = progress > 0.8 ? (1 - progress) / 0.2 : 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(1, Math.abs(Math.sin(p.wobble)) * 0.8 + 0.2);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    if (runningRef.current || parts.length > 0 || rockets.length > 0) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
      ctx.clearRect(0, 0, w, h);
    }
  }, [explode]);

  const startShow = useCallback(() => {
    // Nettoyer un éventuel show en cours
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    runningRef.current = true;
    setShowMessage(true);
    setLaunching(true);

    // Salve initiale généreuse 🎉
    for (let i = 0; i < 5; i++) {
      setTimeout(() => launchRocket(), i * 180);
    }
    burstConfetti();
    setTimeout(() => burstConfetti(), 700);
    setTimeout(() => burstConfetti(), 1500);

    // Tirs continus pendant le show
    intervalRef.current = setInterval(() => {
      launchRocket();
      if (Math.random() < 0.35) burstConfetti();
    }, 450);

    // Fin du show après 8 secondes
    stopTimerRef.current = setTimeout(() => {
      runningRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLaunching(false);
      setTimeout(() => setShowMessage(false), 3000);
    }, 8000);

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [burstConfetti, launchRocket, tick]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      {/* Canvas plein écran au-dessus de tout, sans bloquer les clics */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-[60]"
        aria-hidden="true"
      />

      {/* Message géant au centre du feu d'artifice */}
      {showMessage && (
        <div className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none px-4">
          <h2
            className="text-center font-extrabold uppercase leading-tight tracking-wide text-3xl sm:text-5xl lg:text-6xl animate-[chanvFadeIn_0.5s_ease-out_both]"
            style={{
              background:
                "linear-gradient(90deg, #FFD166, #EF476F, #9B5DE5, #118AB2, #06D6A0, #FFD166)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 0 40px rgba(255, 209, 102, 0.35)",
              animation:
                "chanvFadeIn 0.5s ease-out both, test3Shimmer 3s linear infinite",
            }}
          >
            CAFE ET PICKLEBALL
            <br />
            SEULEMENT TU FERAS
          </h2>
          <style>{`
            @keyframes test3Shimmer {
              0% { background-position: 0% 50%; }
              100% { background-position: 300% 50%; }
            }
          `}</style>
        </div>
      )}

      {/* Carte avec le bouton de lancement */}
      <div className="card p-10 flex flex-col items-center text-center gap-6">
        <div className="text-6xl" aria-hidden="true">
          🚀
        </div>
        <div>
          <h2 className="text-2xl font-bold text-chanv-terre">
            Prêt pour le spectacle ?
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-md">
            Clique sur le bouton pour déclencher un feu d&apos;artifice, une
            pluie de cotillons… et un message très important. 🎆🎉
          </p>
        </div>
        <button
          onClick={startShow}
          disabled={launching}
          className="btn-primary px-10 py-4 text-lg"
        >
          {launching ? "🎆 Spectacle en cours..." : "🎇 Lancer le feu d'artifice !"}
        </button>
      </div>
    </>
  );
}
