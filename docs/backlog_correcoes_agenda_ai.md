# 🛠️ Backlog de Correções e Implementações — AgendaZap

**Base:** Relatório de Auditoria Técnica (26/07/2026)
**Objetivo:** Corrigir o discurso comercial e evoluir o produto para justificar a lista de funcionalidades vendida.

---

## 🔴 P0 — Urgente (antes de qualquer feature nova)

### 1. Rotacionar credenciais expostas no `.env` ✅ APROVADO
- **Problema:** Senhas de banco, chaves de API e tokens em texto plano, possivelmente versionados no Git.
- **Ação:** Confirmar `.gitignore`, rotacionar TODAS as chaves (Gemini, Mercado Pago, Asaas, AbacatePay, Evolution API, Resend, JWT secret), mover para variáveis de ambiente do provedor de hosting (Vercel/Render).
- **Esforço:** Baixo (execução) / Alto (risco se não feito)
- **Por que primeiro:** Se o repositório já vazou, cada dia sem rotação é exposição ativa.

### 2. Corrigir `billingRenewal.ts` (stub sem lógica) ✅ APROVADO
- **Problema:** Cron diário registrado, mas a função só loga — billing recorrente não funciona de fato.
- **Ação:** Unificar com a lógica já funcional em `/api/cron/billing`, ou implementar a renovação real nesse arquivo.
- **Esforço:** Médio
- **Depende de:** Nada — pode ser feito em paralelo ao P0.1

---

## 🟠 P1 — Alto impacto / baixo-médio esforço (quick wins)

### 3. Finalizar integração Google Calendar ✅ APROVADO
- **O que fazer:** Conectar `addEventToCalendar()` (já implementada e funcional) ao `appointmentHandler`, para que todo agendamento criado pela IA também crie evento no Google Calendar do profissional/clínica.
- **Esforço:** Baixo — só falta o "fio" entre o handler existente e a função já pronta.

### 4. Personalização da IA (formulário no frontend) ✅ APROVADO
- **O que fazer:** Construir formulário estruturado em `settings/page.tsx` para editar `aiConfig` (tom de atendimento, regras de agendamento, restrições, mensagem de encerramento) sem precisar mexer em JSON manualmente.
- **Esforço:** Baixo — backend já suporta tudo via `/api/settings/ai-presets`.

### 5. CRONs sem dependência externa ✅ APROVADO
- **Problema:** `reminders`, `expire-appointments`, `daily-report`, `billing`, `check-instances` dependem de um serviço externo (Vercel Cron/UptimeRobot) chamar o endpoint. Só o cron de automações roda internamente via `initCron()`.
- **O que fazer:** Estender `lib/cron.ts` (que já roda a cada minuto internamente) para orquestrar todos os jobs, com fallback para trigger externo como redundância.
- **Esforço:** Baixo-Médio

### 6. Webhook dedicado do Asaas ✅ APROVADO
- **Problema:** Código de pagamento Asaas existe, mas não há endpoint de webhook para confirmar pagamento — hoje só Mercado Pago e AbacatePay são reconhecidos no webhook genérico.
- **O que fazer:** Criar handler específico em `/api/webhooks/payment` (ou rota dedicada) para detectar e processar notificações da Asaas.
- **Esforço:** Baixo-Médio

### 7. Liberação automática do agendamento (ajuste semântico) ✅ APROVADO — manter lógica atual
- **Decisão confirmada:** Manter o modelo atual (reserva antes do pagamento + expira por timeout via `expire-appointments`). Nenhuma mudança de código necessária — só ajustar a copy de marketing para não prometer "liberação após confirmação ativa" quando na prática é "reserva + expiração".
- **Esforço:** Baixo (apenas texto de vendas/documentação)

---

## 🟡 P2 — Funcionalidades centrais faltantes (médio esforço)

### 8. Cancelamento de consultas via IA/WhatsApp
- **O que fazer:** Criar tool de IA `cancel_appointment` + handler, com validação de janela mínima de cancelamento (ex: não cancelar em cima da hora) e liberação do slot.
- **Esforço:** Médio

