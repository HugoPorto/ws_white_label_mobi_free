# 📋 Client Requests API - Exemplos de Uso

## 🔐 Autenticação

Todos os endpoints requerem autenticação JWT. Adicione o token no header:

```http
Authorization: Bearer <seu_token_jwt>
```

---

## 📍 1. Obter Tempo e Distância

Calcula tempo e distância estimados entre origem e destino.

### Endpoint
```http
GET /client-requests/:origin_lat/:origin_lng/:destination_lat/:destination_lng/:type_vehicle
```

### Exemplo de Requisição
```bash
curl -X GET "http://localhost:3000/client-requests/-23.550520/-46.633308/-23.561890/-46.654765/true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Parâmetros
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| origin_lat | number | Latitude de origem |
| origin_lng | number | Longitude de origem |
| destination_lat | number | Latitude de destino |
| destination_lng | number | Longitude de destino |
| type_vehicle | boolean | true = carro, false = moto |

### Exemplo de Resposta
```json
{
  "distance": "5.2 km",
  "duration": "15 min",
  "distanceValue": 5200,
  "durationValue": 900
}
```

---

## 🆕 2. Criar Nova Solicitação

Cria uma nova solicitação de corrida/entrega.

### Endpoint
```http
POST /client-requests
```

### Exemplo de Requisição (Corrida Comum)
```bash
curl -X POST "http://localhost:3000/client-requests" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client": 123,
    "fare_offered": 25.50,
    "pickup_description": "Av. Paulista, 1000 - São Paulo, SP",
    "destination_description": "Rua Augusta, 500 - São Paulo, SP",
    "pickup_lat": -23.550520,
    "pickup_lng": -46.633308,
    "destination_lat": -23.561890,
    "destination_lng": -46.654765,
    "clientRequestType": "common"
  }'
```

### Exemplo de Requisição (Entrega de Pacote)
```bash
curl -X POST "http://localhost:3000/client-requests" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client": 123,
    "fare_offered": 35.00,
    "pickup_description": "Shopping Center Norte - São Paulo, SP",
    "destination_description": "Rua dos Pinheiros, 123 - São Paulo, SP",
    "pickup_lat": -23.515280,
    "pickup_lng": -46.625080,
    "destination_lat": -23.561890,
    "destination_lng": -46.654765,
    "clientRequestType": "delivery",
    "packageDetails": "Documentos importantes - envelope A4",
    "package_type": "documento",
    "packageWeight": 0.5,
    "fragile": false,
    "receiver_name": "João Silva",
    "receiver_phone": "+5511987654321",
    "sender_name": "Maria Santos",
    "sender_phone": "+5511912345678",
    "imagePackage": "https://example.com/package-image.jpg"
  }'
```

### Exemplo de Requisição (Corrida Agendada)
```bash
curl -X POST "http://localhost:3000/client-requests" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client": 123,
    "fare_offered": 45.00,
    "pickup_description": "Aeroporto de Guarulhos - Terminal 2",
    "destination_description": "Hotel Maksoud Plaza - São Paulo, SP",
    "pickup_lat": -23.432222,
    "pickup_lng": -46.469444,
    "destination_lat": -23.569000,
    "destination_lng": -46.652000,
    "clientRequestType": "scheduled",
    "scheduledFor": "2025-11-05T14:30:00.000Z"
  }'
```

### Exemplo de Requisição (Frete)
```bash
curl -X POST "http://localhost:3000/client-requests" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client": 123,
    "fare_offered": 150.00,
    "pickup_description": "Armazém Central - São Paulo, SP",
    "destination_description": "Centro de Distribuição - Guarulhos, SP",
    "pickup_lat": -23.550520,
    "pickup_lng": -46.633308,
    "destination_lat": -23.456789,
    "destination_lng": -46.523456,
    "clientRequestType": "freight",
    "packageDetails": "10 caixas com eletrônicos",
    "package_type": "caixa",
    "packageWeight": 150.5,
    "package_volume": 2.5,
    "fragile": true,
    "requires_signature": true
  }'
