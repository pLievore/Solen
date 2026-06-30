# Analytics (GA4) — Vendy

Painel em `/admin/analytics`. A API lê a **GA4 Data API** (`admin/ga-analytics`)
com uma service account (`GA4_PROPERTY_ID` + `GA_SA_KEY_BASE64` no Render) e
cruza com o banco de propostas/assistência. Todo o tráfego de `/admin` é
excluído das métricas.

## Indicadores já disponíveis

- **Tráfego:** visitas, visitantes, sessões; visitas por dia (com rótulos).
- **Engajamento:** % novos visitantes, duração média, taxa de engajamento e
  rejeição.
- **Picos:** acessos por horário e por dia da semana.
- **Aquisição:** canais e origem detalhada (fonte/mídia).
- **Sistema:** iPhone × Android (operatingSystem) e categoria de dispositivo.
- **Localização:** mapa de bolhas por estado + principais cidades.
- **Páginas:** mais visitadas e de entrada (landing pages).
- **Funil de conversão:** usuários únicos que chegaram pelo menos até cada
  etapa (monotônico).
- **Da avaliação à venda:** propostas recebidas, em contato, fechadas,
  perdidas, taxa de fechamento, valor fechado, ticket médio.
- **Perfil do estoque:** distribuição Sim/Não das respostas das avaliações +
  taxa de sucata.
- **Assistência:** aparelhos por status e por técnico, tempo médio de reparo.

## Eventos do funil (GA4)

`page_view` (automático) · `iniciou_avaliacao` · `selecionou_modelo` ·
`avancou_etapa` (param `etapa`) · `enviou_avaliacao` · `lead`.
O funil também soma os nomes antigos equivalentes (`category_selected`,
`model_selected`, `variant_selected`, `evaluation_started`,
`lead_form_started`, `quote_generated`, `whatsapp_redirect`) para incluir o
histórico anterior à padronização.

## Fase 5 — Dimensões personalizadas (para desbloquear cortes por aparelho)

Os eventos enviam parâmetros que **só ficam consultáveis na Data API depois de
registrados como Dimensões personalizadas** no GA4. Registre uma vez (vale
apenas para dados coletados a partir do registro):

**GA4 → Administrador → Definições personalizadas → Criar dimensões
personalizadas.** Para cada uma: escopo = **Evento**, e o **parâmetro do
evento** com o nome exato abaixo.

| Nome sugerido | Parâmetro do evento | Vem de |
|---|---|---|
| Categoria | `categoria` | iniciou_avaliacao, selecionou_modelo, avancou_etapa |
| Categoria (nome) | `categoria_nome` | iniciou_avaliacao |
| Modelo (id) | `modelo_id` | selecionou_modelo, avancou_etapa |
| Modelo (nome) | `modelo_nome` | selecionou_modelo |
| Versão (id) | `variant_id` | avancou_etapa, enviou_avaliacao, lead |
| Versão (nome) | `variant_nome` | avancou_etapa |
| Etapa | `etapa` | avancou_etapa (`versao` / `iniciou_questionario` / `dados_contato`) |
| Valor | `valor` | enviou_avaliacao |
| Sucata | `is_scrap` | avancou_etapa, enviou_avaliacao |

Depois de registradas e com alguns dias de coleta, dá para adicionar relatórios
como **conversão por categoria/modelo**, **funil por `etapa` nomeada** e
**valor médio de avaliação por origem/dispositivo** (consultando
`customEvent:<parâmetro>` na Data API).
