
# 🌐 Guia de Domínio Personalizado: egos.ia.br

Para conectar seu domínio `egos.ia.br` ao Listening Spiral, siga os passos abaixo.

## 1. No Vercel Dashboard
1. Acesse o projeto **egos-web**.
2. Vá em **Settings** > **Domains**.
3. Digite `egos.ia.br` e clique em **Add**.
4. O Vercel vai gerar uma configuração DNS necessária (provavelmente um CNAME ou A Record).

## 2. No Registro.br (ou onde comprou o domínio)
1. Acesse a zona de DNS do domínio `egos.ia.br`.
2. Adicione os registros indicados pelo Vercel:

| Tipo | Nome | Valor |
|---|---|---|
| A | @ | 76.76.21.21 |
| CNAME | ww | cname.vercel-dns.com |

> **Nota:** Se o domínio já estiver no Carteira Livre, você precisará decidir:
> - Usar um subdomínio para o Lab? (Ex: `lab.egos.ia.br`)
> - Ou migrar o domínio principal? (Isso tirará o Carteira Livre do ar nesse endereço).

## 3. Verificação
- Aguarde a propagação (pode levar de 1h a 24h).
- O Vercel mostrará um "check" verde quando estiver ativo.
