/* Bake O'Clock — admin panel. Reads the same localStorage orders the website writes. */
(() => {
  const { Orders } = BOC;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STATUS = [['new', 'New'], ['confirmed', 'Confirmed'], ['baking', 'Baking'], ['ready', 'Ready'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']];
  const label = (s) => (STATUS.find((x) => x[0] === s) || [0, s])[1];
  const rs = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-PK');
  const wa = (n, t) => { let d = String(n).replace(/\D/g, ''); if (d.startsWith('0')) d = '92' + d.slice(1); return `https://wa.me/${d}?text=${encodeURIComponent(t)}`; };
  const fmt = (v, o) => (v ? new Date(v).toLocaleDateString('en-GB', o || { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  let filter = 'all', query = '', lastNew = -1;

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3200);
  }

  /* ---------- Login gate (client-side only: keeps casual visitors out) ---------- */
  const AK = 'boc-admin';
  const sha = async (s) => {
    try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('boc:' + s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
    catch { return 'x' + btoa(unescape(encodeURIComponent('boc:' + s))); }
  };
  const getHash = () => { try { return localStorage.getItem(AK); } catch { return null; } };
  function showLogin() {
    const first = !getHash();
    $('#app').hidden = true; $('#login').hidden = false;
    $('#login-title').textContent = first ? 'Set a passcode' : 'Owner login';
    $('#login-hint').textContent = first ? 'Choose a passcode (at least 4 characters) to protect this panel.' : 'Enter your passcode to see orders.';
    $('#pw2-wrap').hidden = !first;
    $('#login-btn').textContent = first ? 'Save and open' : 'Open admin';
    $('#forgot').hidden = first;
    $('#pw').focus();
  }
  function showApp() { $('#login').hidden = true; $('#app').hidden = false; render(); }
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = $('#pw').value, err = $('#login-err'), stored = getHash();
    err.textContent = '';
    if (!stored) {
      if (pw.length < 4) return (err.textContent = 'Use at least 4 characters.');
      if (pw !== $('#pw2').value) return (err.textContent = 'The two passcodes do not match.');
      try { localStorage.setItem(AK, await sha(pw)); } catch { /* storage unavailable */ }
    } else if ((await sha(pw)) !== stored) return (err.textContent = 'Wrong passcode.');
    sessionStorage.setItem('boc-admin-ok', '1');
    $('#pw').value = ''; $('#pw2').value = '';
    showApp();
  });
  $('#forgot').addEventListener('click', () => {
    if (prompt('This removes the passcode so you can set a new one. Your orders are kept.\nType RESET to continue.') === 'RESET') { localStorage.removeItem(AK); showLogin(); }
  });
  $('#b-lock').addEventListener('click', () => { sessionStorage.removeItem('boc-admin-ok'); showLogin(); });

  /* ---------- List ---------- */
  const dueInfo = (o) => {
    if (!o.date) return '';
    const days = Math.round((new Date(o.date + 'T00:00') - new Date(new Date().toDateString())) / 864e5);
    const open = !['delivered', 'cancelled'].includes(o.status);
    const when = fmt(o.date, { weekday: 'short', day: 'numeric', month: 'short' });
    if (open && days < 0) return `<span class="warn">Overdue · ${when}</span>`;
    if (open && days === 0) return `<span class="warn">Due today</span>`;
    if (open && days === 1) return `<strong>Due tomorrow</strong>`;
    return 'Needed ' + when;
  };
  const summary = (o) => o.items && o.items.length ? o.items.map((i) => `${i.qty} × ${i.name}`).join(', ') : o.custom ? 'Custom cake · ' + (o.custom.event || '') : o.details || '';

  function render() {
    const all = Orders.all();
    const n = (s) => all.filter((o) => o.status === s).length;
    const advance = all.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (Number(o.advance) || 0), 0);
    $('#stats').innerHTML = [
      ['New', n('new'), n('new') > 0], ['In progress', n('confirmed') + n('baking')], ['Ready', n('ready')], ['Delivered', n('delivered')], ['Advance received', rs(advance)],
    ].map(([l, v, hot]) => `<div class="stat${hot ? ' hot' : ''}"><b>${v}</b><span>${l}</span></div>`).join('');
    $('#chips').innerHTML = [['all', 'All', all.length]].concat(STATUS.map(([k, v]) => [k, v, n(k)]))
      .map(([k, v, c]) => `<button class="chip" type="button" data-f="${k}" aria-pressed="${k === filter}">${v} (${c})</button>`).join('');
    const q = query.trim().toLowerCase();
    const rows = all.filter((o) => (filter === 'all' || o.status === filter) && (!q || [o.id, o.name, o.whatsapp, summary(o)].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    $('#list').innerHTML = rows.length ? rows.map((o) => `<button type="button" class="o${o.status === 'new' ? ' is-new' : ''}" data-id="${esc(o.id)}">
      <span class="id">${esc(o.id)}</span><span></span><span class="badge ${esc(o.status)}">${label(o.status)}</span>
      <div><h3>${esc(o.name)}</h3><p>${esc(summary(o))}</p></div><span></span><span class="due">${dueInfo(o)}</span></button>`).join('')
      : `<p class="empty">${all.length ? 'No orders match this filter.' : 'No orders yet. New website orders will appear here.'}</p>`;
    document.title = (n('new') ? `(${n('new')}) ` : '') + 'Orders | Bake O’Clock Admin';
    if (lastNew >= 0 && n('new') > lastNew) toast('New order received');
    lastNew = n('new');
  }

  /* ---------- Order detail ---------- */
  const dlg = $('#dlg');
  function msgFor(o) {
    const t = {
      new: `Hello ${o.name}, this is Bake O’Clock about your order ${o.id}. Please confirm the details and we’ll share the price and advance payment details.`,
      confirmed: `Hello ${o.name}, your order ${o.id} is confirmed. Thank you for choosing Bake O’Clock!`,
      baking: `Hello ${o.name}, your order ${o.id} is being baked.`,
      ready: `Hello ${o.name}, your order ${o.id} is ready${o.method === 'Pickup' ? ' for pickup' : ' and will be delivered soon'}.`,
      delivered: `Hello ${o.name}, thank you for ordering from Bake O’Clock! We hope you enjoyed it.`,
      cancelled: `Hello ${o.name}, your order ${o.id} has been cancelled. Please message us if you’d like to rebook.`,
    };
    return t[o.status] + (o.quote && ['new', 'confirmed'].includes(o.status) ? ` Total: ${rs(o.quote)}${o.advance ? `, advance received: ${rs(o.advance)}` : ''}.` : '');
  }
  function open(id) {
    const o = Orders.all().find((x) => x.id === id);
    if (!o) return;
    const c = o.custom || {};
    const row = (k, v, full) => (v ? `<dt${full ? ' class="full"' : ''}>${k}</dt><dd${full ? ' class="full"' : ''}>${esc(v)}</dd>` : '');
    $('#dlg-body').innerHTML = `<div class="sheet-head"><h2 id="dlg-t">${esc(o.name)}</h2><button class="icon-btn" type="button" data-close aria-label="Close">×</button></div>
      <p class="fine">${esc(o.id)} · placed ${fmt(o.createdAt)} · ${o.type === 'custom' ? 'Custom cake' : o.type === 'menu' ? 'Menu order' : 'Order'}${o.source === 'imported' ? ' · imported' : ''}</p>
      <dl class="d-grid">${row('WhatsApp', o.whatsapp)}${row('Needed on', fmt(o.date, { weekday: 'long', day: 'numeric', month: 'long' }))}${row('Delivery / pickup', o.method)}${row('Address', o.address)}
      ${o.items ? row('Items', summary(o), 1) : ''}${row('Event', c.event)}${row('Size', c.size)}${row('Flavor', c.flavor)}${row('Colors', c.colors)}${row('Design', c.design, 1)}${row('Reference image', c.ref, 1)}${row('Customer notes', o.notes, 1)}</dl>
      <form id="d-form" class="d-edit"><div class="fgrid">
        <div class="field"><label for="d-status">Status</label><select id="d-status">${STATUS.map(([k, v]) => `<option value="${k}"${k === o.status ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="field"><label for="d-quote">Price quoted (Rs.)</label><input id="d-quote" type="number" min="0" inputmode="numeric" value="${esc(o.quote)}"></div>
        <div class="field"><label for="d-adv">Advance received (Rs.)</label><input id="d-adv" type="number" min="0" inputmode="numeric" value="${esc(o.advance)}"></div>
        <div class="field"><label>Balance</label><p id="d-bal" style="margin:.5rem 0 0"></p></div>
        <div class="field full"><label for="d-notes">Your private notes</label><textarea id="d-notes" rows="2">${esc(o.adminNotes)}</textarea></div></div>
        <div class="actions"><button class="btn btn-primary" type="submit">Save</button><a class="btn btn-ghost" id="d-wa" target="_blank" rel="noopener" href="#">Message on WhatsApp</a>
        <button class="btn btn-ghost danger" type="button" id="d-del">Delete</button></div></form>`;
    const bal = () => { const q = Number($('#d-quote').value) || 0, a = Number($('#d-adv').value) || 0; $('#d-bal').textContent = q ? (a >= q ? 'Paid in full' : rs(q - a) + ' remaining') : a ? 'Quote not set yet' : 'Unpaid'; };
    bal();
    $('#d-form').addEventListener('input', bal);
    $('#d-wa').addEventListener('click', (e) => { e.currentTarget.href = wa(o.whatsapp, msgFor({ ...o, status: $('#d-status').value, quote: $('#d-quote').value, advance: $('#d-adv').value })); });
    $('#d-form').addEventListener('submit', (e) => {
      e.preventDefault();
      Orders.update(id, { status: $('#d-status').value, quote: $('#d-quote').value, advance: $('#d-adv').value, adminNotes: $('#d-notes').value.trim() });
      dlg.close(); render(); toast('Order saved');
    });
    $('#d-del').addEventListener('click', () => { if (confirm(`Delete order ${o.id} for ${o.name}? This cannot be undone.`)) { Orders.remove(id); dlg.close(); render(); toast('Order deleted'); } });
    dlg.showModal();
  }

  /* ---------- Import / backup ---------- */
  const imp = $('#imp');
  $('#b-import').addEventListener('click', () => { $('#imp-text').value = ''; $('#imp-err').textContent = ''; imp.showModal(); });
  $('#imp-go').addEventListener('click', () => {
    const found = Orders.decodeAll($('#imp-text').value);
    if (!found.length) return ($('#imp-err').textContent = 'No order code found. Copy the full WhatsApp message, including the line starting BOC1.');
    const added = Orders.merge(found);
    imp.close(); render();
    toast(added ? `${added} order${added > 1 ? 's' : ''} imported` + (found.length > added ? ` (${found.length - added} already existed)` : '') : 'Already in your orders');
  });
  $('#b-export').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(Orders.all(), null, 2)], { type: 'application/json' }));
    a.download = `bake-oclock-orders-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#b-restore').addEventListener('click', () => $('#restore-file').click());
  $('#restore-file').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try { const list = JSON.parse(await f.text()); if (!Array.isArray(list)) throw 0; const n = Orders.merge(list, 'restored'); render(); toast(`${n} order${n === 1 ? '' : 's'} restored`); }
    catch { toast('That file is not a valid backup'); }
  });

  /* ---------- Wiring ---------- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) e.target.closest('dialog').close();
    else if (e.target === dlg || e.target === imp) e.target.close();
    const f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; render(); }
    const o = e.target.closest('.o'); if (o) open(o.dataset.id);
  });
  $('#q').addEventListener('input', (e) => { query = e.target.value; render(); });
  const live = () => { if (!$('#app').hidden && !dlg.open) render(); };
  window.addEventListener('storage', (e) => { if (e.key === Orders.KEY) live(); });
  window.addEventListener('focus', live);
  document.addEventListener('visibilitychange', () => !document.hidden && live());

  if (sessionStorage.getItem('boc-admin-ok') && getHash()) showApp(); else showLogin();
})();
