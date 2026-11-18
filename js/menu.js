/* Bake O'Clock — menu page.
   Edit the PRODUCTS list below. Leave price as null to show "Contact for price",
   or set it to a string such as 'Rs. 3,500' once you are ready. */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, esc, openWA, bindWA, validate, liveClear, bindMethod, sent, fmtDate } = BOC;

  const CATEGORIES = [
    ['birthday', 'Birthday Cakes'], ['custom', 'Customized Cakes'], ['chocolate', 'Chocolate Cakes'],
    ['cupcakes', 'Cupcakes'], ['brownies', 'Brownies'], ['dessert-boxes', 'Dessert Boxes'], ['slices', 'Cake Slices'],
  ];

  const PRODUCTS = [
    { id: 'white77-cake-1398937', cat: 'birthday', name: 'Classic Birthday Cake', desc: 'A celebration-ready cake finished with your message and colors.', price: null },
    { id: 'cake (1)', cat: 'birthday', name: 'Floral Buttercream Cake', desc: 'Hand-piped buttercream florals in the colors you choose.', price: null },
    { id: 'cake (2)', cat: 'birthday', name: 'Strawberry Cream Cake', desc: 'Light cream layers with a strawberry finish.', price: null },
    { id: 'cake (3)', cat: 'custom', name: 'Themed Celebration Cake', desc: 'A favorite character, hobby or theme, designed with you.', price: null },
    { id: 'cake (4)', cat: 'custom', name: 'Anniversary Cake', desc: 'An elegant cake to mark a milestone together.', price: null },
    { id: 'cake (5)', cat: 'chocolate', name: 'Chocolate Truffle Cake', desc: 'Rich, deeply chocolatey layers for true chocolate lovers.', price: null },
    { id: 'cake (6)', cat: 'chocolate', name: 'Chocolate Drip Cake', desc: 'A glossy chocolate drip over a soft chocolate cake.', price: null },
    { id: 'cake (2)', cat: 'cupcakes', name: 'Buttercream Cupcakes', desc: 'A box of soft cupcakes with swirled buttercream.', price: null },
    { id: 'cake (3)', cat: 'cupcakes', name: 'Chocolate Cupcakes', desc: 'Chocolate cupcakes boxed for sharing.', price: null },
    { id: 'cake (4)', cat: 'brownies', name: 'Fudgy Brownies', desc: 'Dense, fudgy squares, packed fresh.', price: null },
    { id: 'cake (2)', cat: 'brownies', name: 'Brownie Gift Box', desc: 'Brownies boxed up and ready to give.', price: null },
    { id: 'cake (1)', cat: 'dessert-boxes', name: 'Assorted Dessert Box', desc: 'A little of everything, boxed for sharing.', price: null },
    { id: 'cake (4)', cat: 'dessert-boxes', name: 'Gift Dessert Box', desc: 'Sweet treats boxed and ready to gift.', price: null },
    { id: 'cake (5)', cat: 'slices', name: 'Chocolate Cake Slice', desc: 'A generous slice of chocolate cake.', price: null },
    { id: 'cake (6)', cat: 'slices', name: 'Strawberry Cake Slice', desc: 'A slice of strawberry cream cake.', price: null },
  ];

  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const catName = (c) => CATEGORIES.find((x) => x[0] === c)[1];
  const grid = $('#grid');
  const filters = $('#filters');
  let active = 'all';

  function card(p) {
    const msg = `Hello Bake O’Clock! I’d like to order: ${p.name}. Please share the price and availability.`;
    return `<article class="product">
      <figure class="frame r-45"><img src="assets/images/${p.id}.jpg" alt="${esc(p.name)}" loading="lazy" decoding="async"></figure>
      <div class="p-body">
        <p class="p-cat">${esc(catName(p.cat))}</p>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <p class="price${p.price ? '' : ' empty'}">${p.price ? esc(p.price) : 'Contact for price'}</p>
        <div class="p-actions">
          <a class="btn btn-primary btn-sm" href="#" data-wa="${esc(msg)}">Order on WhatsApp</a>
          <button class="btn btn-ghost btn-sm" type="button" data-add="${p.id}">Add to order</button>
        </div>
      </div></article>`;
  }

  function renderFilters() {
    filters.innerHTML = [['all', 'All']].concat(CATEGORIES)
      .map(([id, label]) => `<button class="chip" type="button" data-cat="${id}" aria-pressed="${id === active}">${label}</button>`).join('');
  }

  function renderGrid() {
    const list = active === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.cat === active);
    grid.innerHTML = list.map(card).join('');
    bindWA(grid);
  }

  function setActive(id, updateHash = true) {
    active = id === 'all' || CATEGORIES.some((c) => c[0] === id) ? id : 'all';
    renderFilters();
    renderGrid();
    if (updateHash) history.replaceState(null, '', active === 'all' ? location.pathname : '#' + active);
  }

  filters.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (b) setActive(b.dataset.cat);
  });
  window.addEventListener('hashchange', () => setActive(location.hash.slice(1), false));

  /* ---------- Order basket ---------- */
  const dlg = $('#basket');
  const list = $('#basket-list');
  const form = $('#basket-form');
  const empty = $('#basket-empty');
  const status = $('#basket-status');
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('boc-cart') || '[]').filter((c) => byId(c.id) && c.qty > 0); } catch { cart = []; }
  const save = () => { try { localStorage.setItem('boc-cart', JSON.stringify(cart)); } catch { /* storage unavailable */ } };

  function renderCart() {
    const n = cart.reduce((s, c) => s + c.qty, 0);
    $('#basket-count').textContent = n;
    empty.hidden = cart.length > 0;
    form.hidden = cart.length === 0;
    list.innerHTML = cart.map((c) => {
      const p = byId(c.id);
      return `<li><span>${esc(p.name)}</span><span class="qty">
        <button type="button" data-q="-1" data-id="${c.id}" aria-label="Remove one ${esc(p.name)}">−</button>
        <output aria-label="Quantity">${c.qty}</output>
        <button type="button" data-q="1" data-id="${c.id}" aria-label="Add one ${esc(p.name)}">+</button></span></li>`;
    }).join('');
  }

  function change(id, d) {
    const c = cart.find((x) => x.id === id);
    if (c) c.qty += d; else if (d > 0) cart.push({ id, qty: 1 });
    cart = cart.filter((x) => x.qty > 0);
    save();
    renderCart();
  }

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    change(b.dataset.add, 1);
    b.textContent = 'Added';
    setTimeout(() => (b.textContent = 'Add to order'), 1200);
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (b) change(b.dataset.id, Number(b.dataset.q));
  });

  const openBasket = () => { status.hidden = true; dlg.showModal(); document.body.classList.add('modal-open'); };
  $('#basket-btn').addEventListener('click', openBasket);
  $('#basket-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => document.body.classList.remove('modal-open'));
  $('#basket-clear').addEventListener('click', () => { cart = []; save(); renderCart(); status.hidden = true; });

  liveClear(form);
  bindMethod(form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cart.length || !validate(form)) return;
    const f = new FormData(form);
    const m = f.get('b-method');
    const order = BOC.Orders.add({
      type: 'menu', name: f.get('b-name').trim(), whatsapp: f.get('b-whatsapp').trim(), method: m,
      address: m === 'Home delivery' ? (f.get('b-address') || '').trim() : '', date: f.get('b-date'),
      notes: (f.get('b-notes') || '').trim(), items: cart.map((c) => ({ name: byId(c.id).name, qty: c.qty })),
    });
    const lines = [
      'Hello Bake O’Clock! I’d like to place an order.', '', `*Order ID:* ${order.id}`, '', '*Items*',
      ...cart.map((c) => `• ${c.qty} × ${byId(c.id).name}`), '',
      `*Name:* ${f.get('b-name')}`,
      `*WhatsApp:* ${f.get('b-whatsapp')}`,
      `*Delivery / pickup:* ${m}${m === 'Home delivery' ? ' – ' + f.get('b-address') : ''}`,
      `*Required date:* ${fmtDate(f.get('b-date'))}`,
    ];
    const notes = (f.get('b-notes') || '').trim();
    if (notes) lines.push(`*Notes:* ${notes}`);
    lines.push('', 'Please confirm availability, price and advance payment details. Thank you!');
    lines.push('', `Order code (for the bakery’s admin panel, please don’t edit): ${BOC.Orders.encode(order)}`);
    const text = lines.join('\n');
    openWA(text);
    sent(status, text, order.id);
    cart = []; save(); renderCart(); empty.hidden = true; form.reset(); $('.addr', form).hidden = true;
  });

  setActive(location.hash.slice(1), false);
  renderCart();
});
