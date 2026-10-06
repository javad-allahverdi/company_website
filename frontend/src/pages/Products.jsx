import { useEffect } from "react"; import { Link } from "react-router-dom"; import { usePage } from "../content";

export default function Products() {
  const p = usePage("products");
  useEffect(() => { const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { threshold: .15 });
    document.querySelectorAll(".rv").forEach(el => io.observe(el)); return () => io.disconnect(); }, [p]);
  return (<main className="pg"><div className="grid-bg"/><div className="wrap">
    <header className="ph"><span className="eyebrow">محصولات</span><h1 className="gt">{p.title}</h1><p>{p.intro}</p></header>
    <div className="pgrid">
      {(p.items || []).map((it, k) => (
        <article className="pcard rv" style={{ transitionDelay: (k % 3) * .1 + "s" }} key={it.t || k}>
          {it.img ? <img className="pimg" src={it.img} alt=""/> : <div className="gi">{it.i}</div>}
          {it.tag && <span className="ptag">{it.tag}</span>}
          <h2>{it.t}</h2>
          <p className="pd">{it.d}</p>
          {it.features && it.features.length > 0 && (
            <ul className="feats">{it.features.map((f, n) => <li key={n}>{f}</li>)}</ul>
          )}
          {it.plans && it.plans.length > 0 && (
            <div className="plans">{it.plans.map((pl, n) => (
              <div className="plan" key={n}>
                <div className="plan-h"><b>{pl.name}</b><span className="pprice">{pl.price}{pl.period ? ` / ${pl.period}` : ""}</span></div>
                {pl.features && pl.features.length > 0 && <ul>{pl.features.map((f, m) => <li key={m}>{f}</li>)}</ul>}
              </div>))}</div>
          )}
          <div className="pbtns">
            {it.demoUrl && <a className="btn sm lime" href={it.demoUrl} target="_blank" rel="noreferrer">مشاهده دمو</a>}
            {it.buyUrl && <a className="btn sm" href={it.buyUrl} target="_blank" rel="noreferrer">خرید اشتراک</a>}
            {!it.demoUrl && !it.buyUrl && <Link className="btn sm lime" to="/contact">درخواست دمو و مشاوره</Link>}
          </div>
        </article>))}
    </div>
    <section className="cta2"><div className="aur"/>
      <h2>محصول مورد نظرتان را پیدا نکردید؟</h2>
      <p>برای دریافت نسخه‌ی نمایشی، مشاوره یا خرید اشتراک با کارشناسان ما در تماس باشید.</p>
      <Link to="/contact" className="btn lime">تماس با ما</Link></section>
  </div></main>);
}
