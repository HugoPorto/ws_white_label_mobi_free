# WebSocket JWT Authentication - Documentação

## Visão Geral

O sistema de WebSocket agora requer autenticação JWT para todas as conexões e mensagens. Isso garante que apenas usuários autenticados possam se conectar e interagir via Socket.IO.

## Arquitetura

### Arquivos Criados/Modificados

1. **ws-jwt.guard.ts** - Guard para validação JWT em eventos WebSocket
2. **socket.gateway.ts** - Gateway atualizado com autenticação
3. **socket.module.ts** - Módulo configurado com JwtModule

## Como Conectar ao WebSocket

### 1. Opção 1: Token no Header Authorization (Recomendado)

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  extraHeaders: {
    Authorization: `Bearer ${seu_token_jwt}`
  }
});
```

### 2. Opção 2: Token como Query Parameter

```javascript
const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  query: {
    token: seu_token_jwt
  }
});
```

### 3. Opção 3: Token no Auth Object

```javascript
const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  auth: {
    token: seu_token_jwt
  }
});
```

## Exemplos de Integração

### React Native

```typescript
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Função para conectar ao socket
const connectSocket = async () => {
  const token = await AsyncStorage.getItem('jwt_token');
  
  if (!token) {
    console.error('Token não encontrado');
    return null;
  }

  const socket = io('http://seu-servidor:3000', {
    transports: ['websocket'],
    extraHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  // Eventos de conexão
  socket.on('connect', () => {
    console.log('✅ Conectado ao WebSocket:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Desconectado:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Erro de conexão:', error.message);
  });

  return socket;
};

// Exemplo de uso
const socket = await connectSocket();

// Enviar mensagem de chat
socket.emit('chat_message_client', {
  text: 'Olá!',
  id_client_request: 123
});

// Receber mensagens
socket.on('chat_message_emit_driver', (data) => {
  console.log('Mensagem do motorista:', data);
});
```

### JavaScript/TypeScript Puro

```typescript
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  connect() {
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      extraHeaders: {
        Authorization: `Bearer ${this.token}`
      }
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Conectado:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro:', error.message);
    });
  }

  // Atualizar posição do motorista
  updateDriverPosition(data: { id: number; lat: number; lng: number; typeVehicle: string }) {
    this.socket?.emit('change_driver_position', data);
  }

  // Enviar oferta de motorista
  sendDriverOffer(data: { id_client_request: number; client_request_type: string; accept: boolean }) {
    this.socket?.emit('new_driver_offer', data);
  }

  // Ouvir nova posição do motorista
  onNewDriverPosition(callback: (data: any) => void) {
    this.socket?.on('new_driver_position', callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

// Uso
const wsService = new WebSocketService('seu_token_jwt_aqui');
wsService.connect();
```

### Angular

```typescript
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    const token = localStorage.getItem('jwt_token');
    
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Emitir evento
  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  // Ouvir evento (retorna Observable)
  listen(event: string): Observable<any> {
    return new Observable(observer => {
      this.socket.on(event, (data: any) => {
        observer.next(data);
      });
    });
  }

  // Desconectar
  disconnect(): void {
    this.socket.disconnect();
  }
}

// Uso no componente
export class ChatComponent {
  constructor(private socketService: SocketService) {
    // Ouvir mensagens
    this.socketService.listen('chat_message_emit_driver').subscribe(data => {
      console.log('Nova mensagem:', data);
    });
  }

  sendMessage(message: string) {
    this.socketService.emit('chat_message_client', {
      text: message,
      id_client_request: 123
    });
  }
}
```

## Eventos Disponíveis

### Eventos de Envio (emit)

| Evento | Descrição | Dados |
|--------|-----------|-------|
| `message` | Mensagem genérica | `{ text: string }` |
| `change_driver_position` | Atualizar posição do motorista | `{ id, lat, lng, typeVehicle }` |
| `new_client_request` | Nova solicitação de cliente | `{ id_client_request }` |
| `new_driver_offer` | Nova oferta de motorista | `{ id_client_request, client_request_type, accept }` |
| `new_driver_assigned` | Motorista atribuído | `{ id_driver, id_client_request }` |
| `trip_change_driver_position` | Posição durante viagem | `{ id_client, lat, lng }` |
| `update_status_trip` | Atualizar status da viagem | `{ id_client_request, status }` |
| `pps_idp` | PPS IDP | dados variados |
| `pps_idp2` | PPS IDP2 | dados variados |
| `chat_message_driver` | Mensagem do motorista | dados da mensagem |
| `chat_message_client` | Mensagem do cliente | dados da mensagem |

### Eventos de Recebimento (on)

| Evento | Descrição | Dados Recebidos |
|--------|-----------|-----------------|
| `new_message` | Nova mensagem | dados da mensagem |
| `new_driver_position` | Nova posição do motorista | `{ id_socket, id, lat, lng, typeVehicle }` |
| `created_client_request` | Solicitação criada | `{ id_socket, id_client_request }` |
| `created_driver_offer/{id}` | Oferta criada | `{ id_socket, client_request_type, id_client_request, accept }` |
| `driver_assigned/{id}` | Motorista atribuído | `{ id_socket, id_client_request }` |
| `trip_new_driver_position/{id}` | Nova posição na viagem | `{ id_socket, lat, lng }` |
| `new_status_trip/{id}` | Novo status da viagem | `{ id_socket, status, id_client_request }` |
| `pps` | PPS emitido | dados do PPS |
| `pps2` | PPS2 emitido | dados do PPS2 |
| `chat_message_emit_driver` | Mensagem do motorista | dados da mensagem |
| `chat_message_emit_client` | Mensagem do cliente | dados da mensagem |
| `driver_disconnected` | Motorista desconectado | `{ id_socket }` |

## Tratamento de Erros

### Erro: "Token não fornecido"

**Causa:** O cliente tentou conectar sem enviar o token JWT.

**Solução:**
```javascript
// Certifique-se de enviar o token
const socket = io('http://localhost:3000', {
  extraHeaders: {
    Authorization: `Bearer ${token}`
  }
});
```

### Erro: "Token inválido ou expirado"

**Causa:** O token JWT está malformado, expirado ou inválido.

**Solução:**
1. Verifique se o token está correto
2. Faça login novamente para obter um novo token
3. Certifique-se que o token não expirou (validade: 2 dias)

```javascript
socket.on('connect_error', (error) => {
  if (error.message.includes('Token inválido')) {
    // Redirecionar para login
    console.log('Token inválido, faça login novamente');
  }
});
```

### Erro: Conexão rejeitada

**Causa:** Falha na autenticação durante a conexão.

**Solução:**
```javascript
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Servidor desconectou o cliente (provavelmente por falha de autenticação)
    console.log('Desconectado pelo servidor. Verifique seu token.');
  }
});
```

## Segurança

### Boas Práticas

1. **Nunca compartilhe o token JWT**
2. **Armazene o token de forma segura:**
   - React Native: AsyncStorage ou SecureStore
   - Web: HttpOnly cookies ou sessionStorage
3. **Renove o token antes de expirar**
4. **Use HTTPS/WSS em produção**
5. **Valide os dados recebidos do WebSocket**

### Exemplo de Renovação de Token

```typescript
// Verificar e renovar token antes de conectar
async function connectWithFreshToken() {
  let token = await getStoredToken();
  
  // Verifica se o token está próximo de expirar
  if (isTokenExpiringSoon(token)) {
    token = await refreshToken();
    await storeToken(token);
  }
  
  return io('http://localhost:3000', {
    extraHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
```

## Logs do Servidor

Quando um cliente conecta, o servidor registra:

```
[SocketGateway] Usuário autenticado conectado ao SOCKET: abc123
[SocketGateway] Usuário: João Silva (ID: 42)
```

Quando falha:

```
[SocketGateway] Conexão rejeitada - Token não fornecido: xyz789
[WsJwtGuard] Erro na autenticação WebSocket: Token inválido
```

## Testando com Postman/Insomnia

1. Criar nova conexão WebSocket
2. URL: `ws://localhost:3000`
3. Adicionar Header:
   ```
   Authorization: Bearer SEU_TOKEN_JWT
   ```
4. Conectar e testar eventos

## Migrando Código Existente

### Antes (sem autenticação):

```javascript
const socket = io('http://localhost:3000');
```

### Depois (com autenticação):

```javascript
const token = await getAuthToken(); // Sua função para obter o token
const socket = io('http://localhost:3000', {
  extraHeaders: {
    Authorization: `Bearer ${token}`
  }
});
```

## Acesso aos Dados do Usuário

Dentro dos handlers do gateway, você pode acessar os dados do usuário autenticado:

```typescript
@UseGuards(WsJwtGuard)
@SubscribeMessage('algum_evento')
handleAlgumEvento(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
  // Acessar dados do usuário
  const userId = client.data.user?.userId;
  const username = client.data.user?.username;
  const roles = client.data.user?.roles;
  
  console.log(`Usuário ${username} (${userId}) emitiu evento`);
}
```

## Troubleshooting

### Cliente não consegue conectar

1. Verifique se o token está sendo enviado corretamente
2. Confirme que o token não expirou
3. Verifique os logs do servidor
4. Teste o token em endpoints REST primeiro

### Conexão cai imediatamente

Provavelmente o token é inválido. Verifique:
- Token malformado
- Token expirado
- Secret do JWT incorreto

### Eventos não chegam

1. Confirme que o `@UseGuards(WsJwtGuard)` está no evento
2. Verifique se está autenticado
3. Confirme o nome correto do evento

---

## Suporte

Em caso de dúvidas ou problemas, verifique os logs do servidor para mais informações sobre falhas de autenticação.

**Versão:** 1.0.0  
**Data:** 03/01/2026
