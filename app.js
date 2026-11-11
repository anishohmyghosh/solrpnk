/* Solarpunk · interactive field guide */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOOD = window.MOOD || [];

/* ───── scroll: progress, reveals, nav ───── */
const bar = $('.progress i');
bar && addEventListener('scroll', () => {
  const h = document.documentElement;
  bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
}, { passive: true });
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.reveal').forEach(el => io.observe(el));
const page = document.body.dataset.page;
$$('.nav-links a').forEach(a => a.classList.toggle('on', a.dataset.p === page));
$$('a[href$=".html"]').forEach(a => a.addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || a.target === '_blank') return;
  e.preventDefault(); document.body.classList.add('leaving'); setTimeout(() => location.href = a.href, 260);
}));
addEventListener('pageshow', () => document.body.classList.remove('leaving'));

/* ───── hero canvas: sun, rays, pollen, hills ───── */
(function hero() {
  if (!$('#heroCanvas')) return;
  const cv = $('#heroCanvas'), cx = cv.getContext('2d');
  let W, H, dpr, t = 0, mx = 0, my = 0, run = true, looping = false, lastT = 0;
  const pollen = [...Array(70)].map(() => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + .4, s: Math.random() * .25 + .05, p: Math.random() * 6.28 }));
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); let rzh; addEventListener('resize', () => { clearTimeout(rzh); rzh = setTimeout(() => { size(); if (!looping) frame(); }, 120); });
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  // only animate while the hero is on screen (and never start two loops)
  new IntersectionObserver(([e]) => { run = e.isIntersecting; if (run && !looping && !RM) { looping = true; lastT = performance.now(); requestAnimationFrame(loop); } }).observe(cv);
  function hills(y, amp, f, ph, col) {
    cx.beginPath(); cx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) cx.lineTo(x, y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.3 + ph * 1.7) * amp * .4);
    cx.lineTo(W, H); cx.closePath(); cx.fillStyle = col; cx.fill();
  }
  function loop(now) {
    if (!run) { looping = false; return; }
    t += Math.min(0.05, (now - lastT) / 1000); lastT = now;   // real time, so 120 Hz screens don't run double speed
    frame();
    requestAnimationFrame(loop);
  }
  function frame() {
    cx.clearRect(0, 0, W, H);
    const sx = W * (W < 700 ? .5 : .72) + mx * -30, sy = H * .44 + my * -20, R = Math.min(W, H) * .16;
    let g = cx.createRadialGradient(sx, sy, 0, sx, sy, R * 4.2);
    g.addColorStop(0, 'rgba(240,194,94,.42)'); g.addColorStop(.35, 'rgba(240,160,80,.12)'); g.addColorStop(1, 'rgba(10,15,13,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    // rings
    cx.save(); cx.translate(sx, sy);
    for (let i = 0; i < 4; i++) { cx.beginPath(); cx.arc(0, 0, R * (1.55 + i * .42) + Math.sin(t * .6 + i) * 3, 0, 6.283); cx.strokeStyle = `rgba(240,194,94,${.12 - i * .025})`; cx.lineWidth = 1; cx.stroke(); }
    // rays
    cx.rotate(t * .05);
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * 6.283, long = i % 2 ? 1.25 : 1.6;
      cx.beginPath(); cx.moveTo(Math.cos(a) * R * 1.12, Math.sin(a) * R * 1.12);
      cx.lineTo(Math.cos(a) * R * (long + Math.sin(t + i) * .05), Math.sin(a) * R * (long + Math.sin(t + i) * .05));
      cx.strokeStyle = i % 2 ? 'rgba(143,209,138,.45)' : 'rgba(240,194,94,.7)'; cx.lineWidth = i % 2 ? 1.5 : 2.4; cx.lineCap = 'round'; cx.stroke();
    }
    cx.restore();
    g = cx.createRadialGradient(sx - R * .3, sy - R * .3, R * .1, sx, sy, R);
    g.addColorStop(0, '#fff6dc'); g.addColorStop(.6, '#f5cf73'); g.addColorStop(1, '#e09a3a');
    cx.beginPath(); cx.arc(sx, sy, R, 0, 6.283); cx.fillStyle = g; cx.fill();
    // orbiting leaves
    for (let i = 0; i < 6; i++) {
      const a = -t * .18 + i / 6 * 6.283, rr = R * 2.05;
      cx.save(); cx.translate(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); cx.rotate(a + 1.57);
      cx.beginPath(); cx.moveTo(0, -9); cx.quadraticCurveTo(8, 0, 0, 9); cx.quadraticCurveTo(-8, 0, 0, -9); cx.fillStyle = 'rgba(143,209,138,.8)'; cx.fill(); cx.restore();
    }
    // hills
    hills(H * .78 + my * 10, 22, .004, t * .05 + mx, 'rgba(20,38,30,.9)');
    hills(H * .85 + my * 18, 18, .006, t * .07 + 2 + mx * 2, 'rgba(14,26,21,.96)');
    hills(H * .92 + my * 26, 12, .009, 4 + mx * 3, '#0a0f0d');
    // pollen
    for (const p of pollen) {
      p.y -= p.s / H * 2.4; p.x += Math.sin(t + p.p) * .0003; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
      cx.beginPath(); cx.arc(p.x * W + mx * 40 * p.r, p.y * H, p.r, 0, 6.283);
      cx.fillStyle = `rgba(255,230,160,${.25 + .4 * Math.sin(t * 2 + p.p) ** 2})`; cx.fill();
    }
  }
  frame();
})();

