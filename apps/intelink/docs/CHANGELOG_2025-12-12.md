# Changelog - 12 de Dezembro de 2025

## 🎯 Objetivo Principal
Simplificar o gerenciamento de membros/visitantes e implementar recuperação de senha via Email.

---

## ✅ Funcionalidades Implementadas

### 1. Sistema de Código de Acesso (ABC123)
- **Formato:** 3 letras + 3 números (ex: `WUK738`)
- **Validade:** 7 dias
- **Uso único:** Código é invalidado após uso
- **Geração:** Admin pode gerar em `/central/equipe`

### 2. Recuperação de Senha via Email
- **Integração:** Resend (3000 emails/mês grátis)
- **Domínio:** `noreply@intelink.ia.br` (verificado)
- **Fallback:** Se email falhar, mostra WhatsApp do admin
- **Aviso de spam:** Mostra alerta para verificar pasta de spam

### 3. Auto-Vinculação de Email
- Usuários sem email/telegram podem adicionar email na hora
- Fluxo: "Esqueci senha" → "Adicione um Contato" → Digita email → Recebe código

### 4. Normalização de Telefone Brasileiro
- Auto-converte formato antigo para novo:
  - `XX XXXX-XXXX` → `XX 9XXXX-XXXX`
- Transparente para o usuário

### 5. Melhorias no Logout
- Antes: Mostrava erro de Telegram
- Agora: Mostra "Logout realizado" → Tela de login por telefone

---

## 🔧 APIs Criadas/Modificadas

| API | Método | Descrição |
|-----|--------|-----------|
| `/api/members/access-code` | POST | Gera código ABC123 para membro |
| `/api/members/add-email` | POST | Adiciona email ao próprio perfil |
| `/api/auth/forgot-password` | POST | Envia código via Email/Telegram |
| `/api/auth/verify-reset-code` | POST | Verifica código (usa `access_code`) |
| `/api/auth/reset-password` | POST | Define nova senha (usa `access_code`) |
| `/api/auth/phone` | POST | Login por telefone (usa normalização) |

---

## 🗄️ Colunas do Banco Utilizadas

```sql
-- intelink_unit_members
access_code TEXT,                    -- Código ABC123
access_code_expires_at TIMESTAMPTZ,  -- Validade (7 dias)
access_code_created_by UUID,         -- Quem gerou
email TEXT                           -- Email para recuperação
```

---

## 📁 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `lib/email.ts` | Integração Resend |
| `lib/utils/phone-normalizer.ts` | Normalização de telefone |
| `app/auth/page.tsx` | Tela de login/recuperação |
| `app/central/equipe/page.tsx` | Gestão de equipe (nova) |

---

## 🔐 Variáveis de Ambiente Necessárias

```env
# Resend (Email)
RESEND_API_KEY=re_8FJVnrAm_...

# Telegram (OTP)
TELEGRAM_BOT_TOKEN=...
```

---

## 📊 Fluxos de Autenticação

### Login Normal
```
1. Digita telefone
2. Digita senha
3. [Se tem Telegram] Recebe OTP → Digita OTP
4. Logado!
```

### Recuperação de Senha
```
1. Clica "Esqueci minha senha"
2. Sistema verifica:
   - Tem Email? → Envia código
   - Tem Telegram? → Envia código
   - Não tem nada? → Mostra "Adicione seu Email"
3. Digita código ABC123
4. Cria nova senha
5. Logado!
```

### Primeiro Acesso (Admin gera código)
```
1. Admin vai em /central/equipe
2. Clica "Gerar Código" no membro
3. Envia código via WhatsApp
4. Usuário acessa com telefone + código
5. Cria senha
6. Logado!
```

---

## ⚠️ Pontos de Atenção

1. **Emails podem cair no spam** - Domínio verificado mas novo
2. **Escolha Email vs Telegram** - Ainda não implementado (envia para ambos)
3. **Página /central/equipe** - Nova, substitui /central/membros e /central/permissoes

---

## 🚀 Próximos Passos (Sugestões)

- [ ] Permitir escolher entre Email ou Telegram na recuperação
- [ ] Remover páginas antigas (/central/membros, /central/permissoes)
- [ ] Configurar SPF/DKIM para melhor deliverability de email
- [ ] Logs de auditoria para geração de códigos
