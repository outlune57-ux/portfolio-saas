<DOCUMENT filename="FlipBook.tsx">
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { BookOpen, X, Share2, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface FlipBookProps {
  images: string[];
  clientName?: string;
  watermark?: string;
}

// Theme constants
const theme = {
  leather: '#1c1710',
  spineDark: '#0d0a07',
  spineMid: '#2a2218',
  goldStart: '#e6d0a3',
  goldMid: '#c4a771',
  goldEnd: '#9b7e47',
  paperBack: '#f4efe7',
  textDark: '#12100e',
  textLight: '#e8dcc8',
  textMedium: '#8a7a65',
  textDim: '#6a5a45',
  textBright: '#c8b898',
  watermark: 'rgba(255,255,255,0.20)',
  shadow: 'rgba(0,0,0,0.42)',
  highlight: 'rgba(255,255,255,0.18)',
  badgeBg: 'rgba(0,0,0,0.55)',
  badgeText: 'rgba(255,255,255,0.80)',
  curlHint: 'rgba(255,255,255,0.07)',
  grain: '#7a6a50',
};

// ── Device with throttle ──────────────────────────────────────────────────────
function useDevice() {
  const get = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const mob = vw < 520;
    let w = mob ? vw - 20 : vw < 900 ? Math.min(vw * 0.72, 480) : Math.min(vw * 0.45, 620);
    const h = Math.round(w * (4 / 3));
    const maxH = mob ? vh - 130 : vh - 160;
    if (h > maxH) w = Math.round(maxH * 3 / 4);
    return { w: Math.round(w), h: Math.min(h, maxH), mob };
  };
  const [d, setD] = useState(get);
  useEffect(() => {
    let tid: NodeJS.Timeout;
    const fn = () => {
      clearTimeout(tid);
      tid = setTimeout(() => setD(get()), 150);
    };
    window.addEventListener('resize', fn);
    return () => {
      window.removeEventListener('resize', fn);
      clearTimeout(tid);
    };
  }, []);
  return d;
}

// ── Canvas page renderers (extracted) ─────────────────────────────────────────
function drawCoverPage(ctx: CanvasRenderingContext2D, W: number, H: number, name: string) {
  ctx.fillStyle = theme.leather; ctx.fillRect(0, 0, W, H);
  // Leather noise
  const id = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    id.data[i] += n; id.data[i+1] += n * 0.6; id.data[i+2] += n * 0.3;
  }
  ctx.putImageData(id, 0, 0);
  // Spine
  const sg = ctx.createLinearGradient(0, 0, 28, 0);
  sg.addColorStop(0, theme.spineDark); sg.addColorStop(0.4, theme.spineMid); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, 28, H);
  // Gold frame
  const bx = W * 0.14, by = H * 0.16, bw = W * 0.72, bh = H * 0.68;
  const gg = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  gg.addColorStop(0, theme.goldStart); gg.addColorStop(0.5, theme.goldMid); gg.addColorStop(1, theme.goldEnd);
  ctx.strokeStyle = gg; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = theme.textDark; ctx.fillRect(bx + 6, by + 6, bw - 12, bh - 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
  ctx.strokeRect(bx + 7, by + 7, bw - 14, bh - 14);
  // Text
  const cx = W / 2, cy = H / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.textMedium;
  ctx.font = `${Math.round(W * 0.021)}px Georgia,serif`;
  ctx.fillText('PORTFÓLIO FOTOGRÁFICO', cx, cy - H * 0.07);
  ctx.fillStyle = theme.textLight;
  ctx.font = `300 ${Math.round(W * 0.06)}px Georgia,serif`;
  ctx.fillText(name, cx, cy + H * 0.015);
  // Divider
  ctx.strokeStyle = theme.textMedium; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 28, cy + H * 0.065); ctx.lineTo(cx + 28, cy + H * 0.065); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.font = `${Math.round(W * 0.017)}px Georgia,serif`;
  ctx.fillText('FLIPFOLIO', cx, H - 26);
}

function drawBackPage(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = theme.leather; ctx.fillRect(0, 0, W, H);
  const id = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    id.data[i] += n; id.data[i+1] += n * 0.6; id.data[i+2] += n * 0.3;
  }
  ctx.putImageData(id, 0, 0);
  const sg = ctx.createLinearGradient(W, 0, W - 28, 0);
  sg.addColorStop(0, theme.spineDark); sg.addColorStop(0.4, theme.spineMid); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.fillRect(W - 28, 0, 28, H);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.font = `${Math.round(W * 0.017)}px Georgia,serif`;
  ctx.textAlign = 'center'; ctx.fillText('FLIPFOLIO', W / 2, H - 26);
}

