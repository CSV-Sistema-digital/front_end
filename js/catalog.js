import { api } from "./services.js";
import { addCart, getCart, changeCart } from "./cart.js";
import { $, el, link, button, status, money, picture, cartCount, orderLink, urlId } from "./ui.js";

function add(product, quantity) {
  addCart(product, quantity);
  cartCount();
  status(product.nome + " adicionado ao carrinho.");
}

function card(product) {
  const article = el("article", null, "product-card");
  const photo = link("", orderLink("produto", product.id), "product-art");
  photo.setAttribute("aria-label", product.nome);
  picture(photo, product);
  const copy = el("div", null, "product-copy");
  copy.append(el("h3", product.nome), el("p", product.descricao, "muted"));
  const foot = el("div", null, "product-foot");
  foot.append(el("span", money(product.preco), "price"),
    button("Adicionar", () => add(product, 1), "btn"));
  article.append(photo, copy, foot);
  return article;
}

export function catalog() {
  const root = $("#catalogo");
  const field = $("#search");
  let timer;
  let request;

  async function load() {
    const current = new AbortController();
    request = current;
    const name = field.value.trim();
    const path = name ? "/produtos/pesquisa?" + new URLSearchParams({ nome: name }) : "/produtos";
    status("Carregando produtos…");
    try {
      const products = await api(path, { signal: current.signal });
      if (current.signal.aborted) return;
      const groups = new Map();
      for (const product of products) {
        const category = product.categoria?.trim() || "Sem categoria";
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(product);
      }
      root.replaceChildren();
      for (const [name, entries] of groups) {
        const section = el("section", null, "category");
        const heading = el("div", null, "section-head");
        heading.append(el("h2", name));
        const grid = el("div", null, "products");
        grid.append(...entries.map(card));
        section.append(heading, grid);
        root.append(section);
      }
      status(products.length ? "" : "Nenhum produto encontrado.");
    } catch (error) {
      if (current.signal.aborted) return;
      root.replaceChildren(button("Tentar novamente", load, "btn secondary"));
      status(error.message);
    }
  }

  field.addEventListener("input", () => {
    clearTimeout(timer);
    request?.abort();
    timer = setTimeout(load, 250);
  });
  return load();
}

export async function detail() {
  const product = await api("/produtos/" + urlId());
  picture($("#detailImage"), product);
  $("#detailName").textContent = product.nome;
  $("#detailCategory").textContent = product.categoria || "Sem categoria";
  $("#detailDescription").textContent = product.descricao;
  $("#detailPrice").textContent = money(product.preco);
  const quantity = $("#quantity");
  document.querySelectorAll("[data-qty]").forEach(control => control.addEventListener("click", () => {
    quantity.value = Math.min(999, Math.max(1, Number(quantity.value) + Number(control.dataset.qty)));
  }));
  $("#addDetail").addEventListener("click", () => add(product, Number(quantity.value)));
  $(".product-detail").hidden = false;
}

export function cartPage() {
  const items = getCart();
  const root = $("#cartItems");
  root.replaceChildren();
  for (const item of items) {
    const row = el("div", null, "cart-row");
    const photo = el("div", null, "cart-thumb");
    picture(photo, item);
    if (!item.imagem) {
      api("/produtos/" + encodeURIComponent(item.id))
        .then(product => picture(photo, product))
        .catch(() => {}); // Mantém a imagem de reserva se o produto estiver indisponível.
    }

    const copy = el("div", null, "cart-copy");
    const quantity = el("p", "Quantidade: ", "cart-quantity");
    quantity.append(el("strong", item.quantidade));
    const controls = el("div", null, "cart-controls");
    for (const step of [-1, 1]) {
      const next = item.quantidade + step;
      const control = button(step < 0 ? "−" : "+", () => {
        const current = getCart().find(product => product.id === item.id);
        if (!current) return;
        const updated = Math.min(999, Math.max(1, current.quantidade + step));
        changeCart(item.id, updated);
        cartPage();
        const buttons = root.children[items.indexOf(item)]?.querySelectorAll(".cart-controls button");
        const preferred = buttons?.[step < 0 ? 0 : 1];
        (preferred?.disabled ? buttons[step < 0 ? 1 : 0] : preferred)?.focus();
      });
      control.disabled = next < 1 || next > 999;
      control.setAttribute("aria-label", (step < 0 ? "Diminuir" : "Aumentar") + " quantidade de " + item.nome);
      controls.append(control);
    }
    copy.append(link(item.nome, orderLink("produto", item.id)), quantity, controls);

    const remove = button("Remover", () => {
      changeCart(item.id, 0);
      cartPage();
      (root.children[items.indexOf(item)]?.querySelector("a") ||
        root.lastElementChild?.querySelector("a") || $(".cart-bottom a")).focus();
    }, "remove");
    remove.setAttribute("aria-label", "Remover " + item.nome);
    const prices = el("div", null, "cart-prices");
    prices.append(el("span", money(item.preco), "cart-unit"),
      el("strong", money(Math.round(item.preco * 100) * item.quantidade / 100), "cart-subtotal"), remove);
    row.append(photo, copy, prices);
    root.append(row);
  }
  if (!items.length) root.append(el("p", "Seu carrinho está vazio.", "empty-state"));
  $("#cartItemCount").textContent = items.length + (items.length === 1 ? " tipo de produto" : " tipos de produto");
  $("#total").textContent = money(items.reduce((sum, item) =>
    sum + Math.round(item.preco * 100) * item.quantidade, 0) / 100);
  $("#checkoutBtn").hidden = !items.length;
  cartCount();
}