/* ───── hook: collapse ↔ bloom skyline ───── */
(function skyline() {
  if (!$('#skyline')) return;
  const svg = $('#skyline'), input = $('#bloom'), hook = $('#hook');
  svg.innerHTML = `
  <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop id="sk0" offset="0"/><stop id="sk1" offset="1"/></linearGradient>
  <radialGradient id="sunG"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#f0b649"/></radialGradient><filter id="neon" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="cone"><stop offset="0" stop-color="#ff2f4a" stop-opacity=".45"/><stop offset="1" stop-color="#ff2f4a" stop-opacity="0"/></radialGradient></defs>
  <style>.flk{animation:flk 3.2s infinite steps(1)}.flk2{animation:flk 4.7s .8s infinite steps(1)}@keyframes flk{0%,100%{opacity:1}7%{opacity:.25}9%{opacity:1}52%{opacity:.4}53%{opacity:1}}.blink{animation:blink 1.1s infinite}@keyframes blink{50%{opacity:.1}}.scan{animation:scan 5s ease-in-out infinite alternate}@keyframes scan{from{transform:rotate(-22deg)}to{transform:rotate(26deg)}}.bob{animation:bob 2.6s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-8px)}}.walk{animation:walk 14s linear infinite}@keyframes walk{from{transform:translateX(-40px)}to{transform:translateX(640px)}}.walk2{animation:walk 19s -7s linear infinite reverse}.rain{animation:rain .6s linear infinite}.puff{animation:puff 4s ease-out infinite}@keyframes puff{0%{transform:translateY(0) scale(.6);opacity:.8}100%{transform:translateY(-60px) scale(1.8);opacity:0}}.flare{animation:flare .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}@keyframes flare{to{transform:scaleY(1.35)}}.drive{animation:drive 9s linear infinite}@keyframes drive{from{transform:translateX(-120px)}to{transform:translateX(620px)}}.driveR{animation:driveR 11s linear infinite}@keyframes driveR{from{transform:translateX(620px)}to{transform:translateX(-120px)}}.bullet{animation:bullet 7s cubic-bezier(.5,0,.5,1) infinite}@keyframes bullet{0%{transform:translateX(-420px)}55%,100%{transform:translateX(700px)}}.stroll{animation:stroll 22s linear infinite}@keyframes stroll{from{transform:translateX(-60px)}to{transform:translateX(640px)}}.strollR{animation:strollR 26s -9s linear infinite}@keyframes strollR{from{transform:translateX(640px)}to{transform:translateX(-60px)}}.sway{animation:sway 2.4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}@keyframes sway{to{transform:rotate(3deg)}}@keyframes rain{to{transform:translate(-14px,40px)}}</style>
  <rect width="600" height="420" fill="url(#sk)"/>
  <circle id="sSun" cx="430" cy="300" r="46" fill="url(#sunG)"/>
  <g id="sBirds" fill="none" stroke="#2f5a47" stroke-width="2.5" stroke-linecap="round"><path d="M90 90 q9 -9 18 0 q9 -9 18 0"/><path d="M140 120 q7 -7 14 0 q7 -7 14 0"/></g>
  <g id="sTurb"><line x1="520" y1="150" x2="520" y2="300" stroke="#f5efdf" stroke-width="5"/><g id="sBlade"><rect x="517" y="90" width="6" height="60" rx="3" fill="#f5efdf"/><rect x="517" y="90" width="6" height="60" rx="3" fill="#f5efdf" transform="rotate(120 520 150)"/><rect x="517" y="90" width="6" height="60" rx="3" fill="#f5efdf" transform="rotate(240 520 150)"/></g></g>
  <g id="sStacks"><g><rect x="100" y="110" width="16" height="230" fill="#2a2430"/><rect x="98" y="110" width="20" height="6" fill="#3a3340"/><rect x="100" y="130" width="16" height="3" fill="#ff5a3a" opacity=".6"/><path class="flare" d="M108 110 q-7 -10 0 -24 q7 14 0 24z" fill="#ff8a2a" filter="url(#neon)" style="animation-delay:0s"/><circle class="puff" cx="108" cy="105" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:0.0s"/><circle class="puff" cx="108" cy="105" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:1.3s"/><circle class="puff" cx="108" cy="105" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:2.6s"/></g><g><rect x="286" y="90" width="16" height="250" fill="#2a2430"/><rect x="284" y="90" width="20" height="6" fill="#3a3340"/><rect x="286" y="110" width="16" height="3" fill="#ff5a3a" opacity=".6"/><path class="flare" d="M294 90 q-7 -10 0 -24 q7 14 0 24z" fill="#ff8a2a" filter="url(#neon)" style="animation-delay:0.7s"/><circle class="puff" cx="294" cy="85" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:0.7s"/><circle class="puff" cx="294" cy="85" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:2.0s"/><circle class="puff" cx="294" cy="85" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:3.3s"/></g><g><rect x="392" y="125" width="16" height="215" fill="#2a2430"/><rect x="390" y="125" width="20" height="6" fill="#3a3340"/><rect x="392" y="145" width="16" height="3" fill="#ff5a3a" opacity=".6"/><path class="flare" d="M400 125 q-7 -10 0 -24 q7 14 0 24z" fill="#ff8a2a" filter="url(#neon)" style="animation-delay:1.4s"/><circle class="puff" cx="400" cy="120" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:1.4s"/><circle class="puff" cx="400" cy="120" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:2.7s"/><circle class="puff" cx="400" cy="120" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:4.0s"/></g><g><rect x="552" y="100" width="16" height="240" fill="#2a2430"/><rect x="550" y="100" width="20" height="6" fill="#3a3340"/><rect x="552" y="120" width="16" height="3" fill="#ff5a3a" opacity=".6"/><path class="flare" d="M560 100 q-7 -10 0 -24 q7 14 0 24z" fill="#ff8a2a" filter="url(#neon)" style="animation-delay:0.3s"/><circle class="puff" cx="560" cy="95" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:0.3s"/><circle class="puff" cx="560" cy="95" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:1.6s"/><circle class="puff" cx="560" cy="95" r="12" fill="#4a3a4e" style="transform-box:fill-box;transform-origin:center;animation-delay:2.9s"/></g></g><g id="sBld"></g><g id="sWin"></g><g id="sCyber">
    <g class="rain" stroke="#9ad7ff" stroke-opacity=".28" stroke-width="1">${[...Array(46)].map((_, i) => `<line x1="${(i * 53) % 620}" y1="${(i * 97) % 380 - 40}" x2="${(i * 53) % 620 - 7}" y2="${(i * 97) % 380 - 20}"/>`).join('')}</g>
    <g filter="url(#neon)">
      <g class="flk"><rect x="118" y="218" width="22" height="94" rx="4" fill="#1a0820" stroke="#ff3fa4" stroke-width="2.5"/><text x="129" y="238" fill="#ff3fa4" font-family="Goldman,Arial Black,sans-serif" font-weight="700" font-size="14" text-anchor="middle">$</text><text x="129" y="259" fill="#ff3fa4" font-family="Goldman,Arial Black,sans-serif" font-weight="700" font-size="14" text-anchor="middle">%</text><text x="129" y="280" fill="#ff3fa4" font-family="Goldman,Arial Black,sans-serif" font-weight="700" font-size="14" text-anchor="middle">&amp;</text><text x="129" y="301" fill="#ff3fa4" font-family="Goldman,Arial Black,sans-serif" font-weight="700" font-size="14" text-anchor="middle">!</text></g>
      
      
      
      
    </g>
    <g transform="translate(475 236) scale(.62)"><rect x="-80" y="-34" width="160" height="68" rx="8" fill="#0b0618" stroke="#ff2f4a" stroke-opacity=".6"/><path d="M-50 0 Q0 -30 50 0 Q0 30 -50 0z" fill="#16061a" stroke="#ff2f4a" stroke-width="2" filter="url(#neon)"/><circle r="13" fill="#ff2f4a" filter="url(#neon)"/><circle r="5" fill="#16061a"/><text y="27" fill="#ff8a9a" font-family="Goldman,Arial,sans-serif" font-size="9" letter-spacing="3" text-anchor="middle">WE SEE YOU</text></g>
    <g><line x1="398" y1="300" x2="398" y2="362" stroke="#3a3540" stroke-width="4"/><g style="transform-origin:398px 300px" class="scan"><path d="M398 300 L340 362 L410 362z" fill="url(#cone)"/><rect x="386" y="292" width="26" height="12" rx="3" fill="#55505c"/><circle cx="388" cy="298" r="3" fill="#ff2f4a" class="blink"/></g></g>
    <g><line x1="40" y1="300" x2="40" y2="362" stroke="#3a3540" stroke-width="4"/><g style="transform-origin:40px 300px;animation-delay:-2s" class="scan"><path d="M40 300 L20 362 L90 362z" fill="url(#cone)"/><rect x="28" y="292" width="26" height="12" rx="3" fill="#55505c"/><circle cx="50" cy="298" r="3" fill="#ff2f4a" class="blink"/></g></g>
    <g class="bob"><rect x="330" y="150" width="34" height="8" rx="4" fill="#2b2733"/><line x1="322" y1="148" x2="372" y2="148" stroke="#6f6a78" stroke-width="2"/><circle cx="347" cy="162" r="5" fill="#ff2f4a" filter="url(#neon)" class="blink"/></g>
    <g class="bob" style="animation-delay:-1.2s"><rect x="80" y="176" width="30" height="7" rx="3.5" fill="#2b2733"/><line x1="73" y1="174" x2="117" y2="174" stroke="#6f6a78" stroke-width="2"/><circle cx="95" cy="187" r="4" fill="#33e6ff" filter="url(#neon)"/></g>
  </g><g id="sPanels"></g><g id="sTrees"></g>
  <g id="sSmog"><ellipse cx="160" cy="150" rx="200" ry="40" fill="#4a2a55"/><ellipse cx="420" cy="60" rx="230" ry="40" fill="#3e2550"/><ellipse cx="300" cy="200" rx="260" ry="26" fill="#55304f"/></g>
  <rect y="360" width="600" height="60" id="sRoad"/>
  <g id="sCars"><g class="drive"><g><rect x="0" y="378" width="58" height="20" rx="7" fill="#5a1f1f"/><rect x="10" y="369" width="34" height="11" rx="5" fill="#5a1f1f"/><circle cx="56" cy="387" r="3" fill="#fff3b0" filter="url(#neon)"/><circle cx="2" cy="387" r="2.5" fill="#ff2f4a"/></g><g><rect x="-160" y="378" width="58" height="20" rx="7" fill="#3c3f44"/><rect x="-150" y="369" width="34" height="11" rx="5" fill="#3c3f44"/><circle cx="-104" cy="387" r="3" fill="#fff3b0" filter="url(#neon)"/><circle cx="-158" cy="387" r="2.5" fill="#ff2f4a"/></g><g><rect x="-320" y="378" width="58" height="20" rx="7" fill="#45403a"/><rect x="-310" y="369" width="34" height="11" rx="5" fill="#45403a"/><circle cx="-264" cy="387" r="3" fill="#fff3b0" filter="url(#neon)"/><circle cx="-318" cy="387" r="2.5" fill="#ff2f4a"/></g></g><g class="driveR" style="transform-box:view-box"><g><rect x="0" y="398" width="58" height="20" rx="7" fill="#2f3a40"/><rect x="10" y="389" width="34" height="11" rx="5" fill="#2f3a40"/><circle cx="2" cy="407" r="3" fill="#fff3b0" filter="url(#neon)"/><circle cx="2" cy="407" r="2.5" fill="#ff2f4a"/></g><g><rect x="150" y="398" width="58" height="20" rx="7" fill="#4a2a2a"/><rect x="160" y="389" width="34" height="11" rx="5" fill="#4a2a2a"/><circle cx="206" cy="407" r="3" fill="#fff3b0" filter="url(#neon)"/><circle cx="152" cy="407" r="2.5" fill="#ff2f4a"/></g><g><rect x="300" y="398" width="58" height="20" rx="7" fill="#3a3a46"/><rect x="310" y="389" width="34" height="11" rx="5" fill="#3a3a46"/><circle cx="356" cy="407" r="3" fill="#fff3b0" filter="url(#neon)"/><circle cx="302" cy="407" r="2.5" fill="#ff2f4a"/></g></g></g>
  <g id="sTrain"><rect x="0" y="404" width="600" height="4" fill="#2f5a47"/><rect x="0" y="408" width="600" height="2" fill="#c9b98d"/>
    <g class="bullet"><path d="M0 372 H300 Q352 372 376 402 H0z" fill="#fbf8ee"/><rect x="0" y="392" width="360" height="4" fill="#f0c25e"/><g fill="#2f5a47">${[0,1,2,3,4,5,6,7,8].map(i=>`<rect x="${12+i*34}" y="378" width="22" height="9" rx="2"/>`).join('')}</g><path d="M322 377 Q346 380 360 396 H322z" fill="#2f5a47"/></g></g>
  <g id="sBots"><g class="walk"><rect x="0" y="322" width="22" height="26" rx="4" fill="#4a4652"/><rect x="2" y="306" width="18" height="16" rx="3" fill="#5a5662"/><rect x="4" y="311" width="14" height="4" rx="2" fill="#ff2f4a" filter="url(#neon)"/><rect x="3" y="348" width="6" height="12" fill="#3a3640"/><rect x="13" y="348" width="6" height="12" fill="#3a3640"/></g>
  <g class="walk2"><rect x="0" y="326" width="20" height="22" rx="4" fill="#3f3b47"/><rect x="2" y="312" width="16" height="14" rx="3" fill="#514d59"/><rect x="4" y="317" width="12" height="3" rx="1.5" fill="#33e6ff" filter="url(#neon)"/><rect x="3" y="348" width="5" height="12" fill="#3a3640"/><rect x="12" y="348" width="5" height="12" fill="#3a3640"/></g></g>
  <g id="sPeople"><g transform="translate(0 -124.6) scale(1.35)"><g class="stroll"><g><circle cx="0" cy="323" r="4" fill="#f2d3b0"/><path d="M-5 356 l2 -14 h6 l2 14z" fill="#ef8a72"/><rect x="-3" y="327" width="6" height="9" rx="2" fill="#ef8a72"/></g><g><circle cx="12" cy="323" r="4" fill="#f2d3b0"/><path d="M7 356 l2 -14 h6 l2 14z" fill="#5fc0a0"/><rect x="9" y="327" width="6" height="9" rx="2" fill="#5fc0a0"/></g><path d="M3 334 q3 3 6 0" stroke="#f2d3b0" stroke-width="2" fill="none"/></g><g class="strollR"><g><circle cx="0" cy="323" r="4" fill="#f2d3b0"/><path d="M-5 356 l2 -14 h6 l2 14z" fill="#f0c25e"/><rect x="-3" y="327" width="6" height="9" rx="2" fill="#f0c25e"/></g><g><circle cx="11" cy="326.5" r="3.0" fill="#f2d3b0"/><path d="M7.25 356 l1.5 -10.5 h4.5 l1.5 10.5z" fill="#7fa3f0"/><rect x="8.75" y="329.5" width="4.5" height="6.75" rx="1.5" fill="#7fa3f0"/></g><line x1="11" y1="322" x2="15" y2="298" stroke="#c9b98d"/><circle cx="15" cy="294" r="6" fill="#ef8a72"/></g><g transform="translate(300 0)"><g><circle cx="0" cy="323" r="4" fill="#f2d3b0"/><path d="M-5 356 l2 -14 h6 l2 14z" fill="#b56bff"/><rect x="-3" y="327" width="6" height="9" rx="2" fill="#b56bff"/></g><g><circle cx="13" cy="323" r="4" fill="#f2d3b0"/><path d="M8 356 l2 -14 h6 l2 14z" fill="#ef8a72"/><rect x="10" y="327" width="6" height="9" rx="2" fill="#ef8a72"/></g><g><circle cx="26" cy="323" r="4" fill="#f2d3b0"/><path d="M21 356 l2 -14 h6 l2 14z" fill="#5fc0a0"/><rect x="23" y="327" width="6" height="9" rx="2" fill="#5fc0a0"/></g><path d="M8 312 h12 a3 3 0 0 1 0 6 h-4 l-2 3 v-3 h-6 a3 3 0 0 1 0 -6z" fill="#fbf8ee" class="sway"/></g><g transform="translate(470 0)"><rect x="-4" y="343" width="40" height="5" rx="2" fill="#5a4630"/><rect x="-2" y="348" width="3" height="8" fill="#5a4630"/><rect x="31" y="348" width="3" height="8" fill="#5a4630"/><g><circle cx="6" cy="324.4" r="3.6" fill="#f2d3b0"/><path d="M1.5 346 l1.8 -12.6 h5.4 l1.8 12.6z" fill="#7fa3f0"/><rect x="3.3" y="328.0" width="5.4" height="8.1" rx="1.8" fill="#7fa3f0"/></g><g><circle cx="24" cy="324.4" r="3.6" fill="#f2d3b0"/><path d="M19.5 346 l1.8 -12.6 h5.4 l1.8 12.6z" fill="#f0c25e"/><rect x="21.3" y="328.0" width="5.4" height="8.1" rx="1.8" fill="#f0c25e"/></g></g><g class="stroll" style="animation-duration:12s;animation-delay:-4s"><g stroke="#17322a" stroke-width="2" fill="none"><circle cx="0" cy="352" r="7"/><circle cx="22" cy="352" r="7"/><path d="M0 352 l10 -10 l12 10 M10 342 l3 -6"/></g><circle cx="11" cy="322" r="4" fill="#f2d3b0"/><rect x="8" y="326" width="7" height="12" rx="2" fill="#ef8a72"/></g></g></g>
  </g>`;
  const blds = [[30, 200, 110, 160], [160, 150, 120, 210], [300, 230, 90, 130], [410, 180, 130, 180]];
  $('#sBld', svg).innerHTML = blds.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${x === 160 ? 60 : 14}"/>`).join('');
  $('#sWin', svg).innerHTML = blds.map(([x, y, w, h]) => { let s = ''; for (let yy = y + 40; yy < y + h - 20; yy += 34) for (let xx = x + 18; xx < x + w - 24; xx += 28) s += `<rect x="${xx}" y="${yy}" width="14" height="20" rx="7"/>`; return s; }).join('');
  $('#sPanels', svg).innerHTML = blds.map(([x, y, w]) => `<rect x="${x + 10}" y="${y - 10}" width="${w - 20}" height="9" rx="2" fill="#5c8da8" transform="skewX(-12)" style="transform-origin:${x}px ${y}px"/>`).join('');
  $('#sTrees', svg).innerHTML = [40, 120, 150, 290, 395, 560, 590].map((x, i) => `<g class="tr" style="transform-origin:${x}px 362px"><rect x="${x - 3}" y="320" width="6" height="42" fill="#3e2f22"/><circle cx="${x}" cy="${310 - (i % 2) * 10}" r="${24 + (i % 3) * 5}" fill="${i % 2 ? '#7fb77e' : '#4e8f5a'}"/></g>`).join('')
    + blds.map(([x, y, w]) => `<g class="tr" style="transform-origin:${x + w / 2}px ${y}px">${[0, 1, 2].map(k => `<circle cx="${x + 20 + k * (w - 40) / 2}" cy="${y - 4}" r="12" fill="#8fd18a"/>`).join('')}</g>`).join('');
  let blade = 0, cur = .5, target = .5;
  // 0 = collapse (cyberpunk), .5 = now (where we are), 1 = bloom (solarpunk)
  const tri = (c0, c1, c2, t) => t < .5 ? mix(c0, c1, t * 2) : mix(c1, c2, (t - .5) * 2);
  const show = (id, o) => { const g = $('#' + id, svg); g.style.opacity = o; g.style.display = o < .01 ? 'none' : ''; };
  function paint(t) {
    $('#sk0', svg).setAttribute('stop-color', tri('#120a24', '#9aa3a8', '#f7dc98', t));
    $('#sk1', svg).setAttribute('stop-color', tri('#3a1a40', '#cfcabd', '#cfe8d2', t));
    const cyb = clamp((.4 - t) / .3, 0, 1);
    show('sCyber', cyb); show('sBots', cyb);
    show('sStacks', clamp((.78 - t) / .6, 0, 1));
    show('sCars', clamp((.8 - t) / .28, 0, 1));
    const bl = clamp((t - .62) / .25, 0, 1); show('sTrain', bl); show('sPeople', bl);
    const sun = $('#sSun', svg); sun.setAttribute('cy', lerp(330, 110, t)); sun.style.opacity = clamp(t * 1.6 - .4, 0, 1);
    $('#sSmog', svg).style.opacity = clamp((.72 - t) / .72, 0, 1) * .6;
    $('#sSmog', svg).querySelectorAll('ellipse').forEach(el => el.setAttribute('fill', tri('#4a2a55', '#9b9a92', '#9b9a92', t)));
    $$('#sBld rect', svg).forEach((r, i) => r.setAttribute('fill', tri(['#262a28', '#1f2321', '#2c302e', '#232725'][i], ['#5d6266', '#4c5156', '#686c6e', '#565b5f'][i], ['#2f5a47', '#17322a', '#3e7058', '#2b5442'][i], t)));
    $$('#sWin rect', svg).forEach((r, i) => r.setAttribute('fill', tri('#2c2a33', '#8fa2ad', i % 3 ? '#f2c45e' : '#ffe6a6', clamp(t - (t > .5 ? (i % 5) * .03 : 0), 0, 1))));
    $('#sPanels', svg).style.opacity = clamp((t - .6) / .2, 0, 1);
    $$('.tr', svg).forEach((g, i) => { const roof = i >= 7; const k = roof ? clamp((t - .65) / .2, 0, 1) : clamp((t - .28 - i * .025) / .3, 0, 1); g.style.transform = `scale(${k})`; });
    $('#sTurb', svg).style.opacity = clamp((t - .62) / .2, 0, 1);
    $('#sBirds', svg).style.opacity = clamp((t - .7) / .2, 0, 1);
    $('#sRoad', svg).setAttribute('fill', tri('#141316', '#3b3d3f', '#c9b98d', t));
    hook.dataset.state = t < .33 ? 'collapse' : t > .67 ? 'bloom' : 'now';
  }
  let visible = true, running = false;
  function tick() {
    if (!visible) { running = false; return; }
    const moving = Math.abs(target - cur) > 0.0008;
    cur = moving ? cur + (target - cur) * .12 : target; blade += cur * 2;
    $('#sBlade', svg).setAttribute('transform', `rotate(${blade} 520 150)`);
    if (moving || !painted) { paint(cur); painted = true; }
    requestAnimationFrame(tick);
  }
  let painted = false;
  const go = () => { if (!running && visible) { running = true; requestAnimationFrame(tick); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; svg.classList.toggle('paused', !visible); if (visible) go(); }).observe(svg);
  let touched = false;
  input.addEventListener('pointerdown', () => touched = true);
  input.addEventListener('input', e => { if (e.isTrusted) touched = true; target = input.value / 100; go(); });
  paint(.5); go();

})();

