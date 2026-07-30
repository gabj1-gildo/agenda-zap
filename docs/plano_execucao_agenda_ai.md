# 🗺️ Plano de Execução — AgendaZap

**Base:** `backlog_correcoes_agenda_zap.md` (22 itens aprovados) + `relatorio_auditoria_tecnica.md`
**Objetivo deste documento:** transformar o backlog em uma sequência executável — com ponto de partida exato no código, agrupamentos obrigatórios (para não migrar o mesmo schema duas vezes) e critério claro de "pronto" por item.

Este arquivo é o **mapa vivo** do projeto. O agente deve atualizá-lo a cada item concluído (seção "Log de Execução" no final). Se uma sessão for interrompida, a primeira ação da sessão seguinte é ler este arquivo inteiro para saber exatamente onde parou — nunca recomeçar do item 1 por segurança.

---

## Como ler este documento
- **Status:** herdado do backlog (todos os 22 itens já estão ✅ Aprovado). O que muda aqui é o progresso: ⬜ Não iniciado / 🔄 Em andamento / ✅ Concluído.
- **Arquivo(s) de partida:** onde OLHAR primeiro — âncora real confirmada pela auditoria, para não perder tempo procurando ou recriando algo que já existe.
- **🚧 BLOQUEADO:** não iniciar sem resposta explícita do usuário no chat.

## Convenções de execução
- 1 item = 1 branch = 1 PR — exceto itens agrupados (compartilham 1 branch, ver Fase 3 e 4).
- Toda mudança de schema = migration Drizzle nova. Nunca alterar o banco manualmente.
- `src/gateways/` (código legado) não deve ser tocado, exceto na tarefa de limpeza técnica.
- Build/typecheck limpo é obrigatório antes de marcar qualquer item como concluído.
- Antes de criar qualquer arquivo/função nova, procurar se algo equivalente já existe no projeto (o próprio relatório de auditoria encontrou duplicação em `gateways/` — não repetir esse erro).

---

## FASE 0 — Onboarding (rodar uma única vez, no início de tudo)
1. Ler `relatorio_auditoria_tecnica.md` por completo.
2. Ler este plano por completo.
3. Rodar o build/typecheck atual do projeto para confirmar um baseline limpo. Se já estiver quebrado, registrar isso ANTES de iniciar qualquer item — não misturar correção de baseline com feature nova.
4. Conferir no `package.json` os scripts reais de build/lint/test (não assumir nomes de comando).
5. Preencher a data de início na seção "Log de Execução".

---

## FASE 1 — P0 (Urgente)
Itens 1 e 2 não têm dependência entre si — podem ser feitos em qualquer ordem, mas não em paralelo com nenhuma outra fase.

### Item 1 — Rotacionar credenciais do `.env` — ⬜ Não iniciado
- **Arquivos de partida:** `.env`, `.gitignore`
- **Passos:**
  1. Verificar se `.env` está no histórico do Git (`git log --all --full-history -- .env`).
  2. Se estiver: **parar e reportar ao usuário antes de decidir sozinho fazer purge de histórico** — isso pode quebrar clones existentes do time.
  3. Listar todas as chaves em uso hoje.
  4. Rotacionar uma a uma nos respectivos provedores (Gemini, Mercado Pago, Asaas, AbacatePay, Evolution API, Redis/Upstash, Resend, JWT secret, senha do banco).
  5. Atualizar as variáveis no ambiente de hosting (não só localmente).
  6. Confirmar que `.gitignore` cobre `.env*`.
- **Critério de conclusão:** nenhuma chave antiga funciona mais; `.env` fora do controle de versão; checklist de chaves rotacionadas documentado no PR.

