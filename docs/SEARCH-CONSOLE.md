# Google Search Console — vendybrasil.com

## 1. Criar a propriedade

1. Acesse [Google Search Console](https://search.google.com/search-console).
2. Abra o seletor de propriedades e clique em **Adicionar propriedade**.
3. Escolha **Domínio** — não “Prefixo do URL”.
4. Informe somente `vendybrasil.com`, sem `https://`, `www` ou barras.
5. Selecione o registro **TXT** e copie integralmente o valor semelhante a:

```text
google-site-verification=SEU_CODIGO
```

Esse código é exclusivo da conta Google e deve ser copiado sem aspas, espaços
extras ou alteração de letras.

## 2. Adicionar o TXT na HostGator

1. Acesse o Portal do Cliente da HostGator.
2. Entre em **Domínios**.
3. Localize `vendybrasil.com` e clique em **Configurar Domínio**.
4. Abra **Editar Zona Avançada de DNS**.
5. Clique em **Adicionar Registro** e preencha:

| Campo | Valor |
|---|---|
| Tipo | `TXT` |
| Nome/Host | `vendybrasil.com` ou `@`, conforme o formato aceito pelo painel |
| TTL | manter o padrão; `14400` está correto |
| Texto/Valor | `google-site-verification=SEU_CODIGO` |

Não altere os registros A/CNAME da Vercel e não apague outros registros TXT.
Mais de um registro TXT pode existir no domínio.

Depois de salvar, volte ao Search Console e clique em **Verificar**. A
propagação costuma ser rápida, mas Google e HostGator alertam que pode levar de
algumas horas a dois ou três dias. Não remova o TXT após a verificação, pois ele
mantém a propriedade validada.

Para conferir a propagação pelo terminal:

```bash
nslookup -type=TXT vendybrasil.com
```

## 3. Enviar o sitemap

Depois que a propriedade estiver verificada:

1. No menu do Search Console, acesse **Indexação → Sitemaps**.
2. Em **Adicionar um novo sitemap**, informe:

```text
https://www.vendybrasil.com/sitemap.xml
```

3. Clique em **Enviar**.
4. O status esperado é **Sucesso**.

O sitemap já está público, usa o domínio canônico `www` e contém a home,
categorias, blog e política de privacidade.

## 4. Verificações recomendadas

1. Em **Inspeção de URL**, teste `https://www.vendybrasil.com/`.
2. Execute **Testar URL publicada** e confirme que o rastreamento é permitido.
3. Se necessário, clique em **Solicitar indexação**.
4. Repita para páginas prioritárias de categorias e posts publicados.
5. Em **Configurações → Associações**, associe a propriedade ao Google
   Analytics quando a opção estiver disponível.

Referências oficiais:

- [Verificar a propriedade](https://support.google.com/webmasters/answer/9008080)
- [Relatório de sitemaps](https://support.google.com/webmasters/answer/7451001)
- [Registros DNS na HostGator](https://suporte.hostgator.com.br/hc/pt-br/articles/30813120385427-Como-criar-ou-alterar-um-registro-A-MX-TXT-CNAME-e-outros-na-Zona-DNS)
