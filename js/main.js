/* Bake O'Clock — shared behaviour. Change the WhatsApp number here only. */
(() => {
  const PHONE = '923331311206';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wa = (t) => `https://wa.me/${PHONE}?text=${encodeURIComponent(t)}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function openWA(text) {
    const w = window.open(wa(text), '_blank');
    if (w) w.opener = null;
    return !!w;
  }

  function bindWA(root = document) {
    $$('[data-wa]', root).forEach((a) => {
      a.href = wa(a.dataset.wa);
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  const pad = (n) => String(n).padStart(2, '0');
  function minDate() {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const fmtDate = (v) => new Date(v + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  function setErr(el, msg) {
    const box = document.getElementById(`${el.name || el.id}-err`);
    if (box) box.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }

  function validate(form) {
    let first = null;
    const seen = new Set();
    for (const el of form.elements) {
      if (!el.name || el.type === 'submit' || el.type === 'button' || el.disabled || el.closest('[hidden]')) continue;
      let msg = '';
      const val = (el.value || '').trim();
      if (el.type === 'radio') {
        if (seen.has(el.name)) continue;
        seen.add(el.name);
        if (el.required && !form.querySelector(`input[name="${el.name}"]:checked`)) msg = 'Please choose one option.';
      } else if (el.type === 'checkbox') {
        if (el.required && !el.checked) msg = 'Please tick this box to continue.';
      } else if (!val) {
        if (el.required) msg = 'This field is required.';
      } else {
        const v = el.dataset.v;
        if (v === 'phone') {
          const d = val.replace(/\D/g, '');
          if (d.length < 10 || d.length > 15) msg = 'Enter a valid WhatsApp number, for example 0333 1234567.';
        }
        if (v === 'url') {
          try { if (!/^https?:$/.test(new URL(val).protocol)) throw 0; } catch { msg = 'Enter a full link starting with https://'; }
        }
        if (v === 'date' && val < minDate()) msg = 'Please choose a date at least 2 days from today.';
      }
      setErr(el, msg);
      if (msg && !first) first = el;
    }
    if (first) first.focus();
    return !first;
  }

  function liveClear(form) {
    const clear = (e) => e.target.name && setErr(e.target, '');
    form.addEventListener('input', clear);
    form.addEventListener('change', clear);
    $$('[data-min2]', form).forEach((i) => (i.min = minDate()));
  }

  function bindMethod(form) {
    const addr = $('.addr', form);
    if (!addr) return;
    const area = $('textarea', addr);
    $$('input[type=radio]', form).forEach((r) =>
      r.addEventListener('change', () => {
        const on = r.value === 'Home delivery' && r.checked;
        addr.hidden = !on;
        area.required = on;
        if (!on) setErr(area, '');
      })
    );
  }

  function sent(box, text, id) {
    box.hidden = false;
    box.innerHTML = '';
    const p = document.createElement('p');
    p.innerHTML = (id ? '<strong>Order ' + id + ' noted.</strong> ' : '') + '<strong>Your message is ready in WhatsApp.</strong> Please press send there. Your order is <em>not</em> confirmed until Bake O’Clock replies and your advance payment is received.';
    const pre = document.createElement('pre');
    pre.textContent = text;
    const row = document.createElement('div');
    row.className = 'actions';
    const a = document.createElement('a');
    a.className = 'btn btn-primary btn-sm';
    a.href = wa(text);
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Open WhatsApp again';
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'btn btn-ghost btn-sm';
    c.textContent = 'Copy message';
    c.onclick = async () => {
      try { await navigator.clipboard.writeText(text); c.textContent = 'Copied'; } catch { c.textContent = 'Copy failed'; }
    };
    row.append(a, c);
    box.append(p, pre, row);
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    box.focus();
  }

  window.BOC = { PHONE, $, $$, wa, esc, openWA, bindWA, validate, liveClear, bindMethod, sent, fmtDate };

  /* Images: show a tidy placeholder until a real photo is added to assets/images */
  const ICON = '<svg viewBox="0 0 64 64" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 54h44"/><rect x="14" y="38" width="36" height="16" rx="3"/><rect x="20" y="26" width="24" height="12" rx="3"/><path d="M32 26v-9M14 46c4 3 8-3 12 0s8-3 12 0 8-3 12 0"/><circle cx="32" cy="13" r="2"/></svg>';
  function fallback(im) {
    if (im.dataset.ph) return;
    im.dataset.ph = '1';
    const name = (im.getAttribute('src') || '').split('/').pop();
    const s = document.createElement('span');
    s.className = 'ph';
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', im.alt);
    s.dataset.tone = String(name.length % 3);
    s.innerHTML = ICON + '<small></small>';
    $('small', s).textContent = 'Add photo: ' + name;
    im.replaceWith(s);
  }
  document.addEventListener('error', (e) => { if (e.target instanceof HTMLImageElement) fallback(e.target); }, true);

  document.addEventListener('DOMContentLoaded', () => {
    $$('img').forEach((im) => { if (im.complete && im.naturalWidth === 0) fallback(im); });
    bindWA();
    const yr = $('#yr');
    if (yr) yr.textContent = new Date().getFullYear();

    /* Mobile menu */
    const burger = $('.burger');
    const setNav = (open) => {
      document.body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    burger.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
    $$('#nav a').forEach((a) => a.addEventListener('click', () => setNav(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });
    matchMedia('(min-width:901px)').addEventListener('change', () => setNav(false));

    /* Back to top */
    const top = $('.to-top');
    const onScroll = () => { top.hidden = window.scrollY < 700; };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    /* Reveal on scroll */
    const items = $$('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { threshold: 0.15 });
      items.forEach((i) => io.observe(i));
    } else items.forEach((i) => i.classList.add('in'));

    /* Contact form -> WhatsApp */
    const cf = $('#contact-form');
    if (cf) {
      liveClear(cf);
      cf.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validate(cf)) return;
        const f = new FormData(cf);
        const lines = ['Hello Bake O’Clock!', '', `*Name:* ${f.get('c-name')}`];
        if (f.get('c-whatsapp')) lines.push(`*WhatsApp:* ${f.get('c-whatsapp')}`);
        lines.push(`*Message:* ${f.get('c-message')}`);
        const text = lines.join('\n');
        openWA(text);
        sent($('#contact-status'), text);
      });
    }
  });
})();