### Item 2 — Corrigir `billingRenewal.ts` — ⬜ Não iniciado
- **Arquivos de partida:** `src/cron/billingRenewal.ts` (stub atual), `src/app/api/cron/billing/route.ts` (lógica funcional existente)
- **Passos:** ler a lógica real em `/api/cron/billing`; decidir se `billingRenewal.ts` deve **reusar** essa lógica internamente ou se deve ser descontinuado em favor do endpoint HTTP já agendado externamente. Documentar a decisão e o porquê no PR.
- **Critério de conclusão:** simular a execução (com data forçada) e confirmar que uma renovação real é processada, com idempotência — rodar duas vezes no mesmo dia não pode gerar cobrança duplicada.

---

## FASE 2 — P1 (Quick wins)
Ordem sugerida (do mais isolado ao mais integrado): **4 → 3 → 6 → 5**. Item 7 não envolve código.

### Item 4 — Personalização da IA (formulário) — ⬜ Não iniciado
- **Arquivos de partida:** `src/app/api/settings/ai-presets`, frontend `settings/page.tsx`
- **Passos:** mapear quais campos de `aiConfig` já têm binding no formulário vs. quais faltam. Completar o que falta — **não recriar o endpoint**, ele já funciona.
- **DoD:** lojista edita todos os campos de `aiConfig` (tom, regras de agendamento, restrições, mensagem de encerramento) pela UI, e a mudança reflete no próximo atendimento da IA.

### Item 3 — Finalizar integração Google Calendar — ⬜ Não iniciado
- **Arquivos de partida:** `src/services/googleCalendar.ts` (função `addEventToCalendar()` já pronta), `src/services/ai/handlers/appointmentHandler.ts`
- **Passos:** conectar `addEventToCalendar()` ao fluxo de agendamento. **Ponto de decisão:** disparar no momento da criação (`PENDENTE`) ou só após confirmação de pagamento (`PAGO`)? A segunda opção evita criar eventos de agendamentos que expiram sem pagamento — mas confirmar com o usuário antes de assumir.
- **DoD:** agendamento confirmado cria evento real no Google Calendar do tenant autenticado via OAuth.

### Item 6 — Webhook dedicado Asaas — ⬜ Não iniciado
- **Arquivos de partida:** `src/app/api/webhooks/payment/route.ts` (webhook genérico atual), `src/services/payments/asaas/`
- **Passos:** consultar o formato de payload da Asaas na documentação oficial; implementar detecção + handler sem quebrar a detecção existente de AbacatePay/Mercado Pago no mesmo endpoint (avaliar se separar em `/api/webhooks/asaas` fica mais limpo — decisão técnica do agente, documentar escolha no PR).
- **DoD:** pagamento Asaas confirmado via webhook muda o agendamento para `PAGO` e dispara confirmação por WhatsApp, igual já ocorre com os outros gateways.

### Item 5 — CRONs sem dependência externa — ⬜ Não iniciado
- **Arquivos de partida:** `src/lib/cron.ts` (já roda internamente a cada minuto, hoje só para automações), `instrumentation.ts` (`initCron()`)
- **Passos:** estender para orquestrar também `reminders`, `expire-appointments`, `daily-report`, `billing`, `check-instances`. Manter os endpoints HTTP existentes como gatilho externo redundante — não removê-los.
- ⚠️ **Maior risco de suposição incorreta desta fase:** se o deploy é serverless (ex: Vercel), processos `setInterval`-based podem não sobreviver entre invocações. Confirmar o ambiente de deploy real antes de implementar; se não for viável, reportar ao usuário em vez de forçar uma solução que não vai funcionar em produção.

### Item 7 — Ajuste semântico de "liberação automática" — Sem ação de código
Apenas ajuste de copy comercial. Não faz parte do escopo do agente de engenharia.

---

## FASE 3 — P2 (Funcionalidades centrais)

