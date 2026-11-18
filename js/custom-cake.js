/* Bake O'Clock — custom cake order form -> WhatsApp message */
document.addEventListener('DOMContentLoaded', () => {
  const { $, validate, liveClear, bindMethod, openWA, sent, fmtDate } = BOC;
  const form = $('#cake-form');
  const status = $('#cake-status');

  liveClear(form);
  bindMethod(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(form)) return;
    const f = new FormData(form);
    const v = (k) => (f.get(k) || '').toString().trim();
    const m = v('method');
    const order = BOC.Orders.add({
      type: 'custom', name: v('name'), whatsapp: v('whatsapp'), method: m, address: m === 'Home delivery' ? v('address') : '',
      date: v('date'), notes: v('notes'), items: [{ name: 'Custom cake', qty: 1 }],
      custom: { event: v('event'), size: v('size'), flavor: v('flavor'), colors: v('colors'), design: v('design'), ref: v('ref') },
    });
    const lines = [
      'Hello Bake O’Clock! I’d like to request a custom cake.', '', `*Order ID:* ${order.id}`, '',
      `*Name:* ${v('name')}`,
      `*WhatsApp:* ${v('whatsapp')}`,
      `*Event:* ${v('event')}`,
      `*Size / weight:* ${v('size')}`,
      `*Flavor:* ${v('flavor')}`,
      `*Colors:* ${v('colors')}`,
      `*Design:* ${v('design')}`,
    ];
    if (v('ref')) lines.push(`*Reference image:* ${v('ref')}`);
    lines.push(`*Delivery / pickup:* ${m}${m === 'Home delivery' ? ' – ' + v('address') : ''}`);
    lines.push(`*Required date:* ${fmtDate(v('date'))}`);
    if (v('notes')) lines.push(`*Additional instructions:* ${v('notes')}`);
    lines.push('', 'Please confirm availability, price and advance payment details. Thank you!');
    lines.push('', `Order code (for the bakery’s admin panel, please don’t edit): ${BOC.Orders.encode(order)}`);
    const text = lines.join('\n');
    openWA(text);
    sent(status, text, order.id);
    form.reset(); $('.addr', form).hidden = true;
  });
});
