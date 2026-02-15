# Chat Identify API - Documentação

## Visão Geral

O módulo **Chat Identify** gerencia identificadores únicos de conversas entre usuários no sistema. Ele permite criar, consultar, atualizar e remover identificadores de chat que associam remetentes, destinatários e solicitações de clientes.

## Entidade ChatIdentify

A entidade representa um identificador único para conversas entre usuários.

### Campos da Entidade

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `id` | number | Identificador único (auto-incrementado) | Sim |
| `id_sender` | number | ID do usuário remetente | Sim |
| `id_receiver` | number | ID do usuário destinatário | Sim |
| `id_client_request` | number | ID da solicitação do cliente | Não |
| `code` | string | Código único da conversa | Sim |
| `user` | User | Relação com a entidade User | Sim |
| `created_at` | Date | Data de criação | Automático |
| `updated_at` | Date | Data de última atualização | Automático |

---

## Endpoints

### Base URL
```
http://[address]/chat-identify
```

---

### 1. Criar Chat Identify

Cria um novo identificador de chat entre dois usuários.

**Endpoint:** `POST /chat-identify`

**Autenticação:** Requerida (JWT)

**Roles:** DRIVER, CLIENT, ADMIN

**Request Body:**
```json
{
  "id_sender": 1,
  "id_receiver": 2,
  "id_client_request": 10,
  "code": "CHAT-2026-001",
  "id_user": 1
}
```

**Validações:**
- `id_sender`: número obrigatório
- `id_receiver`: número obrigatório
- `id_client_request`: número opcional
- `code`: string obrigatória
- `id_user`: número obrigatório (referência ao usuário)

**Exemplo de Resposta (201 Created):**
```json
{
  "id": 1,
  "id_sender": 1,
  "id_receiver": 2,
  "id_client_request": 10,
  "code": "CHAT-2026-001",
  "user": {
    "id": 1
  },
  "created_at": "2026-01-03T10:30:00.000Z",
  "updated_at": "2026-01-03T10:30:00.000Z"
}
```

---

### 2. Listar Todos os Chat Identifies

Retorna todos os identificadores de chat do sistema.

**Endpoint:** `GET /chat-identify`

**Autenticação:** Requerida (JWT)

**Roles:** ADMIN

**Exemplo de Resposta (200 OK):**
```json
[
  {
    "id": 1,
    "id_sender": 1,
    "id_receiver": 2,
    "id_client_request": 10,
    "code": "CHAT-2026-001",
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@example.com"
    },
    "created_at": "2026-01-03T10:30:00.000Z",
    "updated_at": "2026-01-03T10:30:00.000Z"
  }
]
```

---

### 3. Buscar por ID

Retorna um chat identify específico pelo ID.

**Endpoint:** `GET /chat-identify/:id`

**Autenticação:** Requerida (JWT)

**Roles:** DRIVER, CLIENT, ADMIN

**Parâmetros:**
- `id` (path): ID do chat identify

**Exemplo de Requisição:**
```
GET /chat-identify/1
```

**Exemplo de Resposta (200 OK):**
```json
{
  "id": 1,
  "id_sender": 1,
  "id_receiver": 2,
  "id_client_request": 10,
  "code": "CHAT-2026-001",
  "user": {
    "id": 1,
    "name": "João Silva"
  },
  "created_at": "2026-01-03T10:30:00.000Z",
  "updated_at": "2026-01-03T10:30:00.000Z"
}
```

