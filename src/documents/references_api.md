📋 Exemplos de Uso da API de Documentos
1. CREATE - Criar Novo Documento
Endpoint: POST /documents

Headers:

{
  "Authorization": "Bearer {JWT_TOKEN}",
  "Content-Type": "application/json"
}

Body (Enviar CNH):

{
  "idVehicle": 5,
  "idUser": 12,
  "documentType": "DRIVER_LICENSE",
  "fileUrl": "https://storage.example.com/documents/cnh-12345.pdf",
  "fileName": "cnh-joao-silva.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "expirationDate": "2026-12-31",
  "notes": "CNH categoria AB"
}

Response (201 Created):

{
  "id": 47,
  "vehicle": {
    "id": 5,
    "licensePlate": "ABC-1234",
    "typeVehicle": "car"
  },
  "user": {
    "id": 12,
    "name": "João Silva",
    "email": "joao@example.com"
  },
  "documentType": "DRIVER_LICENSE",
  "status": "PENDING",
  "fileUrl": "https://storage.example.com/documents/cnh-12345.pdf",
  "fileName": "cnh-joao-silva.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "expirationDate": "2026-12-31",
  "notes": "CNH categoria AB",
  "isActive": true,
  "created_at": "2025-10-27T03:15:00.000Z",
  "updated_at": "2025-10-27T03:15:00.000Z"
}

2. READ - Buscar Documentos por Veículo
Endpoint: GET /documents/vehicle/5

Query Parameters (opcionais):

?onlyActive=true - Apenas documentos ativos
?onlyActive=false - Incluir inativos
Request:

GET /documents/vehicle/5?onlyActive=true
Authorization: Bearer {JWT_TOKEN}

Response (200 OK):

[
  {
    "id": 47,
    "documentType": "DRIVER_LICENSE",
    "status": "APPROVED",
    "fileUrl": "https://storage.example.com/documents/cnh-12345.pdf",
    "fileName": "cnh-joao-silva.pdf",
    "expirationDate": "2026-12-31",
    "reviewedAt": "2025-10-27T05:30:00.000Z",
    "reviewedBy": {
      "id": 1,
      "name": "Admin Sistema"
    },
    "created_at": "2025-10-27T03:15:00.000Z"
  },
  {
    "id": 48,
    "documentType": "VEHICLE_REGISTRATION",
    "status": "PENDING",
    "fileUrl": "https://storage.example.com/documents/crlv-abc1234.jpg",
    "fileName": "crlv-2024.jpg",
    "expirationDate": "2024-12-31",
    "created_at": "2025-10-27T03:20:00.000Z"
  }
]

3. READ - Buscar Documentos por Usuário
Endpoint: GET /documents/user/12

Request:

GET /documents/user/12?onlyActive=true
Authorization: Bearer {JWT_TOKEN}

Response (200 OK):

[
  {
    "id": 47,
    "vehicle": {
      "id": 5,
      "licensePlate": "ABC-1234"
    },
    "documentType": "DRIVER_LICENSE",
    "status": "APPROVED",
    "fileUrl": "https://storage.example.com/documents/cnh-12345.pdf"
  }
]

4. READ - Buscar Documentos Pendentes (Admin)
Endpoint: GET /documents/status/PENDING

Request:

GET /documents/status/PENDING
Authorization: Bearer {ADMIN_JWT_TOKEN}

Response (200 OK):

[
  {
    "id": 48,
    "vehicle": {
      "id": 5,
      "licensePlate": "ABC-1234"
    },
    "user": {
      "id": 12,
      "name": "João Silva"
    },
    "documentType": "VEHICLE_REGISTRATION",
    "status": "PENDING",
    "fileUrl": "https://storage.example.com/documents/crlv-abc1234.jpg",
    "created_at": "2025-10-27T03:20:00.000Z"
  }
]

5. UPDATE - Aprovar Documento (Admin)
Endpoint: PUT /documents/48/approve

Body:

{
  "reviewedBy": 1,
  "notes": "Documento válido e legível"
}

Response (200 OK):

