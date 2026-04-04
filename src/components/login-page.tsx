'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, Eye, EyeOff, AlertTriangle, Loader2, Shield, ArrowRight, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

/* ═══════════════════════════════════════════════════════════
   ANIMATED FINANCIAL FLOW BACKGROUND
   Particles representing money/data flowing across nodes
   ═══════════════════════════════════════════════════════════ */

interface FlowParticle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  size: number;
  color: string;
  trail: Array<{ x: number; y: number; opacity: number }>;
}

interface NetworkNode {
  x: number;
  y: number;
  label: string;
  pulsePhase: number;
}

const NODE_COLORS = ['#00FF41', '#00F0FF', '#FFB800', '#BF40FF', '#FF0040'];
const PARTICLE_COLORS = ['#00FF41', '#00F0FF', '#FFB800'];

function FinancialFlowAnimation() {
  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (!node) return;

    const ctx = node.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      node.width = window.innerWidth;
      node.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Network nodes — representing financial hubs
    const nodes: NetworkNode[] = [];
    const nodeCount = 8;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: 0.1 + Math.random() * 0.8,
        y: 0.1 + Math.random() * 0.8,
        label: ['PT', 'ES', 'FR', 'NL', 'UK', 'DE', 'IT', 'CH'][i] ?? '',
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Particles flowing between nodes
    let particles: FlowParticle[] = [];
    let animFrame: number;

    function spawnParticle() {
      const fromNode = nodes[Math.floor(Math.random() * nodes.length)];
      const toNode = nodes[Math.floor(Math.random() * nodes.length)];
      if (fromNode === toNode) return;

      const id = Date.now() + Math.random();
      particles.push({
        id,
        x: fromNode.x,
        y: fromNode.y,
        targetX: toNode.x,
        targetY: toNode.y,
        progress: 0,
        speed: 0.003 + Math.random() * 0.006,
        size: 1.5 + Math.random() * 2,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        trail: [],
      });
    }

    let lastSpawn = 0;

    function draw(time: number) {
      const w = node.width;
      const h = node.height;
      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(0,255,65,0.015)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Spawn particles
      if (time - lastSpawn > 150 && particles.length < 30) {
        spawnParticle();
        lastSpawn = time;
      }

      // Draw connection lines between close nodes
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = (nodes[i].x - nodes[j].x) * w;
          const dy = (nodes[i].y - nodes[j].y) * h;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 350) {
            const alpha = Math.max(0.02, 0.06 - dist / 8000);
            ctx.strokeStyle = `rgba(0,255,65,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * w, nodes[i].y * h);
            ctx.lineTo(nodes[j].x * w, nodes[j].y * h);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        const pulse = Math.sin(time * 0.002 + n.pulsePhase) * 0.3 + 0.7;
        const nx = n.x * w;
        const ny = n.y * h;

        // Outer glow
        const gradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, 30 * pulse);
        gradient.addColorStop(0, 'rgba(0,255,65,0.12)');
        gradient.addColorStop(1, 'rgba(0,255,65,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(nx, ny, 30 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(0,255,65,${0.5 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = 'rgba(0,255,65,0.25)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, nx, ny + 18);
      });

      // Update and draw particles
      particles = particles.filter((p) => p.progress < 1);
      particles.forEach((p) => {
        p.progress += p.speed;

        const cx = p.x * w;
        const cy = p.y * h;
        const tx = p.targetX * w;
        const ty = p.targetY * h;

        const currentX = cx + (tx - cx) * p.progress;
        const currentY = cy + (ty - cy) * p.progress;

        // Trail
        p.trail.push({ x: currentX, y: currentY, opacity: 1 });
        if (p.trail.length > 12) p.trail.shift();

        p.trail.forEach((t, idx) => {
          t.opacity *= 0.88;
          const trailAlpha = (idx / p.trail.length) * t.opacity * 0.5;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = trailAlpha;
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        });

        // Main particle
        ctx.globalAlpha = 1;
        const glow = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, p.size * 4);
        glow.addColorStop(0, p.color + '66');
        glow.addColorStop(1, p.color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(currentX, currentY, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Horizontal scan line
      const scanY = (time * 0.03) % h;
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanGrad.addColorStop(0, 'rgba(0,255,65,0)');
      scanGrad.addColorStop(0.5, 'rgba(0,255,65,0.03)');
      scanGrad.addColorStop(1, 'rgba(0,255,65,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 20, w, 40);

      animFrame = requestAnimationFrame(draw);
    }

    animFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   LOGIN FORM — Calls real api.auth.login()
   ═══════════════════════════════════════════════════════════ */

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { login, loginError, isLoading } = useAuthStore();

  // Delayed form reveal for cinematic effect
  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    await login(username, password);
  };

  // Determine error type for icon/color
  const isServerError = loginError && !loginError.includes('Credenciais');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C] relative overflow-hidden">
      {/* Animated Background */}
      <FinancialFlowAnimation />

      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-[rgba(10,10,12,0.4)]" style={{ zIndex: 1 }} />

      {/* Content */}
      <div
        className={`relative z-10 w-full max-w-md px-6 transition-all duration-1000 ${
          showForm
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl
            bg-gradient-to-br from-[rgba(0,255,65,0.2)] to-[rgba(0,255,65,0.02)]
            border border-[rgba(0,255,65,0.3)] mb-4 cyber-breathe">
            <Zap className="w-8 h-8 text-[#00FF41]" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-[#E0E0E8] cyber-mono">
            NeXFlow<span className="text-[#00FF41]">X</span>
          </h1>
          <p className="text-xs tracking-[0.25em] text-[#555566] uppercase cyber-mono mt-1">
            Core Banking Platform
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[rgba(0,255,65,0.3)]" />
            <span className="text-[9px] cyber-mono text-[#555566]">CORE BANKING</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[rgba(0,255,65,0.3)]" />
          </div>
        </div>

        {/* Login Card */}
        <div className="cyber-panel p-6 border border-[rgba(51,51,51,0.5)]">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-[#00FF41]" />
            <h2 className="text-sm font-semibold text-[#E0E0E8]">Acesso ao Sistema</h2>
            <span className="ml-auto cyber-badge cyber-badge-green text-[8px]">LIVE</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">
                UTILIZADOR
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="NeXFlowX"
                className="cyber-input w-full px-4 py-2.5 rounded-lg text-sm text-[#E0E0E8] cyber-mono"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] cyber-mono text-[#555566] mb-1.5 tracking-wider">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="cyber-input w-full px-4 py-2.5 pr-10 rounded-lg text-sm text-[#E0E0E8] cyber-mono"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555566] hover:text-[#888899] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {loginError && (
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${
                isServerError
                  ? 'bg-[rgba(255,140,0,0.08)] border-[rgba(255,140,0,0.3)]'
                  : 'bg-[rgba(255,0,64,0.08)] border-[rgba(255,0,64,0.3)]'
              }`}>
                {isServerError
                  ? <WifiOff className="w-4 h-4 text-[#FF8C00] shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-[#FF0040] shrink-0" />
                }
                <span className={`text-xs ${isServerError ? 'text-[#FF8C00]' : 'text-[#FF0040]'}`}>
                  {loginError}
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!username || !password || isLoading}
              className={`cyber-btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-lg
                text-sm font-medium cyber-mono transition-all duration-200
                ${(!username || !password) ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A autenticar...</span>
                </>
              ) : (
                <>
                  <span>Aceder ao Banco</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Backend status */}
          <div className="mt-5 pt-4 border-t border-[rgba(51,51,51,0.3)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse" />
              <span className="text-[10px] cyber-mono text-[#555566]">
                API: <span className="text-[#00FF41]">api-dev.nexflowx.tech</span> — ONLINE
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-[#00FF41] cyber-mono">∞</p>
                <p className="text-[9px] cyber-mono text-[#555566]">WALLETS</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#00F0FF] cyber-mono">50+</p>
                <p className="text-[9px] cyber-mono text-[#555566]">FX PAIRS</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#FFB800] cyber-mono">24/7</p>
                <p className="text-[9px] cyber-mono text-[#555566]">UPTIME</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[9px] cyber-mono text-[#333] mt-4">
          NeXFlowX™ Core Banking v3.0 · Multi-Currency · E2E Encrypted
        </p>
      </div>
    </div>
  );
}
