📨 Exemplos de Uso da API Messages
1. Criar Mensagem para Todos os Usuários

POST /messages
Content-Type: application/json

{
  "createdByAdminId": 1,
  "createdByAdminName": "Admin System",
  "senderRole": "admin",
  "targetType": "all_users",
  "title": "Manutenção Programada",
  "message": "O sistema estará em manutenção no dia 30/10 das 02h às 04h. Planeje suas viagens com antecedência.",
  "category": "maintenance",
  "priority": "high",
  "isDismissible": true,
  "requiresAcknowledgment": false,
  "sendImmediately": true,
  "icon": "tools",
  "iconColor": "#FF9800",
  "tags": ["manutenção", "sistema"]
}

2. Criar Mensagem para Usuário Específico

POST /messages

{
  "createdByAdminId": 1,
  "createdByAdminName": "Suporte Técnico",
  "senderRole": "admin",
  "targetType": "specific_user",
  "targetUserId": 123,
  "title": "Verificação de Documentos",
  "message": "Seus documentos foram aprovados! Você já pode começar a dirigir.",
  "category": "update",
  "priority": "high",
  "isDismissible": true,
  "requiresAcknowledgment": true,
  "sendImmediately": true,
  "actionButton": {
    "text": "Ver Detalhes",
    "action": "open_modal"
  },
  "icon": "check-circle",
  "iconColor": "#4CAF50"
}

3. Criar Mensagem Agendada para Grupo de Usuários

POST /messages

{
  "createdByAdminId": 1,
  "createdByAdminName": "Marketing",
  "senderRole": "admin",
  "targetType": "user_group",
  "targetUserIds": [101, 102, 103, 104, 105],
  "title": "Promoção Especial! 🎉",
  "message": "Ganhe 20% de desconto nas suas próximas 5 viagens! Válido até 31/10.",
  "category": "promotion",
  "priority": "medium",
  "isDismissible": true,
  "requiresAcknowledgment": false,
  "sendImmediately": false,
  "scheduledFor": "2025-10-28T08:00:00Z",
  "expiresAt": "2025-10-31T23:59:59Z",
  "imageUrl": "https://cdn.example.com/promo-banner.jpg",
  "actionButton": {
    "text": "Usar Promoção",
    "link": "/promotions/halloween2025"
  },
  "icon": "gift",
  "iconColor": "#E91E63",
  "tags": ["promoção", "desconto", "halloween"]
}

4. Criar Mensagem por Role (Motoristas ou Passageiros)

POST /messages

{
  "createdByAdminId": 1,
  "createdByAdminName": "Admin",
  "senderRole": "system",
  "targetType": "role_based",
  "targetRole": "driver",
  "title": "Nova Funcionalidade para Motoristas",
  "message": "Agora você pode ver a rota otimizada antes de aceitar a corrida!",
  "category": "update",
  "priority": "medium",
  "isDismissible": true,
  "sendImmediately": true,
  "icon": "map",
  "iconColor": "#2196F3"
}

5. Criar Alerta Crítico

POST /messages

{
  "createdByAdminId": 1,
  "createdByAdminName": "Segurança",
  "senderRole": "system",
  "targetType": "all_users",
  "title": "⚠️ Alerta de Segurança",
  "message": "Detectamos atividade suspeita em sua conta. Por favor, altere sua senha imediatamente.",
  "category": "alert",
  "priority": "high",
  "isDismissible": false,
  "requiresAcknowledgment": true,
  "sendImmediately": true,
  "actionButton": {
    "text": "Alterar Senha",
    "action": "change_password"
  },
  "icon": "alert-triangle",
  "iconColor": "#F44336"
}

6. Buscar Mensagens Ativas de um Usuário

// Todas as mensagens ativas
GET /messages/user/123/active

// Filtrar por categoria
GET /messages/user/123/active?category=alert

// Filtrar por prioridade
GET /messages/user/123/active?priority=high

// Apenas não lidas
GET /messages/user/123/active?unreadOnly=true

// Múltiplos filtros
GET /messages/user/123/active?category=alert&priority=high&unreadOnly=true

7. Marcar Mensagem como Lida

POST /messages/456/read

{
  "userId": 123,
  "deviceInfo": {
    "platform": "android",
    "version": "1.2.3",
    "model": "Samsung Galaxy S21"
  }
}

8. Confirmar Leitura de Mensagem que Requer Confirmação

POST /messages/456/acknowledge

{
  "userId": 123
}

9. Verificar Status de Leitura

GET /messages/456/read-status/123

// Resposta:
{
  "id": 789,
  "message": { "id": 456, "title": "..." },
  "user": { "id": 123, "name": "..." },
  "isRead": true,
  "readAt": "2025-10-25T14:30:00Z",
  "acknowledgedAt": "2025-10-25T14:31:00Z",
  "deviceInfo": {
    "platform": "android",
    "version": "1.2.3"
  },
  "createdAt": "2025-10-25T14:30:00Z"
}

10. Buscar Mensagens que Requerem Confirmação

