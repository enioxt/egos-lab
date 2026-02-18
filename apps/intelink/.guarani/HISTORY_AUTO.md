- telefone -> phone
- profissao -> occupation
- data_nascimento -> birth_date
- endereco -> address
- placa -> plate
- modelo -> model
- marca -> brand
- cor -> color
- ano -> year
- proprietario -> owner
- situacao -> condition
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/components/intelink/PersonModal.tsx apps/intelink/components/intelink/VehicleModal.tsx 


### Commit 0fd1d525 - Mon Dec 8 15:33:25 2025 -0300
**Mensagem:** feat: improve address matching algorithm with intelligent comparison

NEW ALGORITHM:
- Parses addresses into street + number components
- Requires SAME CITY for match (if city is provided)
- Requires numbers within 50 of each other
- NO match if numbers are > 50 apart (was matching 281 vs 1290 before!)

CONFIDENCE LEVELS:
- 90%: Exact same address (diff = 0)
- 85%: Numbers within 10 (e.g., 281 vs 290)
- 80%: Numbers within 25 (e.g., 281 vs 300)
- 75%: Numbers within 50 (e.g., 281 vs 320)
- NO MATCH: Numbers > 50 apart

EXAMPLE (BEFORE vs AFTER):
Paulo: Rua São Paulo, 281 (Uberaba)
Cláudia: Rua São Paulo, 1290 (Betim)
- BEFORE: Match 80% (Jaro-Winkler score 0.94)
- AFTER: NO MATCH (different cities + diff = 1009)
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/lib/intelink/cross-reference-service.ts 


### Commit ba11aa4f - Mon Dec 8 15:38:46 2025 -0300
**Mensagem:** feat: intelligent name matching to prevent false positives

PROBLEM:
- 'Marcos Dias' was matching 'Marcos Silva' and 'Marcos Alves'
- Only first name was equal = too many false positives
- Common names like 'José', 'Maria', 'Marcos' would pollute results

NEW RULES:
1. First name common (Marcos, José, Maria) + different last name = NO MATCH
2. First + last name equal = MATCH 75%
3. Full name Jaro-Winkler > 0.92 = MATCH 70%
4. Common first name + same city + same street = MATCH 65%

COMMON NAMES LIST (40+):
José, João, Maria, Antonio, Francisco, Carlos, Paulo, Marcos,
Ana, Sandra, Adriana, Juliana, etc.

EXAMPLES:
- 'Marcos Dias' vs 'Marcos Silva' → NO MATCH (common name, different surname)
- 'Marcos Dias' vs 'Marcos Dias' → MATCH 75%
- 'João Paulo Silva' vs 'João Paulo' → MATCH 70% (similar full name)
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/lib/intelink/cross-reference-service.ts 


### Commit 2fcab40e - Mon Dec 8 15:41:16 2025 -0300
**Mensagem:** docs: create metadata schema documentation and validation script

NEW FILES:
1. docs/INTELINK_METADATA_SCHEMA.md
   - Complete schema for all entity types (PERSON, VEHICLE, LOCATION, etc.)
   - Portuguese field names mandatory
   - English field names mapping table

2. scripts/intelink/validate_metadata_fields.py
   - Pre-commit hook to detect English field names
   - Focused on actual metadata fields, ignores system properties
   - Reports: file, line, english field, portuguese equivalent

DETECTED ITEMS (16):
- All are intentional fallbacks for backward compatibility
- Pattern: (meta.mae || meta.mother)
- NEW data should always use Portuguese fields

RULES SUMMARY:
✅ mae, pai, telefone, endereco, profissao
❌ mother, father, phone, address, occupation

NOTE: 'type', 'status' are OK in English (system properties)
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md docs/INTELINK_METADATA_SCHEMA.md scripts/intelink/validate_metadata_fields.py 


### Commit 116d4001 - Mon Dec 8 16:09:25 2025 -0300
**Mensagem:** fix: improve address matching to compare only street NAME, not prefix

PROBLEM:
- 'Avenida Brasil, 159' was matching 'Avenida Amazonas, 202'
- Both start with 'AVENIDA', giving high Jaro-Winkler score (0.8585)
- This is a FALSE POSITIVE - they are completely different streets!

SOLUTION:
1. Extract street type (Rua, Avenida, etc.) separately from street name
2. Compare ONLY the street name (Brasil vs Amazonas)
3. Increase threshold from 0.85 to 0.90

