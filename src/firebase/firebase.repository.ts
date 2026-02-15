import { Inject, Injectable } from '@nestjs/common';
import { app } from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging/messaging';
import { Message, MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';
@Injectable()
export class FirebaseRepository {
  messaging: Messaging;

  constructor(@Inject('FIREBASE_APP') private firebaseApp: app.App) {
    this.messaging = firebaseApp.messaging();
  }

  sendMessage(notification: Message) {
    this.messaging.send(notification).then((response) => {
      console.log('sendMessage:', response);  
      console.log('NOTIFICACION ENVIADA');
    }).catch(e => {
      console.log('ERROR ENVIANDO NOTIFICACION: ', e);
    })
  }

  sendMessageToMultipleDevices(notification: MulticastMessage) {
    this.messaging.sendEachForMulticast(notification).then((response) => {
      console.log('sendMessageToMultipleDevices:', response);
      
      // Detalhar erros específicos
      if (response.failureCount > 0) {
        console.error('❌ FALHAS AO ENVIAR NOTIFICAÇÕES:');
        console.error(`✅ Sucessos: ${response.successCount}`);
        console.error(`❌ Falhas: ${response.failureCount}`);
        
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`\n📍 Erro no dispositivo [${idx}]:`);
            console.error(`   Código: ${resp.error?.code}`);
            console.error(`   Mensagem: ${resp.error?.message}`);
            console.error(`   Token usado: ${notification.tokens[idx]}`);
            
            // Identificar tipo específico de erro
            if (resp.error?.code === 'messaging/invalid-registration-token' || 
                resp.error?.code === 'messaging/registration-token-not-registered') {
              console.error(`   ⚠️ TOKEN INVÁLIDO OU EXPIRADO - Remover do banco de dados`);
            } else if (resp.error?.code === 'messaging/invalid-argument') {
              console.error(`   ⚠️ ARGUMENTOS INVÁLIDOS - Verificar payload da notificação`);
            } else if (resp.error?.code === 'messaging/third-party-auth-error') {
              console.error(`   ⚠️ ERRO DE AUTENTICAÇÃO - Verificar certificados APNs (iOS)`);
            }
          }
        });
      } else {
        console.log('✅ TODAS AS NOTIFICAÇÕES ENVIADAS COM SUCESSO');
      }
    }).catch(e => {
      console.error('❌ ERRO CRÍTICO ENVIANDO NOTIFICAÇÃO: ', e);
      console.error('Stack trace:', e.stack);
    })
  }
}