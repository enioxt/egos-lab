# Auth System v2.0

Sistema de autenticação enterprise-grade para Intelink.

## Arquitetura

```
lib/auth/
├── index.ts          # Exports públicos
├── types.ts          # TypeScript types
├── constants.ts      # Configurações
├── jwt.ts            # JWT com jose
├── session.ts        # Gestão de sessões
├── password.ts       # Hash, OTP, lockout
├── audit.ts          # Logging de eventos
└── hooks/
    ├── index.ts
    └── useAuth.ts    # Hook React
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v2/auth/login` | Login com phone + password |
| POST | `/api/v2/auth/logout` | Logout e revogação |
| POST | `/api/v2/auth/refresh` | Rotação de tokens |
| GET | `/api/v2/auth/verify` | Verificar sessão |

## Uso no Frontend

### Hook useAuth

```tsx
'use client';

import { useAuth } from '@/lib/auth';

export default function MyComponent() {
    const { 
        isAuthenticated,
        isLoading,
        member,
        login,
        logout,
        canAccessAdmin,
    } = useAuth();

    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <LoginForm />;

    return (
        <div>
            <p>Olá, {member?.name}</p>
            {canAccessAdmin && <AdminPanel />}
            <button onClick={logout}>Sair</button>
        </div>
    );
}
```

### Página Protegida

```tsx
'use client';

import { useRequireAuth } from '@/lib/auth';

export default function ProtectedPage() {
    const { isLoading, member } = useRequireAuth();

    if (isLoading) return <Loading />;

    return <div>Conteúdo protegido para {member?.name}</div>;
}
```

### Página Admin

```tsx
'use client';

import { useRequireAdmin } from '@/lib/auth';

export default function AdminPage() {
    const { isLoading, member } = useRequireAdmin();

    if (isLoading) return <Loading />;

    return <div>Área administrativa</div>;
}
```

## Uso no Backend (API Routes)

### Verificar Sessão

```ts
import { getCurrentSession, requireAuth, requireRole } from '@/lib/auth';

// Verificação simples
export async function GET() {
    const result = await getCurrentSession();
    
    if (!result.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ member: result.member });
}

// Com requireAuth (throws se não autenticado)
export async function POST() {
    const member = await requireAuth();
    // member é garantido aqui
}

// Com role específica
export async function DELETE() {
    const member = await requireRole(['super_admin']);
    // Apenas super_admin chega aqui
}
```

## Segurança

- **Access Token:** 15 minutos (JWT em cookie httpOnly)
- **Refresh Token:** 7 dias (cookie httpOnly, path restrito)
- **Token Rotation:** A cada refresh, tokens são regenerados
- **Lockout:** 5 tentativas falhas = 15 min bloqueado
- **Audit Log:** Todos eventos são registrados

## Tabelas do Banco

- `auth_sessions` - Sessões ativas
- `auth_audit_log` - Log de eventos

## Migração

O sistema legado (`lib/auth-legacy.ts`) ainda funciona.
Para migrar gradualmente:

1. Novas páginas usam `/api/v2/auth/*`
2. Páginas existentes continuam funcionando
3. Migrar gradualmente para o novo hook

## Permissions Matrix

| Role | Admin Pages | Manage Members | Edit Investigations |
|------|-------------|----------------|---------------------|
| super_admin | ✅ | ✅ | ✅ |
| unit_admin | ✅ | ✅ (própria unidade) | ✅ |
| member | ❌ | ❌ | ✅ |
| intern | ❌ | ❌ | ❌ (view only) |
| visitor | ❌ | ❌ | ❌ |