/* ───── fuse + layers ───── */
if ($('#fuse')) {
$('#fuseBtn').addEventListener('click', () => $('#fuse').classList.toggle('on'));
$('#fuse .fused').addEventListener('click', () => $('#fuse').classList.remove('on'));
$$('#fuse .half').forEach(h => h.addEventListener('click', () => $('#fuse').classList.add('on')));

const LAYERS = [
  { h: 'Genre', p: 'Speculative fiction set in livable, post-carbon futures. Conflict without collapse: the drama comes from building, repairing and negotiating.', ex: 'e.g. Becky Chambers, A Psalm for the Wild-Built',
    svg: `<svg viewBox="0 0 240 180"><g fill="none" stroke="#f0c25e" stroke-width="2"><path d="M30 40 q45 -14 90 0 v110 q-45 -14 -90 0z" fill="rgba(240,194,94,.08)"/><path d="M120 40 q45 -14 90 0 v110 q-45 -14 -90 0z" fill="rgba(143,209,138,.08)" stroke="#8fd18a"/></g><g stroke="#a7b3a4" stroke-width="1.5">${[60, 75, 90, 105, 120].map(y => `<line x1="45" y1="${y}" x2="105" y2="${y - 4}"/><line x1="135" y1="${y - 4}" x2="195" y2="${y}"/>`).join('')}</g><circle cx="165" cy="30" r="10" fill="#f0c25e"/></svg>` },
  { h: 'Aesthetic', p: 'Art Nouveau curves, stained glass, rooftop gardens, solar sails, handmade textiles. Warm golds, deep greens, lots of daylight.', ex: 'e.g. the green cities of Studio Ghibli',
    svg: `<svg viewBox="0 0 240 180"><path d="M60 170 V80 a60 60 0 0 1 120 0 V170z" fill="rgba(240,194,94,.06)" stroke="#f0c25e" stroke-width="2"/><g stroke="#f0c25e" stroke-width="1.5" fill="none"><path d="M120 20 V170 M60 110 H180 M120 110 q-30 -40 -50 -10 M120 110 q30 -40 50 -10"/></g><g fill-opacity=".55"><path d="M120 22 a58 58 0 0 0 -58 58 v30 h58z" fill="#5fc0a0"/><path d="M120 22 a58 58 0 0 1 58 58 v30 h-58z" fill="#f0c25e"/><rect x="62" y="110" width="58" height="60" fill="#8fd18a"/><rect x="120" y="110" width="58" height="60" fill="#ef8a72"/></g></svg>` },
  { h: 'Movement', p: 'Community energy, mutual aid, repair culture, open-source tools. The layer that makes the other two matter.', ex: 'e.g. solar co-ops, repair cafés, seed libraries',
    svg: `<svg viewBox="0 0 240 180"><g transform="translate(120 95)"><circle r="56" fill="none" stroke="#8fd18a" stroke-dasharray="4 6" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * 6.283; return `<line x1="0" y1="0" x2="${Math.cos(a) * 56}" y2="${Math.sin(a) * 56}" stroke="rgba(240,194,94,.4)"/><circle cx="${Math.cos(a) * 56}" cy="${Math.sin(a) * 56}" r="12" fill="${i % 2 ? '#8fd18a' : '#f0c25e'}"/>`; }).join('')}<circle r="20" fill="#f0c25e"/></g></svg>` },
];
function showLayer(i) {
  $$('.layer-tabs button').forEach((b, k) => b.classList.toggle('on', k === i));
  const L = LAYERS[i], body = $('.layer-body');
  body.innerHTML = `<div class="fadein"><h4>${L.h}</h4><p>${L.p}</p><p class="ex">${L.ex}</p></div><div class="fadein">${L.svg}</div>`;
}
if ($('.layer-body')) {
$$('.layer-tabs button').forEach(b => b.addEventListener('click', () => showLayer(+b.dataset.i)));
showLayer(0);
}
}

