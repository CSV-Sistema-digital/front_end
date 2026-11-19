import { auth, session, privateApi } from "./services.js";
import { $, button, link, status } from "./ui.js";

const destinations = ["conta.html", "checkout.html", "pedidos.html", "pagamento.html", "sucesso.html"];

function nextPage() {
  const next = new URLSearchParams(location.search).get("next");
  if (next && destinations.includes(next.split("?")[0])) return next;
  return "conta.html";
}

export function accountUrl() {
  return "conta.html?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search);
}

export async function requireSession() {
  const current = await session();
  if (current) return current;
  status("Entre com seu e-mail confirmado para continuar.");
  $("#feedback").after(link("Entrar na conta", accountUrl(), "btn"));
  return null;
}

export async function profile() {
  try {
    return await privateApi("/clientes/me");
  } catch (error) {
    if (error.status !== 404) throw error;
    return null;
  }
}

export function showProfile(current, cliente, onSave) {
  const form = $("#profileForm");
  form.elements.email.value = current.user.email;
  for (const field of ["nome", "cpf", "telefone"]) form.elements[field].value = cliente?.[field] || "";
  form.hidden = false;
  form.onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(form);
    const nome = data.get("nome").trim();
    const cpf = data.get("cpf").replace(/[.\s-]/g, "");
    const telefone = data.get("telefone").replace(/[()\s-]/g, "");
    if (nome.length > 150 || !/\p{L}/u.test(nome) || !/^\d{11}$/.test(cpf) ||
        !/^(?:\+55)?\d{10,11}$/.test(telefone)) {
      status("Informe um nome válido, CPF com 11 dígitos e telefone com DDD.");
      return;
    }
    const submit = form.querySelector("button");
    submit.disabled = true;
    try {
      await privateApi("/clientes/me", { method: "PUT", body: { nome, cpf, telefone } });
      status("Perfil salvo.");
      await onSave?.();
    } catch (error) {
      status(error.message);
    } finally {
      submit.disabled = false;
    }
  };
}

export async function account() {
  const current = await session();
  const next = nextPage();
  if (current) {
    if (next !== "conta.html") {
      location.replace(next);
      return;
    }
    $("#accountActions").append(button("Sair", async control => {
      control.disabled = true;
      try {
        const { error } = await auth().signOut();
        if (error) throw error;
        location.replace("index.html");
      } catch (error) {
        status(error.message);
        control.disabled = false;
      }
    }, "btn secondary"));
    showProfile(current, await profile());
    return;
  }

  const form = $("#authForm");
  form.hidden = false;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const data = new FormData(form);
    const credentials = { email: data.get("email").trim(), password: data.get("password") };
    const controls = [...form.querySelectorAll("button")];
    controls.forEach(control => { control.disabled = true; });
    try {
      if (event.submitter?.value === "cadastro") {
        const redirect = new URL("conta.html", location.href);
        redirect.searchParams.set("next", next);
        const { error } = await auth().signUp({
          ...credentials, options: { emailRedirectTo: redirect.href }
        });
        if (error) throw error;
        status("Confira sua caixa de entrada e confirme o e-mail para continuar.");
        return;
      }
      const { error } = await auth().signInWithPassword(credentials);
      if (error) {
        if (error.code === "email_not_confirmed") throw new Error("Confirme seu e-mail antes de entrar.");
        throw error;
      }
      if (!await session()) throw new Error("Confirme seu e-mail antes de entrar.");
      location.replace(next);
    } catch (error) {
      status(error.message);
    } finally {
      controls.forEach(control => { control.disabled = false; });
    }
  });
}