**Erro (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "ChatIdentify com ID 999 não encontrado",
  "error": "Not Found"
}
```

---

### 4. Buscar por Código

Retorna um chat identify pelo código único.

**Endpoint:** `GET /chat-identify/code/:code`

**Autenticação:** Requerida (JWT)

**Roles:** DRIVER, CLIENT, ADMIN

**Parâmetros:**
- `code` (path): Código único do chat

**Exemplo de Requisição:**
```
GET /chat-identify/code/CHAT-2026-001
```

**Exemplo de Resposta (200 OK):**
```json
{
  "id": 1,
  "id_sender": 1,
  "id_receiver": 2,
  "id_client_request": 10,
  "code": "CHAT-2026-001",
  "user": {
    "id": 1,
    "name": "João Silva"
  },
  "created_at": "2026-01-03T10:30:00.000Z",
  "updated_at": "2026-01-03T10:30:00.000Z"
}
```

---

### 5. Buscar por Usuário

Retorna todos os chat identifies onde o usuário é remetente ou destinatário.

**Endpoint:** `GET /chat-identify/user/:id_user`

**Autenticação:** Requerida (JWT)

**Roles:** DRIVER, CLIENT, ADMIN

**Parâmetros:**
- `id_user` (path): ID do usuário

**Exemplo de Requisição:**
```
GET /chat-identify/user/1
```

**Exemplo de Resposta (200 OK):**
```json
[
  {
    "id": 1,
    "id_sender": 1,
    "id_receiver": 2,
    "code": "CHAT-2026-001",
    "user": { "id": 1 },
    "created_at": "2026-01-03T10:30:00.000Z"
  },
  {
    "id": 2,
    "id_sender": 3,
    "id_receiver": 1,
    "code": "CHAT-2026-002",
    "user": { "id": 3 },
    "created_at": "2026-01-03T11:00:00.000Z"
  }
]
```

---

### 6. Buscar por Solicitação de Cliente

Retorna todos os chat identifies associados a uma solicitação específica.

**Endpoint:** `GET /chat-identify/client-request/:id_client_request`

**Autenticação:** Requerida (JWT)

**Roles:** DRIVER, CLIENT, ADMIN

**Parâmetros:**
- `id_client_request` (path): ID da solicitação do cliente

**Exemplo de Requisição:**
```
GET /chat-identify/client-request/10
```

**Exemplo de Resposta (200 OK):**
```json
[
  {
    "id": 1,
    "id_sender": 1,
    "id_receiver": 2,
    "id_client_request": 10,
    "code": "CHAT-2026-001",
    "user": { "id": 1 },
    "created_at": "2026-01-03T10:30:00.000Z"
  }
]
```

---

### 7. Atualizar Chat Identify

Atualiza as informações de um chat identify existente.

**Endpoint:** `PUT /chat-identify/:id`

**Autenticação:** Requerida (JWT)

**Roles:** DRIVER, CLIENT, ADMIN

**Parâmetros:**
- `id` (path): ID do chat identify

**Request Body (parcial):**
```json
{
  "code": "CHAT-2026-001-UPDATED",
  "id_client_request": 15
}
```

**Exemplo de Resposta (200 OK):**
```json
{
  "id": 1,
  "id_sender": 1,
  "id_receiver": 2,
  "id_client_request": 15,
  "code": "CHAT-2026-001-UPDATED",
  "user": { "id": 1 },
  "created_at": "2026-01-03T10:30:00.000Z",
  "updated_at": "2026-01-03T12:00:00.000Z"
}
```

---

### 8. Deletar Chat Identify

Remove um chat identify do sistema.

**Endpoint:** `DELETE /chat-identify/:id`

**Autenticação:** Requerida (JWT)

**Roles:** ADMIN

**Parâmetros:**
- `id` (path): ID do chat identify

**Exemplo de Requisição:**
```
DELETE /chat-identify/1
```

**Exemplo de Resposta (200 OK):**
```json
{}
```

---

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso na operação |
| 201 | Recurso criado com sucesso |
| 400 | Erro de validação dos dados enviados |
| 401 | Não autenticado (token inválido/ausente) |
| 403 | Sem permissão (role inadequada) |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## Autenticação e Autorização

Todos os endpoints requerem autenticação via JWT (JSON Web Token).

### Como Autenticar

1. Faça login e obtenha o token JWT
2. Inclua o token no header das requisições:
   ```
   Authorization: Bearer <seu-token-jwt>
   ```

### Roles de Acesso

| Endpoint | DRIVER | CLIENT | ADMIN |
|----------|--------|--------|-------|
| POST / | ✅ | ✅ | ✅ |
| GET / | ❌ | ❌ | ✅ |
| GET /:id | ✅ | ✅ | ✅ |
| GET /code/:code | ✅ | ✅ | ✅ |
| GET /user/:id_user | ✅ | ✅ | ✅ |
| GET /client-request/:id | ✅ | ✅ | ✅ |
| PUT /:id | ✅ | ✅ | ✅ |
| DELETE /:id | ❌ | ❌ | ✅ |

---

## Casos de Uso

### 1. Iniciar Nova Conversa
Quando um cliente solicita uma corrida e um motorista aceita, o sistema cria um chat identify para gerenciar a comunicação.

```javascript
POST /chat-identify
{
  "id_sender": 1,      // ID do cliente
  "id_receiver": 5,    // ID do motorista
  "id_client_request": 42,
  "code": "CHAT-2026-042",
  "id_user": 1
}
```

### 2. Recuperar Conversas de um Usuário
Um usuário deseja ver todas as suas conversas ativas.

```javascript
GET /chat-identify/user/1
```

### 3. Encontrar Chat por Código
O sistema precisa localizar uma conversa específica usando o código único.

```javascript
GET /chat-identify/code/CHAT-2026-042
```

---

## Exemplos de Integração

### JavaScript/TypeScript (fetch)

```typescript
// Criar chat identify
const createChatIdentify = async () => {
  const response = await fetch('http://localhost:3000/chat-identify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      id_sender: 1,
      id_receiver: 2,
      id_client_request: 10,
      code: 'CHAT-2026-001',
      id_user: 1
    })
  });
  
  return await response.json();
};