```

### Body Parameters
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id_client | number | ✅ | ID do cliente |
| fare_offered | number | ✅ | Valor oferecido |
| pickup_description | string | ✅ | Descrição do local de retirada |
| destination_description | string | ✅ | Descrição do destino |
| pickup_lat | number | ✅ | Latitude de retirada |
| pickup_lng | number | ✅ | Longitude de retirada |
| destination_lat | number | ✅ | Latitude de destino |
| destination_lng | number | ✅ | Longitude de destino |
| clientRequestType | string | ❌ | Tipo: 'common', 'scheduled', 'delivery', 'freight' |
| scheduledFor | datetime | ❌ | Data/hora agendada (para tipo 'scheduled') |
| packageDetails | string | ❌ | Detalhes do pacote (para 'delivery'/'freight') |
| package_type | string | ❌ | 'caixa', 'documento', 'mala', 'envelope', 'outro' |
| packageWeight | number | ❌ | Peso em kg |
| package_volume | number | ❌ | Volume em m³ |
| fragile | boolean | ❌ | Se é frágil |
| receiver_name | string | ❌ | Nome do destinatário |
| receiver_phone | string | ❌ | Telefone do destinatário |
| sender_name | string | ❌ | Nome do remetente |
| sender_phone | string | ❌ | Telefone do remetente |
| imagePackage | string | ❌ | URL da imagem do pacote |

### Exemplo de Resposta
```json
{
  "id": 456,
  "id_client": 123,
  "fare_offered": 25.50,
  "status": "CREATED",
  "created_at": "2025-11-01T10:30:00.000Z",
  "message": "Solicitação criada com sucesso"
}
```

---

## 🔍 3. Buscar Solicitação Criada

Busca uma solicitação com status CREATED.

### Endpoint
```http
GET /client-requests/created/:id_client_request
```

### Exemplo de Requisição
```bash
curl -X GET "http://localhost:3000/client-requests/created/456" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Exemplo de Resposta
```json
{
  "id": 456,
  "id_client": 123,
  "fare_offered": 25.50,
  "pickup_description": "Av. Paulista, 1000 - São Paulo, SP",
  "destination_description": "Rua Augusta, 500 - São Paulo, SP",
  "status": "CREATED",
  "updated_at": "2025-11-01T10:30:00.000Z",
  "pickup_lat": -23.550520,
  "pickup_lng": -46.633308,
  "destination_lat": -23.561890,
  "destination_lng": -46.654765,
  "fare_assigned": null,
  "id_driver_assigned": null,
  "client": {
    "name": "Maria",
    "lastname": "Silva",
    "phone": "+5511987654321",
    "image": "https://example.com/user.jpg"
  },
  "driver": null,
  "car": null
}
```

---

## 🚗 4. Buscar Solicitações por Motorista

Busca histórico de corridas finalizadas do motorista.

### Endpoint
```http
GET /client-requests/driver/assigned/:id_driver
```