function drawContactPage(ctx: CanvasRenderingContext2D, W: number, H: number, name: string) {
  ctx.fillStyle = theme.textDark; ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  ctx.strokeStyle = theme.textMedium; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 25, H * 0.16); ctx.lineTo(cx + 25, H * 0.16); ctx.stroke();
  ctx.fillStyle = theme.textMedium;
  ctx.font = `${Math.round(W * 0.021)}px Georgia,serif`;
  ctx.textAlign = 'center'; ctx.fillText('CONTATO', cx, H * 0.23);
  ctx.fillStyle = theme.textLight;
  ctx.font = `300 ${Math.round(W * 0.054)}px Georgia,serif`;
  ctx.fillText(name, cx, H * 0.315);
  const items = [
    ['WHATSAPP', '+55 (11) 99999-9999'],
    ['E-MAIL', 'contato@exemplo.com'],
    ['INSTAGRAM', '@seuinstagram'],
  ];
  items.forEach(([label, value], i) => {
    const y = H * 0.42 + i * H * 0.12;
    ctx.fillStyle = theme.textDim; ctx.font = `${Math.round(W * 0.019)}px Georgia,serif`;
    ctx.textAlign = 'left'; ctx.fillText(label, W * 0.14, y);
    ctx.fillStyle = theme.textBright; ctx.font = `${Math.round(W * 0.032)}px Georgia,serif`;
    ctx.fillText(value, W * 0.14, y + H * 0.047);
  });
  const bW = W * 0.72, bH = H * 0.068, bX = cx - bW / 2, bY = H * 0.82, r = bH / 2;
  ctx.fillStyle = '#25d366';
  ctx.beginPath();
  ctx.moveTo(bX + r, bY); ctx.lineTo(bX + bW - r, bY);
  ctx.arcTo(bX + bW, bY, bX + bW, bY + bH, r);
  ctx.lineTo(bX + r, bY + bH);
  ctx.arcTo(bX, bY + bH, bX, bY, r);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(W * 0.033)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.fillText('📱 Entre em Contato', cx, bY + bH * 0.65);
}

