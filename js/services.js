import { config } from "./config.js";

let client;

export function auth() {
  if (!config.supabaseUrl || !config.supabasePublicKey) {
    throw new Error("Configure a URL e a chave pública do Supabase para acessar sua conta.");
  }
  if (!client) {
    if (!globalThis.supabase) throw new Error("Não foi possível carregar o Supabase Auth.");
    client = globalThis.supabase.createClient(config.supabaseUrl, config.supabasePublicKey);
  }
  return client.auth;
}

export async function session() {
  const { data, error } = await auth().getSession();
  if (error) throw error;
  return data.session?.user.email_confirmed_at ? data.session : null;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = "GET", body, protectedRoute = false, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (protectedRoute) {
    const current = await session();
    if (!current) throw new ApiError(401, "Entre com uma conta de e-mail confirmado.");
    headers.Authorization = "Bearer " + current.access_token;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    const timeout = AbortSignal.timeout(15000);
    response = await fetch(config.apiUrl.replace(/\/$/, "") + "/v1" + path, {
      method, headers, body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, "Não foi possível obter resposta da API. Verifique a conexão e o servidor.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status === 401 ? "Sua sessão foi recusada. Entre novamente." :
      data?.mensagem || "A API retornou um erro (HTTP " + response.status + ").";
    throw new ApiError(response.status, message);
  }
  if (data === null) throw new ApiError(response.status, "A API retornou uma resposta inválida.");
  return data;
}

export function privateApi(path, options) {
  return api(path, { ...options, protectedRoute: true });
}