### Exemplo de Requisição
```bash
curl -X GET "http://localhost:3000/client-requests/driver/assigned/789" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Exemplo de Resposta
```json
[
  {
    "id": 450,
    "id_client": 123,
    "fare_offered": 25.50,
    "pickup_description": "Av. Paulista, 1000",
    "destination_description": "Rua Augusta, 500",
    "status": "FINISHED",
    "created_at": "2025-11-01T09:00:00.000Z",
    "updated_at": "2025-11-01T09:45:00.000Z",
    "fare_assigned": 25.50,
    "id_driver_assigned": 789,
    "driver_rating": 4.8,
    "client_rating": 5.0,
    "client": {
      "name": "Maria",
      "lastname": "Silva",
      "phone": "+5511987654321",
      "image": "https://example.com/user.jpg"
    },
    "driver": {
      "name": "João",
      "lastname": "Santos",
      "phone": "+5511912345678",
      "image": "https://example.com/driver.jpg"
    },
    "vehicle": {
      "brand": "Toyota Corolla",
      "licensePlate": "ABC-1234",
      "color": "Prata"
    }
  }
]
```

---

## 👤 5. Buscar Solicitações por Cliente

Busca histórico de corridas finalizadas do cliente.

### Endpoint
```http
GET /client-requests/client/assigned/:id_client
```

### Exemplo de Requisição
```bash
curl -X GET "http://localhost:3000/client-requests/client/assigned/123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Exemplo de Resposta
```json
[
  {
    "id": 450,
    "id_client": 123,
    "fare_offered": 25.50,
    "pickup_description": "Av. Paulista, 1000",
    "destination_description": "Rua Augusta, 500",
    "status": "FINISHED",
    "created_at": "2025-11-01T09:00:00.000Z",
    "updated_at": "2025-11-01T09:45:00.000Z",
    "fare_assigned": 25.50,
    "id_driver_assigned": 789,
    "driver_rating": 4.8,
    "client_rating": 5.0,
    "client": {
      "name": "Maria",
      "lastname": "Silva",
      "phone": "+5511987654321",
      "image": "https://example.com/user.jpg"
    },
    "driver": {
      "name": "João",
      "lastname": "Santos",
      "phone": "+5511912345678",
      "image": "https://example.com/driver.jpg"
    },
    "vehicle": {
      "brand": "Toyota Corolla",
      "licensePlate": "ABC-1234",
      "color": "Prata"
    }
  }
]
```

---

## 📍 6. Buscar Solicitações Próximas

Busca solicitações criadas próximas à localização do motorista (raio de 5km).

### Endpoint
```http
GET /client-requests/:driver_lat/:driver_lng/:id_driver
```

### Exemplo de Requisição
```bash
curl -X GET "http://localhost:3000/client-requests/-23.550520/-46.633308/789" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Parâmetros
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| driver_lat | number | Latitude atual do motorista |
| driver_lng | number | Longitude atual do motorista |
| id_driver | number | ID do motorista |

### Exemplo de Resposta
```json
[
  {
    "id": 456,
    "id_client": 123,
    "fare_offered": 25.50,
    "pickup_description": "Av. Paulista, 1000",
    "destination_description": "Rua Augusta, 500",
    "status": "CREATED",
    "distance_km": 2.5,
    "client": {
      "name": "Maria",
      "lastname": "Silva",
      "phone": "+5511987654321",
      "image": "https://example.com/user.jpg"
    }
  }
]
```

---

## 🔎 7. Buscar Solicitação por ID

Busca uma solicitação específica com status ACCEPTED.

### Endpoint
```http
GET /client-requests/:id_client_request
```

### Exemplo de Requisição
```bash
curl -X GET "http://localhost:3000/client-requests/456" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Exemplo de Resposta
```json
{
  "id": 456,
  "id_client": 123,
  "fare_offered": 25.50,
  "pickup_description": "Av. Paulista, 1000 - São Paulo, SP",
  "destination_description": "Rua Augusta, 500 - São Paulo, SP",
  "status": "ACCEPTED",
  "updated_at": "2025-11-01T10:35:00.000Z",
  "pickup_lat": -23.550520,
  "pickup_lng": -46.633308,
  "destination_lat": -23.561890,
  "destination_lng": -46.654765,
  "fare_assigned": 25.50,
  "id_driver_assigned": 789,
  "client": {
    "name": "Maria",
    "lastname": "Silva",
    "phone": "+5511987654321",
    "image": "https://example.com/user.jpg"
  },
  "driver": {
    "name": "João",
    "lastname": "Santos",
    "phone": "+5511912345678",
    "image": "https://example.com/driver.jpg"
  },
  "car": {
    "brand": "Toyota Corolla",
    "plate": "ABC-1234",
    "color": "Prata"
  }
}
```

---

## ⏰ 8. Buscar Solicitação Expirada

Busca uma solicitação com status EXPIRED.

### Endpoint
```http
GET /client-requests/expired/:id
```