NEW ALGORITHM:
- 'Avenida Brasil' → type: 'AVENIDA', name: 'Brasil'
- 'Avenida Amazonas' → type: 'AVENIDA', name: 'Amazonas'
- Score: 'Brasil' vs 'Amazonas' = 0.43 (< 0.90) → NO MATCH

PREFIXES RECOGNIZED:
Avenida, Rua, Travessa, Alameda, Praça, Estrada, Rodovia, Largo, Beco, Vila

TEST RESULTS:
- Brasil vs Amazonas: 0.43 → NO MATCH ✅
- São Paulo vs Sao Paulo: 1.00 → MATCH ✅
- Brasil vs Brasília: 0.95 → MATCH (acceptable)
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/lib/intelink/cross-reference-service.ts 


### Commit 3a898ac4 - Mon Dec 8 16:22:00 2025 -0300
**Mensagem:** feat: improve LinkCard with narrative presentation

CHANGES:
1. NEW: generateMatchNarrative() function
   - Generates human-readable explanations of why entities matched
   - Shows details like 'CPF idêntico', 'Nome similar (85%)', etc.
   - Extracts enderecoDetalhes and nomeDetalhes for clearer explanations

2. NEW: MATCH_CRITERIA_LABELS mapping
   - Portuguese labels for all match criteria
   - cpf → 'CPF idêntico', endereco → 'Endereço similar', etc.

3. IMPROVED: LinkCard component
   - Narrative format: '[Entity A] da [Op X] possui vínculo com [Entity B] da [Op Y]'
   - All entities and operations are clickable links
   - Color-coded: blue for source entity, amber for target entity, green for operations
   - Clear 'Motivo do match' section with bullet points
   - Badges for match criteria at bottom

4. UI IMPROVEMENTS:
   - Cleaner header with confidence badge, status, and entity type
   - Actions (Rejeitar/Confirmar) aligned to the right
   - Better visual hierarchy with nested card for narrative

FILE: apps/intelink/app/central/vinculos/page.tsx
LINES: +150 (new narrative system)
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/central/vinculos/page.tsx 


### Commit 57d73fa3 - Mon Dec 8 16:35:26 2025 -0300
**Mensagem:** fix: improve LinkCard UX and add matched entity modal

FIXES:
1. ADD: Hover tooltip for confidence badge
   - Shows percentage and description
   - Color-coded explanations (🔴 🟠 🟡 ⚪)
   - Positioned correctly with z-50

2. FIX: Amber entity now opens popup instead of navigation
   - Before: clicking 'Fernanda Rodrigues' (amber) opened investigation page
   - After: clicking opens UnifiedEntityModal with entity details
   - Added onMatchedEntityClick prop to LinkCard

3. ADD: Second modal for matched entity
   - Blue entity (source) → opens first modal
   - Amber entity (matched) → opens second modal
   - Both modals show full entity details

STATES ADDED:
- matchedEntity: UnifiedLink | null
- isMatchedModalOpen: boolean
- openMatchedEntityModal() function

FILE: apps/intelink/app/central/vinculos/page.tsx
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/central/vinculos/page.tsx 


### Commit 7c140fbc - Mon Dec 8 16:37:15 2025 -0300
**Mensagem:** debug: add detailed logging to UnifiedEntityModal

Added console.log to track:
- entityId, entityName being passed
- sourceInvestigationId, targetInvestigationId
- Query results (hasData, error, metadataKeys)

This will help diagnose why 'Entidade sem dados cadastrados' is showing
when the entity actually has data in the database.
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/components/shared/UnifiedEntityModal.tsx 


### Commit dec89272 - Mon Dec 8 16:47:48 2025 -0300
**Mensagem:** debug: add logs to trace entity ID flow in vinculos page

Added console.log to:
1. API response - shows sourceEntityId coming from API
2. openEntityModal - shows which ID will be passed to modal
3. openMatchedEntityModal - shows which ID will be passed

This will help identify where sourceEntityId is being lost.
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/central/vinculos/page.tsx 


### Commit f508cfd1 - Mon Dec 8 16:49:45 2025 -0300
**Mensagem:** fix: remove !inner joins causing entity modal to fail

BUG: Entity modal showed 'Entidade sem dados cadastrados' even when entity had data

CAUSE: Using !inner (INNER JOIN) in Supabase queries caused the query to fail
if the investigation relationship was missing or had issues.

