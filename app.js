const PRODUCTS = [
  {
    id: 1,
    name: "Folha A0",
    category: "PAPÉIS",
    price: 1.9,
    emoji: "📜",
    description:
      "Folha para projetos gráficos e impressões de grande formato.",
  },
  {
    id: 2,
    name: "Folha A1",
    category: "PAPÉIS",
    price: 4,
    emoji: "📜",
    description: "Papel de alta qualidade para impressão e trabalhos gráficos.",
  },
  {
    id: 3,
    name: "Folha A2",
    category: "PAPÉIS",
    price: 2.5,
    emoji: "📄",
    description:
      "Papel versátil para projetos escolares, profissionais e criativos.",
  },
  {
    id: 4,
    name: "Folha A1 Premium",
    category: "PAPÉIS",
    price: 4,
    emoji: "📜",
    description: "Papel para trabalhos gráficos com acabamento de qualidade.",
  },
  {
    id: 5,
    name: "Caderno",
    category: "MATERIAL ESCOLAR",
    price: 10,
    emoji: "📕",
    description: "Caderno para anotações, estudos e organização do dia a dia.",
  },
  {
    id: 6,
    name: "Lápis",
    category: "MATERIAL ESCOLAR",
    price: 3.8,
    emoji: "✏️",
    description: "Lápis para escrita, desenho e atividades escolares.",
  },
  {
    id: 7,
    name: "Estojo",
    category: "MATERIAL ESCOLAR",
    price: 15,
    emoji: "🎒",
    description: "Estojo prático para guardar lápis, canetas e acessórios.",
  },
  {
    id: 8,
    name: "Apontador",
    category: "MATERIAL ESCOLAR",
    price: 5,
    emoji: "🔺",
    description: "Apontador compacto para manter seus lápis prontos para uso.",
  },
];

const money = (value) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

// Carrinho
const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem("csvCart") || "[]");
  } catch {
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem("csvCart", JSON.stringify(cart));
  updateCounts();
};

const updateCounts = () => {
  const count = getCart().reduce((total, item) => total + item.qty, 0);

  document
    .querySelectorAll(".cart-count")
    .forEach((element) => (element.textContent = count));
};

const addToCart = (id, quantity = 1) => {
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === id);

  if (existingItem) {
    existingItem.qty += quantity;
  } else {
    cart.push({ id, qty: quantity });
  }

  saveCart(cart);
};

// Catálogo
const productCard = (product) => `
  <article class="product-card">
    <a href="produto.html?id=${product.id}" class="product-art" style="display:grid">
      ${product.emoji}
    </a>
    <h3>
      <a href="produto.html?id=${product.id}">${product.name.toUpperCase()}</a>
    </h3>
    <div class="product-foot">
      <span class="price">${money(product.price)}</span>
      <button
        class="icon-btn"
        data-add="${product.id}"
        aria-label="Adicionar ${product.name} ao carrinho"
      >🛒</button>
    </div>
  </article>
`;

function renderCatalog(filter = "") {
  const matchingProducts = PRODUCTS.filter((product) =>
    product.name.toLowerCase().includes(filter.toLowerCase()),
  );
  const papers = matchingProducts.filter(
    (product) => product.category === "PAPÉIS",
  );
  const schoolSupplies = matchingProducts.filter(
    (product) => product.category !== "PAPÉIS",
  );
  const papersContainer = document.querySelector("#papers");
  const schoolContainer = document.querySelector("#school");

  if (papersContainer) {
    papersContainer.innerHTML = papers.length
      ? papers.map(productCard).join("")
      : '<p class="muted">Nenhum papel encontrado.</p>';
  }

  if (schoolContainer) {
    schoolContainer.innerHTML = schoolSupplies.length
      ? schoolSupplies.map(productCard).join("")
      : '<p class="muted">Nenhum material escolar encontrado.</p>';
  }
}

// Página do carrinho
function renderCart() {
  const container = document.querySelector("#cartItems");
  if (!container) return;

  const cart = getCart();
  const items = cart
    .map((item) => ({
      ...PRODUCTS.find((product) => product.id === item.id),
      qty: item.qty,
    }))
    .filter((item) => item.id);
  const count = items.reduce((total, item) => total + item.qty, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.qty,
    0,
  );
  const shipping = items.length ? 15 : 0;

  document.querySelector("#cartItemCount").textContent =
    `${count} ${count === 1 ? "item" : "itens"}`;
  document.querySelector("#subtotal").textContent = money(subtotal);
  document.querySelector("#shipping").textContent = money(shipping);
  document.querySelector("#total").textContent = money(subtotal + shipping);

  container.innerHTML = items.length
    ? items
        .map(
          (product) => `
            <div class="cart-row">
              <div class="cart-thumb">${product.emoji}</div>
              <div>
                <h3>${product.name}</h3>
                <small>${product.category}</small>
                <div class="quantity">
                  <button data-change="${product.id}" data-delta="-1">−</button>
                  <output>${product.qty}</output>
                  <button data-change="${product.id}" data-delta="1">+</button>
                </div>
              </div>
              <div class="cart-unit">${money(product.price)}</div>
              <strong class="cart-subtotal">${money(product.price * product.qty)}</strong>
              <button
                class="remove"
                data-remove="${product.id}"
                aria-label="Remover ${product.name}"
              >×</button>
            </div>
          `,
        )
        .join("")
    : `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h2>Seu carrinho está vazio</h2>
        <p>Adicione produtos do catálogo para continuar.</p>
        <a class="btn" href="index.html">Ver produtos</a>
      </div>
    `;

  const checkoutButton = document.querySelector("#checkoutBtn");
  if (checkoutButton) {
    checkoutButton.style.pointerEvents = items.length ? "auto" : "none";
    checkoutButton.style.opacity = items.length ? "1" : ".5";
  }
}