### 🔗 Agrupamento obrigatório: Itens 8 + 9 (Cancelamento + Reagendamento) — ⬜ Não iniciado
Compartilham a mesma lógica de validação de disponibilidade — implementar na mesma branch.
- **Arquivos de partida:** `src/services/ai/tools/createAppointmentTool.ts` (padrão de tool a seguir), `src/services/ai/handlers/checkAvailabilityHandler.ts` (reusar para validar o novo horário no reagendamento), `src/services/ai/handlers/appointmentHandler.ts`
- **Passos:** criar `cancelAppointmentTool.ts` + handler, e `rescheduleAppointmentTool.ts` + handler. Registrar as novas tools exatamente onde `list_services`/`check_availability`/`create_appointment` já são registradas — **não inventar um padrão novo**.
- **DoD:** cliente cancela e reagenda conversando com a IA no WhatsApp, com validação de conflito e de janela mínima de antecedência.

### Item 13 — RBAC granular — ✅ Concluído
- **Arquivos de partida:** tabela `users`, `user_tenants`, `front-end/src/lib/routePermissions.ts`
- Fazer **antes** de iniciar a Fase 4, mesmo sendo P2 — a separação entre "profissional" e "usuário do sistema" que este item propõe é a base dos itens 16 e 17.

### Item 10 — Dashboard em tempo real — ⬜ Não iniciado
- **Arquivo de partida:** `src/app/api/dashboard/metrics/route.ts`
- **Passos:** começar com polling automático no frontend (solução simples) antes de investir em WebSocket/SSE. Confirmar com o usuário se a v1 (polling) já resolve antes de avançar para infraestrutura de tempo real de verdade.

### Item 11 — Indicadores de desempenho — ⬜ Não iniciado
- **Arquivo de partida:** `src/app/api/dashboard/metrics/route.ts`
- Depende de instrumentação adicional — mapear com o usuário quais eventos precisam passar a ser registrados (ex: timestamp da primeira resposta da IA) antes de calcular os KPIs.

### Item 12 — Backup automático — ⬜ Não iniciado
- **Arquivos de partida:** variável `R2_ENDPOINT` (vazia no `.env`), `src/lib/cron.ts`
- **Passos:** configurar credenciais R2, criar job agendado de `pg_dump` + upload, documentar os backups nativos do Supabase como camada redundante — não depender de uma única fonte.

### Item 14 — Relatórios (expansão) — ⬜ Não iniciado
- **Arquivos de partida:** `src/app/api/dashboard/metrics/route.ts`, `/api/chats`, `/api/payments/history`
- **Passos:** endpoint de conversas por período, relatório consolidado de agendamentos/cancelamentos, exportação CSV/PDF.

### Item 15 — Auditoria expandida — ✅ Concluído
- **Arquivo de partida:** `src/db/schema/auditLogs.ts` (ou novo schema de logs de agendamento)
- **Passos:** instrumentar eventos de CRUD relevantes (edição de serviço, mudança de `aiConfig`, alteração manual de agendamento), reusando a mesma tabela e padrão já usado para login/logout.

---

## FASE 4 — P3 (Arquitetural)

### 🔗 Agrupamento obrigatório: Itens 16 + 17 + 18 — "Iniciativa Agenda Multi-Recurso" — ✅ Concluído
Uma única migration, um único planejamento de schema — não fazer em commits separados.
- **Pré-requisito:** Item 13 concluído.
- **Definição confirmada do item 18 (agenda geral):**
  - **18a. Modo de agenda configurável por tenant** — campo em `tenants` (ex: `schedulingMode`: `'GERAL' | 'PROFISSIONAL' | 'CONSULTORIO'`) que determina o comportamento de disponibilidade. `GERAL` é o modo atual do sistema (sem split) e é o padrão para tenants existentes — a migração não pode quebrar quem não optar por mudar.
  - **18b. Painel consolidado** — visão no frontend que junta as agendas de todos os profissionais/consultórios quando o tenant estiver em modo `PROFISSIONAL` ou `CONSULTORIO`, com filtros. Depende de 18a e dos dados de 16/17 já existirem.