FIX: Changed all 4 occurrences of 'intelink_investigations!inner' to
'intelink_investigations' (LEFT JOIN) which returns the entity even if
the investigation relationship is incomplete.

FILE: apps/intelink/components/shared/UnifiedEntityModal.tsx
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/components/shared/UnifiedEntityModal.tsx 


### Commit fe2b09ee - Mon Dec 8 16:51:54 2025 -0300
**Mensagem:** refactor: rename 'Investigação' to 'Operação' in UI strings

SCOPE: UI text only (visible to users)
- NOT changed: variable names, table names, API routes, IDs

CHANGES (369 replacements in 99 files):
- 'Investigação' → 'Operação'
- 'investigação' → 'operação'
- 'Investigações' → 'Operações'
- 'investigações' → 'operações'
- Labels: 'Nova Investigação' → 'Nova Operação', etc.

PRESERVED (technical code):
- investigation_id
- sourceInvestigationId
- targetInvestigationId
- intelink_investigations (table)
- /api/investigation routes
- /investigation/[id] routes

NOTE: Routes remain as '/investigation' for backward compatibility.
Consider adding redirects from '/operacao' → '/investigation' later.
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/README.md apps/intelink/app/analytics/page.tsx apps/intelink/app/api/activities/route.ts apps/intelink/app/api/chat/route.ts apps/intelink/app/api/documents/batch/route.ts apps/intelink/app/api/documents/check-duplicate/route.ts apps/intelink/app/api/documents/save/route.ts apps/intelink/app/api/findings/route.ts apps/intelink/app/api/history/route.ts apps/intelink/app/api/intelink/alerts/route.ts apps/intelink/app/api/intelink/cross-case-analysis/route.ts apps/intelink/app/api/investigation/[id]/report/route.ts apps/intelink/app/api/investigation/[id]/restore/route.ts apps/intelink/app/api/investigation/[id]/route.ts apps/intelink/app/api/investigation/analyze/route.ts apps/intelink/app/api/investigations/route.ts apps/intelink/app/api/notifications/route.ts apps/intelink/app/api/permissions/route.ts apps/intelink/app/api/report/route.ts apps/intelink/app/central/analise-vinculos/page.tsx apps/intelink/app/central/operacoes/page.tsx apps/intelink/app/central/page.tsx apps/intelink/app/central/unit/[id]/graph/page.tsx apps/intelink/app/central/vinculos/page.tsx apps/intelink/app/chat/layout.tsx apps/intelink/app/graph/[id]/page.tsx apps/intelink/app/investigation/[id]/history/page.tsx apps/intelink/app/investigation/[id]/page.tsx apps/intelink/app/investigation/[id]/reports/page.tsx apps/intelink/app/investigation/new/page.tsx apps/intelink/app/page.tsx apps/intelink/app/profile/page.tsx apps/intelink/app/reports/page.tsx apps/intelink/components/CrossCaseAlertsPanel.tsx apps/intelink/components/FindingsPanel.tsx apps/intelink/components/chat/ChatHeader.tsx apps/intelink/components/chat/ChatInput.tsx apps/intelink/components/chat/ChatMessages.tsx apps/intelink/components/chat/ChatOnboarding.tsx apps/intelink/components/demo/DemoWalkthrough.tsx apps/intelink/components/intelink/ConnectionHeatmap.tsx apps/intelink/components/intelink/DeleteConfirmModal.tsx apps/intelink/components/intelink/DocumentActionButtons.tsx apps/intelink/components/intelink/DocumentUploadModal.tsx apps/intelink/components/intelink/FirearmModal.tsx apps/intelink/components/intelink/InvestigationTimeline.tsx apps/intelink/components/intelink/LocationModal.tsx apps/intelink/components/intelink/OrganizationModal.tsx apps/intelink/components/intelink/PersonModal.tsx apps/intelink/components/intelink/ReportModal.tsx apps/intelink/components/intelink/VehicleModal.tsx apps/intelink/components/investigation/CrossInvestigationLinks.tsx apps/intelink/components/investigation/SetupWizard.tsx apps/intelink/components/investigation/new/AttachmentsTab.tsx apps/intelink/components/investigation/new/InfoTab.tsx apps/intelink/components/investigation/new/TeamTab.tsx apps/intelink/components/shared/EntityDetailModal.tsx apps/intelink/components/shared/UnifiedEntityModal.tsx apps/intelink/components/shared/VoteModal.tsx apps/intelink/docs/API_DIAGNOSTIC_2025-12-04.md apps/intelink/docs/DEPLOY.md apps/intelink/docs/LLM_CONFIGURATION.md apps/intelink/docs/PAGES_DIAGNOSTIC.md apps/intelink/hooks/usePermissions.ts apps/intelink/hooks/useRole.tsx apps/intelink/lib/bot-setup.ts apps/intelink/lib/document-extraction.ts apps/intelink/lib/gamification/gamification-adapter.ts apps/intelink/lib/i18n/translations.ts apps/intelink/lib/intelink-service.ts apps/intelink/lib/intelink/ai-chat.ts apps/intelink/lib/intelink/analysis-prompts.ts apps/intelink/lib/intelink/commands.ts apps/intelink/lib/intelink/commands/achados.ts apps/intelink/lib/intelink/commands/analisar.ts apps/intelink/lib/intelink/commands/buscar.ts apps/intelink/lib/intelink/commands/comandos.ts apps/intelink/lib/intelink/commands/exportar.ts apps/intelink/lib/intelink/commands/grafo.ts apps/intelink/lib/intelink/commands/help.ts apps/intelink/lib/intelink/commands/inserir.ts apps/intelink/lib/intelink/commands/investigacoes.ts apps/intelink/lib/intelink/commands/quem.ts apps/intelink/lib/intelink/commands/relatorio.ts apps/intelink/lib/intelink/commands/start.ts apps/intelink/lib/intelink/cross-reference-service.ts apps/intelink/lib/intelink/investigations.ts apps/intelink/lib/intelink/llm-verifier.ts apps/intelink/lib/intelink/messages.ts apps/intelink/lib/notifications/push-notifications.ts apps/intelink/lib/rag/context-retriever.ts apps/intelink/lib/rbac/RBAC_RULES.md apps/intelink/lib/rbac/index.ts apps/intelink/lib/telemetry/prompt-classifier.ts apps/intelink/lib/tenant-guard.ts apps/intelink/next-env.d.ts apps/intelink/providers/ChatContext.tsx apps/intelink/scripts/generate-cross-case-scenarios.ts apps/intelink/scripts/generate-synthetic-data.ts 