GET /messages/user/123/requiring-acknowledgment

// Retorna apenas mensagens não confirmadas que exigem confirmação

11. Incrementar Contador de Visualizações

PUT /messages/456/view
// Retorna 204 No Content

12. Atualizar Mensagem

PUT /messages/456

{
  "title": "Título Atualizado",
  "message": "Mensagem atualizada com novas informações",
  "priority": "low",
  "expiresAt": "2025-12-31T23:59:59Z"
}

13. Ativar/Desativar Mensagem

// Ativar
PUT /messages/456/activate

// Desativar
PUT /messages/456/deactivate

14. Publicar Mensagem Agendada

POST /messages/456/publish

// Publica imediatamente uma mensagem que estava agendada

15. Gerenciar Tags

// Adicionar tags
POST /messages/456/tags
{
  "tags": ["urgente", "importante", "ação-requerida"]
}

// Remover tags
DELETE /messages/456/tags
{
  "tags": ["urgente"]
}

16. Buscar por Tipo de Destinatário

GET /messages/target-type/all_users
GET /messages/target-type/specific_user
GET /messages/target-type/user_group
GET /messages/target-type/role_based

17. Buscar por Categoria e Prioridade

GET /messages/filter/category-priority?category=alert&priority=high
GET /messages/filter/category-priority?category=promotion&priority=medium

18. Buscar Mensagens Agendadas Pendentes

GET /messages/scheduled/pending

// Retorna mensagens que deveriam ter sido enviadas mas ainda não foram

19. Buscar Mensagens Expiradas mas Ainda Ativas

GET /messages/expired/active

// Útil para limpeza: encontra mensagens que expiraram mas não foram desativadas

20. Estatísticas de uma Mensagem

GET /messages/456/stats

// Resposta:
{
  "message": { "id": 456, "title": "..." },
  "recipientCount": 1000,
  "viewCount": 850,
  "readCount": 720,
  "acknowledgmentCount": 650,
  "readPercentage": 72.00,
  "acknowledgmentPercentage": 65.00
}

21. Estatísticas Gerais do Sistema

GET /messages/stats/general

// Resposta:
{
  "totalMessages": 150,
  "activeMessages": 45,
  "scheduledMessages": 10,
  "expiredMessages": 5,
  "totalReads": 12500,
  "totalAcknowledgments": 8900,
  "averageReadRate": 83.33,
  "byCategory": {
    "info": 60,
    "warning": 30,
    "alert": 20,
    "update": 25,
    "maintenance": 10,
    "promotion": 5
  },
  "byPriority": {
    "low": 80,
    "medium": 50,
    "high": 20
  }
}

22. Buscar por Código da Mensagem

GET /messages/code/MSG-2025-00123

// Útil para rastreamento e suporte

23. Soft Delete e Restore

// Deletar (soft delete)
DELETE /messages/456
// Retorna 204 No Content

// Restaurar
PUT /messages/456/restore

24. Mensagem com Anexos

POST /messages

{
  "createdByAdminId": 1,
  "createdByAdminName": "Suporte",
  "senderRole": "admin",
  "targetType": "specific_user",
  "targetUserId": 123,
  "title": "Documentos Necessários",
  "message": "Segue em anexo a lista de documentos necessários para ativação.",
  "category": "info",
  "priority": "medium",
  "sendImmediately": true,
  "attachments": [
    {
      "url": "https://cdn.example.com/docs/lista-documentos.pdf",
      "type": "pdf",
      "name": "Lista de Documentos.pdf"
    },
    {
      "url": "https://cdn.example.com/docs/modelo-cnh.jpg",
      "type": "image",
      "name": "Modelo CNH.jpg"
    }
  ]
}

25. Mensagem Recorrente

POST /messages

{
  "createdByAdminId": 1,
  "createdByAdminName": "Sistema",
  "senderRole": "system",
  "targetType": "all_users",
  "title": "Lembrete Semanal: Complete seu Perfil",
  "message": "Mantenha seus dados atualizados para melhor experiência!",
  "category": "info",
  "priority": "low",
  "sendImmediately": false,
  "scheduledFor": "2025-10-28T09:00:00Z",
  "repeatType": "weekly",
  "repeatUntil": "2025-12-31T23:59:59Z",
  "isDismissible": true
}

🔄 Fluxo Completo de Uso:

// 1. Admin cria mensagem
POST /messages → { id: 456, messageCode: "MSG-2025-00123" }

// 2. Usuário busca suas mensagens ativas
GET /messages/user/123/active → [...mensagens...]

// 3. Usuário visualiza a mensagem (incrementa view count)
PUT /messages/456/view

// 4. Usuário marca como lida
POST /messages/456/read → { isRead: true, readAt: "..." }

// 5. Se requer confirmação, usuário confirma
POST /messages/456/acknowledge → { acknowledgedAt: "..." }

// 6. Admin verifica estatísticas
GET /messages/456/stats → { readPercentage: 85, ... }

// 7. Quando expirar, admin pode desativar
PUT /messages/456/deactivate