### Exemplo de Requisição
```bash
curl -X GET "http://localhost:3000/client-requests/expired/456" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Exemplo de Resposta
```json
{
  "id": 456,
  "id_client": 123,
  "fare_offered": 25.50,
  "status": "EXPIRED",
  "expired_at": "2025-11-01T10:40:00.000Z",
  "created_at": "2025-11-01T10:30:00.000Z"
}
```

---

## ✅ 9. Atribuir Motorista

Atribui um motorista à solicitação (aceita a corrida).

### Endpoint
```http
PUT /client-requests
```

### Exemplo de Requisição
```bash
curl -X PUT "http://localhost:3000/client-requests" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client_request": 456,
    "id_driver": 789,
    "fare_assigned": 25.50
  }'
```

### Body Parameters
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id_client_request | number | ✅ | ID da solicitação |
| id_driver | number | ✅ | ID do motorista |
| fare_assigned | number | ✅ | Valor aceito pelo motorista |

### Exemplo de Resposta
```json
{
  "message": "Motorista atribuído com sucesso",
  "id_client_request": 456,
  "id_driver": 789,
  "fare_assigned": 25.50,
  "status": "ACCEPTED"
}
```

---

## 🔄 10. Atualizar Status

Atualiza o status da solicitação.

### Endpoint
```http
PUT /client-requests/update_status
```

### Exemplo de Requisição (A Caminho)
```bash
curl -X PUT "http://localhost:3000/client-requests/update_status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client_request": 456,
    "status": "ON_THE_WAY"
  }'
```

### Exemplo de Requisição (Chegou)
```bash
curl -X PUT "http://localhost:3000/client-requests/update_status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client_request": 456,
    "status": "ARRIVED"
  }'
```

### Exemplo de Requisição (Viajando)
```bash
curl -X PUT "http://localhost:3000/client-requests/update_status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client_request": 456,
    "status": "TRAVELLING"
  }'
```

### Exemplo de Requisição (Finalizado)
```bash
curl -X PUT "http://localhost:3000/client-requests/update_status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client_request": 456,
    "status": "FINISHED"
  }'
```

### Exemplo de Requisição (Cancelado)
```bash
curl -X PUT "http://localhost:3000/client-requests/update_status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client_request": 456,
    "status": "CANCELLED"
  }'
```

### Exemplo de Requisição (Expirado)
```bash
curl -X PUT "http://localhost:3000/client-requests/update_status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client_request": 456,
    "status": "EXPIRED"
  }'
```

### Body Parameters
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id_client_request | number | ✅ | ID da solicitação |
| status | string | ✅ | Status: CREATED, ACCEPTED, ON_THE_WAY, ARRIVED, TRAVELLING, FINISHED, CANCELLED, EXPIRED |

### Exemplo de Resposta
```json
{
  "message": "Status atualizado com sucesso",
  "id_client_request": 456,
  "status": "ON_THE_WAY",
  "updated_at": "2025-11-01T10:40:00.000Z"
}
```

---

## ⭐ 11. Avaliar Motorista

Cliente avalia o motorista após a corrida.

### Endpoint
```http
PUT /client-requests/update_driver_rating
```

### Exemplo de Requisição
```bash
curl -X PUT "http://localhost:3000/client-requests/update_driver_rating" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client_request": 456,
    "driver_rating": 4.8
  }'
```

### Body Parameters
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id_client_request | number | ✅ | ID da solicitação |
| driver_rating | number | ✅ | Nota de 0 a 5 |

### Exemplo de Resposta
```json
{
  "message": "Avaliação do motorista registrada com sucesso",
  "id_client_request": 456,
  "driver_rating": 4.8
}
```

---

## ⭐ 12. Avaliar Cliente

Motorista avalia o cliente após a corrida.

### Endpoint
```http
PUT /client-requests/update_client_rating
```

### Exemplo de Requisição
```bash
curl -X PUT "http://localhost:3000/client-requests/update_client_rating" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "id_client_request": 456,
    "client_rating": 5.0
  }'