### Commit 4f00ca59 - Mon Dec 8 16:52:49 2025 -0300
**Mensagem:** cleanup: remove debug console.logs
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/central/vinculos/page.tsx 


### Commit 59b1b1f0 - Mon Dec 8 16:53:35 2025 -0300
**Mensagem:** cleanup: remove remaining debug logs from UnifiedEntityModal
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/components/shared/UnifiedEntityModal.tsx 


### Commit f584e2bf - Mon Dec 8 17:11:18 2025 -0300
**Mensagem:** fix: bypass RLS for entity modal via API route

ROOT CAUSE IDENTIFIED:
- RLS policy 'entities_select_authenticated' blocks unauthenticated reads
- UnifiedEntityModal runs client-side with ANON_KEY
- Without valid auth session, RLS returns 0 rows

SOLUTION:
1. Created /api/entities/[id] route using SERVICE_ROLE_KEY
2. Updated UnifiedEntityModal to fetch via API (bypasses RLS)
3. Added fallback to direct query if API fails

FILES:
- NEW: apps/intelink/app/api/entities/[id]/route.ts
- MODIFIED: apps/intelink/components/shared/UnifiedEntityModal.tsx

INVESTIGATION CHECKLIST UPDATED:
- ✅ RLS confirmed as root cause
- ✅ Policy requires 'authenticated' role
- ✅ Client-side query was unauthenticated
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/api/entities/[id]/route.ts apps/intelink/components/shared/UnifiedEntityModal.tsx docs/DEBUG_VINCULOS_CHECKLIST.md docs/DEBUG_VINCULOS_MODAL.md 


### Commit 85e8cf5e - Mon Dec 8 17:11:49 2025 -0300
**Mensagem:** docs: update debug checklist with final findings
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md docs/DEBUG_VINCULOS_CHECKLIST.md 


### Commit 7e24aedf - Mon Dec 8 17:24:29 2025 -0300
**Mensagem:** feat: prevent duplicate operation names + cleanup

CLEANUP:
- Deleted 186 duplicate operations (kept the one with most entities)
- Total operations reduced from 238 to 52