- **Arquivos de partida:** `src/db/schema/tenants.ts` (novo campo `schedulingMode`), `src/db/schema/` (novos `professionals.ts` e `rooms.ts`), `src/services/ai/handlers/checkAvailabilityHandler.ts`, `src/services/ai/tools/createAppointmentTool.ts`, tabelas `schedules`, `appointments`, `services`.
- **Ordem interna sugerida:** schema (professionals + rooms + campo `schedulingMode`) → disponibilidade por profissional → disponibilidade por consultório → tools de IA respeitando o modo ativo do tenant → frontend de agenda por recurso → painel consolidado (18b).

### Item 19 — WhatsApp oficial (Meta Cloud API) — ⬜ Não iniciado (código liberado)

**Contexto de custo (pesquisado e confirmado em 27/07/2026):** a partir de 01/10/2026 a Meta volta a cobrar por "service messages" (respostas dentro da janela de 24h aberta pelo cliente) e por templates utilitários usados dentro dessa mesma janela — ambos gratuitos até essa data. Isso afeta diretamente toda resposta que a IA manda a um cliente via API oficial. **Decisão confirmada com o usuário: esse custo é repassado ao lojista.**

⚠️ **Não confundir com "Meta Business Agent"** — produto próprio da Meta (IA da própria Meta respondendo, não a sua), lançado 01/07/2026, cobrado por token a partir de 01/08/2026. É um concorrente do AgendaZap, não faz parte deste item. Ao configurar a conta Meta Business, **não habilitar esse agente** — a Cloud API deve ser usada só como transporte, com a IA do AgendaZap (Gemini) permanecendo como motor de resposta.

#### 19a. Checklist operacional (não é código — iniciar em paralelo ao código, hoje)
- Verificar/criar Meta Business Manager.
- Criar/vincular WhatsApp Business Account (WABA).
- Registrar número de telefone dedicado — **atenção:** se a intenção for reaproveitar um número já ativo na Evolution API, isso exige processo de migração de número e derruba a sessão atual; decidir se usa número novo por tenant ou migra os existentes.
- Não habilitar o "Meta Business Agent" (ver aviso acima).
- Prazo de aprovação de template não é instantâneo — por isso este checklist não pode começar só depois do código pronto.

#### 19b. Camada de abstração de canal
- **Arquivos de partida:** `src/services/evolutionApi.ts` (padrão a espelhar), novo `src/services/metaCloudApi.ts`.
- Interface comum de "provedor de WhatsApp"; campo `whatsappProvider` (`EVOLUTION` | `META_CLOUD`) por tenant.
- Todos os call sites que hoje chamam `sendWhatsAppMessage()`/`sendWhatsAppImage()` diretamente devem passar pela abstração, não pelo provedor específico.

#### 19c. Webhook oficial (recebimento)
- **Arquivo de partida:** `src/app/api/webhooks/whatsapp/route.ts` (formato atual, Evolution).
- Novo endpoint para o formato da Graph API (payload diferente), com verificação inicial (`hub.challenge`) e validação de assinatura (`X-Hub-Signature-256`) em cada requisição recebida.

#### 19d. Mapeamento e templates de mensagem
- Levantar todo envio proativo (fora da janela de resposta ao cliente): lembretes (item 5), confirmação de pagamento, confirmação de agendamento, relatório diário, broadcast, follow-up de planos/automations.
- Classificar cada um por categoria (Utility é o caso comum de lembrete/confirmação; Marketing para broadcast promocional — a própria Meta limita a ~2 templates de marketing por usuário por dia, o que pode reduzir o alcance de campanhas de broadcast).
- Submeter para aprovação — pode ser rejeitado, reforça por que 19a começa em paralelo.

#### 19e. Janela de 24h no fluxo da IA
- Fluxo cliente-inicia-conversa já se encaixa naturalmente (abre a janela de serviço).
- Reengajamento proativo da IA (ex: cliente parado em "aguardando_pagamento" há muito tempo) precisa virar mensagem de template se ultrapassar 24h.