// Buscar por usuário
const getChatsByUser = async (userId: number) => {
  const response = await fetch(`http://localhost:3000/chat-identify/user/${userId}`, {
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  });
  
  return await response.json();
};
```

### cURL

```bash
# Criar chat identify
curl -X POST http://localhost:3000/chat-identify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "id_sender": 1,
    "id_receiver": 2,
    "id_client_request": 10,
    "code": "CHAT-2026-001",
    "id_user": 1
  }'

# Buscar por código
curl -X GET http://localhost:3000/chat-identify/code/CHAT-2026-001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Atualizar
curl -X PUT http://localhost:3000/chat-identify/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"code": "CHAT-2026-001-UPDATED"}'
```

---

## Observações Importantes

1. **Código Único**: O campo `code` deve ser único para cada conversa. Recomenda-se usar um padrão como `CHAT-ANO-SEQUENCIAL`.

2. **Relacionamentos**: 
   - O campo `user` estabelece relação com a tabela de usuários
   - Use `id_user` no DTO para definir o usuário responsável pelo registro

3. **Timestamps Automáticos**: Os campos `created_at` e `updated_at` são gerenciados automaticamente pelo banco de dados.

4. **Soft Delete**: O sistema implementa remoção física. Para implementar soft delete, seria necessário adicionar um campo `deleted_at`.

5. **Performance**: As consultas incluem relações com a entidade User. Para melhor performance em produção, considere usar lazy loading ou DTOs específicos.

---

## Troubleshooting

### Erro 401 Unauthorized
- Verifique se o token JWT está sendo enviado corretamente
- Confirme se o token não expirou

### Erro 403 Forbidden
- Verifique se o usuário possui a role adequada para o endpoint
- Confirme se as roles estão configuradas corretamente no token

### Erro 404 Not Found
- Confirme se o ID ou código enviado existe no banco de dados
- Verifique a sintaxe da URL

### Erro 400 Bad Request
- Revise os dados enviados no body
- Confirme se todos os campos obrigatórios foram preenchidos
- Valide os tipos de dados (números devem ser numbers, não strings)

---

## Versão da API

**Versão Atual:** 1.0.0  
**Última Atualização:** 03/01/2026  
**Compatibilidade:** NestJS 9+, TypeORM 0.3+