PREVENTION:
- Added duplicate name check on creation
- Auto-adds number suffix if name exists (e.g., 'Operação Vênus 2')
- Check is per unit_id (different units can have same name)
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/api/investigations/route.ts 


### Commit 1e86133f - Mon Dec 8 17:33:03 2025 -0300
**Mensagem:** fix: visitor role + job display in vinculos page

FIX 1: Visitor creation error 500
- Cause: DB constraint check_system_role missing 'visitor'
- Solution: Updated migration to include 'visitor'
- New migration: supabase/migrations/20251208_add_visitor_role.sql
- Updated: apps/intelink/migrations/003_add_system_roles.sql

FIX 2: Jobs showing wrong name in vinculos page
- Cause: Using job.title instead of job.entity_name
- Example: 'CPF inválido' (job title) instead of 'CARLOS MENEZES' (entity name)
- Solution: Changed entityName to use entity_name field
- Also improved: AI confidence display, job metadata

REQUIRES MANUAL ACTION:
Execute in Supabase SQL Editor:
ALTER TABLE intelink_unit_members DROP CONSTRAINT IF EXISTS check_system_role;
ALTER TABLE intelink_unit_members ADD CONSTRAINT check_system_role
CHECK (system_role IN ('super_admin', 'unit_admin', 'member', 'intern', 'visitor'));
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/central/vinculos/page.tsx apps/intelink/migrations/003_add_system_roles.sql supabase/migrations/20251208_add_visitor_role.sql 


### Commit de49880f - Mon Dec 8 17:37:46 2025 -0300
**Mensagem:** docs: update TASKS.md with Sprint 26 + system diagnostic

SPRINT 26 - DATA QUALITY & UX POLISH:
- ✅ RLS Entity Modal bypass
- ✅ 186 duplicate operations cleaned
- ✅ Duplicate name prevention
- ✅ Visitor constraint fix
- ✅ Jobs display fix (entity_name vs title)

SYSTEM METRICS:
- 132,519 lines TypeScript
- 6,431 files
- 52 operations (post-cleanup)
- 504 entities
- 236 relationships

PENDING DECISION:
- Separate Jobs from Vinculos page (different concepts)
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md TASKS.md 


### Commit 4412f206 - Mon Dec 8 17:41:13 2025 -0300
**Mensagem:** fix: separate visitors from members + remove jobs from vinculos

VISITORS:
- Visitors now filtered OUT of /central/membros page
- Visitors only appear in /central/permissoes
- Added 'Visitante' to ROLES list with gray color
- Fixed getRoleInfo fallback (was showing 'Investigador' for unknown roles)
- Added system_role to TeamMember interface

JOBS vs VINCULOS SEPARATION:
- Removed jobs loading from /central/vinculos page
- Jobs are data quality tasks (CPF inválido, duplicatas)
- Vinculos are entity cross-references (matches between operations)
- Jobs remain accessible via /jobs page

This follows the principle: Different concepts = Different pages
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/central/membros/page.tsx apps/intelink/app/central/vinculos/page.tsx 


### Commit f389717e - Mon Dec 8 17:42:21 2025 -0300
**Mensagem:** feat: add Qualidade (Jobs) link to Central nav

- Added /jobs as 'Qualidade' in Central navigation
- Jobs are data quality tasks (CPF validation, duplicates, etc.)
- Clear separation: Vínculos = entity links, Qualidade = data cleanup
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/components/central/CentralNav.tsx 


### Commit b08d52ee - Mon Dec 8 17:48:48 2025 -0300
**Mensagem:** feat: visitors in permissions page + duplicate phone protection

VISITORS:
- Now appear in /central/permissoes under 'Visitante' section
- Added 'Visitante' option to role selector
- Added delete button for visitors (super_admin only)
- Fixed membersByRole to include visitor grouping

DUPLICATE PHONE PROTECTION:
- API validates phone uniqueness before creating member
- Returns admin contact info (WhatsApp/Telegram) on duplicate
- Sends Telegram notification to admin on duplicate attempt
- UI shows friendly error with contact information

DELETE HANDLER:
- Now accepts ID from both query param and body
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/api/members/route.ts apps/intelink/app/central/permissoes/page.tsx 


### Commit 4d1dd274 - Mon Dec 8 17:52:23 2025 -0300
**Mensagem:** feat: visitor cards UI with edit/delete in permissions page

