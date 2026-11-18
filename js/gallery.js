/* Bake O'Clock — gallery. Edit GALLERY to match your photos in assets/images
   Each entry: [file name without .jpg, alt text / caption, aspect ratio] */
document.addEventListener('DOMContentLoaded', () => {
  const { $, esc } = BOC;
  const GALLERY = [
    ['white77-cake-1398937', 'Floral buttercream birthday cake', '4/5'],
    ['white77-cake-1398937', 'Chocolate drip cake', '1/1'],
    ['white77-cake-1398937', 'Strawberry cream cake', '3/4'],
    ['white77-cake-1398937', 'Assorted cupcakes', '4/3'],
    ['white77-cake-1398937', 'Customized celebration cake', '4/5'],
    ['white77-cake-1398937', 'Fudgy brownies', '1/1'],
    ['white77-cake-1398937', 'Dessert box', '3/4'],
    ['white77-cake-1398937', 'Cake slice on a plate', '4/5'],
    ['white77-cake-1398937', 'Anniversary cake', '1/1'],
    ['white77-cake-1398937', 'Chocolate cupcakes', '4/3'],
    ['white77-cake-1398937', 'Pastel birthday cake', '3/4'],
    ['white77-cake-1398937', 'Brownie gift box', '4/5'],
  ];

  const wall = $('#masonry');
  wall.innerHTML = GALLERY.map(([n, alt, ratio], i) =>
    `<button class="m-item" type="button" data-i="${i}" aria-label="Open photo: ${esc(alt)}">
      <figure class="frame" style="aspect-ratio:${ratio}"><img src="assets/images/${n}.jpg" alt="${esc(alt)}" loading="lazy" decoding="async"></figure>
    </button>`).join('');

  const lb = $('#lightbox');
  const stage = $('#lb-stage');
  const cap = $('#lb-cap');
  let cur = 0;
  let opener = null;

  function show(i) {
    cur = (i + GALLERY.length) % GALLERY.length;
    const [n, alt] = GALLERY[cur];
    stage.innerHTML = `<img src="assets/images/${n}.jpg" alt="${esc(alt)}">`;
    cap.textContent = `${alt} (${cur + 1} of ${GALLERY.length})`;
  }

  wall.addEventListener('click', (e) => {
    const b = e.target.closest('.m-item');
    if (!b) return;
    opener = b;
    show(Number(b.dataset.i));
    lb.showModal();
    document.body.classList.add('modal-open');
  });

  $('#lb-close').addEventListener('click', () => lb.close());
  $('#lb-prev').addEventListener('click', () => show(cur - 1));
  $('#lb-next').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', () => { document.body.classList.remove('modal-open'); if (opener) opener.focus(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
});
