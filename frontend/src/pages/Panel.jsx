import { useEffect, useState } from "react"; import { Link } from "react-router-dom"; import api from "../api"; import { defaults } from "../content";
const fa = { open: "باز", pending: "در حال بررسی", closed: "بسته" };
const lbl = { t: "عنوان", d: "توضیح", i: "آیکون", n: "عدد", l: "برچسب", title: "عنوان صفحه", text: "متن", intro: "مقدمه", phone: "تلفن", email: "ایمیل", address: "آدرس", cta: "متن دعوت به اقدام", slides: "اسلایدها", services: "خدمات", stats: "آمار", cards: "کارت‌ها", items: "محصولات", tag: "شعار", features: "ویژگی‌ها", plans: "پلن‌ها", demoUrl: "لینک دمو", buyUrl: "لینک خرید/اشتراک", name: "نام پلن", price: "قیمت", period: "دوره" };
const blank = v => (v == null || typeof v === "string") ? "" : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
function Img({ v, set, k }) {
  const up = async e => { const fd = new FormData(); fd.append("file", e.target.files[0]); const r = await api.post("upload/", fd); set(r.data.url); };
  return <div className="fld"><span>{k === "logo" ? "لوگوی سایت (خالی = لوگوی پیش‌فرض)" : "تصویر اسلاید (اختیاری)"}</span>{v && <img className="pv" src={v} alt=""/>}
    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={up}/>{v && <a className="lnk" onClick={() => set("")}>حذف تصویر</a>}</div>;
}
function Fields({ v, set, k }) {
  if (Array.isArray(v)) return <div className="grp"><h4>{lbl[k] || k}</h4>{v.map((x, n) => <div className="sub-g" key={n}><Fields v={x} set={nv => set(v.map((y, m) => m === n ? nv : y))}/>
    {v.length > 1 && <a className="lnk" onClick={() => set(v.filter((_, m) => m !== n))}>🗑 حذف این مورد</a>}</div>)}
    <button type="button" className="btn sm" onClick={() => set([...v, blank(v[0])])}>+ افزودن</button></div>;
  if (v && typeof v === "object") return <>{Object.entries(v).map(([kk, x]) => <Fields key={kk} k={kk} v={x} set={nv => set({ ...v, [kk]: nv })}/>)}</>;
  if (k === "img" || k === "logo") return <Img v={v} set={set} k={k}/>;
  const L = String(v).length > 60 || k === "text";
  return <label className="fld"><span>{lbl[k] || k}</span>{L ? <textarea rows="4" value={v} onChange={e => set(e.target.value)}/> : <input value={v} onChange={e => set(e.target.value)}/>}</label>;
}
function Thread({ x, kind, user, reload }) {
  const isS = user.perms.includes("tickets");
  const [r, setR] = useState("");
  const send = async () => { if (!r.trim()) return; await api.post(`${kind}/${x.id}/reply/`, { message: r }); setR(""); reload(); };
  const st = async e => { await api.post(`${kind}/${x.id}/status/`, { status: e.target.value }); reload(); };
  return (<div className="card item"><b>{x.subject || x.service}</b>
    {isS ? <select value={x.status} onChange={st}>{Object.entries(fa).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select> : <span className={"st " + x.status}>{fa[x.status]}</span>}
    {isS && <small> — {x.username}</small>}<p>{x.message || x.description}</p>
    {(x.replies || []).map(m => <div key={m.id} className={"rp" + (m.is_staff ? " adm" : "")}><small>{m.is_staff ? "پشتیبانی" : m.username}</small><p>{m.message}</p></div>)}
    {x.status !== "closed" && <div className="rrow"><input placeholder="پاسخ…" value={r} onChange={e => setR(e.target.value)}/><button className="btn sm" onClick={send}>ارسال</button></div>}</div>);
}
function Editor() {
  const [slug, setSlug] = useState("home"); const [d, setD] = useState(null); const [m, setM] = useState("");
  useEffect(() => { setD(null); setM(""); api.get(`pages/${slug}/`).then(r => { const x = { ...defaults[slug], ...r.data }; if (slug === "home") x.slides = x.slides.map(s => ({ img: "", ...s })); setD(x); }); }, [slug]);
  const save = async () => { await api.put(`pages/${slug}/`, d); setM("✓ ذخیره شد"); };
  return (<div><div className="tabs">{[["home", "صفحه اول"], ["products", "محصولات"], ["about", "درباره ما"], ["contact", "تماس با ما"], ["site", "لوگوی سایت"]].map(([s, t]) => <button key={s} className={slug === s ? "act" : ""} onClick={() => setSlug(s)}>{t}</button>)}</div>
    {d && <div className="card"><Fields v={d} set={setD}/><button className="btn" onClick={save}>ذخیره تغییرات</button> <span className="ok">{m}</span></div>}</div>);
}
function Users({ me }) {
  const [list, setList] = useState([]); const [roles, setRoles] = useState([]); const [m, setM] = useState("");
  const [n, setN] = useState({ username: "", password: "", email: "", role: "customer" });
  const load = () => { api.get("users/").then(r => setList(r.data)); api.get("roles/").then(r => setRoles(r.data)); };
  useEffect(() => { load(); }, []);
  const err = e => setM(e.response?.data?.error || "خطا");
  const patch = (id, b) => api.patch(`users/${id}/`, b).then(() => { setM(""); load(); }).catch(err);
  const add = e => { e.preventDefault(); api.post("users/", n).then(() => { setN({ ...n, username: "", password: "", email: "" }); setM(""); load(); }).catch(err); };
  const pw = id => { const p = prompt("رمز جدید:"); if (p) patch(id, { password: p }); };
  return (<div><h2>مدیریت کاربران</h2>
    <form className="card form row" onSubmit={add}><input required placeholder="نام کاربری" value={n.username} onChange={e => setN({ ...n, username: e.target.value })}/>
      <input required type="password" placeholder="رمز عبور" value={n.password} onChange={e => setN({ ...n, password: e.target.value })}/>
      <input type="email" placeholder="ایمیل" value={n.email} onChange={e => setN({ ...n, email: e.target.value })}/>
      <select value={n.role} onChange={e => setN({ ...n, role: e.target.value })}>{roles.map(r => <option key={r.key} value={r.key}>{r.title}</option>)}</select>
      <button className="btn sm">+ کاربر جدید</button></form>
    {m && <p className="err">{m}</p>}
    <div className="card" style={{ overflowX: "auto" }}><table className="tbl"><thead><tr><th>نام کاربری</th><th>ایمیل</th><th>نقش</th><th>وضعیت</th><th></th></tr></thead><tbody>
      {list.map(u => <tr key={u.id}><td>{u.username}</td><td>{u.email}</td>
        <td><select value={u.role} disabled={u.is_superuser || u.username === me.username} onChange={e => patch(u.id, { role: e.target.value })}>{roles.map(r => <option key={r.key} value={r.key}>{r.title}</option>)}</select></td>
        <td><button className={"chip" + (u.is_active ? "" : " off")} disabled={u.is_superuser || u.username === me.username} onClick={() => patch(u.id, { is_active: !u.is_active })}>{u.is_active ? "فعال" : "غیرفعال"}</button></td>
        <td><a className="lnk" onClick={() => pw(u.id)}>تغییر رمز</a></td></tr>)}</tbody></table></div></div>);
}
export default function Panel() {
  const [user, setUser] = useState(null); const [chk, setChk] = useState(!!localStorage.getItem("token"));
  const [mode, setMode] = useState("login"); const [c, setC] = useState({ username: "", password: "" }); const [err, setErr] = useState("");
  const [tab, setTab] = useState("dash"); const [nf, setNf] = useState(false); const go = k => { setTab(k); setNf(false); }; const [data, setData] = useState({ tickets: [], requests: [] }); const [f, setF] = useState({ a: "", b: "" });
  const me = () => api.get("me/").then(r => setUser(r.data)).catch(() => localStorage.removeItem("token")).finally(() => setChk(false));
  const load = () => ["tickets", "requests"].forEach(k => api.get(k + "/").then(r => setData(p => ({ ...p, [k]: r.data }))));
  useEffect(() => { if (chk) me(); }, []); useEffect(() => { if (user) load(); }, [user]);
  const enter = async e => { e.preventDefault(); try { const r = await api.post(mode === "login" ? "login/" : "register/", c);
    localStorage.setItem("token", r.data.token); setErr(""); me(); } catch { setErr("ورود/ثبت‌نام ناموفق بود"); } };
  const add = async e => { e.preventDefault(); await api.post(tab + "/", tab === "tickets" ? { subject: f.a, message: f.b } : { service: f.a, description: f.b }); setF({ a: "", b: "" }); setNf(false); load(); };
  if (chk) return <div className="page">…</div>;
  if (!user) return (<section className="page auth"><div className="card form"><img src="/logo.webp" alt="" width="170"/><h2>{mode === "login" ? "ورود به پنل" : "ثبت‌نام"}</h2>
    <input placeholder="نام کاربری" required onChange={e => setC({ ...c, username: e.target.value })}/><input type="password" placeholder="رمز عبور" required onChange={e => setC({ ...c, password: e.target.value })}/>
    <button className="btn" onClick={enter}>{mode === "login" ? "ورود" : "ثبت‌نام"}</button>
    <a className="lnk" onClick={() => setMode(mode === "login" ? "reg" : "login")}>{mode === "login" ? "حساب ندارید؟ ثبت‌نام" : "ورود به حساب"}</a>{err && <p className="err">{err}</p>}<Link to="/" className="lnk">← بازگشت به سایت</Link></div></section>);
  const pm = k => user.perms.includes(k);
  const items = [["dash", "📊 داشبورد"], ["tickets", "🎫 تیکت‌ها"], ["requests", "📝 درخواست‌ها"], ...(pm("pages") ? [["edit", "✏️ ویرایش صفحات"]] : []), ...(pm("users") ? [["users", "👥 کاربران"]] : [])];
  const list = data[tab] || [];
  return (<div className="shell"><aside className="side"><Link to="/" className="sl-logo"><img src="/logo.webp" alt="" height="44"/></Link><div className="me"><div className="av">{user.username[0].toUpperCase()}</div><b>{user.username}</b><small>{user.role_title}</small></div>
    {items.map(([k, t]) => <button key={k} className={tab === k ? "act" : ""} onClick={() => go(k)}>{t}</button>)}
    <Link to="/" className="sl">🌐 مشاهده سایت</Link><button onClick={() => { localStorage.removeItem("token"); setUser(null); }}>🚪 خروج</button></aside>
    <main className="main">
      {tab === "dash" && <><h2>خوش آمدید {user.username} 👋</h2>
        <div className="grid"><div className="card kpi"><b>{data.tickets.length}</b>تیکت</div><div className="card kpi"><b>{data.requests.length}</b>درخواست</div>
          <div className="card kpi"><b>{[...data.tickets, ...data.requests].filter(x => x.status !== "closed").length}</b>در انتظار پاسخ</div></div>
        <div className="two2">{[["tickets", "🎫 آخرین تیکت‌ها"], ["requests", "📝 آخرین درخواست‌ها"]].map(([k, t]) => <div className="card" key={k}>
          <div className="bar"><h3>{t}</h3><span><a className="lnk" onClick={() => { setTab(k); setNf(true); }}>+ ثبت جدید</a> &nbsp; <a className="lnk" onClick={() => go(k)}>مشاهده همه ←</a></span></div>
          {data[k].length === 0 && <p className="mut">موردی ثبت نشده است.</p>}
          {data[k].slice(0, 5).map(x => <div className="mini" key={x.id} onClick={() => go(k)}><span>{x.subject || x.service}{pm("tickets") && <small> — {x.username}</small>}</span><span className={"st " + x.status}>{fa[x.status]}</span></div>)}</div>)}</div></>}
      {tab === "edit" && <Editor/>}
      {tab === "users" && <Users me={user}/>}
      {(tab === "tickets" || tab === "requests") && <>
        <div className="bar"><h2>{tab === "tickets" ? (pm("tickets") ? "همه‌ی تیکت‌ها" : "تیکت‌های من") : (pm("tickets") ? "همه‌ی درخواست‌ها" : "درخواست‌های من")}</h2>
          <button className="btn sm" onClick={() => setNf(!nf)}>{nf ? "× بستن فرم" : tab === "tickets" ? "+ ثبت تیکت جدید" : "+ ثبت درخواست جدید"}</button></div>
        {nf && <form className="card form" onSubmit={add}>
          <input required placeholder={tab === "tickets" ? "موضوع" : "نوع خدمت"} value={f.a} onChange={e => setF({ ...f, a: e.target.value })}/>
          <textarea required rows="3" placeholder="توضیحات" value={f.b} onChange={e => setF({ ...f, b: e.target.value })}/><button className="btn">ثبت</button></form>}
        {list.length === 0 && <p className="mut">موردی ثبت نشده است.</p>}
        {list.map(x => <Thread key={x.id} x={x} kind={tab} user={user} reload={load}/>)}</>}
    </main></div>);
}