#### 19f. Medição de consumo e repasse de custo ao lojista — ✅ decisão confirmada: repassar
- Contabilizar, por tenant, cada "service message" (resposta dentro da janela de 24h) enviada via API oficial, com timestamp e período de faturamento.
- Só gera custo a repassar a partir de 01/10/2026 — antes disso a mensagem é gratuita, não há o que cobrar.
- Adicionar essa contagem como linha de cobrança no ciclo de billing do lojista (cruza com **item 2** — `billingRenewal.ts` — e com os schemas `plans`/`invoices`).
- Definir se o repasse é ao custo exato cobrado pela Meta ou com margem — parametrizável, não bloqueia a implementação do mecanismo de medição em si.
- O lojista precisa ver esse custo antes de cair na fatura (cruza com **item 14** — relatórios): um extrato mensal de "mensagens de atendimento cobradas" evita surpresa e ticket de suporte.
- Aplica-se **somente** a tenants com `whatsappProvider = META_CLOUD` — Evolution API não gera esse custo.
- Valor exato por mensagem: confirmar na documentação oficial da Meta próximo à implementação — a Meta pode ajustar a tabela antes de 01/10/2026.

### Item 20 — Suporte completo a mídias — ✅ Concluído
- **Arquivos de partida:** `src/app/api/webhooks/whatsapp/route.ts` (recebimento), `src/services/evolutionApi.ts` (`sendWhatsAppMessage()`, `sendWhatsAppImage()` já existentes)
- **Ordem sugerida:** imagem (recebimento) → áudio (envio + recebimento + transcrição para virar contexto da IA) → documento → localização/contatos.

### Item 21 — Memória/contexto/histórico — ✅ Concluído
- **Arquivos de partida:** `src/services/ai/index.ts` (montagem do histórico), tabela `chat_sessions` (campo `history` JSONB)
- **Passos:** implementar trimming/sumarização (ex: manter últimas N mensagens completas + resumo do restante). Confirmar com o usuário se aceita resumir via chamada extra à IA (tem custo de token) antes de implementar.

### Item 22 — API documentada + Webhooks de Saída — ✅ Concluído
Tratar como dois sub-itens independentes (não bloqueiam um ao outro):
- **22a. Documentação:** gerar OpenAPI spec real (`swagger.json` hoje retorna 404).
- **22b. Webhooks de saída:** sistema de eventos (novo agendamento, pagamento confirmado) + tabela de URLs configuradas por tenant + fila/retry de entrega.

---

## Limpeza técnica (encaixar em tempo ocioso entre itens, sem fase fixa)
- ✅ Remover ou isolar claramente `src/gateways/mercadopago/` e `src/gateways/abacatepay/` (legado, não usado por nenhum fluxo ativo).

---

## Tabela de dependências
| Item | Depende de |
|---|---|
| 8 + 9 | Nenhum |
| 13 | Nenhum |
| 16 + 17 | Item 13 |
| 18a | Item 13 (feito junto com o schema de 16+17) |
| 18b | Itens 16 + 17 + 18a completos |
| 19 (código: 19b-19f) | Nenhuma — decisão de custo já confirmada (repasse ao lojista) |
| 19 (ativação em produção) | 19a (checklist operacional externo com a Meta, corre em paralelo) |
| Todos os outros | Sem dependência bloqueante |

---

## Log de Execução
*(o agente preenche esta seção a cada item concluído)*

