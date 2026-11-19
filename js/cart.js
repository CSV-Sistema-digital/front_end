const cartKey = "csvCart";

export const isUuid = value => typeof value === "string" &&
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function getCart() {
  const stored = read(cartKey, []);
  const items = new Map();
  for (const item of Array.isArray(stored) ? stored : []) {
    if (!isUuid(item?.id) || !Number.isInteger(item.quantidade) || item.quantidade < 1) continue;
    const quantidade = Math.min(999, (items.get(item.id)?.quantidade || 0) + item.quantidade);
    items.set(item.id, { ...item, quantidade });
  }
  return [...items.values()];
}

function save(items) {
  localStorage.setItem(cartKey, JSON.stringify(items));
}

export function changeCart(id, quantidade, produto) {
  const items = getCart();
  const index = items.findIndex(item => item.id === id);
  if (quantidade === 0) {
    if (index >= 0) items.splice(index, 1);
  } else {
    const item = {
      ...(produto || items[index]), id, quantidade: Math.min(999, Math.max(1, quantidade)),
      revisao: crypto.randomUUID()
    };
    if (index >= 0) items[index] = item;
    else items.push(item);
  }
  save(items);
}

export function addCart(produto, quantidade = 1) {
  const existing = getCart().find(item => item.id === produto.id);
  changeCart(produto.id, (existing?.quantidade || 0) + quantidade, produto);
}

const pendingKey = userId => "csvPending:" + userId;

export function getPending(userId) {
  return read(pendingKey(userId), {});
}

export function rememberOrder(userId, id, items) {
  localStorage.setItem(pendingKey(userId), JSON.stringify({ ...getPending(userId), [id]: items }));
}

export function matchesCart(snapshot, cart) {
  return snapshot.length === cart.length &&
    snapshot.every(item => cart.some(current => current.id === item.id && current.revisao === item.revisao));
}

export function finishOrder(userId, id) {
  const pending = getPending(userId);
  const snapshot = pending[id];
  if (!snapshot) return;
  save(getCart().filter(item => !snapshot.some(paid =>
    paid.id === item.id && paid.revisao === item.revisao)));
  delete pending[id];
  localStorage.setItem(pendingKey(userId), JSON.stringify(pending));
}