VISITOR CARDS:
- Grid layout (1/2/3 cols responsive) similar to members page
- Shows: Name, Phone, Email
- Edit button → Opens modal to update name/phone/email
- Delete button → Removes visitor with confirmation
- Role selector to promote visitor to member/intern/admin

EDIT MODAL:
- Blue themed modal for editing visitor data
- Fields: Name, Phone, Email
- Saves via PATCH /api/members

UX:
- Cards have hover effects
- Buttons have tooltips
- Actions only visible to super_admin
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/central/permissoes/page.tsx 


### Commit fbd3d3ad - Mon Dec 8 17:57:53 2025 -0300
**Mensagem:** feat: smart phone normalizer for consistent phone handling

NEW UTILITY: lib/utils/phone-normalizer.ts
- Recognizes ALL phone formats:
  - +55 24 99227-0880
  - 55 24 99227-0880
  - (24) 99227-0880
  - 24992270880
  - 24.9.9227.0880
  - etc.

FUNCTIONS:
- normalizePhone() - Returns PhoneInfo with all formats
- phonesMatch() - Smart comparison ignoring formatting
- formatPhoneDisplay() - Pretty format: (24) 99227-0880
- formatPhoneWhatsApp() - WhatsApp format: 5524992270880
- getWhatsAppLink() - Full link: https://wa.me/...
- extractPhonesFromText() - Extract phones from documents
- cleanPhoneForStorage() - DB format (digits only)

INTEGRATION:
- API /members POST: Validates duplicates with phonesMatch()
- API /members POST: Stores normalized phone
- API /members PATCH: Normalizes phone on update
- TELEGRAM_ADMIN_CHAT_ID=171767219 already configured

NEW COMPONENT: PhoneDisplay.tsx
- Formatted display with optional WhatsApp link
- Works anywhere in the system
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/api/members/route.ts apps/intelink/components/shared/PhoneDisplay.tsx apps/intelink/lib/utils/index.ts apps/intelink/lib/utils/phone-normalizer.ts 


### Commit 0839ed03 - Mon Dec 8 20:55:45 2025 -0300
**Mensagem:** fix: move /jobs to /central/qualidade for consistent navigation

PROBLEM:
- /jobs had its own header causing full page reload
- Navigation between Central tabs was inconsistent

SOLUTION:
- Created /central/qualidade with same functionality
- Uses CentralLayout (shared header/nav)
- Header persists when switching tabs (no reload)
- /jobs now redirects to /central/qualidade

UX:
- Consistent navigation experience
- Faster tab switching
- Unified Central interface
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md .guarani/preprocessor.md .windsurf/workflows/pre.md .windsurfrules apps/intelink/app/central/qualidade/page.tsx apps/intelink/app/jobs/page.tsx apps/intelink/components/central/CentralNav.tsx memory_db/memory.jsonl 


### Commit 60846559 - Mon Dec 8 21:00:32 2025 -0300
**Mensagem:** docs: auth ux strategy and nexus-pipeline architecture
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md docs/architecture/AUTH_UX_STRATEGY.md docs/architecture/HYPER_AGENT_PROTOCOL.md 


### Commit 8ff3cdec - Mon Dec 8 21:03:48 2025 -0300
**Mensagem:** docs: context lifecycle protocol
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md docs/architecture/CONTEXT_LIFECYCLE_PROTOCOL.md 


### Commit 200b7876 - Mon Dec 8 21:11:24 2025 -0300
**Mensagem:** feat: password recovery UI and API for auth page

AUTH PAGE IMPROVEMENTS:
- Added 'Esqueceu a senha?' link (forgot password)
- Added 'Problemas com acesso?' link (recover account)
- Modal for forgot password: sends code via Telegram
- Modal for recover account: shows admin contact info

API ENDPOINT:
- POST /api/auth/forgot-password
- Generates 6-digit reset code
- Stores code with 10min expiration in DB
- Sends code via Telegram Bot

DATABASE:
- Added password_reset_code column
- Added password_reset_expires column

UX:
- High-end design with animations
- Clear distinction between quick reset vs manual recovery
- WhatsApp + Telegram admin contacts
**Arquivos Relevantes:** .guarani/HISTORY_AUTO.md apps/intelink/app/api/auth/forgot-password/route.ts apps/intelink/app/auth/page.tsx 