```

### Body Parameters
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id_client_request | number | ✅ | ID da solicitação |
| client_rating | number | ✅ | Nota de 0 a 5 |

### Exemplo de Resposta
```json
{
  "message": "Avaliação do cliente registrada com sucesso",
  "id_client_request": 456,
  "client_rating": 5.0
}
```

---

## 📊 Status Disponíveis

| Status | Descrição |
|--------|-----------|
| CREATED | Solicitação criada, aguardando motoristas |
| ACCEPTED | Motorista aceitou a corrida |
| ON_THE_WAY | Motorista a caminho do local de embarque |
| ARRIVED | Motorista chegou no local de embarque |
| STARTED | Corrida iniciada (passageiro embarcou) |
| TRAVELLING | Em viagem para o destino |
| FINISHED | Corrida finalizada |
| CANCELLED | Corrida cancelada |
| EXPIRED | Solicitação expirou (timeout) |

---

## 🚦 Códigos de Resposta HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## 🔧 Testando com Postman

### 1. Criar uma Collection
1. Abra o Postman
2. Clique em "New Collection"
3. Nomeie como "Client Requests API"

### 2. Configurar Autorização
1. Na collection, vá em "Authorization"
2. Selecione "Bearer Token"
3. Cole seu token JWT

### 3. Adicionar Variáveis
- `baseUrl`: `http://localhost:3000`
- `token`: `seu_token_jwt_aqui`

### 4. Importar Exemplos
Use os exemplos cURL acima e converta para Postman usando "Import" > "Raw text" > Cole o cURL.

---

## 🐛 Tratamento de Erros

### Exemplo de Erro 401 (Não Autenticado)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Token inválido ou expirado"
}
```

### Exemplo de Erro 404 (Não Encontrado)
```json
{
  "statusCode": 404,
  "message": "Solicitação não encontrada",
  "error": "Not Found"
}
```

### Exemplo de Erro 400 (Validação)
```json
{
  "statusCode": 400,
  "message": [
    "fare_offered deve ser um número positivo",
    "pickup_description não pode estar vazio"
  ],
  "error": "Bad Request"
}
```

---

## 📝 Notas Importantes

1. **Autenticação**: Todos os endpoints requerem JWT válido
2. **Roles**: Endpoints verificam se o usuário tem role adequada (CLIENT, DRIVER ou ADMIN)
3. **Timeout**: Solicitações expiram após 5 minutos sem aceitação
4. **Raio de Busca**: Motoristas veem solicitações em um raio de 5km
5. **Coordenadas**: Use formato decimal (-23.550520, não graus/minutos/segundos)

---

## 🚀 Fluxo Completo de Uma Corrida

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as API
    participant D as Motorista

    C->>API: POST /client-requests (Criar)
    API-->>C: 201 Created (id: 456)
    
    D->>API: GET /client-requests/:lat/:lng/:id (Buscar próximas)
    API-->>D: Lista de solicitações
    
    D->>API: PUT /client-requests (Aceitar)
    API-->>D: Status ACCEPTED
    API-->>C: Notificação motorista aceito
    
    D->>API: PUT /update_status (ON_THE_WAY)
    API-->>C: Motorista a caminho
    
    D->>API: PUT /update_status (ARRIVED)
    API-->>C: Motorista chegou
    
    D->>API: PUT /update_status (STARTED)
    API-->>C: Corrida iniciada
    
    D->>API: PUT /update_status (TRAVELLING)
    API-->>C: Em viagem
    
    D->>API: PUT /update_status (FINISHED)
    API-->>C: Corrida finalizada
    
    C->>API: PUT /update_driver_rating
    API-->>C: Avaliação registrada
    
    D->>API: PUT /update_client_rating
    API-->>D: Avaliação registrada
```

---

## 📚 Recursos Adicionais

- **Documentação Swagger**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`
- **WebSocket Events**: Consulte documentação de eventos em tempo real

---

**Última atualização**: 01/11/2025
**Versão da API**: 1.0.0
