/* Checkout page (mock payment: Cash on Delivery or Demo Card) */
async function initCheckout() {
  const area = document.getElementById('checkoutArea');
  try {
    const [cart, profile] = await Promise.all([api('/api/cart'), api('/api/users/profile')]);
    if (!cart.items.length) {
      area.innerHTML = emptyHtml('🛒', 'Your cart is empty', 'Add some products before checking out.', '<a class="btn" href="products.html">Browse products</a>');
      return;
    }
    area.innerHTML = `
      <div class="two-col">
        <div>
          <div class="card" style="margin-bottom:20px">
            <h3 style="margin-bottom:14px">1. Customer Information</h3>
            <div class="form-row">
              <div class="form-group"><label>Name</label><input class="form-control" value="${esc(profile.name)}" readonly></div>
              <div class="form-group"><label>Email</label><input class="form-control" value="${esc(profile.email)}" readonly></div>
            </div>
            <div class="form-group"><label for="phone">Phone</label><input class="form-control" id="phone" value="${esc(profile.phone || '')}"></div>
            <div class="form-group"><label for="address">Shipping address</label><textarea class="form-control" id="address">${esc(profile.address || '')}</textarea></div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:14px">2. Payment Method <small style="color:var(--muted);font-weight:500">(demo – no real payment)</small></h3>
            <label class="pay-option"><input type="radio" name="pay" value="COD" checked><div><b>Cash on Delivery</b><small>Pay when your order arrives.</small></div></label>
            <label class="pay-option"><input type="radio" name="pay" value="CARD"><div><b>Demo Card Payment</b><small>Simulated payment. Card details are never sent or stored.</small></div></label>
            <div id="cardBox" class="hidden" style="margin-top:12px">
              <div class="form-group"><label>Card number</label><input class="form-control" id="cardNo" placeholder="4242 4242 4242 4242" inputmode="numeric" maxlength="23"></div>
              <div class="form-row">
                <div class="form-group"><label>Expiry (MM/YY)</label><input class="form-control" id="cardExp" placeholder="12/30" maxlength="5"></div>
                <div class="form-group"><label>CVV</label><input class="form-control" id="cardCvv" placeholder="123" inputmode="numeric" maxlength="4" type="password"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="card summary">
          <h3>Order Summary</h3>
          ${cart.items.map(i => `<div class="mini-item">${imgTag(i.imageUrl, i.name)}<span>${esc(i.name)} × ${i.quantity}</span><span>${money(i.subtotal)}</span></div>`).join('')}
          <div class="sum-row" style="margin-top:8px"><span>Subtotal</span><span>${money(cart.subtotal)}</span></div>
          <div class="sum-row"><span>Delivery charge</span><span>${Number(cart.deliveryCharge) === 0 ? '<span class="free">FREE</span>' : money(cart.deliveryCharge)}</span></div>
          <div class="sum-row total"><span>Total</span><span>${money(cart.total)}</span></div>
          <div id="msg" style="margin-top:12px"></div>
          <button class="btn btn-accent btn-block" id="placeBtn">Place Order</button>
          <a class="btn btn-ghost btn-block" style="margin-top:8px" href="cart.html">← Back to cart</a>
        </div>
      </div>`;
    document.querySelectorAll('input[name=pay]').forEach(r => r.addEventListener('change', () => {
      document.getElementById('cardBox').classList.toggle('hidden', document.querySelector('input[name=pay]:checked').value !== 'CARD');
    }));
    document.getElementById('placeBtn').addEventListener('click', placeOrder);
  } catch (e) { area.innerHTML = alertHtml(e.message); }
}

function fail(text) { document.getElementById('msg').innerHTML = alertHtml(text); }

async function placeOrder() {
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const method = document.querySelector('input[name=pay]:checked').value;
  if (!address) return fail('Please enter your shipping address');
  if (!/^\+?[0-9]{10,15}$/.test(phone)) return fail('Enter a valid phone number (10-15 digits)');
  if (method === 'CARD') {
    const no = document.getElementById('cardNo').value.replace(/\s+/g, '');
    if (!/^[0-9]{13,19}$/.test(no)) return fail('Enter a valid demo card number (13-19 digits)');
    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(document.getElementById('cardExp').value)) return fail('Enter the expiry date as MM/YY');
    if (!/^[0-9]{3,4}$/.test(document.getElementById('cardCvv').value)) return fail('Enter a valid CVV');
  }
  const btn = document.getElementById('placeBtn');
  setLoading(btn, true, 'Placing order...');
  try {
    // only non-sensitive data is sent; card details stay in the browser
    const order = await api('/api/orders', { method: 'POST', body: { shippingAddress: address, phone, paymentMethod: method } });
    window.location.href = 'order-success.html?id=' + order.id;
  } catch (e) { fail(e.message); setLoading(btn, false); }
}
if (ACCESS_OK) initCheckout();
