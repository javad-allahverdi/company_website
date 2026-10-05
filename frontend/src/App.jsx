import { useState, lazy, Suspense } from "react"; import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home"; import api from "./api"; import { usePage } from "./content";
const Panel = lazy(() => import("./pages/Panel"));
const Hero = ({ eyebrow, title, text }) => (<header className="ph"><span className="eyebrow">{eyebrow}</span><h1 className="gt">{title}</h1><p>{text}</p></header>);

function About() { const a = usePage("about");
  return (<main className="pg"><div className="grid-bg"/><div className="wrap">
    <Hero eyebrow="آشنایی با ما" title={a.title} text={a.text}/>
    <div className="g3">{a.cards.map((c, k) => <article className="gc" key={c.t}><span className="num">{(k + 1).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}</span>
      <div className="gi">{["🎯", "🔭", "💎", "🤝", "🚀", "⭐"][k % 6]}</div><h3>{c.t}</h3><p>{c.d}</p></article>)}</div>
    <section className="cta2"><div className="aur"/><h2>آماده‌ی همکاری با شما هستیم</h2><p>ایده‌ی خود را با ما در میان بگذارید تا آن را به راهکاری هوشمند تبدیل کنیم.</p><Link to="/contact" className="btn lime">تماس با ما</Link></section>
  </div></main>); }

function Contact() { const c = usePage("contact");
  const [f, setF] = useState({ name: "", email: "", message: "" }); const [ok, setOk] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const send = async e => { e.preventDefault(); await api.post("contact/", f); setOk(true); setF({ name: "", email: "", message: "" }); };
  return (<main className="pg"><div className="grid-bg"/><div className="wrap">
    <Hero eyebrow="در ارتباط باشید" title={c.title} text={c.intro}/>
    <div className="two">
      <div className="card info">{[["📞", "تلفن", c.phone], ["✉️", "ایمیل", c.email], ["📍", "آدرس", c.address]].map(([i, l, v]) =>
        <div className="ir" key={l}><span className="gi">{i}</span><div><small>{l}</small><p dir="auto">{v}</p></div></div>)}</div>
      <form className="card form" onSubmit={send}>
        <input placeholder="نام" required value={f.name} onChange={set("name")}/><input type="email" placeholder="ایمیل" required value={f.email} onChange={set("email")}/>
        <textarea rows="5" placeholder="پیام شما" required value={f.message} onChange={set("message")}/>
        <button className="btn">ارسال پیام</button>{ok && <p className="ok">پیام شما ارسال شد ✓</p>}</form></div>
  </div></main>); }

export default function App() {
  const site = usePage("site"); const inPanel = useLocation().pathname.startsWith("/panel");
  return (<>
    {!inPanel && <header className="nav"><Link to="/"><img src={site.logo || "/logo.webp"} alt="هوشمند فناوران برتر ایرانیان" height="42"/></Link>
      <nav><NavLink to="/" end>خانه</NavLink><NavLink to="/about">درباره ما</NavLink><NavLink to="/contact">تماس با ما</NavLink><NavLink to="/panel" className="btn sm">پنل کاربری</NavLink></nav></header>}
    <Suspense fallback={<div className="page">در حال بارگذاری…</div>}>
      <Routes><Route path="/" element={<Home/>}/><Route path="/about" element={<About/>}/><Route path="/contact" element={<Contact/>}/><Route path="/panel" element={<Panel/>}/></Routes></Suspense>
    {!inPanel && <footer className="foot">© شرکت هوشمند فناوران برتر ایرانیان</footer>}</>);
}
