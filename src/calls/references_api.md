# 1. Criar chamado
POST /calls
{
  "userId": 101,
  "userEmail": "user@email.com",
  "title": "Problema com pagamento",
  "description": "Cartão recusado",
  "category": "payment",
  "priority": "high",
  "deviceInfo": {
    "platform": "android",
    "osVersion": "14.0"
  }
}

# 2. Buscar chamados do usuário (com filtros)
GET /calls/user/101?status=open&category=payment

# 3. Buscar chamados abertos
GET /calls/user/101/open

# 4. Atribuir a atendente
PUT /calls/1/assign
{
  "agentId": 50,
  "agentName": "João Silva"
}

# 5. Primeira resposta
POST /calls/1/first-response
{
  "response": "Olá! Estamos investigando..."
}

# 6. Adicionar notas internas
POST /calls/1/notes
{
  "notes": "Cliente relatou problema com gateway XYZ"
}

# 7. Adicionar tags
POST /calls/1/tags
{
  "tags": ["gateway-erro", "pagamento"]
}

# 8. Resolver
PUT /calls/1/resolve
{
  "resolution": "Problema era temporário, já normalizado"
}

# 9. Usuário avalia
POST /calls/1/rating
{
  "rating": 5,
  "feedback": "Excelente!"
}

# 10. Fechar
PUT /calls/1/close

# 11. Buscar por ticket
GET /calls/ticket/SUP-2024-00123

# 12. Buscar urgentes não atribuídos
GET /calls/urgent/unassigned

# 13. Buscar violações SLA
GET /calls/sla/violations

# 14. Filtrar por categoria e prioridade
GET /calls/filter/category-priority?category=technical&priority=high

# 15. Escalar
PUT /calls/1/escalate

# 16. Relacionar
PUT /calls/1/relate
{
  "relatedTicketId": 2
}

# 17. Estatísticas do chamado
GET /calls/1/stats
# Retorna: { responseTime: 15, resolutionTime: 2, ... }

# 18. Estatísticas gerais
GET /calls/stats/general
# Retorna: { total: 150, open: 23, avgResponseTime: 18, ... }

# 19. Atualizar visualização
PUT /calls/1/view

# 20. Soft delete
DELETE /calls/1

# 21. Restaurar
PUT /calls/1/restore