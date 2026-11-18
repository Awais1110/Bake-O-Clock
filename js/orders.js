/* Bake O'Clock — order store. localStorage only, no backend or database.
   Website forms call BOC.Orders.add(); admin.html reads the same key. */
window.BOC = window.BOC || {};
BOC.Orders = (() => {
  const KEY = 'boc-orders';
  const all = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
  const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch { return false; } };
  const p2 = (n) => String(n).padStart(2, '0');
  const newId = () => { const d = new Date(); return `BOC-${String(d.getFullYear()).slice(2)}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; };
  const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  const defaults = () => ({ status: 'new', quote: '', advance: '', adminNotes: '', source: 'website' });

  /* The code travels inside the WhatsApp message, so the owner can paste it into the admin panel. */
  const encode = (o) => 'BOC1.' + b64(JSON.stringify({ id: o.id, type: o.type, createdAt: o.createdAt, name: o.name, whatsapp: o.whatsapp, method: o.method, address: o.address, date: o.date, notes: o.notes, items: o.items, custom: o.custom }));
  const decodeAll = (text) => (String(text).match(/BOC1\.[A-Za-z0-9_-]+/g) || []).map((c) => {
    try { const o = JSON.parse(unb64(c.slice(5))); return o && o.id && o.name ? o : null; } catch { return null; }
  }).filter(Boolean);

  function add(o) {
    const order = Object.assign(defaults(), o, { id: newId(), createdAt: new Date().toISOString() });
    const a = all(); a.push(order);
    if (!save(a)) order.unsaved = true;
    return order;
  }
  function merge(list, source = 'imported') {
    const a = all(); let n = 0;
    list.forEach((o) => { if (o && o.id && !a.some((x) => x.id === o.id)) { a.push(Object.assign(defaults(), o, { source: o.source || source })); n++; } });
    save(a);
    return n;
  }
  function update(id, patch) { const a = all(); const o = a.find((x) => x.id === id); if (o) { Object.assign(o, patch); save(a); } return o; }
  function remove(id) { save(all().filter((x) => x.id !== id)); }

  return { KEY, all, add, merge, update, remove, encode, decodeAll };
})();