{
  "id": 48,
  "documentType": "VEHICLE_REGISTRATION",
  "status": "APPROVED",
  "reviewedAt": "2025-10-27T06:00:00.000Z",
  "reviewedBy": {
    "id": 1,
    "name": "Admin Sistema"
  },
  "notes": "Documento válido e legível",
  "updated_at": "2025-10-27T06:00:00.000Z"
}

6. UPDATE - Rejeitar Documento (Admin)
Endpoint: PUT /documents/49/reject

Body:

{
  "reviewedBy": 1,
  "reason": "Documento ilegível. Por favor, envie uma foto mais nítida."
}

Response (200 OK):

{
  "id": 49,
  "documentType": "VEHICLE_PHOTO",
  "status": "REJECTED",
  "reviewedAt": "2025-10-27T06:05:00.000Z",
  "reviewedBy": {
    "id": 1,
    "name": "Admin Sistema"
  },
  "notes": "Documento ilegível. Por favor, envie uma foto mais nítida.",
  "updated_at": "2025-10-27T06:05:00.000Z"
}

7. UTILITY - Verificar se Veículo Está Totalmente Documentado
Endpoint: GET /documents/vehicle/5/is-fully-documented

Request:

GET /documents/vehicle/5/is-fully-documented
Authorization: Bearer {JWT_TOKEN}

Response (200 OK) - Documentado:

{
  "isFullyDocumented": true
}

Response (200 OK) - Faltam documentos:

{
  "isFullyDocumented": false
}

8. UTILITY - Obter Estatísticas (Admin)
Endpoint: GET /documents/statistics/summary

Request:

GET /documents/statistics/summary
Authorization: Bearer {ADMIN_JWT_TOKEN}

Response (200 OK):

{
  "total": 150,
  "pending": 23,
  "approved": 110,
  "rejected": 12,
  "expired": 5
}

9. UTILITY - Verificar Documentos Expirados (Admin)
Endpoint: POST /documents/check-expired

Request:

POST /documents/check-expired
Authorization: Bearer {ADMIN_JWT_TOKEN}

Response (200 OK):

{
  "expired": [
    {
      "id": 25,
      "documentType": "VEHICLE_REGISTRATION",
      "expirationDate": "2024-12-31",
      "status": "EXPIRED",
      "vehicle": {
        "id": 3,
        "licensePlate": "XYZ-9876"
      }
    }
  ],
  "count": 1
}

10. READ - Buscar Todos com Filtros (Admin)
Endpoint: GET /documents

Query Parameters:

?status=APPROVED
&documentType=DRIVER_LICENSE
&onlyActive=true

Request:

GET /documents?status=APPROVED&documentType=DRIVER_LICENSE&onlyActive=true
Authorization: Bearer {ADMIN_JWT_TOKEN}

Response (200 OK):

[
  {
    "id": 47,
    "documentType": "DRIVER_LICENSE",
    "status": "APPROVED",
    "fileUrl": "https://storage.example.com/documents/cnh-12345.pdf"
  }
]

11. DELETE - Desativar Documento
Endpoint: DELETE /documents/50/deactivate

Request:

DELETE /documents/50/deactivate
Authorization: Bearer {JWT_TOKEN}

Response (200 OK):

{
  "id": 50,
  "isActive": false,
  "updated_at": "2025-10-27T06:30:00.000Z"
}

🔑 Enums Disponíveis:
DocumentType:
VEHICLE_REGISTRATION - CRLV
DRIVER_LICENSE - CNH
INSURANCE - Seguro
VEHICLE_PHOTO - Foto do Veículo
INSPECTION - Vistoria
OTHER - Outros
DocumentStatus:
PENDING - Pendente
APPROVED - Aprovado
REJECTED - Rejeitado
EXPIRED - Expirado

🛡️ Controle de Acesso por Role:
Endpoint	ADMIN	DRIVER	CLIENT
POST /documents	❌	✅	✅
GET /documents/:id	✅	✅	✅
GET /documents (todos)	✅	❌	❌
PUT /:id/approve	✅	❌	❌
PUT /:id/reject	✅	❌	❌
DELETE /:id (permanente)	✅	❌	❌
GET /statistics/summary	✅	❌	❌