// Detalhes do produto
function renderDetail() {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id")) || 3;
  const product = PRODUCTS.find((item) => item.id === id) || PRODUCTS[2];
  const name = document.querySelector("#detailName");

  if (!name) return;

  name.textContent = product.name;
  document.querySelector("#detailImage").textContent = product.emoji;
  document.querySelector("#detailCategory").textContent = product.category;
  document.querySelector("#detailDescription").textContent =
    product.description;
  document.querySelector("#detailPrice").innerHTML =
    `${money(product.price)} <small>/ unidade</small>`;

  let quantity = 1;
  document.querySelectorAll("[data-qty]").forEach((button) => {
    button.addEventListener("click", () => {
      quantity = Math.max(1, quantity + Number(button.dataset.qty));
      document.querySelector("#quantity").textContent = quantity;
    });
  });

  document.querySelector("#addDetail").addEventListener("click", () => {
    addToCart(product.id, quantity);
    location.href = "carrinho.html";
  });
}

// Pedidos
function renderOrders() {
  const container = document.querySelector("#ordersList");
  if (!container) return;

  const orders = [
    {
      id: "#GRAFICA1298",
      date: "12/08/2026",
      items: "14 itens",
      total: 129,
      status: "Enviado",
      cls: "",
    },
    {
      id: "#GRAFICA1754",
      date: "07/06/2026",
      items: "25 itens",
      total: 68.5,
      status: "Concluído",
      cls: "done",
    },
    {
      id: "#GRAFICA2277",
      date: "07/06/2026",
      items: "2 itens",
      total: 26.9,
      status: "Em separação",
      cls: "progress",
    },
  ];
  const query = (
    document.querySelector("#orderSearch")?.value || ""
  ).toLowerCase();
  const matchingOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(query),
  );

  container.innerHTML = matchingOrders.length
    ? matchingOrders
        .map(
          (order) => `
            <article class="order-card">
              <div class="order-icon">▤</div>
              <div>
                <h3>${order.id}</h3>
                <p>${order.date}</p>
                <p>Pedido de materiais gráficos</p>
              </div>
              <div class="order-meta">
                <strong>${order.items}</strong>
                <p>${money(order.total)}</p>
              </div>
              <span class="status ${order.cls}">${order.status}</span>
              <a
                class="order-arrow"
                href="pedido.html?id=${encodeURIComponent(order.id)}"
              >›</a>
            </article>
          `,
        )
        .join("")
    : `
      <div class="empty-state">
        <div class="empty-icon">⌕</div>
        <h2>Pedido não encontrado</h2>
        <p>Confira o número digitado e tente novamente.</p>
      </div>
    `;
}

// Finalização do pedido
function renderCheckout() {
  const form = document.querySelector("#checkoutForm");
  if (!form) return;

  const items = getCart()
    .map((item) => ({
      ...PRODUCTS.find((product) => product.id === item.id),
      qty: item.qty,
    }))
    .filter((item) => item.id);
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.qty,
    0,
  );

  document.querySelector("#checkoutSummary").innerHTML = items.length
    ? items
        .map(
          (product) => `
            <div class="summary-product">
              <span>${product.name} × ${product.qty}</span>
              <strong>${money(product.price * product.qty)}</strong>
            </div>
          `,
        )
        .join("")
    : '<p class="helper">Carrinho vazio. Você pode voltar ao catálogo para escolher produtos.</p>';

  document.querySelector("#checkoutTotal").textContent = money(
    subtotal + (items.length ? 15 : 0),
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!items.length) {
      alert("Adicione pelo menos um produto antes de finalizar.");
      return;
    }

    const orderNumber = `#GRAFICA${Math.floor(1000 + Math.random() * 8999)}`;
    localStorage.setItem("csvLastOrder", orderNumber);
    localStorage.removeItem("csvCart");
    location.href = "sucesso.html";
  });
}

// Eventos compartilhados
document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    addToCart(Number(addButton.dataset.add));
    addButton.textContent = "✓";
    setTimeout(() => {
      if (addButton.isConnected) addButton.textContent = "🛒";
    }, 700);
  }

  const changeButton = event.target.closest("[data-change]");
  if (changeButton) {
    const cart = getCart();
    const item = cart.find(
      (entry) => entry.id === Number(changeButton.dataset.change),
    );

    if (item) item.qty += Number(changeButton.dataset.delta);

    saveCart(cart.filter((entry) => entry.qty > 0));
    renderCart();
  }

  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    saveCart(
      getCart().filter(
        (item) => item.id !== Number(removeButton.dataset.remove),
      ),
    );
    renderCart();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  updateCounts();
  renderCatalog();

  const search = document.querySelector("#search");
  if (search) {
    search.addEventListener("input", () => renderCatalog(search.value));
  }

  renderCart();
  renderDetail();
  renderOrders();
  document
    .querySelector("#searchOrder")
    ?.addEventListener("click", renderOrders);
  document
    .querySelector("#orderSearch")
    ?.addEventListener("input", renderOrders);
  renderCheckout();

  const orderNumber = document.querySelector("#orderNumber");
  if (orderNumber) {
    orderNumber.textContent =
      localStorage.getItem("csvLastOrder") || "#GRAFICA0001";
  }
});
