
# CSV Sistema Digital — Gráfica Digital

Projeto acadêmico de sistema de vendas e acompanhamento de pedidos para uma gráfica, desenvolvido para o Trabalho Integrador da **UNINOVE**.

Este repositório contém a **API Web** em Java/Spring Boot. A interface Web está em um repositório separado; o aplicativo Mobile (Flutter) e sua API são componentes distintos que compartilham o banco de dados PostgreSQL.

## Acessos

| Componente | Endereço |
| --- | --- |
| Frontend Web | [csv-sistema-digital.vercel.app](https://csv-sistema-digital.vercel.app) |
| API Web | [csv-grafica-digital.onrender.com](https://csv-grafica-digital.onrender.com) |
| Catálogo público (API) | [GET /v1/produtos](https://csv-grafica-digital.onrender.com/v1/produtos) |
| Código do Frontend | [CSV-Sistema-digital/front_end](https://github.com/CSV-Sistema-digital/front_end) |

> **Observação:** O Backend no plano gratuito do Render pode levar algum tempo para responder após um período de inatividade. A disponibilidade dos serviços deve ser verificada antes da apresentação.

## Arquitetura

```text
Navegador — HTML / CSS / JavaScript (Vercel)
   |
   | HTTPS / JSON / Bearer JWT
   v
API Web — Spring Boot (Render)
   |
   | JDBC
   v
PostgreSQL (Supabase)

Navegador --> Supabase Auth
              Cadastro, login e sessão

Aplicativo Mobile — Flutter
   |
   v
API Mobile (separada)
   |
   v
Mesmo PostgreSQL
```

### Funcionamento da arquitetura

- O catálogo e o carrinho são acessíveis sem autenticação.
- O **Supabase Auth** autentica os usuários.
- O **Spring Security** valida os tokens JWT nas rotas protegidas.
- O carrinho é armazenado no `localStorage` do navegador.
- O Backend calcula os valores, valida os preços e registra os pedidos.
- O PostgreSQL armazena os dados do sistema.
- O pagamento é **simulado**, sem cobrança financeira real.
- A API Mobile e o gerenciamento administrativo são componentes separados.

## Tecnologias utilizadas

| Camada | Tecnologias |
| --- | --- |
| Backend Web | Java 21, Spring Boot 4, Spring Web MVC |
| Persistência | Spring Data JPA, Hibernate |
| Segurança | Spring Security, OAuth2 Resource Server, JWT |
| Banco de dados | PostgreSQL |
| Autenticação | Supabase Auth |
| Frontend Web | HTML5, CSS3, JavaScript, Fetch API |
| Aplicativo Mobile | Flutter |
| Hospedagem Backend | Render |
| Hospedagem Frontend | Vercel |
| Banco hospedado | Supabase |
| Build | Maven |
| Contêiner | Docker |
| Versionamento | Git e GitHub |

## Funcionalidades implementadas

### Catálogo de produtos

- Listagem pública de produtos ativos.
- Pesquisa de produtos por nome.
- Consulta de detalhes de um produto.
- Identificação dos produtos por UUID.

### Clientes

- Autenticação com Supabase Auth.
- Confirmação de e-mail.
- Cadastro do perfil do cliente.
- Consulta dos dados cadastrais.
- Atualização do perfil autenticado.
- Associação entre cliente e usuário do Supabase Auth.

### Carrinho

- Adição de produtos.
- Alteração de quantidades.
- Remoção de itens.
- Agrupamento de produtos repetidos.
- Cálculo visual de subtotais.
- Persistência no `localStorage`.

### Pedidos

- Prévia oficial calculada pelo Backend.
- Validação dos preços atuais.
- Criação transacional de pedidos.
- Associação do pedido ao cliente autenticado.
- Consulta do histórico de pedidos.
- Consulta dos detalhes de cada pedido.
- Preservação dos preços registrados na compra.

### Pagamentos

- Seleção entre PIX, cartão e boleto.
- Criação de pagamento com status pendente.
- Confirmação simulada do pagamento.
- Consulta do status do pagamento.

> **Importante:** A confirmação do pagamento não altera automaticamente o status do pedido para `PRONTO`.

## Regras de negócio

### Status dos pedidos

- `PENDENTE`
- `EM_PRODUCAO`
- `PRONTO`
- `CANCELADO`

### Status dos pagamentos

- `PENDENTE`
- `CONFIRMADO`
- `CANCELADO`

### Formas de pagamento

- `PIX`
- `CARTAO`
- `BOLETO`

### Validação de preços

O Backend é responsável por calcular o valor oficial dos pedidos.

Antes da criação, o Frontend solicita uma prévia dos valores.

Quando o usuário confirma a compra, o Backend verifica novamente os preços dos produtos.

Caso os valores tenham sido alterados, a operação poderá retornar `409 Conflict`, exigindo uma nova confirmação do cliente.

## Endpoints da API Web

**URL local:**

`http://localhost:8080`

**URL de produção:**

`https://csv-grafica-digital.onrender.com`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| GET | `/v1/produtos` | Pública | Listar produtos ativos |
| GET | `/v1/produtos/{id}` | Pública | Consultar produto por ID |
| GET | `/v1/produtos/pesquisa?nome=...` | Pública | Pesquisar produtos |
| GET | `/v1/clientes/me` | JWT | Consultar perfil do cliente |
| PUT | `/v1/clientes/me` | JWT | Criar ou atualizar perfil |
| POST | `/v1/pedidos/previa` | JWT | Calcular prévia do pedido |
| POST | `/v1/pedidos` | JWT | Criar pedido |
| POST | `/v1/pedidos/{id}/confirmar-pagamento` | JWT | Confirmar pagamento simulado |
| GET | `/v1/pedidos` | JWT | Listar pedidos do cliente |
| GET | `/v1/pedidos/{id}` | JWT | Consultar pedido por ID |

As rotas protegidas exigem o cabeçalho:

```http
Authorization: Bearer <access_token>
```

O token deve ser emitido pelo Supabase Auth.

## Exemplos de requisições

### Consultar catálogo público

```bash
curl https://csv-grafica-digital.onrender.com/v1/produtos
```

### Calcular prévia de pedido

```http
POST /v1/pedidos/previa
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "itens": [
    {
      "produtoId": "<uuid-do-produto>",
      "quantidade": 2
    }
  ]
}
```

### Criar pedido

```http
POST /v1/pedidos
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "itens": [
    {
      "produtoId": "<uuid-do-produto>",
      "quantidade": 2
    }
  ],
  "formaPagamento": "PIX",
  "precosConfirmados": {
    "<uuid-do-produto>": 81.00
  }
}
```

O valor `81.00` é ilustrativo. O preço confirmado deve corresponder ao valor unitário retornado na prévia.

## Estrutura do repositório

```text
sistema-grafica/
|
|-- README.md
|-- .gitignore
|
|-- backend/
    |
    |-- Dockerfile
    |-- pom.xml
    |-- mvnw
    |-- mvnw.cmd
    |
    |-- src/
        |
        |-- main/
        |   |
        |   |-- java/br/com/grafica/backend/
        |   |   |
        |   |   |-- config/
        |   |   |-- controller/
        |   |   |-- dto/
        |   |   |-- enums/
        |   |   |-- exception/
        |   |   |-- model/
        |   |   |-- repository/
        |   |   |-- service/
        |   |
        |   |-- resources/
        |       |
        |       |-- application.yaml
        |
        |-- test/
```

O Frontend está disponível em um repositório separado:

[CSV-Sistema-digital/front_end](https://github.com/CSV-Sistema-digital/front_end)

## Executar o Backend localmente

### Pré-requisitos

- Java 21
- Git
- PostgreSQL configurado
- Acesso ao projeto Supabase

O projeto possui Maven Wrapper, portanto não exige instalação global do Maven.

### 1. Clonar o repositório

```bash
git clone https://github.com/CSV-Sistema-digital/sistema-grafica.git

cd sistema-grafica/backend
```

### 2. Configurar variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DB_URL_CSV` | Sim | URL JDBC do PostgreSQL |
| `DB_USERNAME_CSV` | Sim | Usuário do banco |
| `DB_PASSWORD_CSV` | Sim | Senha do banco |
| `SUPABASE_URL` | Sim | URL HTTPS do Supabase |
| `FRONTEND_ORIGINS` | Não | Origens autorizadas no CORS |
| `PORT` | Não | Porta HTTP, padrão 8080 |

Exemplo:

```text
DB_URL_CSV=jdbc:postgresql://HOST_DO_BANCO:5432/postgres?sslmode=require

DB_USERNAME_CSV=SEU_USUARIO

DB_PASSWORD_CSV=SUA_SENHA

SUPABASE_URL=https://SEU-PROJETO.supabase.co

FRONTEND_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

**Não publique senhas ou credenciais privadas no GitHub.**

### 3. Executar a aplicação

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Linux ou macOS:

```bash
./mvnw spring-boot:run
```

### 4. Testar a API

Abra no navegador:

```text
http://localhost:8080/v1/produtos
```

A resposta deverá conter os produtos ativos cadastrados no PostgreSQL.

> O projeto utiliza `spring.jpa.hibernate.ddl-auto: none`. Portanto, as tabelas devem existir previamente no banco de dados.

## Executar o Frontend localmente

Clone o repositório:

```bash
git clone https://github.com/CSV-Sistema-digital/front_end.git
```

Abra a pasta no VS Code.

Configure o arquivo `js/config.js`:

```javascript
export const config = {
  apiUrl: "http://localhost:8080",
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabasePublicKey: "SUA_CHAVE_PUBLICA"
};
```

Abra o `index.html` utilizando a extensão Live Server, preferencialmente na porta `5500`.

O endereço local será:

```text
http://localhost:5500
```

Configure os redirecionamentos de autenticação em **Supabase → Authentication → URL Configuration**.

## Deploy em produção

### Backend — Render

O Backend está hospedado no Render.

**URL:**

https://csv-grafica-digital.onrender.com

Configurações:

| Configuração | Valor |
| --- | --- |
| Repositório | `CSV-Sistema-digital/sistema-grafica` |
| Branch | `main` |
| Runtime | Docker |
| Root Directory | `backend` |
| Dockerfile | `./Dockerfile` |
| Plano | Free |

Variáveis utilizadas:

```text
DB_URL_CSV
DB_USERNAME_CSV
DB_PASSWORD_CSV
SUPABASE_URL
FRONTEND_ORIGINS
```

Origem autorizada do Frontend:

```text
https://csv-sistema-digital.vercel.app
```

O Render utiliza o Dockerfile para construir e iniciar a aplicação Java 21.

> Como o projeto utiliza o plano gratuito, o serviço pode entrar em repouso após um período sem requisições. O primeiro acesso pode levar mais tempo para responder.

### Frontend — Vercel

O Frontend está hospedado na Vercel.

**URL:**

https://csv-sistema-digital.vercel.app

Repositório:

https://github.com/CSV-Sistema-digital/front_end

Configurações:

- Aplicação estática em HTML, CSS e JavaScript.
- Framework Preset: Other.
- Sem necessidade de compilação.
- Comunicação com a API via HTTPS e Fetch API.

O arquivo `js/config.js` deve apontar para a API hospedada:

```javascript
export const config = {
  apiUrl: "https://csv-grafica-digital.onrender.com",
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabasePublicKey: "SUA_CHAVE_PUBLICA"
};
```

### Banco de dados — Supabase

O PostgreSQL está hospedado no Supabase.

O projeto utiliza as seguintes entidades principais:

| Entidade | Finalidade |
| --- | --- |
| Cliente | Dados cadastrais dos clientes |
| Produto | Catálogo de produtos |
| Pedido | Registro das compras |
| ItemPedido | Produtos e quantidades de cada pedido |
| Pagamento | Forma, valor e status do pagamento |

O Supabase Auth também é responsável pela autenticação dos usuários.

### Segurança

- Autenticação via Supabase Auth.
- JWT obrigatório nas operações protegidas.
- Validação de usuários no Spring Security.
- CORS configurado para origens autorizadas.
- Credenciais do banco armazenadas em variáveis de ambiente.
- Senhas e chaves privadas não devem ser enviadas ao Frontend.

A chave pública do Supabase não substitui as regras de autorização. As políticas RLS e permissões das tabelas expostas devem ser verificadas antes de disponibilizar o sistema publicamente.

## Fluxo de funcionamento do sistema

```text
1. Cliente acessa a loja
          |
          v
2. Consulta o catálogo de produtos
          |
          v
3. Adiciona produtos ao carrinho
          |
          v
4. Realiza cadastro ou login
          |
          v
5. Confirma seus dados cadastrais
          |
          v
6. Solicita a prévia do pedido
          |
          v
7. Confirma os preços e quantidades
          |
          v
8. Seleciona a forma de pagamento
          |
          v
9. Backend registra o pedido
          |
          v
10. Cliente confirma o pagamento simulado
          |
          v
11. Consulta o histórico de pedidos
```

## Roteiro de demonstração acadêmica

Para apresentar o projeto, recomenda-se:

1. Acessar o Frontend hospedado na Vercel.
2. Demonstrar a listagem e a pesquisa de produtos.
3. Adicionar produtos ao carrinho.
4. Modificar quantidades e remover itens.
5. Demonstrar o login ou cadastro.
6. Consultar e atualizar o perfil.
7. Acessar a prévia do pedido.
8. Selecionar uma forma de pagamento.
9. Confirmar o pedido.
10. Realizar o pagamento simulado.
11. Consultar o histórico de pedidos.
12. Mostrar o registro persistido no PostgreSQL.

A publicação do projeto não garante, por si só, que todos os fluxos estejam funcionando. Recomenda-se testar os serviços antes da apresentação.

## Operações CRUD

O sistema implementa diferentes operações de persistência de dados:

| Operação | Exemplo |
| --- | --- |
| Create | Criação de pedidos |
| Read | Consulta de produtos, clientes e pedidos |
| Update | Atualização do perfil do cliente |
| Delete | Não existe endpoint DELETE na API Web atual |

A remoção de itens do carrinho ocorre no armazenamento local do navegador e não representa uma exclusão no banco de dados.

## Organização e colaboração

O desenvolvimento é organizado utilizando Git e GitHub.

Fluxo recomendado:

1. Criar uma branch para cada funcionalidade ou correção.
2. Implementar e testar as alterações.
3. Realizar commit.
4. Enviar a branch para o GitHub.
5. Criar um Pull Request.
6. Revisar e realizar o merge na `main`.

Exemplo:

```bash
git switch main

git pull origin main

git switch -c feature/nova-funcionalidade

git add .

git commit -m "feat: implementa nova funcionalidade"

git push -u origin feature/nova-funcionalidade
```

## Finalidade acadêmica

Este projeto foi desenvolvido para fins acadêmicos, como parte do Trabalho Integrador da **Universidade Nove de Julho — UNINOVE**.

O objetivo é demonstrar conhecimentos de:

- Desenvolvimento Web Full Stack.
- Programação Orientada a Objetos.
- Desenvolvimento de APIs REST.
- Modelagem e persistência de dados.
- Autenticação e autorização.
- Integração entre sistemas.
- Versionamento de código.
- Hospedagem de aplicações.

**O processamento de pagamentos é exclusivamente demonstrativo e não envolve transações financeiras reais.**
