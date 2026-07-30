# 🔍 Relatório de Auditoria Técnica — AgendaZap

**Data da Auditoria:** 26/07/2026  
**Auditor:** Antigravity (AI Technical Auditor)  
**Stack Identificada:** Next.js 16 (backend API + frontend), PostgreSQL (Supabase), Drizzle ORM, Gemini AI, Evolution API (WhatsApp), Redis (Upstash), Mercado Pago / Asaas / AbacatePay

---

## 📊 Tabela Resumo

| Categoria | ✅ Implementado | 🟡 Parcial | ❌ Não Implementado | ⚠️ Desativado/Não Usado |
|---|---|---|---|---|
| **Inteligência Artificial** | 5 | 1 | 0 | 1 |
| **Agendamentos** | 4 | 1 | 3 | 0 |
| **Pagamentos** | 3 | 1 | 1 | 0 |
| **WhatsApp** | 1 | 1 | 0 | 0 |
| **Gestão** | 3 | 1 | 0 | 0 |
| **Relatórios** | 2 | 2 | 2 | 0 |
| **Segurança** | 3 | 0 | 1 | 0 |
| **Integrações** | 4 | 1 | 1 | 2 |
| **TOTAL** | **25** | **8** | **8** | **3** |

---

## 1. 🤖 Inteligência Artificial

### ✅ Atendimento automático 24h
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivos:** [index.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/ai/index.ts), [whatsapp/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/webhooks/whatsapp/route.ts)
- **Fluxo:** Webhook recebe mensagem da Evolution API → identifica tenant pela instância → busca/cria cliente → busca/cria sessão de chat → monta histórico → chama `generateAiResponse()` → resposta enviada via WhatsApp → histórico atualizado no banco.
- **Dependências:** Gemini API (`@google/generative-ai`), com suporte secundário a Groq e DeepSeek via [openaiCompatible.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/ai/openaiCompatible.ts).
- **Tratamento de erro:** Sim — fallback com mensagem amigável caso a API falhe; verificação de chave ausente; verificação de assinatura ativa do lojista.

---

### ✅ Respostas inteligentes e contextualizadas
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivo:** [index.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/ai/index.ts) (linhas 95-132)
- **Como funciona:** System instruction robusto montado dinamicamente com: nome da empresa, data/hora atual, nome do cliente, métodos de pagamento aceitos, tom de atendimento, informações gerais, regras de agendamento, instruções de pagamento, restrições, regras de transbordo, mensagem de encerramento. Tudo vem do campo `aiConfig` (JSONB) do tenant.
- **Function Calling:** 4 tools implementadas — `list_services`, `check_availability`, `create_appointment`, `update_funnel_stage` — com handlers reais que consultam e alteram o banco.
- **Segurança do prompt:** Implementação contra prompt injection (tags XML seguras, regras invioláveis).

---

### ✅ Atendimento simultâneo de múltiplos clientes
**Status: IMPLEMENTADO E FUNCIONAL**

- **Mecanismo:** Cada cliente tem sua própria `chatSession` (isolada por `clientId` + `tenantId`). Não há estado global compartilhado — cada webhook é processado de forma independente.
- **Debounce distribuído:** Implementado via Redis (Upstash) com lock distribuído para evitar processamento duplicado. Se Redis falha, há fallback para processamento direto.
- **Concorrência de agendamento:** Usa `SELECT ... FOR UPDATE` no tenant para serializar criações de agendamento e evitar race conditions ([appointmentHandler.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/ai/handlers/appointmentHandler.ts) linha 17).

---

### ✅ Transferência para atendimento humano
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivos:** [funnelStageHandler.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/ai/handlers/funnelStageHandler.ts), [chats/[id]/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/chats/%5Bid%5D/route.ts), [chats/[id]/send/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/chats/%5Bid%5D/send/route.ts)
- **Fluxo (IA → Humano):** Quando a IA identifica que o cliente quer falar com um humano, chama `update_funnel_stage` com `stage='atendimento_humano'` → o handler atualiza `chatSessions.status` para `'HUMAN'` → no próximo webhook, a condição `session.status === 'HUMAN'` na linha 207 do webhook faz a IA **não** responder, apenas armazena a mensagem no histórico para visualização no painel.
- **Fluxo (Humano → Cliente):** Via endpoint `POST /api/chats/[id]/send` o atendente humano envia mensagens diretamente via Evolution API.

---

