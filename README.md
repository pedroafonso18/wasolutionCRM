# WaSolCRM

## 📝 Descrição

**WaSolCRM** é um sistema CRM básico desenvolvido em Go, inspirado no projeto [wasolution](https://github.com/pedroafonso18/wasolution). Ele integra funcionalidades essenciais de autenticação, gerenciamento de usuários e instâncias do WhatsApp, além de interface web simples para login, registro e painel principal. O sistema é extensível e serve como base para integrações com APIs de WhatsApp, gerenciamento de webhooks e operações administrativas.

---

## 🚀 Funcionalidades

- Cadastro e login de usuários com autenticação JWT
- Diferenciação entre usuários comuns e administradores
- Interface web para login, registro e painel principal
- Integração com banco de dados PostgreSQL
- Gerenciamento de instâncias do WhatsApp (criar, conectar, desconectar, excluir)
- Envio de mensagens via instâncias do WhatsApp
- Configuração dinâmica de webhooks para instâncias
- Estrutura modular e fácil de expandir

---

## 🛠️ Tecnologias Utilizadas

- **Go** (versão 1.24+)
- **Gin** (framework web)
- **PostgreSQL** (banco de dados)
- **JWT** (autenticação)
- **HTML/CSS/JS** (interface web)
- **godotenv** (carregamento de variáveis de ambiente)
- **lib/pq** (driver PostgreSQL)

---

## 📋 Pré-requisitos

- Go 1.24 ou superior
- PostgreSQL em execução
- Variáveis de ambiente configuradas (ver seção de configuração)

---

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
DB_URL=postgres://usuario:senha@endereco:porta/nome_do_banco?sslmode=disable
JWT_KEY=sua_chave_jwt
WASOLUTION_KEY=sua_chave_wasolution
```

---

## 🏗️ Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd WaSolCRM
   ```

2. **Instale as dependências:**
   ```bash
   go mod tidy
   ```

3. **Configure o banco de dados e variáveis de ambiente (.env).**

4. **Execute o servidor:**
   ```bash
   go run ./cmd/WaSolCRM/main.go
   ```

5. **Acesse a interface web:**
   - [http://localhost:8080/login](http://localhost:8080/login)
   - [http://localhost:8080/register](http://localhost:8080/register)
   - [http://localhost:8080/](http://localhost:8080/) (após login)

---

## 🌐 Endpoints Principais

- `GET /login` — Página de login
- `POST /login` — Autenticação de usuário
- `GET /register` — Página de registro
- `POST /register` — Cadastro de novo usuário
- `GET /` — Página principal (protegida)
- **APIs internas** (em desenvolvimento): gerenciamento de instâncias WhatsApp, envio de mensagens, configuração de webhooks

---

## 🗄️ Banco de Dados

O sistema utiliza PostgreSQL. A conexão é configurada via variável `DB_URL`. O banco armazena informações de usuários e pode ser expandido para armazenar instâncias e logs.

---

## 🔒 Segurança

- Autenticação via JWT (token armazenado em cookie)
- Middleware de proteção para rotas autenticadas
- Diferenciação de permissões para administradores

---

## 🖥️ Interface Web

- **/login:** Formulário de login
- **/register:** Formulário de cadastro (com opção de administrador)
- **/**: Painel principal (apenas usuários autenticados)

---

## 📦 Estrutura do Projeto

```
WaSolCRM/
│
├── cmd/WaSolCRM/main.go         # Ponto de entrada da aplicação
├── config/config.go             # Carregamento de variáveis de ambiente
├── internal/
│   ├── api/                     # Integração com APIs externas (WhatsApp)
│   ├── auth/                    # Lógica de autenticação e middleware
│   ├── database/                # Conexão com banco de dados
│   └── routes/                  # Definição das rotas HTTP
├── web/templates/               # Templates HTML para interface web
├── go.mod / go.sum              # Gerenciamento de dependências
└── .env                         # Variáveis de ambiente (não versionado)
```

---

## 📚 Inspiração

Este projeto foi inspirado e utiliza conceitos do [wasolution](https://github.com/pedroafonso18/wasolution), especialmente na padronização de integração com APIs de WhatsApp e gerenciamento de instâncias.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

## 📄 Licença

Este projeto está sob a licença MIT. 