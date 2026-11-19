import { privateApi } from "./services.js";
import { getCart, getPending, rememberOrder, finishOrder, matchesCart } from "./cart.js";
import { requireSession, profile, showProfile } from "./account.js";
import { $, el, link, button, status, money, orderLink, urlId, cartCount } from "./ui.js";

const methods = { PIX: "Pix", CARTAO: "Cartão", BOLETO: "Boleto" };
const eligible = order => order.statusPedido !== "CANCELADO" && order.statusPagamento === "PENDENTE";
const paymentLink = id => link("Retomar pagamento", orderLink("pagamento", id), "btn");

function itemsList(items) {
  const list = el("ul", null, "order-items");
  for (const item of items) {
    const subtotal = item.subtotal ?? Math.round(item.precoUnitario * 100) * item.quantidade / 100;
    list.append(el("li", item.nomeProduto + " · " + item.quantidade + " × " +
      money(item.precoUnitario) + " = " + money(subtotal)));
  }
  return list;
}

export async function checkout() {
  const current = await requireSession();
  if (!current) return;
  const userId = current.user.id;
  const snapshot = getCart();
  const form = $("#checkoutForm");
  const submit = form.querySelector("button");
  if (!snapshot.length) {
    status("Seu carrinho está vazio.");
    return;
  }

  async function findPending() {
    for (const [id, stored] of Object.entries(getPending(userId))) {
      if (!matchesCart(stored, snapshot)) continue;
      let order;
      try {
        order = await privateApi("/pedidos/" + encodeURIComponent(id));
      } catch (error) {
        if (error.status === 404) continue;
        throw error;
      }
      if (eligible(order) || order.statusPagamento === "CONFIRMADO") {
        location.replace(orderLink(eligible(order) ? "pagamento" : "sucesso", order.id));
        return true;
      }
    }
    return false;
  }

  if (await findPending()) return;
  const itens = snapshot.map(item => ({ produtoId: item.id, quantidade: item.quantidade }));
  let preview;
  async function loadPreview() {
    preview = null;
    submit.disabled = true;
    form.hidden = true;
    const result = await privateApi("/pedidos/previa", { method: "POST", body: { itens } });
    $("#checkoutSummary").replaceChildren(itemsList(result.itens));
    $("#checkoutTotal").textContent = money(result.valorTotal);
    preview = result;
    form.hidden = false;
    submit.disabled = false;
  }

  async function createOrder() {
    if (!matchesCart(snapshot, getCart())) {
      throw new Error("O carrinho mudou. Volte ao carrinho e abra o checkout novamente.");
    }
    if (await findPending()) return;
    const order = await privateApi("/pedidos", {
      method: "POST",
      body: {
        itens,
        formaPagamento: new FormData(form).get("pagamento"),
        precosConfirmados: Object.fromEntries(preview.itens.map(item => [item.produtoId, item.precoUnitario]))
      }
    });
    rememberOrder(userId, order.id, snapshot.map(({ id, revisao }) => ({ id, revisao })));
    location.replace(orderLink("pagamento", order.id));
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!preview || submit.disabled) return;
    submit.disabled = true;
    status("Criando pedido…");
    try {
      if (navigator.locks) await navigator.locks.request("csv-checkout:" + userId, createOrder);
      else await createOrder();
    } catch (error) {
      if (error.status === 409 && error.message === "PRECO_ALTERADO") {
        status("Os preços mudaram. Confira a nova prévia e confirme novamente.");
        try {
          await loadPreview();
        } catch (previewError) {
          status(previewError.message);
        }
      } else if (error.status === 0 || error.status >= 500) {
        status(error.message + " Consulte Meus pedidos antes de tentar criar outro pedido.");
      } else {
        status(error.message);
        submit.disabled = false;
      }
    }
  });

  const cliente = await profile();
  if (cliente) {
    await loadPreview();
  } else {
    status("Cadastre seu perfil para continuar.");
    showProfile(current, null, async () => {
      await loadPreview();
      $("#profileForm").hidden = true;
      status("");
    });
  }
}

function orderCard(order, detailed) {
  const card = el("article", null, "panel order-detail");
  card.append(el("h2", "Pedido " + order.id),
    el("p", "Data: " + order.data),
    el("p", "Pedido: " + order.statusPedido),
    el("p", "Pagamento: " + order.statusPagamento + " · " + methods[order.formaPagamento]),
    el("strong", "Total: " + money(order.valorTotal)));
  if (detailed) card.append(itemsList(order.itens));
  else card.append(link("Ver detalhes", orderLink("pedidos", order.id), "btn secondary"));
  if (eligible(order)) card.append(paymentLink(order.id));
  return card;
}

export async function historyPage() {
  if (!await requireSession()) return;
  const root = $("#ordersList");
  if (new URLSearchParams(location.search).has("id")) {
    const order = await privateApi("/pedidos/" + urlId());
    root.append(link("Voltar aos pedidos", "pedidos.html", "back-link"), orderCard(order, true));
    return;
  }
  const orders = await privateApi("/pedidos");
  root.append(...orders.map(order => orderCard(order, false)));
  if (!orders.length) status("Você ainda não tem pedidos.");
}

export async function payment() {
  const current = await requireSession();
  if (!current) return;
  const id = urlId();
  const order = await privateApi("/pedidos/" + id);
  const root = $("#payment");
  root.append(orderCard(order, true));
  root.querySelector(".btn")?.remove();
  if (order.statusPagamento === "CONFIRMADO") {
    location.replace(orderLink("sucesso", id));
    return;
  }
  if (!eligible(order)) {
    status("Este pedido não está disponível para pagamento.");
    return;
  }

  root.append(el("p", "Simulação de " + methods[order.formaPagamento] + ". Nenhuma cobrança será feita."),
    button("Confirmar pagamento simulado", async control => {
      control.disabled = true;
      status("Confirmando pagamento…");
      try {
        const result = await privateApi("/pedidos/" + id + "/confirmar-pagamento", { method: "POST" });
        if (result.statusPagamento !== "CONFIRMADO" || result.pedidoId !== id) {
          throw new Error("A API não confirmou o pagamento deste pedido.");
        }
        finishOrder(current.user.id, id);
        location.replace(orderLink("sucesso", id));
      } catch (error) {
        status(error.message);
        control.disabled = false;
      }
    }, "btn"));
}

export async function success() {
  const current = await requireSession();
  if (!current) return;
  const id = urlId();
  const order = await privateApi("/pedidos/" + id);
  if (order.statusPagamento !== "CONFIRMADO") {
    status("O pagamento deste pedido ainda não foi confirmado.");
    if (eligible(order)) $("#feedback").after(paymentLink(id));
    return;
  }
  finishOrder(current.user.id, id);
  cartCount();
  $("#orderNumber").textContent = order.id;
  $("#successStatus").textContent = "Pedido: " + order.statusPedido + " · Pagamento: " + order.statusPagamento;
  $("#detailsLink").href = orderLink("pedidos", id);
  $(".success-card").hidden = false;
}