### ✅ Retorno da conversa para a IA (handoff reverso)
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivo:** [chats/[id]/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/chats/%5Bid%5D/route.ts)
- **Fluxo:** Via `PATCH /api/chats/[id]` com `{ status: 'ACTIVE' }`, o atendente devolve a sessão para a IA. O webhook do WhatsApp só bloqueia respostas da IA quando `status === 'HUMAN'`. Ao voltar para `'ACTIVE'`, a IA retoma o atendimento normalmente.
- **Validação:** Aceita apenas `'ACTIVE'` ou `'HUMAN'` como valores válidos.

---

### ✅ Memória do contexto da conversa
**Status: IMPLEMENTADO E FUNCIONAL**

- **Mecanismo:** O histórico completo da conversa é armazenado no campo `history` (JSONB) da tabela `chat_sessions`. A cada mensagem nova, o array é carregado, a nova mensagem é adicionada, e todo o histórico é enviado ao Gemini via `chat.startChat({ history })`.
- **Formato:** Array de objetos `{ role: 'user' | 'system' | 'model', content: string }`.
- **Persistência:** O contexto persiste entre sessões — não há expiração automática de sessão (a busca usa `findFirst` com `orderBy: desc(updatedAt)`).

> [!WARNING]
> **Risco identificado:** O histórico cresce indefinidamente no campo JSONB. Para conversas longas, isso pode causar problemas de performance na leitura/escrita e no consumo de tokens da IA. Não há mecanismo de poda (trimming) implementado.

---

### 🟡 Personalização conforme regras da clínica
**Status: IMPLEMENTADO PARCIALMENTE**

- **O que existe:** O campo `aiConfig` (JSONB) no tenant ([tenants.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/db/schema/tenants.ts) linha 28) permite configurar: `tom_atendimento`, `informacoes_gerais`, `regras_agendamento`, `instrucoes_pagamento`, `restricoes`, `regras_transbordo`, `mensagem_encerramento`. Tudo isso é injetado no system prompt da IA.
- **Multi-tenancy real:** ✅ Sim — cada tabela tem coluna `tenant_id`, existe RLS via Supabase ([withTenant.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/db/withTenant.ts)), e a instância do WhatsApp é vinculada ao tenant via `evolution_instance_name`.
- **O que falta:** Não há UI no frontend para o lojista editar o `aiConfig` de forma estruturada (campos individuais). A configuração de presets de IA existe em [/api/settings/ai-presets](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/settings/ai-presets), mas o formulário no frontend (`settings/page.tsx`) precisa de verificação de completude.
- **Esforço para concluir:** **Baixo** — a lógica de backend está completa; falta polir o formulário do frontend.

---

### ⚠️ Integração Google Calendar
**Status: IMPLEMENTADO MAS NÃO USADO**

- **Arquivo:** [googleCalendar.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/googleCalendar.ts)
- **Evidência:** A função `addEventToCalendar()` está implementada e funcional (OAuth2, criação de evento). **Porém**, ela não é chamada em nenhum fluxo ativo — nem no `appointmentHandler`, nem em nenhum outro handler. Há variáveis de ambiente configuradas (`GOOGLE_CLIENT_ID`, etc.) e rotas OAuth em `/api/google/`, mas a integração não está conectada ao fluxo de agendamento.

---

## 2. 📅 Agendamentos

### ✅ Agendamento automático
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivos:** [appointmentHandler.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/ai/handlers/appointmentHandler.ts), [createAppointmentTool.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/ai/tools/createAppointmentTool.ts)
- **Fluxo:** IA lista serviços (`list_services`) → consulta disponibilidade (`check_availability`) → confirma com cliente → chama `create_appointment` → verifica disponibilidade real no banco (dentro de transação com lock) → gera pagamento via gateway → salva agendamento com status `PENDENTE` → envia link de pagamento ao cliente.
- **Race condition:** Protegido via `SELECT 1 FROM tenants WHERE id = ... FOR UPDATE`.

---

### ✅ Consulta de horários disponíveis
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivo:** [checkAvailabilityHandler.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/ai/handlers/checkAvailabilityHandler.ts) (154 linhas)
- **Fluxo completo:** Valida serviço → verifica regras de antecedência (`maxAdvanceDays`, `minAdvanceMinutes`) → consulta exceções de agenda (`scheduleExceptions`) → consulta agenda regular (`schedules`) por dia da semana → busca agendamentos existentes do dia → calcula conflitos de slot → retorna horários livres.
- **Edge cases tratados:** Dia fechado, horários de intervalo (almoço), antecedência mínima para hoje, conflito por duração do serviço.