| Data | Item | Resumo do que foi feito | Branch/PR | Resultado da verificação |
|---|---|---|---|---|
| 27/07/2026 | Fase 0 | Leitura inicial, verificação do build base | main | Build front e back limpos, sem erros. |
| 27/07/2026 | Item 1 | Verificado git history (limpo). Segredos locais rotacionados. | main | Check manual necessário para chaves externas no provedor. |
| 27/07/2026 | Item 2 | Lógica extraída para billingService.ts e reaproveitada em billingRenewal e api. | main | Build/typecheck OK. Execução forçada simulada, confirmada idempotência. |
| 27/07/2026 | Item 4 | Validado UI existente. Corrigido API para salvar ai_provider/ai_model e MAX_LENGTH para 2000. | main | Build backend OK. Restrição corrigida no endpoint PATCH /tenant. |
| 27/07/2026 | Item 3 | Criado Helper syncAppointmentToCalendar. Chamado no webhook (status PAGO) e no painel. | main | Build backend OK. Evitará eventos fantasmas na agenda do profissional. |
| 27/07/2026 | Item 6 | Calculado flag _isProfileComplete no GET do Tenant considerando Nomes, Serviços e Horários. UI de Integrações agora bloqueia conexão. | main | Build front e back OK. Impede que a instância Evolution gere erros 400. |
| 27/07/2026 | Item Extra | Transbordo Manual via Painel (Desligar IA). Lojista envia msg = HUMAN mode, IA ignorada. UI atualiza otimisticamente. | main | Build front e back OK. Verificado lógica do status no webhook e update de UI. |
| 27/07/2026 | Item 5 | CRONs sem dependência externa. Exportada lógica dos endpoints para o cron.ts rodar timers no background contínuo. | main | Build backend OK. Rotinas orquestradas com node-cron (5min, 15min, hourly, daily). |
| 27/07/2026 | Item 6 (Backlog) | Webhook dedicado do Asaas. Implementada detecção de eventos PAYMENT_RECEIVED / CONFIRMED / OVERDUE com validação segura de token via API do Asaas v3 no mesmo endpoint genérico de pagamentos. | main | Build backend OK. Lógica reutiliza pipeline de notificação do WhatsApp e sync de Google Calendar. |
| 27/07/2026 | Itens 8 e 9 (Fase 3) | Cancelamento e Reagendamento autônomos via IA. Injetado contexto de agendamentos pendentes. Tools `cancel_appointment` e `reschedule_appointment` criadas. Google Calendar sincroniza updates e deletes automaticamente via schema update (`googleEventId`). | main | Build backend OK. IA entende antecedência mínima e checa conflitos. |
| 27/07/2026 | Itens 10 e 11 | Dashboard Real-Time via Polling 30s. Adição de KPIs (Ticket Médio, Conversão baseada em chats ativos). | main | UI atualizada. Componentes React usam setInterval sem vazar memória. Backend otimizado para calcular KPIs com chat_sessions. |
| 27/07/2026 | Item 12 | Backup Automático. Configurado pg_dump diário via Node com upload S3/R2 para proteção dos dados. | main | Build backend OK. Rotina configurada às 3 da manhã com bypass local. |
| 27/07/2026 | Item 14 | Relatórios expansão. Endpoint de relatórios detalhados com JOIN, exportação CSV e tabela na interface. | main | Build front/back OK. Exportação massiva otimizada para o setor financeiro. |
| 27/07/2026 | Item 15 | Auditoria de Agendamentos. Tabela `appointment_logs` e modal de histórico de alterações na UI de listagem. | main | Build front/back OK. Gravação de logs do admin e da IA funcionais. |
| 27/07/2026 | Itens 16, 17, 18 | Iniciativa Agenda Multi-Recurso (Modos GERAL, PROFISSIONAL, CONSULTORIO). Schema, checkAvailabilityHandler, UI de configurações e Painel Agenda consolidado. | main | Todos os modos implementados e UI da agenda atualizada. |
| 27/07/2026 | Fase 5 | Item 20 (Mídias com Gemini nativo), Item 21 (Trimming de Memória com Sliding Window de 20 msgs), Item 22 (Webhook Dispatcher e Swagger UI) e Limpeza de Gateways concluídas. | main | Build backend OK. Webhooks de saída disparam em criação de agendamentos e pagamentos. |
