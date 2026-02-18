# Widget Standards - Intelink Investigation Page

**Version:** 1.0.0
**Updated:** 2025-12-17

---

## 📐 Dimensões Padrão

```
min-h-[300px] max-h-[400px] overflow-y-auto
```

Todos os widgets DEVEM seguir esta altura para manter consistência visual.

---

## 🧱 Arquitetura de Componentes

### Hierarquia

```
ResponsiveWidgetRow
├── ResponsiveWidget (isOpen, otherOpen, isFirst)
│   └── CollapsibleWidget (storageKey, title, icon, badge, onOpenChange, headerAction)
│       └── [Content Component] (hideHeader={true})
```

### Componentes Envolvidos

| Componente | Arquivo | Props Importantes |
|------------|---------|-------------------|
| `ResponsiveWidgetRow` | `shared/ResponsiveWidgetRow.tsx` | `firstOpen`, `secondOpen` |
| `ResponsiveWidget` | `shared/ResponsiveWidgetRow.tsx` | `isOpen`, `otherOpen`, `isFirst` |
| `CollapsibleWidget` | `shared/CollapsibleWidget.tsx` | `storageKey`, `onOpenChange`, `headerAction` |

---

## 🎨 Padrão de Ícones

| Widget | Ícone | Cor |
|--------|-------|-----|
| Síntese | `Brain` | purple |
| Cross-Case | `AlertTriangle` | warning |
| Links Previstos | `Sparkles` | success |
| Envolvidos | `Users` | purple |
| Evidências | `FileText` | emerald |
| Timeline | `Activity` | cyan |
| Grafo | `Network` | blue |
| Rho | `Activity` | blue |

---

## 🏷️ Badge Variants

```typescript
const BADGE_COLORS = {
    default: 'bg-slate-700 text-slate-300',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/20 text-red-400',
};
```

---

## 📋 Componentes com `hideHeader`

Componentes que têm header interno e precisam de `hideHeader={true}` quando usados dentro de `CollapsibleWidget`:

| Componente | Prop |
|------------|------|
| `NarrativeSummary` | `hideHeader` |
| `GroupedEntityList` | `hideHeader` |
| `PredictedLinksPanel` | `hideContainer` |
| `RhoHealthWidget` | `hideHeader` |

---

## 🔄 Recolhimento Dinâmico

Quando um widget é recolhido:
1. O widget parceiro expande para 100% da largura
2. O widget recolhido vai para a linha de baixo
3. Transição suave de 300ms

**Estados necessários na página:**
```tsx
const [synthesisOpen, setSynthesisOpen] = useState(true);
const [crosscaseOpen, setCrosscaseOpen] = useState(true);
// ... para cada par de widgets
```

---

## 📝 Exemplo de Uso Completo

```tsx
<ResponsiveWidgetRow firstOpen={widgetAOpen} secondOpen={widgetBOpen}>
    <ResponsiveWidget isOpen={widgetAOpen} otherOpen={widgetBOpen} isFirst={true}>
        <CollapsibleWidget
            storageKey={`widgetA_${id}`}
            title="Widget A"
            icon={<IconA className="w-4 h-4" />}
            badge={count}
            badgeVariant="success"
            defaultOpen={true}
            collapsedSummary="Resumo quando fechado"
            onOpenChange={setWidgetAOpen}
            headerAction={<Link href="/page">Ver tudo →</Link>}
        >
            <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                <ContentComponent hideHeader={true} />
            </div>
        </CollapsibleWidget>
    </ResponsiveWidget>
    
    <ResponsiveWidget isOpen={widgetBOpen} otherOpen={widgetAOpen} isFirst={false}>
        {/* Widget B */}
    </ResponsiveWidget>
</ResponsiveWidgetRow>
```

---

## ✅ Checklist para Novos Widgets

- [ ] Usar `CollapsibleWidget` como wrapper
- [ ] Definir `storageKey` único para persistência
- [ ] Adicionar `onOpenChange` se estiver em `ResponsiveWidgetRow`
- [ ] Usar altura padrão `min-h-[300px] max-h-[400px]`
- [ ] Usar `hideHeader={true}` se o componente interno tiver header
- [ ] Escolher `badgeVariant` apropriado
- [ ] Adicionar `collapsedSummary` informativo
- [ ] Usar `headerAction` para links "Ver tudo"