/* ───── timeline ───── */
(function timeline() {
  if (!$('#timeline')) return;
  const T = [
    ['2008', 'The word appears', 'A blog post, “From Steampunk to Solarpunk” on Republic of the Bees, is the earliest known use of the word.'],
    ['2012', 'First anthology', 'Brazil publishes Solarpunk: Histórias ecológicas e fantásticas, edited by Gerson Lodi-Ribeiro. The genre starts outside the English-speaking world.'],
    ['2014', 'Manifesto + look', 'Adam Flynn’s “Notes toward a manifesto” gives it politics; Olivia Louise’s Tumblr post sketches the look: Art Nouveau, Ghibli, stained glass.'],
    ['2017', 'Sunvault', 'A major English anthology of solarpunk and eco-speculation brings the genre to a wider readership.'],
    ['2018', 'Going wider', 'Glass and Gardens: Solarpunk Summers is published, and the Brazilian anthology is translated into English.'],
    ['2020s', 'Mainstream', 'Novels, games, architecture and climate activism adopt the label. A Psalm for the Wild-Built (2021) becomes a gateway book.'],
  ];
  const el = $('#timeline'), track = $('.tl-track', el), handle = $('.tl-handle', el), fill = $('.tl-fill', el), years = $('.tl-years', el), card = $('.tl-card', el);
  years.innerHTML = T.map((t, i) => `<button data-i="${i}">${t[0]}</button>`).join('');
  let cur = -1;
  function set(i) {
    if (i === cur) return; cur = i;
    const pct = i / (T.length - 1) * 100;
    handle.style.left = pct + '%'; fill.style.width = pct + '%';
    $$('button', years).forEach((b, k) => b.classList.toggle('on', k === i));
    card.innerHTML = `<div class="fadein"><h4>${T[i][0]} · ${T[i][1]}</h4><p>${T[i][2]}</p></div>`;
  }
  $$('button', years).forEach(b => b.addEventListener('click', () => set(+b.dataset.i)));
  handle.addEventListener('pointerdown', e => {
    handle.setPointerCapture(e.pointerId); handle.classList.add('drag');
    const r = track.getBoundingClientRect();
    const mv = ev => { const p = clamp((ev.clientX - r.left) / r.width, 0, 1); handle.style.left = p * 100 + '%'; fill.style.width = p * 100 + '%'; const i = Math.round(p * (T.length - 1)); if (i !== cur) { cur = -1; set(i); handle.style.left = p * 100 + '%'; fill.style.width = p * 100 + '%'; } };
    const up = () => { handle.classList.remove('drag'); handle.removeEventListener('pointermove', mv); const i = cur; cur = -1; set(i); };
    handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', up, { once: true });
  });
  set(0);
})();

/* ───── cities ───── */
(function cities() {
  if (!$('#cities')) return;
  const C = [
    ['Singapore', '“City in Nature” plan; Supertrees and the Jewel’s rain vortex.', 'Supertree Grove'],
    ['Milan', 'Bosco Verticale: two towers carrying a forest’s worth of trees.', 'Bosco Verticale'],
    ['Bogotá', 'Ciclovía Sundays close major roads to cars; bikes and buses carry the city.', 'Bogota'],
    ['Copenhagen', 'CopenHill: a public ski slope on a waste-to-energy plant.', 'CopenHill'],
    ['Freiburg', 'Vauban: a car-light, solar-roofed neighborhood.', 'Vauban'],
    ['New York', 'The High Line: an old rail viaduct turned into a planted walk.', 'High Line'],
    ['Cornwall', 'The Eden Project: biomes rebuilt inside a spent clay pit.', 'Eden Project'],
    ['Your city next', 'What’s one corner of it that could look like this?', null],
  ];
  // the home page doesn't load the whole moodboard file just for these six photos
  const CITY_PICS = {
    'Supertree Grove': { src: 'images/mood/c182.webp', credit: 'Tim Adams · Wikimedia Commons', license: 'CC BY 3.0' },
    'Bosco Verticale': { src: 'images/mood/m029.webp', credit: 'Kokky92 · Wikimedia Commons', license: 'CC BY-SA 4.0' },
    'Bogota': { src: 'images/mood/m027.webp', credit: 'Verse Lozano · Wikimedia Commons', license: 'CC0' },
    'CopenHill': { src: 'images/mood/m038.webp', credit: 'kallerna · Wikimedia Commons', license: 'CC BY-SA 4.0' },
    'Vauban': { src: 'images/mood/m040.webp', credit: 'Andrewglaser · Wikimedia Commons', license: 'CC BY-SA 3.0' },
    'High Line': { src: 'images/mood/m049.webp', credit: 'GK tramrunner RU · Wikimedia Commons', license: 'CC BY-SA 4.0' },
    'Eden Project': { src: 'images/mood/m043.webp', credit: 'tomyst · Wikimedia Commons', license: 'CC BY 3.0' },
  };
  $('#cities').innerHTML = C.map(([n, d, k]) => {
    const m = k && (MOOD.find(x => x.title.includes(k)) || CITY_PICS[k]);
    return `<button class="city">${m ? `<img loading="lazy" decoding="async" src="${m.src}" alt="${n}">` : ''}<div class="cap"><b>${n}</b><span>${d}${m ? `<small>${m.credit}${m.license ? ' · ' + m.license : ''}</small>` : ''}</span></div></button>`;
  }).join('');
  $$('.city').forEach(c => c.addEventListener('click', () => c.classList.toggle('on')));
})();

/* ───── game tabs ───── */
$$('.game-tabs button').forEach(b => b.addEventListener('click', () => {
  $$('.game-tabs button').forEach(x => x.classList.toggle('on', x === b));
  $$('.game').forEach(g => g.classList.toggle('on', g.id === 'g-' + b.dataset.g));
}));

