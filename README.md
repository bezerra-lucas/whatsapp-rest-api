# WhatsApp Rest Server

### Descrição:

Este script cria abas em um navegador headless com diversas instâncias do WhatsApp Web um servidor REST usando a biblioteca Express.js para gerenciar as requisições HTTP e a whatsapp-web.js para gerenciar as instâncias do WhatsApp.

------------------------

##### POST - /create

Cria um novo client do wweb.js passando a auth strategy como "new LocalAuth". Devolve ao cliente o código QRCode para autenticação.


Parâmetro:
 - id: string
  
------------------------

##### POST - /send-message

É utilizada para enviar uma mensagem para um contato específico no WhatsApp.

Parâmetros:
- id: identificador do cliente criado previamente pela rota "/create".
- number: número do telefone do contato que receberá a mensagem, no formato internacional (com o código do país e o código da área, sem o sinal de "+").
- message: mensagem que será enviada.