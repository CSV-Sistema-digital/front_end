import { getCart, isUuid } from "./cart.js";
import { config } from "./config.js";

export const $ = selector => document.querySelector(selector);
export const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format;

export function el(tag, value, className) {
  const node = document.createElement(tag);
  if (value != null) node.textContent = value;
  if (className) node.className = className;
  return node;
}

export function link(label, href, className) {
  const node = el("a", label, className);
  node.href = href;
  return node;
}

export function button(label, action, className) {
  const node = el("button", label, className);
  node.type = "button";
  node.addEventListener("click", () => action(node));
  return node;
}

export function status(message = "") {
  $("#feedback").textContent = message;
}

export function orderLink(page, id) {
  return page + ".html?id=" + encodeURIComponent(id);
}

export function urlId() {
  const id = new URLSearchParams(location.search).get("id");
  if (!isUuid(id)) throw new Error("Identificador inválido.");
  return id;
}

export function cartCount() {
  const count = getCart().reduce((total, item) => total + item.quantidade, 0);
  document.querySelectorAll(".cart-count").forEach(node => { node.textContent = count; });
}

export function picture(parent, product) {
  const fallback = () => parent.replaceChildren(el("span", "Imagem indisponível"));
  if (!product.imagem) return fallback();
  let url;
  try {
    url = new URL(product.imagem, config.apiUrl + "/");
  } catch {
    return fallback();
  }
  if (!["https:", "http:"].includes(url.protocol)) return fallback();
  const image = el("img");
  image.alt = product.nome;
  image.loading = "lazy";
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", fallback, { once: true });
  image.src = url.href;
  parent.replaceChildren(image);
}