/* ───── game 1: rewild the block ───── */
(function block() {
  if (!$('#blockSvg')) return;
  const svg = $('#blockSvg'), pop = $('#blockPop'), stage = $('.block-stage');
  const METERS = ['Energy', 'Nature', 'Cool', 'Community'];
  const car = (x, y, c) => `<rect x="${x}" y="${y}" width="58" height="24" rx="8" fill="${c}"/><circle cx="${x + 14}" cy="${y + 24}" r="6" fill="#111"/><circle cx="${x + 44}" cy="${y + 24}" r="6" fill="#111"/>`;
  const tree = (x, y, r, c = '#4e8f5a') => `<rect x="${x - 3}" y="${y}" width="6" height="${r * 1.4}" fill="#4a3626"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x - r * .4}" cy="${y - r * .3}" r="${r * .55}" fill="#7fb77e" opacity=".8"/>`;
  const turbine = (x, y, s, d) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 130 * s}" stroke="#e9e3d0" stroke-width="${4 * s}"/><g style="transform-origin:${x}px ${y}px;animation:spin ${d}s linear infinite">${[0, 120, 240].map(a => `<rect x="${x - 2.5 * s}" y="${y - 58 * s}" width="${5 * s}" height="${58 * s}" rx="${2.5 * s}" fill="#e9e3d0" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="${5 * s}" fill="#f0c25e"/>`;
  const SPOTS = {
    power: { label: 'The power plant', at: [510, 250], opts: [
      { n: 'Coal stack', d: 'Cheap power, dirty air', s: [0, 0, 0, 0], g: `<rect x="450" y="200" width="120" height="130" rx="6" fill="#3a3c3b"/><rect x="470" y="140" width="22" height="70" fill="#4a4c4b"/><rect x="520" y="120" width="22" height="90" fill="#4a4c4b"/><g fill="#7a7d7a" opacity=".8"><circle cx="481" cy="125" r="16"/><circle cx="495" cy="100" r="22"/><circle cx="531" cy="100" r="18"/><circle cx="548" cy="72" r="26"/></g>` },
      { n: 'Wind turbines', d: 'Clean, but owned by a utility far away', s: [3, 1, 1, 1], g: turbine(470, 170, 1, 6) + turbine(545, 150, 1.15, 7) + `<rect x="430" y="318" width="160" height="12" rx="6" fill="#3e7058"/>` },
      { n: 'Community microgrid', d: 'A solar field and battery the neighborhood co-owns', s: [3, 1, 1, 3], g: `<g fill="#5c8da8" stroke="#b9d6e4" stroke-width="1">${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${438 + c * 38}" y="${236 + r * 28}" width="32" height="18" rx="2" transform="skewX(-14)"/>`).join('')).join('')}</g><rect x="560" y="250" width="40" height="70" rx="8" fill="#f0c25e"/><path d="M582 262 l-8 18 h10 l-6 18" stroke="#17322a" stroke-width="3" fill="none"/>` + turbine(470, 170, .8, 5) },
    ] },
    roof: { label: 'The rooftop', at: [195, 185], opts: [
      { n: 'Bare tar roof', d: 'Bakes in the sun', s: [0, 0, 0, 0], g: `<rect x="70" y="190" width="250" height="14" fill="#2b2d2c"/><rect x="110" y="168" width="30" height="22" fill="#3d3f3e"/><rect x="230" y="160" width="20" height="30" fill="#3d3f3e"/>` },
      { n: 'Solar co-op roof', d: 'Tenants share the power and the savings', s: [3, 0, 1, 2], g: `<rect x="70" y="190" width="250" height="14" fill="#2f5a47"/><g fill="#5c8da8" stroke="#cfe3ee" stroke-width="1">${[0, 1, 2, 3, 4].map(i => `<rect x="${85 + i * 46}" y="166" width="38" height="22" rx="2" transform="skewX(-16)"/>`).join('')}</g>` },
      { n: 'Rooftop farm', d: 'Food, shade and bees, less power', s: [1, 3, 2, 2], g: `<rect x="70" y="190" width="250" height="14" fill="#5a4630"/><g>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${88 + i * 31}" cy="${182 - (i % 2) * 5}" r="${12 + (i % 3) * 2}" fill="${i % 3 ? '#7fb77e' : '#4e8f5a'}"/>`).join('')}</g><path d="M250 190 v-34 a20 20 0 0 1 40 0 v34z" fill="rgba(207,232,210,.5)" stroke="#e9f5ea"/><circle cx="110" cy="168" r="4" fill="#f0c25e"/><circle cx="200" cy="162" r="4" fill="#ef8a72"/>` },
    ] },
    facade: { label: 'The tower', at: [780, 280], opts: [
      { n: 'Glass box', d: 'Air-conditioned all year', s: [0, 0, 0, 0], g: `<rect x="680" y="120" width="200" height="320" rx="4" fill="#4b5a63"/><g stroke="#7d8d96" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<line x1="680" y1="${150 + i * 32}" x2="880" y2="${150 + i * 32}"/>`).join('')}${[1, 2, 3, 4].map(i => `<line x1="${680 + i * 40}" y1="120" x2="${680 + i * 40}" y2="440"/>`).join('')}</g>` },
      { n: 'Vertical forest', d: 'Trees on every balcony; cooler, cleaner air', s: [1, 3, 3, 1], g: `<rect x="680" y="120" width="200" height="320" rx="10" fill="#2b4c3e"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(r => [0, 1, 2, 3].map(c => `<circle cx="${700 + c * 52 + (r % 2) * 14}" cy="${140 + r * 38}" r="${13 + ((r + c) % 3) * 3}" fill="${(r + c) % 2 ? '#7fb77e' : '#4e8f5a'}"/>`).join('')).join('')}<g fill="#f2c45e">${[0, 1, 2, 3, 4, 5, 6, 7].map(r => `<rect x="${716 + (r % 2) * 40}" y="${150 + r * 38}" width="10" height="14" rx="5"/>`).join('')}</g>` },
      { n: 'Living wall + mural', d: 'A local artist and a climbing garden', s: [0, 2, 2, 3], g: `<rect x="680" y="120" width="200" height="320" rx="10" fill="#2f3a35"/><path d="M690 430 C700 330 760 360 740 250 S790 150 760 130" stroke="#4e8f5a" stroke-width="26" fill="none" stroke-linecap="round"/><circle cx="820" cy="230" r="44" fill="#f0c25e"/><path d="M780 330 q40 -60 80 0" fill="#ef8a72"/><path d="M770 380 q50 -50 100 0 v50 h-100z" fill="#5fc0a0"/><g fill="#8fd18a">${[0, 1, 2, 3, 4, 5, 6].map(i => `<circle cx="${700 + (i % 2) * 30}" cy="${150 + i * 40}" r="10"/>`).join('')}</g>` },
    ] },
    lot: { label: 'The empty lot', at: [500, 390], opts: [
      { n: 'Parking lot', d: 'Hot asphalt, empty most of the day', s: [0, 0, 0, 0], g: `<rect x="360" y="345" width="280" height="95" fill="#2c2e2d"/><g stroke="#e9e3d0" stroke-width="2" opacity=".5">${[0, 1, 2, 3, 4, 5].map(i => `<line x1="${380 + i * 48}" y1="350" x2="${380 + i * 48}" y2="390"/>`).join('')}</g>${car(390, 362, '#6b2b2b')}${car(486, 362, '#3c4048')}` },
      { n: 'Community garden', d: 'Raised beds, sunflowers, a shared shed', s: [0, 3, 2, 3], g: `<rect x="360" y="345" width="280" height="95" fill="#5a4630"/>${[0, 1, 2].map(i => `<rect x="${375 + i * 90}" y="375" width="75" height="40" rx="6" fill="#3e2f22"/><g fill="#7fb77e">${[0, 1, 2, 3].map(k => `<circle cx="${385 + i * 90 + k * 18}" cy="378" r="8"/>`).join('')}</g>`).join('')}${[0, 1, 2].map(i => `<line x1="${400 + i * 100}" y1="375" x2="${400 + i * 100}" y2="345" stroke="#4e8f5a" stroke-width="3"/><circle cx="${400 + i * 100}" cy="342" r="9" fill="#f0c25e"/><circle cx="${400 + i * 100}" cy="342" r="4" fill="#5a4630"/>`).join('')}` },
      { n: 'Market + repair café', d: 'Saturday stalls; fix it instead of tossing it', s: [1, 1, 1, 3], g: `<rect x="360" y="345" width="280" height="95" fill="#c9b98d"/>${[0, 1, 2].map(i => `<rect x="${372 + i * 90}" y="378" width="76" height="40" fill="#e9e3d0"/><path d="M${368 + i * 90} 378 l8 -22 h68 l8 22z" fill="${['#ef8a72', '#5fc0a0', '#f0c25e'][i]}"/>`).join('')}<path d="M555 395 l14 -14 m-6 -2 l8 8" stroke="#17322a" stroke-width="3"/>` },
    ] },
    street: { label: 'The street', at: [240, 500], opts: [
      { n: '4-lane road', d: 'Fast, loud, and wide', s: [0, 0, 0, 0], g: `<rect y="440" width="1000" height="120" fill="#1e201f"/><g stroke="#e9e3d0" stroke-width="3" stroke-dasharray="26 22" opacity=".5"><line x1="0" y1="470" x2="1000" y2="470"/><line x1="0" y1="500" x2="1000" y2="500"/><line x1="0" y1="530" x2="1000" y2="530"/></g>${car(120, 448, '#6b2b2b')}${car(420, 478, '#45403a')}${car(700, 508, '#3c4048')}${car(860, 448, '#2f3a40')}` },
      { n: 'Bike lanes + tram', d: 'Fewer cars, faster commutes', s: [2, 1, 1, 2], g: `<rect y="440" width="1000" height="120" fill="#c9b98d"/><rect y="448" width="1000" height="22" fill="#4e8f5a"/><rect y="532" width="1000" height="22" fill="#4e8f5a"/><line x1="0" y1="520" x2="1000" y2="520" stroke="#2f5a47" stroke-width="3"/><rect x="300" y="474" width="300" height="44" rx="14" fill="#f0c25e"/><g fill="#2f5a47">${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${318 + i * 46}" y="482" width="32" height="18" rx="4"/>`).join('')}</g><g stroke="#17322a" stroke-width="2" fill="none"><circle cx="120" cy="462" r="7"/><circle cx="142" cy="462" r="7"/><path d="M120 462 l10 -10 l12 10 M130 452 l4 -6"/><circle cx="760" cy="545" r="7"/><circle cx="782" cy="545" r="7"/><path d="M760 545 l10 -10 l12 10"/></g>` },
      { n: 'Green street', d: 'Shade trees, benches, kids playing', s: [1, 3, 3, 3], g: `<rect y="440" width="1000" height="120" fill="#d8c99c"/><path d="M0 500 Q250 470 500 500 T1000 500 V560 H0z" fill="#7fb77e" opacity=".5"/>${[60, 200, 340, 660, 800, 940].map((x, i) => tree(x, 470 + (i % 2) * 14, 20 + (i % 3) * 3)).join('')}<g fill="#17322a"><circle cx="460" cy="488" r="6"/><rect x="455" y="494" width="10" height="22" rx="4"/><circle cx="530" cy="500" r="5"/><rect x="526" y="505" width="8" height="16" rx="3"/></g><rect x="560" y="510" width="60" height="8" rx="3" fill="#5a4630"/>` },
    ] },
  };
  const state = Object.fromEntries(Object.keys(SPOTS).map(k => [k, 0]));
  const MAX = METERS.map((_, m) => Object.values(SPOTS).reduce((a, s) => a + Math.max(...s.opts.map(o => o.s[m])), 0));
  svg.innerHTML = `<style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  <defs><linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop id="bs0" offset="0"/><stop id="bs1" offset="1"/></linearGradient>
  <radialGradient id="bsun"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#f0b649"/></radialGradient></defs>
  <rect width="1000" height="560" fill="url(#bsky)"/><circle id="bSun" cx="880" cy="90" r="48" fill="url(#bsun)"/>
  <path d="M0 330 Q200 270 420 320 T1000 300 V440 H0z" id="bHill"/>
  <rect x="70" y="200" width="250" height="240" rx="6" id="bBody"/><g id="bWins"></g>
  ${Object.keys(SPOTS).map(k => `<g id="sp-${k}" class="swap"></g>`).join('')}
  <rect width="1000" height="560" id="bSmog" fill="#6f736f" pointer-events="none"/>
  <g id="bBirds" fill="none" stroke="#2f5a47" stroke-width="3" stroke-linecap="round" opacity="0"><path d="M120 80 q10 -10 20 0 q10 -10 20 0"/><path d="M180 110 q8 -8 16 0 q8 -8 16 0"/><path d="M640 70 q10 -10 20 0 q10 -10 20 0"/></g>
  ${Object.entries(SPOTS).map(([k, s]) => `<g class="hot" data-k="${k}" tabindex="0" role="button" aria-label="${s.label}"><circle class="ring" cx="${s.at[0]}" cy="${s.at[1]}" r="34" fill="rgba(240,194,94,.001)" pointer-events="all"/><circle class="beacon" cx="${s.at[0]}" cy="${s.at[1]}" r="7"/></g>`).join('')}`;
  $('#bWins', svg).innerHTML = [0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => `<rect x="${92 + c * 46}" y="${222 + r * 42}" width="20" height="26" rx="10"/>`).join('')).join('');
  $('#meters').innerHTML = METERS.map(m => `<div class="meter"><label><span>${m}</span><b>0%</b></label><div class="bar"><i></i></div></div>`).join('');
  function draw(k, fade) {
    const g = $('#sp-' + k, svg), html = SPOTS[k].opts[state[k]].g;
    if (!fade) { g.innerHTML = html; return; }
    g.style.opacity = 0; setTimeout(() => { g.innerHTML = html; g.style.opacity = 1; }, 260);
  }
  function score() {
    const tot = METERS.map((_, m) => Object.entries(SPOTS).reduce((a, [k, s]) => a + s.opts[state[k]].s[m], 0) / MAX[m]);
    $$('.meter').forEach((el, i) => { const p = Math.round(tot[i] * 100); $('b', el).textContent = p + '%'; $('i', el).style.width = p + '%'; el.classList.toggle('full', p >= 70); });
    const avg = tot.reduce((a, b) => a + b) / 4, win = tot.every(v => v >= .7);
    $('#bs0', svg).setAttribute('stop-color', mix('#3d413e', '#f7dc98', avg));
    $('#bs1', svg).setAttribute('stop-color', mix('#5e635e', '#cfe8d2', avg));
    $('#bHill', svg).setAttribute('fill', mix('#2a2e2c', '#3e7058', avg));
    $('#bBody', svg).setAttribute('fill', mix('#2a2d2b', '#2f5a47', avg));
    $$('#bWins rect', svg).forEach((r, i) => r.setAttribute('fill', mix('#3a3e3c', '#f2c45e', clamp(avg * 1.5 - (i % 4) * .1, 0, 1))));
    $('#bSun', svg).style.opacity = .2 + avg * .8; $('#bSmog', svg).style.opacity = (1 - avg) * .32;
    $('#bBirds', svg).style.opacity = win ? 1 : 0;
    const msg = $('#blockMsg');
    msg.classList.toggle('win', win);
    msg.textContent = win ? 'Your block bloomed. ☀' : avg === 0 ? 'Your block is still a gray one.' : avg < .5 ? 'Something’s growing. Keep going.' : 'Almost. Check which meter is still gray.';
  }
  function openPop(k, x, y) {
    const s = SPOTS[k];
    pop.innerHTML = `<h5>${s.label}</h5>` + s.opts.map((o, i) => `<button data-i="${i}" class="${i === state[k] ? 'cur' : ''}">${o.n}<small>${o.d}</small></button>`).join('');
    pop.hidden = false;
    const r = stage.getBoundingClientRect();
    pop.style.left = clamp(x - r.left + 14, 8, r.width - 290) + 'px';
    pop.style.top = clamp(y - r.top - 40, 8, r.height - 230) + 'px';
    $$('button', pop).forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); state[k] = +b.dataset.i; draw(k, true); score(); pop.hidden = true; }));
  }
  $$('.hot', svg).forEach(h => {
    const open = e => { e.stopPropagation(); const b = h.getBoundingClientRect(); openPop(h.dataset.k, e.clientX || b.left + b.width / 2, e.clientY || b.top); };
    h.addEventListener('click', open); h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } });
  });
  document.addEventListener('click', e => { if (!pop.contains(e.target)) pop.hidden = true; });
  $('#blockReset').addEventListener('click', () => { Object.keys(state).forEach(k => { state[k] = 0; draw(k, true); }); score(); });
  Object.keys(SPOTS).forEach(k => draw(k)); score();
})();