function drawPhotoPage(ctx: CanvasRenderingContext2D, W: number, H: number,
  img: HTMLImageElement, num: number, total: number, wm: string) {
  // Image fill
  const iAR = img.width / img.height, pAR = W / H;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (iAR > pAR) { sw = img.height * pAR; sx = (img.width - sw) / 2; }
  else { sh = img.width / pAR; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  // Spine shadow
  const sg = ctx.createLinearGradient(0, 0, W * 0.30, 0);
  sg.addColorStop(0, theme.shadow); sg.addColorStop(0.25, 'rgba(0,0,0,0.12)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
  // Watermark
  ctx.fillStyle = theme.watermark;
  ctx.font = `${Math.round(W * 0.02)}px Georgia,serif`;
  ctx.textAlign = 'left'; ctx.fillText(wm, 12, H - 10);
  // Page badge
  const badge = `${num} / ${total}`;
  const fs = Math.round(W * 0.026);
  ctx.font = `bold ${fs}px sans-serif`;
  const bw = ctx.measureText(badge).width + 20, bh = fs * 1.8;
  const bx = W - bw - 10, by = H - bh - 10;
  ctx.fillStyle = theme.badgeBg;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, bw, bh, bh/2);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();
  ctx.fillStyle = theme.badgeText; ctx.textAlign = 'center';
  ctx.fillText(badge, bx + bw / 2, by + bh * 0.68);
  // Curl hint corner
  ctx.fillStyle = theme.curlHint;
  ctx.beginPath(); ctx.moveTo(W, H); ctx.lineTo(W - 30, H); ctx.lineTo(W, H - 30); ctx.closePath(); ctx.fill();
}

// ── Geometry functions (extracted) ────────────────────────────────────────────
interface Pt { x: number; y: number }

function clipPolyToRect(poly: Pt[], W: number, H: number): Pt[] {
  const edges = [
    { x1:0, y1:0, x2:W, y2:0 },
    { x1:W, y1:0, x2:W, y2:H },
    { x1:W, y1:H, x2:0, y2:H },
    { x1:0, y1:H, x2:0, y2:0 },
  ];
  let out = [...poly];
  for (const e of edges) {
    if (out.length === 0) break;
    const inp = out; out = [];
    const inside = (p: Pt) =>
      (e.x2-e.x1)*(p.y-e.y1) - (e.y2-e.y1)*(p.x-e.x1) >= 0;
    const intersect = (a: Pt, b: Pt): Pt => {
      const dx1=b.x-a.x, dy1=b.y-a.y;
      const dx2=e.x2-e.x1, dy2=e.y2-e.y1;
      const d = dx1*dy2 - dy1*dx2;
      if (Math.abs(d) < 1e-9) return a;
      const t = ((e.x1-a.x)*dy2 - (e.y1-a.y)*dx2) / d;
      return { x: a.x+t*dx1, y: a.y+t*dy1 };
    };
    for (let i = 0; i < inp.length; i++) {
      const curr = inp[i], prev = inp[(i-1+inp.length)%inp.length];
      const cIn = inside(curr), pIn = inside(prev);
      if (cIn) { if (!pIn) out.push(intersect(prev, curr)); out.push(curr); }
      else if (pIn) out.push(intersect(prev, curr));
    }
  }
  return out;
}

function foldIntersections(mx: number, my: number, px: number, py: number, W: number, H: number): Pt[] {
  const pts: Pt[] = [];
  const eps = 1e-6;
  const edges = [
    { t: Math.abs(py) > eps ? -my / py : Infinity, dir: 'h', lim: W },
    { t: Math.abs(py) > eps ? (H - my) / py : Infinity, dir: 'h', lim: W },
    { t: Math.abs(px) > eps ? -mx / px : Infinity, dir: 'v', lim: H },
    { t: Math.abs(px) > eps ? (W - mx) / px : Infinity, dir: 'v', lim: H },
  ];
  edges.forEach((e, i) => {
    if (!isFinite(e.t)) return;
    const ix = mx + e.t * px, iy = my + e.t * py;
    const coord = e.dir === 'h' ? ix : iy;
    if (coord >= -1 && coord <= e.lim + 1) {
      pts.push({ x: Math.max(0, Math.min(W, ix)), y: Math.max(0, Math.min(H, iy)) });
    }
  });
  return pts.filter((p, i, a) => a.findIndex(q => Math.abs(q.x-p.x) < 2 && Math.abs(q.y-p.y) < 2) === i);
}

function sortPoly(pts: Pt[]): Pt[] {
  if (pts.length < 2) return pts;
  const cx = pts.reduce((s,p) => s+p.x, 0) / pts.length;
  const cy = pts.reduce((s,p) => s+p.y, 0) / pts.length;
  return [...pts].sort((a, b) => Math.atan2(a.y-cy, a.x-cx) - Math.atan2(b.y-cy, b.x-cx));
}

function reflectPt(p: Pt, mx: number, my: number, nx: number, ny: number): Pt {
  const dx = p.x - mx, dy = p.y - my;
  const dot = dx * nx + dy * ny;
  return { x: p.x - 2*dot*nx, y: p.y - 2*dot*ny };
}

// ── Render curl (extracted) ───────────────────────────────────────────────────
function renderCurl(
  ctx: CanvasRenderingContext2D,
  frontC: HTMLCanvasElement, backC: HTMLCanvasElement,
  W: number, H: number,
  touchX: number, touchY: number,
  dir: 'fwd' | 'bwd'
) {
  const cX = dir === 'fwd' ? W : 0;
  const cY = H;
  const dX = Math.max(0, Math.min(W, touchX));
  const dY = Math.max(H * 0.1, Math.min(H, touchY));

  const mX = (cX + dX) / 2, mY = (cY + dY) / 2;
  const vX = cX - dX, vY = cY - dY;
  const vL = Math.sqrt(vX*vX + vY*vY);
  if (vL < 2) { ctx.drawImage(frontC, 0, 0, W, H); return; }
  const nX = vX/vL, nY = vY/vL;
  const pX = -nY, pY = nX;

  const fold = foldIntersections(mX, mY, pX, pY, W, H);
  if (fold.length < 2) { ctx.drawImage(frontC, 0, 0, W, H); return; }

  const f1 = fold[0], f2 = fold[1];
  const flapSign = Math.sign((cX-mX)*nX + (cY-mY)*nY);
  const onFlap = (p: Pt) => ((p.x-mX)*nX + (p.y-mY)*nY) * flapSign > 0;

  const corners: Pt[] = [{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}];
  const staticPoly = sortPoly([f1, f2, ...corners.filter(c => !onFlap(c))]);
  const flapPoly   = sortPoly([f1, f2, ...corners.filter(c => onFlap(c))]);
  const reflPoly   = clipPolyToRect(flapPoly.map(p => reflectPt(p, mX, mY, nX, nY)), W, H);

  function clip(poly: Pt[]) {
    ctx.beginPath();
    poly.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.clip();
  }

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(backC, 0, 0, W, H);

  ctx.save(); clip(staticPoly);
  ctx.drawImage(frontC, 0, 0, W, H);
  ctx.restore();

  ctx.save(); clip(staticPoly);
  const smX = (f1.x+f2.x)/2, smY = (f1.y+f2.y)/2;
  const sG = ctx.createLinearGradient(smX, smY, smX - flapSign*nX*80, smY - flapSign*nY*80);
  sG.addColorStop(0, theme.shadow);
  sG.addColorStop(0.30, 'rgba(0,0,0,0.15)');
  sG.addColorStop(0.70, 'rgba(0,0,0,0.04)');
  sG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sG; ctx.fillRect(0, 0, W, H);
  ctx.restore();

  ctx.save(); clip(reflPoly);
  ctx.fillStyle = theme.paperBack; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.018;
  ctx.strokeStyle = theme.grain; ctx.lineWidth = 1;
  for (let y = 18; y < H; y += 22) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const rf1 = reflectPt(f1, mX, mY, nX, nY), rf2 = reflectPt(f2, mX, mY, nX, nY);
  const foldMidR = {x:(rf1.x+rf2.x)/2, y:(rf1.y+rf2.y)/2};
  const rfCenter: Pt = {
    x: reflPoly.reduce((s,p) => s+p.x, 0)/reflPoly.length,
    y: reflPoly.reduce((s,p) => s+p.y, 0)/reflPoly.length,
  };
  const bsG = ctx.createLinearGradient(foldMidR.x, foldMidR.y, rfCenter.x, rfCenter.y);
  bsG.addColorStop(0, 'rgba(0,0,0,0.32)');
  bsG.addColorStop(0.20, 'rgba(0,0,0,0.12)');
  bsG.addColorStop(0.50, 'rgba(0,0,0,0.04)');
  bsG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bsG; ctx.fillRect(0, 0, W, H);
  const hlG = ctx.createLinearGradient(foldMidR.x, foldMidR.y, foldMidR.x + nX*30, foldMidR.y + nY*30);
  hlG.addColorStop(0, 'rgba(255,255,255,0)');
  hlG.addColorStop(0.5, theme.highlight);
  hlG.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hlG; ctx.fillRect(0, 0, W, H);
  ctx.restore();

  ctx.save();
  const feG = ctx.createLinearGradient(f1.x, f1.y, f2.x, f2.y);
  feG.addColorStop(0, 'rgba(255,255,255,0.45)');
  feG.addColorStop(0.5, 'rgba(255,255,255,1.00)');
  feG.addColorStop(1, 'rgba(255,255,255,0.45)');
  ctx.strokeStyle = feG; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(f1.x, f1.y); ctx.lineTo(f2.x, f2.y); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(f1.x, f1.y); ctx.lineTo(f2.x, f2.y); ctx.stroke();
  ctx.restore();
}

// ── Lightbox (extracted as component) ─────────────────────────────────────────
const Lightbox: React.FC<{src:string;caption:string;onClose:()=>void}> = ({src,caption,onClose}) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.96)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{position:'relative',maxWidth:'95vw',maxHeight:'95vh'}}>
        <img src={src} alt={caption} style={{maxWidth:'95vw',maxHeight:'88vh',objectFit:'contain',borderRadius:4,display:'block'}} />
        {caption && <p style={{textAlign:'center',color:'rgba(255,255,255,0.5)',fontSize:12,marginTop:10,letterSpacing:'0.15em',textTransform:'uppercase'}}>{caption}</p>}
        <button onClick={onClose} style={{position:'absolute',top:-14,right:-14,background:theme.leather,border:'1px solid #3a2a15',borderRadius:'50%',width:32,height:32,color:'#aaa',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <X size={14}/>
        </button>
      </div>
    </div>
  );
};

