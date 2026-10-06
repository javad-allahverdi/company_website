import { useEffect, useRef, useState } from "react"; import { Link } from "react-router-dom"; import { usePage } from "../content";

function Net() {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current, x = c.getContext("2d"); let w, h, raf, mx = -999, my = -999; const P = [];
    const size = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; }; size();
    const N = Math.min(70, Math.floor(w / 18));
    for (let i = 0; i < N; i++) P.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4 });
    const mm = e => { const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    window.addEventListener("resize", size); window.addEventListener("mousemove", mm);
    const line = (a, b, col) => { x.strokeStyle = col; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); };
    const loop = () => { x.clearRect(0, 0, w, h);
      for (const p of P) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; x.fillStyle = "#8cd04a"; x.beginPath(); x.arc(p.x, p.y, 2, 0, 7); x.fill(); }
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y); if (d < 130) line(P[i], P[j], `rgba(140,208,74,${(1 - d / 130) * .35})`); }
      for (const p of P) { const d = Math.hypot(p.x - mx, p.y - my); if (d < 160) line(p, { x: mx, y: my }, `rgba(34,211,238,${1 - d / 160})`); }
      raf = requestAnimationFrame(loop); };
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); window.removeEventListener("mousemove", mm); };
  }, []);
  return <canvas ref={ref} className="net" aria-hidden="true"/>;
}

const NP = [[200, 50], [75, 135], [325, 135], [55, 250], [345, 250], [130, 345], [270, 345], [200, 200]];
const A1 = () => (<svg viewBox="0 0 400 400" className="art"><defs><radialGradient id="rg"><stop offset="0" stopColor="#8cd04a" stopOpacity=".5"/><stop offset="1" stopColor="#8cd04a" stopOpacity="0"/></radialGradient></defs>
  <circle cx="200" cy="200" r="195" fill="url(#rg)"/>
  {NP.slice(0, 7).map(([x, y], i) => <g key={i}><line className="dash" x1="200" y1="200" x2={x} y2={y}/><line className="dash" x1={x} y1={y} x2={NP[(i + 1) % 7][0]} y2={NP[(i + 1) % 7][1]}/></g>)}
  {NP.map(([x, y], i) => <circle key={i} className="pulse" style={{ animationDelay: i * .3 + "s" }} cx={x} cy={y} r={i === 7 ? 20 : 10}/>)}</svg>);
const A2 = () => (<svg viewBox="0 0 400 400" className="art"><defs><radialGradient id="hb"><stop offset="0" stopColor="#b6e36b"/><stop offset="1" stopColor="#0a7a35"/></radialGradient></defs>
  {[80, 125, 170].map((r, i) => <g key={r}><circle cx="200" cy="200" r={r} className="ring"/>
    <g className="orb2" style={{ animationDuration: [14, 22, 32][i] + "s", animationDirection: i === 1 ? "reverse" : "normal" }}><circle cx={200 + r} cy="200" r="8" className="dev"/><circle cx={200 - r * .7071} cy={200 + r * .7071} r="6" className="dev c"/></g></g>)}
  <circle cx="200" cy="200" r="40" fill="url(#hb)" className="hub"/><text x="200" y="208" textAnchor="middle" fontSize="22" fill="#04130d" fontWeight="800">IoT</text></svg>);
const A3 = () => (<svg viewBox="0 0 400 400" className="art"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8cd04a"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs>
  {[...Array(6)].map((_, i) => <g key={i} stroke="url(#cg)" strokeWidth="3" opacity=".7"><line x1={120 + i * 32} y1="70" x2={120 + i * 32} y2="110"/><line x1={120 + i * 32} y1="290" x2={120 + i * 32} y2="330"/><line x1="70" y1={120 + i * 32} x2="110" y2={120 + i * 32}/><line x1="290" y1={120 + i * 32} x2="330" y2={120 + i * 32}/></g>)}
  <rect x="105" y="105" width="190" height="190" rx="28" fill="#06200f" stroke="url(#cg)" strokeWidth="4"/>
  <path className="dash" d="M140 250 L180 250 L205 225 L260 225 M140 200 L170 200 L195 175 L260 175 M160 150 L215 150 L240 125" fill="none" stroke="url(#cg)" strokeWidth="3"/>
  {[[140, 250], [260, 225], [140, 200], [260, 175], [160, 150], [240, 125]].map(([x, y], i) => <circle key={i} className="pulse" style={{ animationDelay: i * .4 + "s" }} cx={x} cy={y} r="6"/>)}</svg>);
