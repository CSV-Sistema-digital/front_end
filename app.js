import { $, cartCount, status } from "./js/ui.js";
import { account } from "./js/account.js";
import { catalog, detail, cartPage } from "./js/catalog.js";
import { checkout, historyPage, payment, success } from "./js/orders.js";

const pages = { catalog, detail, cartPage, account, checkout, historyPage, payment, success };

async function start() {
  cartCount();
  try {
    await pages[document.body.dataset.page]();
  } catch (error) {
    status(error.message);
  }
}

window.addEventListener("storage", event => {
  if (event.key !== "csvCart" && event.key !== null) return;
  if ($("#cartItems")) cartPage();
  else cartCount();
});

start();