### 9. Reagendamento via IA/WhatsApp
- **O que fazer:** Criar tool `reschedule_appointment` + handler, reaproveitando a lógica de `check_availability` para validar o novo horário e evitar conflito.
- **Esforço:** Médio
- **Dica:** Faz sentido implementar junto com o item 8 — compartilham boa parte da lógica de validação de agendamento.

### 10. Dashboard em tempo real
- **O que fazer:** Trocar polling manual por WebSocket ou Server-Sent Events nos endpoints de métricas (`/api/dashboard/metrics`), ou no mínimo implementar polling automático no frontend (ex: a cada 30s) como solução intermediária de baixo custo.
- **Esforço:** Médio (SSE) — recomendo começar por polling automático como v1, e WebSocket como v2 se o volume justificar.

### 11. Indicadores de desempenho (KPIs)
- **O que fazer:** Calcular e expor: taxa de conversão (agendamentos/conversas), tempo médio de resposta da IA, taxa de no-show, taxa de abandono, ticket médio, LTV de clientes.
- **Esforço:** Médio-Alto — depende de instrumentação adicional (ex: marcar quando conversa vira lead vs agendamento).

### 12. Backup automático
- **O que fazer:** Configurar rotina de `pg_dump` agendada (via cron interno) com upload para storage externo (Cloudflare R2 — já tem variável `R2_ENDPOINT` no `.env`, só falta configurar) ou confirmar e documentar os backups nativos do Supabase como camada adicional.
- **Esforço:** Médio

### 13. Gestão de permissões dos usuários (RBAC granular) ✅ APROVADO
- **O que fazer:** Evoluir de 3 roles fixos para permissões configuráveis por módulo (ex: "pode ver pagamentos mas não editar"). Inclui separar "profissional" de "usuário do sistema" como entidades distintas.
- **Esforço:** Médio — é redesign, não só feature nova.
- **Observação:** Esse item também é pré-requisito técnico para os itens 14 e 15 (agenda por profissional depende de ter profissional como entidade própria).

### 14. Relatórios (expansão)
- **O que fazer:**
  - Endpoint dedicado de conversas por período (contagem agregada)
  - Relatório consolidado de agendamentos/cancelamentos com taxa de conversão e comparação entre períodos
  - Exportação em CSV/PDF
- **Esforço:** Médio

### 15. Histórico completo de auditoria (expandir além de login)
- **O que fazer:** Auditar também operações de CRUD relevantes (edição de serviços, mudança de configuração de IA, alteração de agendamento por operador).
- **Esforço:** Baixo-Médio — a tabela `auditLogs` já existe, é questão de instrumentar mais pontos do código.

---

## 🔵 P3 — Maior esforço arquitetural

### 16. Agenda por profissional
- **O que fazer:** Criar tabela `professionals`, adicionar `professional_id` em `schedules`, `appointments` e `services`. Atualizar `checkAvailabilityHandler` e `createAppointmentTool` para considerar disponibilidade por profissional. Atualizar frontend de agenda.
- **Esforço:** Alto — mudança de schema + lógica de disponibilidade + UI.
- **Depende de:** Item 13 (separar profissional de usuário do sistema).

### 17. Agenda por consultório
- **O que fazer:** Criar tabela `rooms`, adicionar `room_id` em `appointments`/`schedules`. Definir se um consultório pode ter múltiplos profissionais e como resolver conflito de sala.
- **Esforço:** Alto
- **Depende de:** Item 16 (mesma mudança estrutural, faz sentido implementar juntos).

### 18. Agenda geral — ✅ DEFINIÇÃO CONFIRMADA
Dois sub-itens dentro da mesma iniciativa dos itens 16/17:
- **18a. Modo de agenda configurável por tenant** — a clínica escolhe entre "geral" (sem split, comportamento atual do sistema), "por profissional" ou "por consultório". O modo `GERAL` precisa continuar funcionando sem regressão para quem não migrar.
- **18b. Painel consolidado** — visão que junta as agendas de todos os profissionais/consultórios num só lugar, com filtros, visível quando o tenant estiver em modo separado (profissional ou consultório).
- **Esforço:** 18a é baixo-médio (é essencialmente um campo de configuração + ajuste de lógica condicional); 18b é médio, e só faz sentido **depois** de 16 e 17 existirem com dados reais.