---

### ✅ Confirmação automática (do agendamento)
**Status: IMPLEMENTADO E FUNCIONAL**

- **Fluxo:** Após `create_appointment`, a IA envia automaticamente no WhatsApp: resumo do agendamento + link de pagamento + mensagem de confirmação. Após o pagamento ser aprovado (via webhook), o status muda para `PAGO` e uma mensagem de confirmação é enviada automaticamente ao cliente via WhatsApp ([payment/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/webhooks/payment/route.ts) linhas 57-73).

---

### ✅ Lembretes automáticos
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivo:** [cron/reminders/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/cron/reminders/route.ts)
- **Fluxo:** Endpoint `GET /api/cron/reminders` (protegido por `CRON_SECRET`) busca agendamentos com status `PAGO` nas próximas 2-3 horas → envia mensagem de lembrete via WhatsApp para cada cliente.
- **Ativação:** Precisa ser chamado por um serviço externo (Vercel Cron, Render Cron, UptimeRobot, etc.). **Não há agendamento automático interno** para esta rota — depende de configuração de infraestrutura.

---

### 🟡 Reagendamento
**Status: IMPLEMENTADO PARCIALMENTE**

- **O que existe:** O endpoint `PATCH /api/dashboard/appointments` permite alterar o status de agendamentos manualmente. Via o frontend de appointments, o operador pode cancelar e criar um novo.
- **O que falta:** Não existe uma tool de IA para reagendamento (`reschedule_appointment`). A IA não possui capacidade de alterar a data/hora de um agendamento existente — o cliente precisaria cancelar e criar outro. Não há fluxo automatizado de reagendamento via WhatsApp.
- **Esforço:** **Médio** — requer nova tool de IA + handler + lógica de validação de conflito no novo horário.

---

### ❌ Cancelamento (via IA/WhatsApp)
**Status: NÃO IMPLEMENTADO**

- **Evidência:** Não existe tool de IA para cancelamento (`cancel_appointment`). O cancelamento **só** ocorre automaticamente quando o pagamento expira ([expire-appointments/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/cron/expire-appointments/route.ts)) ou manualmente pelo operador via `PATCH /api/dashboard/appointments`.
- **Nota:** O cliente **não** consegue cancelar via WhatsApp conversando com a IA.

---

### ❌ Agenda por profissional
**Status: NÃO IMPLEMENTADO**

- **Evidência:** A tabela `schedules` não possui campo `professional_id` ou `user_id` — está vinculada apenas ao `tenant_id`. A tabela `appointments` também não tem referência a um profissional específico. A tabela `services` não tem campo de profissional. Não há tabela de profissionais (professionals). O schema inteiro opera com a abstração de "empresa" (tenant), não de "profissional dentro da empresa".

---

### ❌ Agenda por consultório
**Status: NÃO IMPLEMENTADO**

- **Evidência:** Não há nenhuma tabela, coluna ou referência a "consultório" (room/office) no schema do banco de dados. Não existe campo `room_id` em appointments, schedules ou qualquer outra tabela.

---

## 3. 💳 Pagamentos

### ✅ Geração automática de PIX
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivos:** [paymentService.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/paymentService.ts), [mercadopago/pix.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/payments/mercadopago/pix.ts), [asaas/pix.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/payments/asaas/pix.ts), [abacatepay/pix.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/payments/abacatepay/pix.ts)
- **Fluxo:** `createCheckoutPayment()` busca a chave ativa do tenant na tabela `payment_keys` → detecta o gateway (`MERCADOPAGO`, `ASAAS`, `ABACATEPAY`) → chama o handler correto → retorna `paymentId` + `checkoutUrl`.
- **Nota:** O PIX via Mercado Pago é gerado como um Checkout Preferences (link de checkout), não como PIX direto (QR Code inline). Isso é funcional, mas o cliente é redirecionado para a página do Mercado Pago.

---

### ✅ Envio de links de pagamento (cartão)
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivos:** [mercadopago/creditCard.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/payments/mercadopago/creditCard.ts), [asaas/creditCard.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/payments/asaas/creditCard.ts)
- **Fluxo:** Mesmo fluxo do PIX, mas com `method='CREDIT_CARD'`. Mercado Pago exclui PIX e boleto das opções; Asaas gera link com `billingType: 'CREDIT_CARD'`.
- **AbacatePay:** Não suporta cartão — lança exceção se o método não for PIX.