// ── Main FlipBook ─────────────────────────────────────────────────────────────
export const FlipBook: React.FC<FlipBookProps> = ({ images, clientName = 'Apresentação', watermark }) => {
  const { w: bookW, h: bookH, mob } = useDevice();
  const totalPages = images.length + 3;
  const thumbSize = Math.max(32, Math.round(bookW * 0.10));
  const wm = watermark || `© ${clientName}`;

  const [curPage, setCurPage] = useState(0);
  const [lightbox, setLightbox] = useState<{src:string;caption:string}|null>(null);
  const [copied, setCopied] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [loadingPages, setLoadingPages] = useState(new Set<number>());

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const rafRef = useRef<number>(0);
  const flipRef = useRef<{
    dir: 'fwd'|'bwd'; from: number; to: number;
    touchX: number; touchY: number; animating: boolean;
    targetX: number; targetY: number;
  }|null>(null);
  const touchStart = useRef<{x:number;y:number;t:number}|null>(null);
  const lastFrame = useRef(0);

  // ── Preload images with error handling ───────────────────────────────────────
  useEffect(() => {
    images.forEach((src, idx) => {
      if (imgCache.current.has(src)) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        pageCache.current.delete(`photo-${idx}-${bookW}x${bookH}`);
        setLoadingPages(prev => {
          const newSet = new Set(prev);
          newSet.delete(idx + 1);
          return newSet;
        });
      };
      img.onerror = () => console.error(`Failed to load image: ${src}`);
      img.src = src;
      imgCache.current.set(src, img);
    });
    // Preload next/prev
    const preloadRange = 2;
    const start = Math.max(0, curPage - preloadRange);
    const end = Math.min(totalPages - 1, curPage + preloadRange);
    for (let i = start; i <= end; i++) {
      getPageCanvas(i, bookW, bookH);
    }
  }, [images, curPage, bookW, bookH, totalPages]);

  // ── Get page canvas (memoized by size) ───────────────────────────────────────
  const getPageCanvas = useCallback((idx: number, W: number, H: number): HTMLCanvasElement | null => {
    const key = `${idx}-${W}x${H}`;
    if (pageCache.current.has(key)) return pageCache.current.get(key)!;

    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    setLoadingPages(prev => new Set([...prev, idx]));

    if (idx === 0) {
      drawCoverPage(ctx, W, H, clientName);
    } else if (idx === totalPages - 1) {
      drawBackPage(ctx, W, H);
    } else if (idx === totalPages - 2) {
      drawContactPage(ctx, W, H, clientName);
    } else {
      const imgIdx = idx - 1;
      const src = images[imgIdx];
      const img = imgCache.current.get(src);
      if (!img || !img.complete || img.naturalWidth === 0) {
        return null;
      }
      drawPhotoPage(ctx, W, H, img, imgIdx + 1, images.length, wm);
    }

    pageCache.current.set(key, c);
    setLoadingPages(prev => {
      const newSet = new Set(prev);
      newSet.delete(idx);
      return newSet;
    });
    return c;
  }, [images, clientName, totalPages, wm, bookW, bookH]);

  // ── Render function with FPS limit ───────────────────────────────────────────
  const doRender = useCallback(() => {
    const canvas = canvasRef.current;
    const f = flipRef.current;
    if (!canvas || !f) return;
    const ctx = canvas.getContext('2d')!;
    const W = bookW, H = bookH;
    const front = getPageCanvas(f.from, W, H);
    const back = getPageCanvas(f.to, W, H);
    if (!front || !back) {
      rafRef.current = requestAnimationFrame(doRender);
      return;
    }
    renderCurl(ctx, front, back, W, H, f.touchX, f.touchY, f.dir);
  }, [bookW, bookH, getPageCanvas]);

  const renderFrame = useCallback(() => {
    const now = performance.now();
    if (now - lastFrame.current < 20) { // ~50 FPS
      rafRef.current = requestAnimationFrame(renderFrame);
      return;
    }
    lastFrame.current = now;
    doRender();
    rafRef.current = requestAnimationFrame(renderFrame);
  }, [doRender]);

  // ── Animation ────────────────────────────────────────────────────────────────
  const startAnim = useCallback((targetX: number, targetY: number, onDone: (completed: boolean) => void) => {
    const f = flipRef.current;
    if (!f) return;
    flipRef.current = { ...f, animating: true, targetX, targetY };

    const tick = () => {
      const ff = flipRef.current;
      if (!ff || !ff.animating) return;

      const dx = ff.targetX - ff.touchX;
      const dy = ff.targetY - ff.touchY;
      const dist = Math.sqrt(dx*dx + dy*dy);

      const speed = Math.min(0.18, 0.06 + 180 / (dist + 1));
      const newX = ff.touchX + dx * speed;
      const newY = ff.touchY + dy * speed;

      const crossed = ff.dir === 'fwd' ? newX < bookW * 0.02 : newX > bookW * 0.98;

      if (dist < 1.2 || crossed) {
        onDone(ff.targetX < bookW / 2 === (ff.dir === 'fwd'));
        if ('vibrate' in navigator) navigator.vibrate(12);
        return;
      }

      flipRef.current = { ...ff, touchX: newX, touchY: newY };
      doRender();
      rafRef.current = requestAnimationFrame(tick);
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [bookW, doRender]);

  const animateTo = useCallback((targetX: number, targetY: number) => {
    startAnim(targetX, targetY, (completed) => {
      const f = flipRef.current;
      if (completed && f) setCurPage(f.to);
      flipRef.current = null;
      setFlipping(false);
      const c = canvasRef.current;
      if (c) c.getContext('2d')!.clearRect(0, 0, bookW, bookH);
    });
  }, [bookW, bookH, startAnim]);

  // ── Trigger flip ─────────────────────────────────────────────────────────────
  const triggerFlip = useCallback((dir: 'fwd'|'bwd') => {
    if (flipRef.current) return;
    const to = dir === 'fwd' ? curPage + 1 : curPage - 1;
    if (to < 0 || to >= totalPages) return;
    flipRef.current = {
      dir, from: curPage, to,
      touchX: dir === 'fwd' ? bookW : 0,
      touchY: bookH,
      animating: false, targetX: 0, targetY: 0,
    };
    setFlipping(true);
    const tx = dir === 'fwd' ? -bookW * 0.05 : bookW * 1.05;
    animateTo(tx, bookH * 0.75);
  }, [curPage, totalPages, bookW, bookH, animateTo]);

  // ── Pointer handlers (touch + mouse) ─────────────────────────────────────────
  const isTouch = 'ontouchstart' in window;
  const pointerDownEvent = isTouch ? 'touchstart' : 'mousedown';
  const pointerMoveEvent = isTouch ? 'touchmove' : 'mousemove';
  const pointerUpEvent = isTouch ? 'touchend' : 'mouseup';

  const getPointerPos = (e: MouseEvent | TouchEvent, rect: DOMRect) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (flipRef.current?.animating) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const { x: tx, y: ty } = getPointerPos(e.nativeEvent, rect);
    touchStart.current = { x: tx, y: ty, t: Date.now() };
    const dir = tx > bookW / 2 ? 'fwd' : 'bwd';
    const to = dir === 'fwd' ? curPage + 1 : curPage - 1;
    if (to < 0 || to >= totalPages) return;
    flipRef.current = {
      dir, from: curPage, to,
      touchX: dir === 'fwd' ? bookW : 0, touchY: bookH * 0.85,
      animating: false, targetX: 0, targetY: 0,
    };
    setFlipping(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(renderFrame);
    if (!isTouch) {
      document.addEventListener(pointerMoveEvent, onPointerMove as any);
      document.addEventListener(pointerUpEvent, onPointerUp as any);
    }
  }, [curPage, totalPages, bookW, bookH, renderFrame, pointerMoveEvent, pointerUpEvent]);

  const onPointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const f = flipRef.current;
    if (!f || f.animating) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const { x: tx, y: ty } = getPointerPos(e, rect);
    flipRef.current = { ...f, touchX: tx, touchY: ty };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(renderFrame);
  }, [renderFrame]);

  const onPointerUp = useCallback((e: MouseEvent | TouchEvent) => {
    const f = flipRef.current;
    if (!f || f.animating) return;

    const ts = touchStart.current;
    const dt = ts ? Math.max(Date.now() - ts.t, 1) : 999;
    const ddx = ts ? f.touchX - ts.x : 0;
    const velocity = Math.abs(ddx) / dt;
    const progress = f.dir === 'fwd' ? 1 - f.touchX / bookW : f.touchX / bookW;
    const complete = progress > 0.25 || velocity > 0.35;

    touchStart.current = null;

    if (complete) {
      const tx = f.dir === 'fwd' ? -bookW * 0.05 : bookW * 1.05;
      const ty = bookH * 0.75;
      startAnim(tx, ty, (ok) => {
        const ff = flipRef.current;
        if (ff) setCurPage(ff.to);
        flipRef.current = null;
        setFlipping(false);
        const c = canvasRef.current;
        if (c) c.getContext('2d')!.clearRect(0, 0, bookW, bookH);
      });
    } else {
      const tx = f.dir === 'fwd' ? bookW * 1.05 : -bookW * 0.05;
      startAnim(tx, bookH * 0.95, (_) => {
        flipRef.current = null;
        setFlipping(false);
        const c = canvasRef.current;
        if (c) c.getContext('2d')!.clearRect(0, 0, bookW, bookH);
      });
    }
    if (!isTouch) {
      document.removeEventListener(pointerMoveEvent, onPointerMove as any);
      document.removeEventListener(pointerUpEvent, onPointerUp as any);
    }
  }, [bookW, bookH, startAnim, pointerMoveEvent, pointerUpEvent]);

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') triggerFlip('bwd');
      if (e.key === 'ArrowRight') triggerFlip('fwd');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [triggerFlip]);

  // ── Go to page ───────────────────────────────────────────────────────────────
  const goToPage = useCallback((idx: number) => {
    cancelAnimationFrame(rafRef.current);
    flipRef.current = null;
    setFlipping(false);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')!.clearRect(0, 0, bookW, bookH);
    setCurPage(Math.max(0, Math.min(totalPages - 1, idx)));
  }, [totalPages, bookW, bookH]);

  // ── Book click (zoom) ────────────────────────────────────────────────────────
  const onBookClick = useCallback((e: React.MouseEvent) => {
    if (flipping) return;
    const imgIdx = curPage - 1;
    if (imgIdx >= 0 && imgIdx < images.length) {
      setLightbox({ src: images[imgIdx], caption: `${clientName} — Foto ${imgIdx + 1}` });
    }
  }, [flipping, curPage, images, clientName]);

  // ── Share ────────────────────────────────────────────────────────────────────
  const shareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  }, []);

  // ── Render page DOM ──────────────────────────────────────────────────────────
  const renderPageDOM = useMemo(() => (idx: number) => {
    if (loadingPages.has(idx)) {
      return (
        <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:theme.leather}}>
          <p style={{color:theme.textMedium}}>Carregando...</p>
        </div>
      );
    }
    if (idx === 0) return (
      <div style={{width:'100%',height:'100%',backgroundColor:theme.leather,position:'relative',overflow:'hidden',borderRight:'2px solid rgba(0,0,0,0.5)'}}>
        <div style={{position:'absolute',inset:0,opacity:0.08,backgroundImage:'url("https://www.transparenttextures.com/patterns/leather.png")',backgroundSize:'70px'}}/>
        <div style={{position:'absolute',left:0,top:0,bottom:0,width:24,background:`linear-gradient(to right,${theme.spineDark},${theme.spineMid},${theme.spineDark})`}}/>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'72%',background:`linear-gradient(135deg,${theme.goldStart},${theme.goldMid},${theme.goldEnd})`,padding:2,borderRadius:4,boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
          <div style={{background:theme.textDark,padding:'28px 18px',borderRadius:2,textAlign:'center',border:'1px solid rgba(255,255,255,0.06)'}}>
            <p style={{color:theme.textMedium,fontSize:9,textTransform:'uppercase',letterSpacing:'0.3em',marginBottom:10}}>Portfólio Fotográfico</p>
            <h2 style={{color:theme.textLight,fontSize:20,fontWeight:300,fontFamily:'Georgia,serif',margin:'0 0 14px'}}>{clientName}</h2>
            <div style={{width:40,height:1,background:theme.textMedium,margin:'0 auto'}}/>
          </div>
        </div>
        <div style={{position:'absolute',bottom:24,left:0,right:0,textAlign:'center',color:'rgba(255,255,255,0.08)',fontSize:8,letterSpacing:'0.4em'}}>FLIPFOLIO</div>
      </div>
    );
    if (idx === totalPages - 1) return (
      <div style={{width:'100%',height:'100%',backgroundColor:theme.leather,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,opacity:0.08,backgroundImage:'url("https://www.transparenttextures.com/patterns/leather.png")',backgroundSize:'70px'}}/>
        <div style={{position:'absolute',right:0,top:0,bottom:0,width:24,background:`linear-gradient(to right,rgba(0,0,0,0),${theme.spineMid},${theme.spineDark})`}}/>
        <div style={{position:'absolute',bottom:36,left:0,right:0,textAlign:'center',color:'rgba(255,255,255,0.09)',fontSize:9,letterSpacing:'0.5em'}}>FLIPFOLIO</div>
      </div>
    );
    if (idx === totalPages - 2) return (
      <div style={{width:'100%',height:'100%',backgroundColor:theme.textDark,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40,boxSizing:'border-box',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,opacity:0.06,backgroundImage:'url("https://www.transparenttextures.com/patterns/leather.png")',backgroundSize:'70px'}}/>
        <div style={{position:'relative',zIndex:1,textAlign:'center',width:'100%'}}>
          <div style={{width:40,height:1,background:theme.textMedium,margin:'0 auto 24px'}}/>
          <p style={{color:theme.textMedium,fontSize:9,textTransform:'uppercase',letterSpacing:'0.35em',marginBottom:16}}>Contato</p>
          <h3 style={{color:theme.textLight,fontSize:18,fontWeight:300,fontFamily:'Georgia,serif',marginBottom:32}}>{clientName}</h3>
          <div style={{display:'flex',flexDirection:'column',gap:14,alignItems:'flex-start',width:'100%'}}>
            {[{icon:'📱',label:'WhatsApp',value:'+55 (11) 99999-9999',href:'https://wa.me/5511999999999'},{icon:'✉',label:'E-mail',value:'contato@exemplo.com',href:'mailto:contato@exemplo.com'},{icon:'📷',label:'Instagram',value:'@seuinstagram',href:'https://instagram.com'}].map(item=>(
              <a key={item.label} href={item.href} style={{display:'flex',alignItems:'center',gap:12,color:theme.textBright,textDecoration:'none',fontSize:12}}>
                <span style={{width:28,textAlign:'center'}}>{item.icon}</span>
                <div><div style={{color:theme.textDim,fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:2}}>{item.label}</div><div>{item.value}</div></div>
              </a>
            ))}
          </div>
          <div style={{width:40,height:1,background:'#3a2a15',margin:'28px auto 20px'}}/>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:8,background:'#25d366',color:'#fff',textDecoration:'none',borderRadius:24,padding:'10px 20px',fontSize:13,fontWeight:600,boxShadow:'0 4px 20px rgba(37,211,102,0.35)'}}>
            📱 Entre em Contato
          </a>
        </div>
      </div>
    );
    const imgIdx = idx - 1;
    const src = images[imgIdx];
    return (
      <div style={{width:'100%',height:'100%',backgroundColor:'#1a1410',position:'relative',overflow:'hidden',cursor:'zoom-in'}}>
        <img src={src} alt={`Foto ${imgIdx+1}`} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(0,0,0,0.42) 0%,rgba(0,0,0,0.10) 12%,transparent 30%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:10,right:10,background:theme.badgeBg,backdropFilter:'blur(8px)',color:theme.badgeText,padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:600,border:'1px solid rgba(255,255,255,0.08)'}}>
          {imgIdx+1} / {images.length}
        </div>
        {wm && <div style={{position:'absolute',bottom:8,left:10,color:theme.watermark,fontSize:9,letterSpacing:'0.15em',fontFamily:'serif'}}>{wm}</div>}
        <div style={{position:'absolute',bottom:0,right:0,width:30,height:30,background:`linear-gradient(135deg,transparent 50%,${theme.curlHint} 50%)`,pointerEvents:'none'}}/>
      </div>
    );
  }, [loadingPages, totalPages, clientName, images, wm]);

  if (images.length === 0) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:384,color:'#525252'}}>
      <BookOpen size={48} style={{marginBottom:16,opacity:0.3}}/>
      <p style={{fontSize:14}}>Nenhuma imagem no portfólio.</p>
    </div>
  );

  return (
    <>
      {lightbox && <Lightbox src={lightbox.src} caption={lightbox.caption} onClose={()=>setLightbox(null)}/>}

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:mob?8:14,userSelect:'none',width:'100%'}}>

        {/* Top bar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:mob?'flex-end':'space-between',width:'100%',maxWidth:bookW}}>
          {!mob && <span style={{color:'#4a3a25',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase'}}>↔ Arraste para folhear</span>}
          <button onClick={shareLink} style={{background:'none',border:'1px solid #2a1a08',borderRadius:20,padding:'3px 10px',color:copied?'#a0c878':'#6a5a45',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:5}}>
            {copied?<Check size={11}/>:<Share2 size={11}/>}
            {copied?'Copiado!':'Compartilhar'}
          </button>
        </div>

        {/* Book */}
        <div
          onTouchStart={onPointerDown as any}
          onTouchMove={onPointerMove as any}
          onTouchEnd={onPointerUp as any}
          onMouseDown={onPointerDown as any}
          onClick={onBookClick}
          style={{width:bookW,height:bookH,position:'relative',touchAction:'none',flexShrink:0,cursor:flipping?'grabbing':'grab'}}
        >
          {/* Ground shadow */}
          <div style={{position:'absolute',bottom:-18,left:'50%',transform:'translateX(-50%)',width:'85%',height:35,borderRadius:'50%',pointerEvents:'none',background:'radial-gradient(ellipse,rgba(0,0,0,0.75) 0%,transparent 70%)',filter:'blur(10px)',zIndex:0}}/>

          {/* Book container */}
          <div style={{position:'relative',zIndex:10,width:bookW,height:bookH,borderRadius:'2px 6px 6px 2px',boxShadow:'-6px 0 20px rgba(0,0,0,0.55), 4px 0 0 #d4c9b8, 6px 0 0 #c8bca8, 8px 0 0 #bdb09c, 10px 0 0 #b2a490',overflow:'hidden'}}>

            {/* DOM page */}
            <div style={{position:'absolute',inset:0,zIndex:1,opacity:flipping?0:1,transition:'opacity 0s'}}>
              {renderPageDOM(curPage)}
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={bookW}
              height={bookH}
              style={{position:'absolute',inset:0,zIndex:2,display:flipping?'block':'none',pointerEvents:'none'}}
            />
          </div>
        </div>

        {/* Navigation */}
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button aria-label="Página anterior" onClick={()=>triggerFlip('bwd')} disabled={curPage===0||flipping} style={{background:'none',border:'1px solid #2a1a08',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:(curPage===0||flipping)?'default':'pointer',color:(curPage===0||flipping)?'#2a1a08':theme.textMedium}}>
            <ChevronLeft size={14}/>
          </button>
          <span style={{color:'#4a3a25',fontSize:11,letterSpacing:'0.15em',minWidth:50,textAlign:'center'}}>
            {curPage+1} / {totalPages}
          </span>
          <button aria-label="Próxima página" onClick={()=>triggerFlip('fwd')} disabled={curPage>=totalPages-1||flipping} style={{background:'none',border:'1px solid #2a1a08',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:(curPage>=totalPages-1||flipping)?'default':'pointer',color:(curPage>=totalPages-1||flipping)?'#2a1a08':theme.textMedium}}>
            <ChevronRight size={14}/>
          </button>
        </div>

        {/* Dots / Thumbs */}
        {mob ? (
          <div style={{display:'flex',gap:5,justifyContent:'center',flexWrap:'wrap',maxWidth:bookW}}>
            {Array.from({length:totalPages}).map((_,i)=>(
              <div key={i} onClick={()=>goToPage(i)} style={{width:i===curPage?16:6,height:6,borderRadius:3,background:i===curPage?theme.goldMid:'rgba(255,255,255,0.2)',cursor:'pointer',transition:'all 0.3s',flexShrink:0}}/>
            ))}
          </div>
        ) : (
          <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',maxWidth:bookW}}>
            <div onClick={()=>goToPage(0)} style={{width:curPage===0?20:8,height:8,borderRadius:4,background:curPage===0?theme.goldMid:'rgba(255,255,255,0.15)',cursor:'pointer',transition:'all 0.3s',flexShrink:0,alignSelf:'center'}}/>
            {images.map((src,i)=>{
              const pi=i+1,active=curPage===pi;
              return (
                <button key={i} onClick={()=>goToPage(pi)} style={{width:thumbSize,height:thumbSize,padding:0,flexShrink:0,border:active?`2px solid ${theme.goldMid}`:'2px solid #2a1a08',borderRadius:4,overflow:'hidden',cursor:'pointer',opacity:active?1:0.45,transition:'all 0.3s',background:'none'}}>
                  <img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                </button>
              );
            })}
            {[totalPages-2,totalPages-1].map(pi=>(
              <div key={pi} onClick={()=>goToPage(pi)} style={{width:curPage===pi?20:8,height:8,borderRadius:4,background:curPage===pi?theme.goldMid:'rgba(255,255,255,0.15)',cursor:'pointer',transition:'all 0.3s',flexShrink:0,alignSelf:'center'}}/>
            ))}
          </div>
        )}

      </div>
    </>
  );
};
</DOCUMENT>