### 19. Integração oficial do WhatsApp (Meta Cloud API) — ✅ MODELO DE CUSTO CONFIRMADO
- **O que fazer:** Implementar camada paralela usando a API oficial da Meta (Cloud API), com abstração para escolher entre Evolution API (não oficial) e API oficial por tenant — permite migração gradual sem quebrar clientes já usando Evolution.
- **Esforço:** Alto — requer conta Meta Business verificada, templates de mensagem pré-aprovados para iniciar conversas fora da janela de resposta, e reescrita da camada de envio/recebimento.
- **Modelo de custo confirmado:** a partir de 01/10/2026 a Meta cobra por mensagem de resposta ao cliente ("service message") dentro da janela de 24h — hoje gratuita. **Decisão: esse custo é repassado ao lojista**, via linha de cobrança no billing (relaciona com os itens 2 e 14).
- ⚠️ **Não confundir com "Meta Business Agent"** (agente de IA da própria Meta, cobrado por token a partir de 01/08/2026) — é um produto concorrente, não deve ser habilitado. O AgendaZap usa a Cloud API só como transporte, mantendo a própria IA (Gemini) como motor de resposta.

### 20. Suporte completo a mídias (áudio, vídeo, documento, imagem, localização, contatos)
- **O que fazer:** Hoje só texto está completo nos dois sentidos, e imagem só no envio. Faltam: recebimento de imagem, áudio (envio + recebimento, incluindo transcrição via IA para o áudio recebido virar contexto), vídeo, documento, localização, contatos.
- **Esforço:** Médio-Alto — cada tipo de mídia tem tratamento próprio (download, storage, e no caso de áudio, transcrição antes de virar input pro Gemini).
- **Sugestão de ordem:** Imagem (recebimento) → Áudio (maior valor para o cliente final) → Documento → Localização/Contatos (menor prioridade, uso raro em clínica).

### 21. Melhorar memória, contexto e histórico da conversa
- **Problema identificado:** Histórico cresce indefinidamente no JSONB, sem poda — risco de performance e custo de tokens em conversas longas.
- **O que fazer:** Implementar estratégia de sumarização/trimming (ex: manter últimas N mensagens completas + resumo do restante), ou paginar o histórico enviado ao Gemini.
- **Esforço:** Médio

### 22. API pública documentada + Webhooks de saída
- **O que fazer:**
  - Gerar documentação OpenAPI/Swagger real (hoje `swagger.json` retorna 404)
  - Implementar sistema de webhooks de saída — eventos como "novo agendamento", "pagamento confirmado" disparando POST para URLs configuradas por integradores
- **Esforço:** Alto — são dois itens grandes e independentes entre si (documentação vs. infraestrutura de eventos).

---

## 🧹 Limpeza técnica (sem prazo definido, mas recomendado)
- Remover ou isolar claramente o código legado em `src/gateways/` (Mercado Pago e AbacatePay antigos, não usados) para evitar manutenção acidental no código errado.

---

## 📌 Ordem sugerida de execução

```
Semana 1        → P0 (itens 1-2)
Semanas 2-3     → P1 (itens 3-7) — quick wins, entregam valor rápido
Semanas 4-7     → P2 (itens 8-15) — funcionalidades centrais
Semanas 8+      → P3 (itens 16-22) — mudanças arquiteturais, priorizar
                  conforme demanda comercial (ex: se cliente enterprise
                  pede "agenda por profissional", adianta 16-17-18;
                  se o risco de banimento do WhatsApp virar bloqueio
                  de vendas, adianta o item 19)
```

**Nota sobre paralelismo:** os itens 16, 17 e 18 compartilham a mesma mudança de schema — vale planejá-los como uma única iniciativa em vez de três tickets separados, para não retrabalhar a migração do banco três vezes.