---

### ✅ Confirmação automática do pagamento
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivo:** [webhooks/payment/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/webhooks/payment/route.ts)
- **Fluxo:** Webhook recebe notificação → detecta gateway (Mercado Pago ou AbacatePay) → se Mercado Pago, faz request à API para confirmar status real (`approved`) → atualiza status do appointment para `PAGO` → envia mensagem de confirmação via WhatsApp. Se expirado/cancelado, atualiza para `CANCELADO` e notifica o cliente.

---

### 🟡 Liberação automática do agendamento após pagamento
**Status: IMPLEMENTADO PARCIALMENTE**

- **O que funciona:** Quando o pagamento é confirmado, o status do agendamento muda de `PENDENTE` para `PAGO`. O agendamento permanece no banco e o horário fica reservado.
- **O que falta:** Não há liberação **propriamente dita** — o conceito de "liberar" implica que o horário estava bloqueado até o pagamento. Na implementação atual, o horário é reservado **antes** do pagamento (no momento do `create_appointment`). Se o pagamento não for feito, o cron `expire-appointments` cancela após o tempo limite. Isso funciona, mas é liberação por **expiração**, não por **confirmação ativa**.
- **Esforço:** **Baixo** — funciona de ponta a ponta, a semântica é apenas ligeiramente diferente do que o nome sugere.

---

### ❌ Histórico de pagamentos (dedicado)
**Status: IMPLEMENTADO E FUNCIONAL** ✅

*(Reclassificado após análise detalhada)*

- **Arquivo:** [payments/history/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/payments/history/route.ts)
- **Fluxo:** `GET /api/payments/history?tenantId=...` retorna todos os agendamentos do tenant com dados de pagamento (paymentId, valor, status, nome do cliente, serviço, data). O frontend tem uma página em `/payments`.
- **Limitação:** Não é uma tabela de transações separada — usa a tabela `appointments` como fonte. Agendamentos sem `paymentId` aparecem como `'Manual'`.

---

## 4. 📱 WhatsApp

### ✅ Atendimento via WhatsApp (Evolution API — NÃO OFICIAL)
**Status: IMPLEMENTADO E FUNCIONAL**

- **Arquivo:** [evolutionApi.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/evolutionApi.ts)
- **API utilizada:** **Evolution API** (API não oficial de WhatsApp, baseada em WhatsApp Web/Baileys).

> [!CAUTION]
> **Impacto comercial:** O WhatsApp **NÃO** é via API Oficial (Meta/Cloud API). É via Evolution API, que é uma solução não oficial (wrapper do WhatsApp Web). Isso significa:
> - Risco de banimento de número
> - Não possui selo de verificação Meta
> - Sem suporte oficial do WhatsApp Business
> - Termos de uso do WhatsApp podem ser violados
> 
> O discurso comercial **não deve** afirmar "integração oficial com WhatsApp Business API".

- **Variáveis configuradas:** `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME` — todas preenchidas no `.env`.
- **Multi-instância:** Suportado — cada tenant tem seu próprio `evolution_instance_name`, e as funções aceitam `customInstanceName`.
- **Cron de monitoramento:** [check-instances/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/cron/check-instances/route.ts) verifica o status de conexão de cada instância na Evolution API e atualiza no banco.

---

### 🟡 Envio/recebimento de texto, áudio, imagem, documento, vídeo, localização, contatos
**Status: IMPLEMENTADO PARCIALMENTE**

| Tipo | Envio | Recebimento |
|---|---|---|
| **Texto** | ✅ `sendWhatsAppMessage()` | ✅ Processado no webhook |
| **Imagem** | ✅ `sendWhatsAppImage()` | ❌ Ignorado no webhook |
| **Áudio** | ❌ Não implementado | ❌ Ignorado no webhook |
| **Documento** | ❌ Não implementado | ❌ Ignorado no webhook |
| **Vídeo** | ❌ Não implementado | ❌ Ignorado no webhook |
| **Localização** | ❌ Não implementado | ❌ Ignorado no webhook |
| **Contatos** | ❌ Não implementado | ❌ Ignorado no webhook |

