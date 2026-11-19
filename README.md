# CSV Gráfica Digital — Frontend Web

Loja acadêmica em HTML, CSS e JavaScript. O Spring Boot fornece catálogo, perfil, prévia, pedidos e confirmação de pagamento. O Supabase Auth fornece a sessão usada nas rotas protegidas.

## Executar localmente

1. Inicie o Spring Boot da branch `main` de [sistema-grafica](https://github.com/CSV-Sistema-digital/sistema-grafica) na porta 8080. Configure no ambiente **do backend** `DB_URL_CSV`, `DB_USERNAME_CSV`, `DB_PASSWORD_CSV` e `SUPABASE_URL`.
2. Em `js/config.js`, preencha `supabaseUrl` com a URL do mesmo projeto Supabase configurado no backend e `supabasePublicKey` com a chave pública **publishable** ou **anon**. A URL padrão da API é `http://localhost:8080`. Mantenha chaves secretas, `service_role` e credenciais do banco fora do frontend.
3. Em **Authentication → Providers → Email**, mantenha habilitada a confirmação de e-mail. Em **Authentication → URL Configuration**, configure o endereço do frontend e autorize como Redirect URL `http://localhost:5500/conta.html**` para aceitar o parâmetro de retorno. Para usar `127.0.0.1`, cadastre também essa origem e abra toda a navegação por ela.
4. Abra `index.html` com Live Server na porta 5500. A URL esperada é `http://localhost:5500/index.html`. O SDK do Supabase é carregado via CDN nas páginas de conta e pedidos.

## Roteiro de apresentação

1. Abra o catálogo sem login, pesquise um produto e abra os detalhes.
2. Adicione o mesmo produto duas vezes. Confira a consolidação, altere a quantidade e recarregue a página para verificar a persistência.
3. Acesse o checkout, cadastre a conta, confirme o e-mail e entre. Informe nome, CPF e telefone para salvar o perfil.
4. Confira a prévia oficial, escolha Pix, cartão ou boleto e confirme o pedido. Se o valor mudar, revise a nova prévia e confirme novamente.
5. Abra Meus pedidos e retome o pagamento pendente. Confirme a simulação e confira o UUID, o status do pagamento `CONFIRMADO` e o status do pedido `PENDENTE`. O carrinho local remove os itens daquele pedido que ainda correspondem à seleção enviada.
6. No histórico, confira o valor unitário registrado no pedido. Saia da conta e verifique que o catálogo e o carrinho continuam acessíveis.

Se a criação de um pedido ficar sem resposta, consulte **Meus pedidos** antes de enviar novamente. A API atual não oferece chave de idempotência para esse endpoint.

## Hospedagem futura

Na Vercel, publique a raiz do repositório como site estático e ajuste `apiUrl` em `js/config.js` para a URL HTTPS do Render. Inclua a origem HTTPS do frontend em `FRONTEND_ORIGINS` no backend e cadastre a URL de retorno equivalente no Supabase Auth. Use o mesmo projeto Supabase para a sessão do frontend e a validação do JWT no backend.