/* ───── game 2: punk or greenwash ───── */
(function wash() {
  if (!$('#deck')) return;
  const CARDS = [
    ['Neighbors co-own a rooftop solar array and split the savings.', 'punk', 'Shared ownership is the punk half: the power and the profit stay local.', [['Repowering London: community-owned solar on estate rooftops', 'https://www.repowering.org.uk']]],
    ['A luxury tower wrapped in trees, condos from $4M, built where a public park used to be.', 'wash', 'Looks solarpunk, works against it: it privatizes green space and prices people out.', [['What greenwashing looks like (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['A repair café where volunteers fix toasters, bikes and phones for free.', 'punk', 'Repair keeps things out of landfill and builds skills and community.', [['Repair Café International: find or start one', 'https://www.repaircafe.org/en/']]],
    ['An oil company ad full of sunflowers and wind turbines, while most of its spending stays on drilling.', 'wash', 'Classic greenwash: the imagery points one way, the money points the other.', [['How to spot greenwashing (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['A tool library lends drills and ladders so nobody on the block needs to buy one.', 'punk', 'Sharing beats owning. Fewer things made, more people helped.', [['Library of Things, London', 'https://www.libraryofthings.co.uk']]],
    ['A “carbon neutral” flight offset by protecting a forest that was never at risk.', 'wash', 'Offsets that don’t change anything real are a permission slip, not a solution.', [['The Guardian’s investigation into rainforest offsets', 'https://www.theguardian.com/environment/2023/jan/18/revealed-forest-carbon-offsets-biggest-provider-worthless-verra-aoe']]],
    ['A city tears out a highway and brings a buried stream back to the surface.', 'punk', 'Seoul did this with Cheonggyecheon: cooler air, more life, public space.', [['Cheonggyecheon, Seoul', 'https://en.wikipedia.org/wiki/Cheonggyecheon']]],
    ['A smart fridge that reorders food on its own and is designed to be replaced every three years.', 'wash', 'High tech, low durability. Solarpunk favors repairable, long-lived tools.', [['The right to repair (iFixit)', 'https://www.ifixit.com/Right-to-Repair']]],
    ['An open-source design for a small tractor that farmers can build and fix themselves.', 'punk', 'Open hardware decentralizes who gets to make and repair the machines.', [['Open Source Ecology: Marcin Jakubowski’s open-source tractor and machines', 'https://www.opensourceecology.org'], ['His TED talk', 'https://www.ted.com/talks/marcin_jakubowski_open_sourced_blueprints_for_civilization']]],
    ['A school roof turned into a garden that feeds the cafeteria.', 'punk', 'Food, learning and shade in one place, run by the community that uses it.', [['The Edible Schoolyard Project', 'https://edibleschoolyard.org']]],
    ['Plastic bottles relabeled “eco” because the cap uses a little less plastic.', 'wash', 'A marginal tweak dressed up as a transformation.', [['How to spot greenwashing (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['A “sustainable” fashion line made from a small share of recycled fabric, dropping new styles every week.', 'wash', 'The business model is still overproduction; the label is decoration.', [['Fashion Revolution: who made my clothes?', 'https://www.fashionrevolution.org']]],
    ['A community fridge on the sidewalk where anyone can leave or take food, no questions asked.', 'punk', 'Mutual aid in its simplest form: less waste, more neighbors fed.', [['Community fridges', 'https://en.wikipedia.org/wiki/Community_fridge'], ['Freedge: find or start one', 'https://freedge.org']]],
    ['A library where you check out seeds, grow them, and return seeds from your harvest.', 'punk', 'Seed libraries keep local varieties alive and out of corporate hands.', [['Seed Savers Exchange', 'https://www.seedsavers.org']]],
    ['A volunteer bike shop where you learn to fix your own bike with shared tools.', 'punk', 'Repair plus skill-sharing: the bike gets fixed and so does your confidence.', [['Bicycle cooperatives', 'https://en.wikipedia.org/wiki/Bicycle_cooperative']]],
    ['A city closes the inner streets of whole blocks to through-traffic and fills them with trees, benches and play space.', 'punk', 'Barcelona’s superblocks gave streets back to people.', [['Superblocks', 'https://en.wikipedia.org/wiki/Superblock']]],
    ['A public park planted as a food forest: fruit trees, berries and herbs anyone can pick.', 'punk', 'Shared abundance grown in public space.', [['Beacon Food Forest, Seattle', 'https://beaconfoodforest.org']]],
    ['Neighbors build their own community internet with rooftop antennas, run by volunteers.', 'punk', 'Owning the network is the punk half, applied to the internet.', [['NYC Mesh', 'https://www.nycmesh.net']]],
    ['Residents close their street to cars for a few hours a week so kids can play outside.', 'punk', 'A tiny, grassroots way to reclaim the street.', [['Playing Out', 'https://playingout.net']]],
    ['An offshore wind farm half-owned by thousands of local residents through a cooperative.', 'punk', 'Copenhagen’s Middelgrunden: clean energy with shared ownership.', [['Middelgrunden wind farm', 'https://en.wikipedia.org/wiki/Middelgrunden']]],
    ['A city redesigns parks and plazas to soak up floodwater like a sponge.', 'punk', 'Working with water instead of fighting it: cooler, greener, safer.', [['Sponge cities', 'https://en.wikipedia.org/wiki/Sponge_city']]],
    ['A phone built from modules so you can swap the battery and screen yourself.', 'punk', 'Repairable by design means fewer phones made and thrown away.', [['Fairphone', 'https://www.fairphone.com'], ['Right to repair', 'https://en.wikipedia.org/wiki/Right_to_repair']]],
    ['A website that runs on a small solar panel and goes offline when it’s cloudy.', 'punk', 'Low-tech, honest about its limits, and beautiful anyway.', [['The solar-powered Low-tech Magazine', 'https://solar.lowtechmagazine.com']]],
    ['A brand promises to plant one tree per order while shipping each item in five layers of packaging.', 'wash', 'One good gesture used to cover a wasteful business model.', [['How to spot greenwashing (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['A giant electric pickup marketed as the way to “save the planet,” heavier than most cars on the road.', 'wash', 'Electric helps, but bigger and more stuff isn’t the solarpunk answer. Fewer, smaller, shared.', [['How to spot greenwashing (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['A hotel asks you to reuse your towel “for the planet” and does nothing else differently.', 'wash', 'Shifting a tiny cost onto guests and calling it climate action.', [['How to spot greenwashing (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['Cups labeled “compostable” that only break down in industrial facilities the city doesn’t have.', 'wash', 'If it ends up in landfill anyway, the label is decoration.', [['Bioplastics, explained', 'https://en.wikipedia.org/wiki/Bioplastic']]],
    ['A company pledges “net zero by 2050” with no plan for the next ten years.', 'wash', 'Distant promises without near-term cuts are the most common greenwash of all.', [['UN: what credible net zero means', 'https://www.un.org/en/climatechange/net-zero-coalition']]],
    ['A company bans plastic straws in its offices while growing its private jet fleet.', 'wash', 'A visible small win hiding a much bigger footprint.', [['How to spot greenwashing (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['A new highway gets trees planted along its median after paving over a wetland.', 'wash', 'Decoration can’t replace the ecosystem that was destroyed.', [['How to spot greenwashing (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['A delivery app’s “green option” just ships your order a day later, with no other change.', 'wash', 'Relabeling the same thing with a leaf icon.', [['How to spot greenwashing (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['A gated “solarpunk eco-village” for the ultra-rich, with private security and helicopter access.', 'wash', 'All the look, none of the shared ownership or openness. Solarpunk is for everyone.', [['How to spot greenwashing (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['A festival puts out color-coded recycling bins that all get emptied into the same dumpster.', 'wash', 'Performance of sustainability without the system behind it.', [['How to spot greenwashing (UN)', 'https://www.un.org/en/climatechange/science/climate-issues/greenwashing']]],
    ['A neighborhood skill-share where people teach sewing, canning and electrical basics for free.', 'punk', 'Knowledge as a commons: the most renewable resource there is.', [['Repair Café International', 'https://www.repaircafe.org/en/']]],
  ];
  const deck = $('#deck'), ex = $('#washExplain');
  let order = [], idx = 0, right = 0;
  function start() {
    order = CARDS.map((_, i) => i).map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]).slice(0, 10); idx = 0; right = 0; ex.innerHTML = ''; render();
  }
  function render() {
    deck.innerHTML = '';
    if (idx >= order.length) {
      deck.innerHTML = `<div class="card end"><div><p>${right} of ${order.length}</p><p style="font-size:18px;color:var(--mute);margin:12px 0 22px">${right >= 8 ? 'Sharp eye. You can smell greenwash a mile off.' : right >= 6 ? 'Solid. The renders can be convincing.' : 'Tricky, right? That’s why the punk half matters.'}</p><button class="pill gold" id="washAgain">Play again</button></div></div>`;
      $('#washAgain').addEventListener('click', start); return;
    }
    [idx + 1, idx].forEach((k, j) => {
      if (k >= order.length) return;
      const c = CARDS[order[k]], el = document.createElement('div');
      el.className = 'card' + (j === 0 ? ' under' : '');
      el.innerHTML = `<span class="stamp l">GREENWASH</span><span class="stamp r">PUNK</span><span class="n">Card ${k + 1} of ${order.length}</span><p>${c[0]}</p><span class="n">← greenwash · punk →</span>`;
      deck.appendChild(el);
      if (j === 1) drag(el);
    });
  }
  function decide(dir) {
    const top = deck.lastElementChild; if (!top || top.classList.contains('end')) return;
    const c = CARDS[order[idx]], ok = (dir > 0 ? 'punk' : 'wash') === c[1];
    if (ok) right++;
    ex.innerHTML = `<b class="${ok ? 'ok' : 'no'}">${ok ? 'Yes.' : 'Not quite.'}</b> It’s ${c[1] === 'punk' ? 'solarpunk' : 'greenwash'}. ${c[2]}` + (c[3] ? `<span class="wash-links">${c[3].map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${c[1] === 'punk' ? 'See it for real' : 'Learn more'}: ${l} ↗</a>`).join('')}</span>` : '');
    top.style.transform = `translateX(${dir * 140}%) rotate(${dir * 24}deg)`; top.style.opacity = 0;
    idx++; setTimeout(render, 380);
  }
  function drag(el) {
    let sx = 0, dx = 0;
    el.addEventListener('pointerdown', e => { sx = e.clientX; dx = 0; el.setPointerCapture(e.pointerId); el.classList.add('drag'); });
    el.addEventListener('pointermove', e => {
      if (!el.classList.contains('drag')) return; dx = e.clientX - sx;
      el.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`;
      $('.stamp.r', el).style.opacity = clamp(dx / 120, 0, 1); $('.stamp.l', el).style.opacity = clamp(-dx / 120, 0, 1);
    });
    el.addEventListener('pointerup', () => { el.classList.remove('drag'); if (Math.abs(dx) > 110) decide(Math.sign(dx)); else { el.style.transform = ''; $$('.stamp', el).forEach(s => s.style.opacity = 0); } });
  }
  $('#washL').addEventListener('click', () => decide(-1));
  $('#washR').addEventListener('click', () => decide(1));
  addEventListener('keydown', e => { if (!$('#g-wash').classList.contains('on')) return; const r = $('#g-wash').getBoundingClientRect(); if (r.top > innerHeight || r.bottom < 0) return; if (e.key === 'ArrowLeft') decide(-1); if (e.key === 'ArrowRight') decide(1); });
  start();
})();

/* ───── game 3: sort the aesthetic ───── */
(function sortGame() {
  if (!$('#sortCard')) return;
  const CATS = [
    { k: 'living', n: 'Living architecture', d: 'Buildings and rooms that grow plants', subs: ['green towers', 'green interiors'] },
    { k: 'tree', n: 'Treehouse & organic living', d: 'Homes shaped like, or in, the trees', subs: ['treehouses & organic', 'off-grid'] },
    { k: 'nouveau', n: 'Art Nouveau curves', d: 'Ornament, whiplash lines, natural forms', subs: ['art nouveau & organic'] },
    { k: 'dome', n: 'Domes & biomes', d: 'Eco-futurist enclosed ecosystems', subs: ['eco-futurism'] },
    { k: 'bio', n: 'Biodesign', d: 'Nature’s own patterns as a blueprint', subs: ['biodesign'] },
    { k: 'luna', n: 'Lunarpunk', d: 'Solarpunk’s glowing night side', subs: ['lunarpunk'] },
    { k: 'aero', n: 'Frutiger Aero', d: 'Glossy 2000s tech-meets-nature optimism', subs: ['frutiger aero'] },
    { k: 'city', n: 'Cities in nature', d: 'Real cities rebuilding around green', subs: ['cities'] },
    { k: 'energy', n: 'Community energy', d: 'Sun and wind, shared', subs: ['energy'] },
    { k: 'commons', n: 'Everyday solarpunk', d: 'People growing, mending and sharing together', subs: [] },
  ];
  const byK = Object.fromEntries(CATS.map(c => [c.k, c]));
  const ALL = MOOD.filter(m => m.sort && byK[m.sort]);
  const cats = CATS.filter(c => ALL.some(m => m.sort === c.k));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // a shuffled bag of every example; each round deals the next 10, and it reshuffles once you've seen them all
  const BAG = 'solrpnk.sortBag';
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem(BAG) || '[]').filter(s => ALL.some(m => m.src === s)); } catch {}
  function deal(n) {
    const out = [];
    while (out.length < n) {
      if (!bag.length) bag = shuffle(ALL.map(m => m.src)).filter(s => !out.includes(s));
      const s = bag.shift(), m = ALL.find(x => x.src === s); if (m && !m.dead) out.push(m);
    }
    try { localStorage.setItem(BAG, JSON.stringify(bag)); } catch {}
    return out;
  }
  const card = $('#sortCard'), img = $('img', card), bins = $$('.sort-bin'), msg = $('#sortMsg'), sc = $('#sortScore'), nx = $('#sortNext');
  const rand = a => a[Math.floor(Math.random() * a.length)];
  let rounds = [], r = 0, pts = 0, locked = false;
  function start() {
    rounds = deal(10).map(m => {
      const A = byK[m.sort], B = rand(cats.filter(c => c !== A)), pair = Math.random() < .5 ? [A, B] : [B, A];
      return { m, pair, ans: pair.indexOf(A) };
    });
    r = 0; pts = 0; show();
    // warm the next image so each round appears instantly
  }
  const warm = k => { const R = rounds[k]; if (R) { const i = new Image(); i.decoding = 'async'; i.src = R.m.src; } };
  function show() {
    locked = false; nx.hidden = true; msg.innerHTML = ''; card.className = 'sort-card'; card.style.transform = '';
    bins.forEach(b => b.classList.remove('ok', 'no', 'hover'));
    if (r >= rounds.length) {
      card.classList.add('done'); img.removeAttribute('src');
      bins.forEach(b => { $('b', b).textContent = ''; $('small', b).textContent = ''; b.classList.add('idle'); });
      sc.textContent = `${pts} of ${rounds.length}`;
      msg.innerHTML = pts >= 8 ? 'You’ve got an eye for it.' : pts >= 5 ? 'Nice. The aesthetics overlap a lot, which is part of the fun.' : 'These blur into each other. Wander the wall and try again.';
      nx.textContent = 'Play again'; nx.hidden = false; return;
    }
    const R = rounds[r];
    bins.forEach((b, i) => { b.classList.remove('idle'); $('b', b).textContent = R.pair[i].n; $('small', b).textContent = R.pair[i].d; });
    img.style.opacity = 0; img.onload = () => img.style.opacity = 1; img.onerror = () => { R.m.dead = true; rounds[r] = { ...R, m: deal(1)[0] }; show(); }; img.src = R.m.src; warm(r + 1);
    sc.textContent = `Round ${r + 1} of ${rounds.length} · ${pts} right`;
  }
  function drop(i) {
    if (locked || r >= rounds.length) return; locked = true;
    const R = rounds[r], ok = i === R.ans; if (ok) pts++;
    bins[i].classList.add(ok ? 'ok' : 'no'); if (!ok) bins[R.ans].classList.add('ok');
    const br = bins[R.ans].getBoundingClientRect(), cr = card.getBoundingClientRect();
    card.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1), opacity .5s';
    card.style.transform = `translate(${br.left + br.width / 2 - (cr.left - parseFloat(card.dataset.dx || 0)) - cr.width / 2}px, ${br.top + br.height / 2 - (cr.top - parseFloat(card.dataset.dy || 0)) - cr.height / 2}px) scale(.35)`;
    card.classList.add('in-bin');
    msg.innerHTML = `<b class="${ok ? 'ok' : 'no'}">${ok ? 'Yes.' : 'Not quite.'}</b> That’s <i>${R.pair[R.ans].n}</i>: ${R.m.title}. <small>${R.m.credit}</small>`;
    sc.textContent = `Round ${r + 1} of ${rounds.length} · ${pts} right`;
    nx.textContent = 'Next →'; nx.hidden = false;
  }
  // drag
  let sx = 0, sy = 0, dragging = false;
  card.addEventListener('pointerdown', e => { if (locked || r >= rounds.length) return; dragging = true; sx = e.clientX; sy = e.clientY; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; card.classList.add('drag'); });
  card.addEventListener('pointermove', e => {
    if (!dragging) return; const dx = e.clientX - sx, dy = e.clientY - sy;
    card.dataset.dx = dx; card.dataset.dy = dy; card.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 30}deg)`;
    bins.forEach(b => { const q = b.getBoundingClientRect(); b.classList.toggle('hover', e.clientX > q.left && e.clientX < q.right && e.clientY > q.top && e.clientY < q.bottom); });
  });
  card.addEventListener('pointerup', e => {
    if (!dragging) return; dragging = false; card.classList.remove('drag');
    const hit = bins.findIndex(b => { const q = b.getBoundingClientRect(); return e.clientX > q.left && e.clientX < q.right && e.clientY > q.top && e.clientY < q.bottom; });
    bins.forEach(b => b.classList.remove('hover'));
    if (hit >= 0) drop(hit); else { card.style.transition = 'transform .4s cubic-bezier(.2,.7,.2,1)'; card.style.transform = ''; card.dataset.dx = card.dataset.dy = 0; }
  });
  bins.forEach((b, i) => b.addEventListener('click', () => { card.dataset.dx = card.dataset.dy = 0; drop(i); }));
  nx.addEventListener('click', () => { card.dataset.dx = card.dataset.dy = 0; if (r >= rounds.length) start(); else { r++; show(); } });
  start();
})();

/* ───── flips + discussion ───── */
$$('.flip').forEach(f => f.addEventListener('click', () => f.classList.toggle('on')));
(function discuss() {
  if (!$('#discuss')) return;
  const lis = $$('#discuss li'), btn = $('#discussNext'); let n = 0;
  const step = () => { if (n < lis.length) lis[n++].classList.add('on'); if (n >= lis.length) { btn.textContent = 'Start over'; } };
  btn.addEventListener('click', () => { if (n >= lis.length) { lis.forEach(l => l.classList.remove('on')); n = 0; btn.textContent = 'Reveal next question'; } step(); });
  step();
})();

/* ───── moodboard wall ───── */
(function wall() {
  if (!$('#wall')) return;
  const wallEl = $('#wall'), plane = $('#plane'), mainEl = $('#tagMain'), subEl = $('#tagSub');
  // interleave sources so the wall feels curated, not chunked
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const items = MOOD.map((m, i) => ({ ...m, i, k: rnd() })).sort((a, b) => a.k - b.k);
  const MAIN = [['all', 'All'], ['art', 'Art'], ['reality', 'Reality'], ['board', 'From my board']];
  let main = 'all', sub = null, px = 0, py = 0, vx = 0, vy = 0, PW = 0, PH = 0;
  // every image's size is known up front, so tiles are placed once and never shuffle while loading.
  // Images load only as they come near the view.
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const im = e.target; io.unobserve(im); load(im);
  }), { root: wallEl, rootMargin: '300px' }) : null;
  // Pinterest serves several sizes: let the browser take the small one unless the screen is sharp enough to need more
  const load = im => { if (im.dataset.srcset) { im.sizes = '(max-width: 600px) 170px, 236px'; im.srcset = im.dataset.srcset; } im.src = im.dataset.src; };
  const frag = document.createDocumentFragment();
  const tiles = items.map(m => {
    const t = document.createElement('div'); t.className = 'tile';
    t.innerHTML = `<img alt="${m.title.replace(/"/g, '&quot;')}" draggable="false" decoding="async"><span class="badge">${m.board ? 'my board · ' + m.sub : m.sub}</span><div class="tc"><b>${m.title}</b><span>${m.credit}</span></div>`;
    const im = $('img', t);
    im.onload = () => im.classList.add('ok');
    im.onerror = () => { m.dead = true; t.classList.add('out'); };   // fade the gap out; don't reshuffle everything
    im.dataset.src = m.src;
    if (/i\.pinimg\.com\/474x\//.test(m.src)) im.dataset.srcset = `${m.src.replace('/474x/', '/236x/')} 236w, ${m.src} 474w`;
    if (io) io.observe(im); else load(im);
    t._m = m; frag.appendChild(t); return t;
  });
  plane.appendChild(frag);
  const match = m => !m.dead && (main === 'all' || (main === 'board' ? m.board : m.tag === main)) && (!sub || m.sub === sub);
  function renderTags() {
    mainEl.innerHTML = MAIN.map(([k, l]) => `<button class="${k === main ? 'on' : ''}" data-k="${k}">${l}</button>`).join('');
    const pool = items.filter(m => !m.dead && (main === 'all' || (main === 'board' ? m.board : m.tag === main)));
    const counts = {}; pool.forEach(m => counts[m.sub] = (counts[m.sub] || 0) + 1);
    subEl.innerHTML = main === 'board' ? '' : Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([s, c], i) => `<button class="${s === sub ? 'on' : ''}" data-s="${s}" style="animation-delay:${i * 30}ms">${s}<i>${c}</i></button>`).join('');
    $$('button', mainEl).forEach(b => b.addEventListener('click', () => { main = b.dataset.k; sub = null; renderTags(); layout(true); }));
    $$('button', subEl).forEach(b => b.addEventListener('click', () => { sub = sub === b.dataset.s ? null : b.dataset.s; renderTags(); layout(true); }));
  }
  let laidOut = false;
  function layout(recenter) {
    const vw = wallEl.clientWidth, vh = wallEl.clientHeight;
    if (!laidOut) plane.classList.add('still');   // first placement: no sliding in from the corner
    const vis = tiles.filter(t => match(t._m));
    const colW = vw < 600 ? 170 : 236, gap = vw < 600 ? 10 : 16;   // 236 matches Pinterest's small size exactly
    // aim for a plane wider and taller than the viewport, so there's somewhere to wander
    const area = vis.reduce((a, t) => a + colW * (t._m.h / t._m.w || 1.2) * (colW + gap), 0);
    let cols = Math.max(Math.ceil(vw / (colW + gap)) + 1, Math.round(Math.sqrt(area * 1.5) / (colW + gap)));
    cols = Math.min(cols, Math.max(2, vis.length));
    const hs = Array(cols).fill(0);
    vis.forEach(t => {
      const m = t._m, h = Math.round(clamp(colW * (m.h / m.w || 1.2), colW * .55, colW * 1.9));
      const c = hs.indexOf(Math.min(...hs));
      t._x = c * (colW + gap) + (c % 2 ? 0 : 0); t._y = hs[c] + (c % 2 ? colW * .25 : 0) * (hs[c] === 0 ? 1 : 0);
      t.style.width = colW + 'px'; t.style.height = h + 'px';
      t.style.transform = `translate(${t._x}px,${t._y}px)`; t.classList.remove('out');
      hs[c] = t._y + h + gap;
    });
    tiles.filter(t => !match(t._m)).forEach(t => t.classList.add('out'));
    PW = cols * (colW + gap) - gap; PH = Math.max(...hs) - gap;
    if (recenter) { px = (vw - PW) / 2; py = Math.min(40, (vh - PH) / 2); vx = vy = 0; }
    clampPan(); apply(laidOut);
    if (!laidOut) { laidOut = true; plane.getBoundingClientRect(); requestAnimationFrame(() => requestAnimationFrame(() => plane.classList.remove('still'))); }
  }
  function clampPan() {
    const vw = wallEl.clientWidth, vh = wallEl.clientHeight, m = 60;
    px = PW + 2 * m < vw ? (vw - PW) / 2 : clamp(px, vw - PW - m, m);
    py = PH + 2 * m < vh ? (vh - PH) / 2 : clamp(py, vh - PH - m, m);
  }
  function apply(smooth) { plane.style.transition = smooth ? 'transform .9s cubic-bezier(.2,.7,.2,1)' : 'none'; plane.style.transform = `translate(${px}px,${py}px)`; }
  // drag with inertia
  let down = false, moved = 0, lx = 0, ly = 0, lt = 0, raf = 0;
  wallEl.addEventListener('pointerdown', e => { down = true; moved = 0; lx = e.clientX; ly = e.clientY; lt = performance.now(); vx = vy = 0; cancelAnimationFrame(raf); wallEl.setPointerCapture(e.pointerId); wallEl.classList.add('drag'); });
  wallEl.addEventListener('pointermove', e => {
    if (!down) return; const now = performance.now(), dx = e.clientX - lx, dy = e.clientY - ly, dt = Math.max(1, now - lt);
    moved += Math.abs(dx) + Math.abs(dy); px += dx; py += dy; vx = dx / dt * 16; vy = dy / dt * 16; lx = e.clientX; ly = e.clientY; lt = now;
    clampPan(); apply(false);
  });
  const release = e => {
    if (!down) return; down = false; wallEl.classList.remove('drag');
    if (moved < 6) { const t = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList && x.classList.contains('tile')); if (t) openLB(t._m); return; }
    const glide = () => { vx *= .94; vy *= .94; px += vx; py += vy; clampPan(); apply(false); if (Math.abs(vx) + Math.abs(vy) > .3) raf = requestAnimationFrame(glide); };
    raf = requestAnimationFrame(glide);
  };
  wallEl.addEventListener('pointerup', release); wallEl.addEventListener('pointercancel', () => { down = false; wallEl.classList.remove('drag'); });
  // wheel pans the wall; at the top/bottom edge the page scrolls on
  wallEl.addEventListener('wheel', e => {
    const ox = px, oy = py;
    px -= e.deltaX; py -= e.deltaY; clampPan();
    if (px !== ox || py !== oy) { e.preventDefault(); apply(false); }
  }, { passive: false });
  // only re-lay out when the width really changes (phones resize the height as the address bar moves)
  let lastW = wallEl.clientWidth, rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (Math.abs(wallEl.clientWidth - lastW) > 40) { lastW = wallEl.clientWidth; layout(true); } else { clampPan(); apply(false); } }, 150); });
  // lightbox
  const lb = $('#lightbox');
  function openLB(m) {
    const li = $('img', lb); li.src = m.src; li.alt = m.title;   // show the small one instantly, swap in the big one when it arrives
    if (m.full && m.full !== m.src) { const big = new Image(); big.onload = () => { if (!lb.hidden && li.alt === m.title) li.src = m.full; }; big.src = m.full; }
    $('figcaption b', lb).textContent = m.title;
    $('figcaption span', lb).textContent = m.credit + (m.license ? ' · ' + m.license : '');
    const a = $('figcaption a', lb); a.href = m.page; a.hidden = !m.page;
    lb.hidden = false;
  }
  const closeLB = () => { lb.hidden = true; $('img', lb).src = ''; };
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-x')) closeLB(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLB(); });
  renderTags(); layout(true);
})();

/* ───── voices directory ───── */
(function voices() {
  if (!$('#vGrid') || !window.VOICES) return;
  const V = window.VOICES.map(([name, type, region, country, tags, desc, links, isNew]) => ({ name, type, region, country, tags, desc, links, isNew, hay: [name, type, region, country, desc, ...tags].join(' ').toLowerCase() }));
  const q = $('#vSearch'), grid = $('#vGrid'), cnt = $('#vCount'), typesEl = $('#vTypes'), regsEl = $('#vRegions'), tagsEl = $('#vTags');
  const st = { type: null, region: null, tag: null, q: '' };
  const uniq = k => [...new Set(V.map(v => v[k]))].sort();
  const TYPES = uniq('type'), REGS = uniq('region').filter(r => r !== 'Global').concat('Global');
  const tagCount = {}; V.forEach(v => v.tags.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
  const TAGS = Object.entries(tagCount).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const chips = (el, list, key, label) => {
    el.innerHTML = `<button class="${st[key] ? '' : 'on'}" data-v="">${label}</button>` + list.map(x => `<button class="${st[key] === x ? 'on' : ''}" data-v="${x}">${x}</button>`).join('');
    $$('button', el).forEach(b => b.addEventListener('click', () => { st[key] = b.dataset.v || null; render(); }));
  };
  function render() {
    chips(typesEl, TYPES, 'type', 'All kinds'); chips(regsEl, REGS, 'region', 'Everywhere'); chips(tagsEl, TAGS, 'tag', 'Any tag');
    const words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = V.filter(v => (!st.type || v.type === st.type) && (!st.region || v.region === st.region) && (!st.tag || v.tags.includes(st.tag)) && words.every(w => v.hay.includes(w)));
    cnt.textContent = `${list.length} of ${V.length}`;
    grid.innerHTML = list.length ? list.map((v, i) => `<article class="vcard${v.isNew ? ' new' : ''}" style="animation-delay:${Math.min(i, 20) * 25}ms">
      <div class="vtop"><span class="vtype">${v.type}</span><span class="vplace">${v.country || v.region}</span></div>
      <h4>${v.name}</h4><p>${v.desc}</p>
      <div class="vtags">${v.tags.map(t => `<button data-t="${t}" class="${st.tag === t ? 'on' : ''}">#${t}</button>`).join('')}</div>
      ${v.links.length ? `<div class="links">${v.links.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l} ↗</a>`).join('')}</div>` : ''}
    </article>`).join('') : `<p class="vnone">Nothing matches yet. Try a broader word, or clear a filter.</p>`;
    $$('.vtags button', grid).forEach(b => b.addEventListener('click', () => { st.tag = st.tag === b.dataset.t ? null : b.dataset.t; render(); scrollTo({ top: $('#voices').offsetTop - 20, behavior: 'smooth' }); }));
  }
  q.addEventListener('input', () => { st.q = q.value; render(); });
  $('#vClear').addEventListener('click', () => { Object.assign(st, { type: null, region: null, tag: null, q: '' }); q.value = ''; render(); });
  render();
})();

/* ───── close: plant a seed ───── */
(function garden() {
  if (!$('#garden')) return;
  const sec = $('#close'), svg = $('#garden'); let n = 0;
  const COLS = ['#f0c25e', '#ef8a72', '#9bd3e6', '#e7a0d0', '#fff1c7'];
  function plant(x, y) {
    const r = sec.getBoundingClientRect(), H = r.height, X = x - r.left, Y = clamp(y - r.top, H * .3, H - 40);
    svg.setAttribute('viewBox', `0 0 ${r.width} ${H}`);
    const sway = (Math.random() - .5) * 60, c = COLS[n++ % COLS.length], len = H - Y;
    const g = document.createElementNS(NS, 'g');
    const d = `M${X} ${H} C${X + sway * .3} ${H - len * .4} ${X + sway} ${H - len * .7} ${X + sway * .6} ${Y}`;
    const L = Math.hypot(len, sway) * 1.15;
    g.innerHTML = `<path d="${d}" fill="none" stroke="#5f9b62" stroke-width="3" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L}"><animate attributeName="stroke-dashoffset" to="0" dur="1.6s" fill="freeze" calcMode="spline" keySplines=".2 .7 .2 1" keyTimes="0;1"/></path>`
      + [.35, .55, .75].map((k, i) => { const ly = H - len * k, lx = X + sway * k * .9, s = i % 2 ? 1 : -1; return `<path d="M${lx} ${ly} q${s * 18} -14 ${s * 30} -4 q${-s * 14} 12 ${-s * 30} 4z" fill="#7fb77e" opacity="0" transform-origin="${lx} ${ly}"><animate attributeName="opacity" to=".9" begin="${.5 + i * .25}s" dur=".5s" fill="freeze"/><animateTransform attributeName="transform" type="scale" from="0" to="1" begin="${.5 + i * .25}s" dur=".6s" fill="freeze"/></path>`; }).join('')
      + `<g transform="translate(${X + sway * .6} ${Y})"><g opacity="0">${[0, 1, 2, 3, 4, 5].map(i => `<ellipse rx="6" ry="12" cy="-11" fill="${c}" transform="rotate(${i * 60})"/>`).join('')}<circle r="6" fill="#5a4630"/><animate attributeName="opacity" to="1" begin="1.4s" dur=".6s" fill="freeze"/></g></g>`;
    svg.appendChild(g);
    if (svg.children.length > 40) svg.firstElementChild.remove();
  }
  sec.addEventListener('click', e => { if (e.target.closest('a')) return; plant(e.clientX, e.clientY); });
  new IntersectionObserver(([e], o) => { if (!e.isIntersecting) return; o.disconnect(); const r = sec.getBoundingClientRect(); [.2, .38, .62, .8].forEach((k, i) => setTimeout(() => plant(r.left + r.width * k, r.top + r.height * (.55 + (i % 2) * .12)), i * 350)); }, { threshold: .4 }).observe(sec);
})();

})();