- **Evidência:** O webhook ([whatsapp/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/webhooks/whatsapp/route.ts) linha 37) extrai apenas `message.conversation` e `message.extendedTextMessage?.text`. Qualquer outra mídia é ignorada com `"No text content found"`.
- **Envio de imagem:** `sendWhatsAppImage()` está implementada no [evolutionApi.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/evolutionApi.ts) (linhas 129-169) usando o endpoint `/message/sendMedia`, mas **não é chamada em nenhum fluxo ativo**.
- **Esforço para completar:** **Alto** — requer implementação de recepção de mídia no webhook, processamento por tipo, storage (R2 está configurado mas vazio), e potencialmente transcrição de áudio.

---

## 5. 🏢 Gestão

### ✅ Cadastro de clientes
**Status: IMPLEMENTADO E FUNCIONAL**

- **Criação automática:** Clientes são criados automaticamente quando enviam a primeira mensagem via WhatsApp ([whatsapp/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/webhooks/whatsapp/route.ts) linhas 155-169).
- **API REST:** Endpoint dedicado em `/api/clients`.
- **Frontend:** Página `/clients` com listagem, busca e gestão.
- **Campos:** phone, name, whatsappName, status, funnelStage, tenantId.

---

### ✅ Cadastro de serviços
**Status: IMPLEMENTADO E FUNCIONAL**

- **API:** CRUD completo em `/api/settings/services` (GET/POST/PUT/DELETE).
- **Schema:** [services.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/db/schema/services.ts) — nome, descrição, preço, duração em minutos, isActive, por tenant.

---

### ✅ Horários de atendimento
**Status: IMPLEMENTADO E FUNCIONAL**

- **API:** CRUD em `/api/settings/schedules` + `/api/settings/schedule-exceptions`.
- **Schema:** [schedules.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/db/schema/schedules.ts) — por dia da semana, horário início/fim, intervalo (almoço), duração do slot, isActive.
- **Exceções:** [scheduleExceptions.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/db/schema/scheduleExceptions.ts) — data específica, dia fechado ou horário customizado.

---

### 🟡 Controle de usuários e permissões
**Status: IMPLEMENTADO PARCIALMENTE**