const ARTS = [A1, A2, A3];
const tech = ["Artificial Intelligence", "Internet of Things", "Cloud", "Big Data", "Cyber Security", "Machine Learning", "Computer Vision", "Edge Computing", "Smart City", "Industry 4.0"];

export default function Home() {
  const h = usePage("home"); const pr = usePage("products"); const [i, setI] = useState(0); const n = h.slides.length;
  useEffect(() => { const t = setTimeout(() => setI(x => (x + 1) % n), 7000); return () => clearTimeout(t); }, [i, n]);
  useEffect(() => { const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { threshold: .15 });
    document.querySelectorAll(".rv").forEach(el => io.observe(el)); return () => io.disconnect(); }, [h]);
  return (<div className="home">
    <section className="hero2"><Net/><div className="grid-bg"/>
      {h.slides.map((s, k) => (<div key={k} className={"s2" + (k === i ? " on" : "")} aria-hidden={k !== i}>
        <div className="txt"><span className="badge"><i/>هوشمند فناوران برتر ایرانیان</span><h1>{s.t}</h1><p>{s.d}</p>
          <div className="btns"><Link to="/panel" className="btn lime">ثبت درخواست</Link><Link to="/about" className="btn ghost">بیشتر بدانید</Link></div></div>
        <div className="vis">{s.img ? <div className="photo"><img src={s.img} alt="" loading="lazy"/></div> : ARTS[k % 3]()}</div></div>))}
      <div className="dots">{h.slides.map((_, k) => <button key={k} aria-label={`اسلاید ${k + 1}`} className={k === i ? "act" : ""} onClick={() => setI(k)}>{k === i && <b key={i}/>}</button>)}</div>
    </section>
    <section className="stats2 rv">{h.stats.map(s => <div key={s.l}><b>{s.n}</b><span>{s.l}</span></div>)}</section>
    <div className="mq" aria-hidden="true"><div>{[...tech, ...tech].map((t, k) => <span key={k}>{t}</span>)}</div></div>
    <section className="sec2"><span className="eyebrow">حوزه‌های فعالیت</span><h2 className="gt">خدمات ما</h2><p className="sub2">راهکارهای هوشمند، متناسب با نیاز شما</p>
      <div className="g3">{h.services.map((s, k) => <article className="gc rv" style={{ transitionDelay: (k % 3) * .1 + "s" }} key={s.t}>
        <span className="num">{(k + 1).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}</span><div className="gi">{s.i}</div><h3>{s.t}</h3><p>{s.d}</p></article>)}</div></section>
    <section className="sec2"><span className="eyebrow">محصولات</span><h2 className="gt">{pr.title}</h2><p className="sub2">{pr.intro}</p>
      <div className="g3">{(pr.items || []).slice(0, 6).map((it, k) => <article className="gc rv" style={{ transitionDelay: (k % 3) * .1 + "s" }} key={it.t || k}>
        {it.img ? <img className="pimg" src={it.img} alt=""/> : <div className="gi">{it.i}</div>}<h3>{it.t}</h3><p>{it.tag || it.d}</p>
        <Link to="/products" className="lnk pmore">مشاهده جزئیات ←</Link></article>)}</div>
      <div className="more"><Link to="/products" className="btn lime">مشاهده همه محصولات</Link></div></section>
    <section className="cta2 rv"><div className="aur"/><h2>{h.cta}</h2><p>کارشناسان ما آماده‌اند تا ایده‌ی شما را به یک راهکار هوشمند تبدیل کنند.</p><Link to="/contact" className="btn lime">با ما تماس بگیرید</Link></section>
  </div>);
}