- **O que existe:**
  - Tabela `users` com campo `role` (`SUPERADMIN`, `ADMIN`, `ATTENDANT`).
  - Tabela `user_tenants` vinculando usuários a empresas.
  - Frontend com RBAC via [routePermissions.ts](file:///c:/Users/jferr/Desktop/agenda_zap/front-end/src/lib/routePermissions.ts) — rotas protegidas por role.
  - Backend com `verifyAuth()` + `canAccessTenant()` em todas as rotas.
  - CRUD de usuários em `/admin/users`.
- **O que falta:** Não há permissões granulares (ex: "pode ver pagamentos mas não editar"). O sistema é baseado em 3 roles fixos sem customização. Não há CRUD completo de "profissionais" como entidade separada — profissionais e usuários são a mesma tabela.
- **Esforço:** **Médio** — RBAC básico funciona; permissões granulares exigiriam redesign.

---

### ❌ Dashboard em tempo real
**Status: IMPLEMENTADO (mas NÃO em tempo real)** → Reclassificado como 🟡

- **O que existe:** Endpoint [/api/dashboard/metrics](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/dashboard/metrics/route.ts) retorna: faturamento, agendamentos (pagos/pendentes/cancelados), novos clientes, tokens IA usados, dados para gráfico, e Kanban de clientes (funil CRM).
- **O que falta:** Não há WebSocket, Server-Sent Events, ou polling automático. Os dados são obtidos via request HTTP convencional — o dashboard é "atualizado ao recarregar", não "em tempo real".

---

## 6. 📈 Relatórios

### ✅ Atendimentos realizados
**Status: IMPLEMENTADO E FUNCIONAL**

- **Endpoint:** `/api/dashboard/metrics` retorna `appointmentsCount`, `atendimentosPagos`, `atendimentosPendentes`, `atendimentosCancelados` filtrados por período (`startDate`/`endDate`).
- **Gráfico:** `chartData` com agrupamento por dia (faturamento + atendimentos por dia).

---

### ✅ Pagamentos recebidos
**Status: IMPLEMENTADO E FUNCIONAL**

- **Endpoints:** `/api/dashboard/metrics` retorna `faturamento` total no período. `/api/payments/history` retorna lista detalhada de transações. Dashboard do frontend tem aba para visualizar pagamentos.

---

### 🟡 Conversas por período
**Status: IMPLEMENTADO PARCIALMENTE**

- **O que existe:** A tabela `chat_sessions` tem `createdAt`/`updatedAt` e a listagem está em `/api/chats`. O dashboard retorna `tokensUsados` como proxy de atividade de conversas.
- **O que falta:** Não há endpoint dedicado para relatório de conversas com filtro por período, contagem agregada, ou exportação. As conversas são acessíveis via lista de chats, mas sem métricas consolidadas.
- **Esforço:** **Baixo** — basta criar uma query de contagem agrupada por período.

---

### 🟡 Agendamentos e cancelamentos (como relatório)
**Status: IMPLEMENTADO PARCIALMENTE**

- **O que existe:** Os dados estão disponíveis nos endpoints de métricas e agendamentos. O campo `status` permite filtrar por `PAGO`, `PENDENTE`, `CANCELADO`.
- **O que falta:** Não há endpoint de relatório consolidado com taxa de cancelamento, taxa de conversão, comparação entre períodos, ou exportação (CSV/PDF).
- **Esforço:** **Baixo**.

---

### ❌ Indicadores de desempenho
**Status: NÃO IMPLEMENTADO**

- **Evidência:** Não existem KPIs calculados como: taxa de conversão (agendamentos/conversas), tempo médio de resposta da IA, NPS, taxa de abandono, taxa de no-show, ticket médio comparativo, LTV de clientes. O dashboard mostra números brutos, não indicadores derivados.

---

### ❌ Relatório dedicado de cancelamentos (detalhado)
**Status: NÃO IMPLEMENTADO**

- **Evidência:** Não há endpoint específico para análise de cancelamentos (motivos, padrões, tendências). O cancelamento automático por expiração é registrado no banco, mas não há relatório que agrupe essas informações de forma analítica.

---

## 7. 🔒 Segurança

### ✅ Acesso seguro (autenticação/autorização)
**Status: IMPLEMENTADO E FUNCIONAL**

- **Autenticação:**
  - JWT com expiração de 15 minutos ([login/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/auth/login/route.ts))
  - Refresh Token com hash SHA-256, expiração de 30 dias
  - Senhas hasheadas com Argon2 ([password.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/lib/password.ts))
  - Proteção brute force: 5 tentativas → bloqueio de 15 minutos
  - Reset de senha com token temporário + email via Resend
- **Autorização:**
  - RBAC com 3 roles (`SUPERADMIN`, `ADMIN`, `ATTENDANT`)
  - `verifyAuth()` em todas as rotas autenticadas
  - `canAccessTenant()` para isolamento multi-tenant
  - RLS (Row Level Security) no PostgreSQL via [withTenant.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/db/withTenant.ts)
  - Frontend middleware com NextAuth para proteção de rotas

---

### ✅ Histórico completo (auditoria/logs)
**Status: IMPLEMENTADO E FUNCIONAL**

- **Tabela:** [auditLogs](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/db/schema/auditLogs.ts) — `userId`, `email`, `eventType` (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT), `ipAddress`, `userAgent`, `createdAt`.
- **Uso ativo:** Login bem-sucedido, login falhado (com ou sem userId), todos registrados com IP e user-agent.
- **Logs de IA:** Tabela `token_logs` registra uso de tokens por tenant e tipo de interação.
- **Limitação:** Auditoria cobre apenas eventos de autenticação. Operações CRUD (edições de serviços, configurações, etc.) **não** são auditadas.

---

### ✅ Controle de permissões por papel/usuário
**Status: IMPLEMENTADO E FUNCIONAL**

- **Backend:** `verifyAuth()` + role check + `canAccessTenant()`.
- **Frontend:** [routePermissions.ts](file:///c:/Users/jferr/Desktop/agenda_zap/front-end/src/lib/routePermissions.ts) define rotas por role, middleware bloqueia acesso não autorizado.
- **Roles:** SUPERADMIN (acesso total), ADMIN (acesso à empresa), ATTENDANT (apenas operações básicas, sem acesso a faturamento nos gráficos).

---

### ❌ Backup automático
**Status: NÃO IMPLEMENTADO**

- **Evidência:** Nenhum vestígio de implementação de backup no código — nenhum script, cron job, integração com serviço de backup, ou menção ativa. O banco está no Supabase, que pode ter backups nativos do provedor, mas isso **não é configurado ou gerenciado pelo sistema**. Não há pg_dump agendado, não há upload para S3/R2, não há monitoramento de backup.

> [!IMPORTANT]
> A variável `R2_ENDPOINT` no `.env` está **vazia** — o storage Cloudflare R2 não está configurado. Não há infraestrutura de backup implementada pelo código da aplicação.

---

## 8. 🔗 Integrações

### ✅ Webhooks (recebidos)
**Status: IMPLEMENTADO E FUNCIONAL**

- **Endpoints ativos:**
  - `POST /api/webhooks/whatsapp` — Evolution API mensagens
  - `POST /api/webhooks/payment` — Pagamento de agendamentos (Mercado Pago + AbacatePay)
  - `POST /api/webhooks/mercadopago` — Assinaturas/faturas do SaaS
  - `POST /api/webhooks/mercadopago/subscriptions` — Assinaturas

---

### ✅ Mercado Pago
**Status: IMPLEMENTADO E FUNCIONAL**

- **Para pagamentos de agendamentos (lojista → cliente):** Via Checkout Preferences com chave do lojista armazenada na tabela `payment_keys`. Suporta PIX, Cartão e Boleto.
- **Para assinaturas SaaS (plataforma):** Webhook em `/api/webhooks/mercadopago` para processar pagamentos de faturas do SaaS. Token master (`MP_ACCESS_TOKEN`) configurado no `.env`.
- **Status:** **ATIVO EM PRODUÇÃO** — token configurado, URLs de webhook definidas, fluxo completo implementado.

---

### ✅ WhatsApp (Evolution API)
**Status: IMPLEMENTADO E FUNCIONAL**

- Conforme detalhado na seção WhatsApp acima.

---

### ✅ PIX
**Status: IMPLEMENTADO E FUNCIONAL**

- Implementado via 3 gateways: Mercado Pago (Checkout Preferences), Asaas (Payment Links), AbacatePay (SDK).

---

### 🟡 Asaas
**Status: IMPLEMENTADO PARCIALMENTE**

- **O que existe:** Código completo em [services/payments/asaas/](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/payments/asaas) com suporte a PIX, Cartão e Boleto via Payment Links API.
- **O que falta:**
  - Nenhuma variável de ambiente do Asaas no `.env` (sem `ASAAS_API_KEY` ou similar)
  - O token do Asaas seria armazenado per-tenant na tabela `payment_keys`, então não precisa de env global
  - **Não há webhook dedicado para Asaas** — o webhook genérico `/api/webhooks/payment` tenta detectar AbacatePay, não Asaas especificamente
  - **Conclusão:** O código está pronto para uso se um lojista configurar uma chave Asaas, mas o fluxo de webhook para confirmar pagamento Asaas **não está implementado**.
- **Esforço:** **Baixo-Médio** — precisa de handler de webhook Asaas.

---

### ❌ API pública/documentada
**Status: NÃO IMPLEMENTADO**

- **Evidência:** O arquivo [swagger.json](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/swagger.json) contém apenas um erro 404: `{"status":404,"error":"Not Found","response":{"message":["Cannot GET /docs-json"]}}`. Não há Swagger UI, OpenAPI spec, ou qualquer documentação de API gerada ou manual. Não há rota `/docs` ou `/api-docs`.

---

### ⚠️ AbacatePay
**Status: IMPLEMENTADO MAS PARCIALMENTE ATIVO**

- **O que existe no `services/payments/`:** Implementação real usando o SDK `abacatepay-nodejs-sdk` ([abacatepay/pix.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/payments/abacatepay/pix.ts)). Suporta apenas PIX.
- **O que existe no `gateways/`:** Versão antiga/legada em [gateways/abacatepay/createPixPayment.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/gateways/abacatepay/createPixPayment.ts) — **é um MOCK** (retorna dados simulados, não faz request real).
- **Status real:** A versão em `services/payments/abacatepay/` é funcional. A versão em `gateways/abacatepay/` é legada e não usada.
- **Webhook:** Recebido via `/api/webhooks/payment` (detecção por `source=abacatepay` ou campo `status` no body).

---

### ⚠️ Webhooks (enviados)
**Status: NÃO IMPLEMENTADO**

- **Evidência:** O sistema **recebe** webhooks de fontes externas (WhatsApp, pagamentos), mas **não envia** webhooks para sistemas externos. Não há funcionalidade de "webhook de saída" onde eventos do sistema (novo agendamento, pagamento confirmado, etc.) disparem notificações para URLs configuradas por lojistas ou integradores.

---

## 🎁 Funcionalidades "Escondidas" (Não listadas, mas implementadas)

Estas funcionalidades existem no código e podem ser diferenciais de marketing:

### 1. 📊 CRM / Kanban de Vendas (Funil)
- **Automação completa:** A IA move clientes automaticamente entre etapas do funil (`espera` → `atendimento_ia` → `aguardando_pagamento` → `finalizado` → `perdido` → `atendimento_humano`) via [funnelStageHandler.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/ai/handlers/funnelStageHandler.ts).
- **Frontend:** Página `/funil` com visualização Kanban.
- **Diferencial:** CRM integrado automaticamente à IA, sem intervenção manual.

### 2. 🏷️ Sistema de Tags para Clientes
- **Schema:** Tabelas `tags` e `client_tags` — permite categorizar clientes com etiquetas customizáveis.
- **API:** Endpoint `/api/tags`.

### 3. 📢 Broadcast / Disparo em Massa
- **Endpoint:** [/api/broadcast](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/broadcast/route.ts) — envia mensagem para todos os clientes do tenant via WhatsApp.
- **Frontend:** Página `/broadcast` com interface para disparos.

### 4. 📧 E-mail Transacional (Resend)
- **Arquivo:** [emailService.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/emailService.ts) — integrado com Resend para envio de emails (reset de senha, etc.).

### 5. 📅 Relatório Diário Automático via WhatsApp
- **Arquivo:** [cron/daily-report/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/cron/daily-report/route.ts) — envia resumo diário para cada lojista via WhatsApp: total de atendimentos, faturamento do dia, agenda de amanhã.

### 6. 🔄 Automações de Follow-up (Planos de Clientes)
- **Schema:** [automations.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/db/schema/automations.ts) + [clientPlans.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/db/schema/clientPlans.ts)
- **Cron:** [lib/cron.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/lib/cron.ts) roda a cada minuto, envia mensagens automatizadas de follow-up para clientes com planos ativos.

### 7. 🧠 Multi-provider IA
- **Suporte:** Gemini (padrão), Groq e DeepSeek via OpenAI-compatible API. Configurável globalmente via `system_settings` e `ai_models`.

### 8. 💰 SaaS Billing (Planos + Metered Billing)
- **Schemas:** `plans`, `userSubscriptions`, `invoices`, `planFeatures`.
- **CRON Billing:** [cron/billing/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/cron/billing/route.ts) — calcula chats excedentes e gera faturas automáticas.
- **Controle de acesso:** A IA verifica se a assinatura do lojista está ativa antes de responder ([index.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/services/ai/index.ts) linhas 42-71).

### 9. 🔍 Validação de CPF
- **Rota:** `/api/validate/cpf` — endpoint para validação de CPF (chave `APICPF_KEY` no `.env`, mas sem valor configurado).

### 10. ⏰ Expiração Automática de Agendamentos
- **Arquivo:** [cron/expire-appointments/route.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/app/api/cron/expire-appointments/route.ts) — verifica agendamentos pendentes que passaram do tempo limite de pagamento, verifica se não foram pagos por delay de webhook, cancela e notifica o cliente.

---

## ⚠️ Observações Críticas

> [!CAUTION]
> **Credenciais expostas no .env versionado:** O arquivo `.env` contém senhas de banco de dados, chaves de API e tokens em texto plano. O `.gitignore` pode não estar protegendo este arquivo corretamente. **Recomendação urgente:** rotacionar todas as credenciais e garantir que `.env` não está no repositório Git.

> [!WARNING]
> **Pasta `gateways/` é código legado:** Os arquivos em `src/gateways/mercadopago/` e `src/gateways/abacatepay/` são versões antigas que **não são chamadas** por nenhum fluxo ativo. O fluxo real usa `src/services/payments/`. Isso pode causar confusão em manutenção.

> [!WARNING]
> **CRONs dependem de infra externa:** Os endpoints em `/api/cron/*` (reminders, expire-appointments, daily-report, billing, check-instances) precisam ser chamados por serviço externo (Vercel Cron, Render, UptimeRobot). O `initCron()` em `instrumentation.ts` só inicializa o cron de automações, não os demais.

> [!IMPORTANT]
> **`billingRenewal.ts` é um STUB:** O arquivo [cron/billingRenewal.ts](file:///c:/Users/jferr/Desktop/agenda_zap/BACK-END/src/cron/billingRenewal.ts) está registrado como cron job diário (02:00), mas a função `runBillingRenewal()` apenas imprime um log — é um placeholder sem lógica real. O billing funcional é o endpoint HTTP em `/api/cron/billing`.
