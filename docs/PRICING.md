# PRICING — Motor de precificação

> Como o valor da proposta é calculado. Versão 0.1.
> Toda a lógica vive na **API** (`módulo pricing`), num único serviço testável. Valores em **centavos** (Int).

---

## 1. Entradas do cálculo

```
quote(input):
  variantId          # versão escolhida (ex.: iPhone 11 64GB)
  conditionStateId   # estado base selecionado (Bloco 2)
  answers[]          # respostas das perguntas:
                     #   - knockout (Bloco 1): { knockoutQuestionId, answer: YES|NO }
                     #   - detalhadas (Bloco 3): { detailedStateId, answer: YES|NO }
```

---

## 2. Algoritmo

```
1. KNOCKOUT (Bloco 1) — verificar perguntas eliminatórias:
   para cada knockoutQuestion:
       se answer == triggerAnswer:
           return { isScrap: true, value: scrapValue(variant), breakdown: [knockout disparado] }
   (ex.: "liga?"=NÃO  ou  "bloqueado?"=SIM  → sucata)

2. PREÇO BASE (Bloco 2):
   base = VariantPrice(variantId, conditionStateId).price
   breakdown += { tipo: "base", estado, valor: base }

3. DESCONTOS (Bloco 3) — para cada resposta detalhada da versão:
   vds   = VariantDetailedState(variantId, detailedStateId)   # atribuição
   delta = answer == YES
             ? (vds.yesDeltaOverride ?? detailedState.yesDelta)
             : (vds.noDeltaOverride  ?? detailedState.noDelta)
   total += delta
   breakdown += { pergunta, resposta, delta }

4. RESULTADO:
   value = max(base + Σdelta, MIN_VALUE)     # nunca abaixo de um piso (default 0)
   return { isScrap: false, value, breakdown }
```

### Regras
- **Knockout tem prioridade absoluta:** se qualquer pergunta eliminatória disparar, o fluxo vira sucata e os demais blocos são ignorados.
- **Deltas** são normalmente ≤ 0 (descontos), mas o modelo aceita valores positivos se um dia precisar (ex.: bônus).
- **Override por versão:** se a atribuição (`VariantDetailedState`) tiver override, ele vence o delta padrão do `DetailedState`.
- **Piso (`MIN_VALUE`):** o valor final nunca fica negativo (configurável; default R$ 0).
- **Apenas perguntas atribuídas à versão entram no cálculo** (as não atribuídas são ignoradas mesmo que venham no payload).
- **Snapshot:** ao salvar a `Proposal`, gravar `answers` + `breakdown` + `calculatedValue` como estavam no momento — alterações futuras de preço não afetam propostas antigas.

---

## 3. Exemplo completo (do briefing)

**Versão:** iPhone 11 64GB · **Estado:** Usado com marcas leves (base R$ 550,00)

| Pergunta | Resposta | Delta |
|----------|----------|------:|
| Bateria > 85%? | Não | −R$ 100,00 |
| Tela perfeita? | Sim | R$ 0,00 |
| Câmeras perfeitas? | Sim | R$ 0,00 |
| Face ID funciona? | Não | −R$ 250,00 |
| Tem restrição? | Não | R$ 0,00 |
| Mensagem peça desconhecida? | Não | R$ 0,00 |

```
base                 = 55000
+ bateria (Não)      = -10000
+ faceID (Não)       = -25000
─────────────────────────────
value                =  20000  → R$ 200,00
```

**Cenário sucata:** "O aparelho liga?" = **Não** → `isScrap=true`, `value = scrapValue(variant)` (demais respostas ignoradas).

---

## 4. Sucata (decidido)

✅ **Valor fixo por versão** (`Variant.scrapPrice`), com **fallback global** quando a versão não tiver valor próprio:

```
scrapValue(variant):
    return variant.scrapPrice ?? Setting("scrap.defaultValue")
```

- O admin define o valor de sucata por versão no painel (Precificação).
- Se a versão não tiver `scrapPrice`, usa-se o default global (`Setting scrap.defaultValue`).
- Acionado por qualquer pergunta eliminatória (knockout) — ver §2, passo 1.

---

## 5. Saída e proposta

```json
// POST /quote  → resposta
{
  "isScrap": false,
  "value": 20000,
  "valueFormatted": "R$ 200,00",
  "breakdown": [
    { "type": "base", "label": "Usado com marcas leves", "amount": 55000 },
    { "type": "delta", "label": "Bateria abaixo de 85%", "amount": -10000 },
    { "type": "delta", "label": "Face ID não funciona", "amount": -25000 }
  ]
}
```

Na tela de proposta: **valor grande** (`valueFormatted`), e o `breakdown` pode ser exibido como "como chegamos nesse valor" (transparência aumenta conversão). Botão **Continuar** → formulário do vendedor → `POST /proposals`.

---

## 6. Token e WhatsApp

- **Token:** curto, único e legível (ex.: `SOL-7Q4K2` ou 6–8 chars base32). Gerado no `POST /proposals`, salvo na `Proposal`, exibido ao usuário.
- **Mensagem do WhatsApp:** montada de um template em `Setting` (`whatsapp_message_template`) com placeholders:

```
Olá! Acabei de fazer a avaliação nº {token} no site.
Aparelho: {variant} — Estado: {condition}
Proposta: {value}
Meus dados: {sellerName} · {city}/{neighborhood}
```

- **Link:** `https://wa.me/{WHATSAPP_PHONE}?text={mensagem URL-encoded}` — aberto pelo frontend ao concluir.

---

## 7. Testes (mínimos)
- Knockout dispara sucata e ignora o resto.
- Soma de base + múltiplos deltas (caso do §3) = valor esperado.
- Override por versão prevalece sobre delta padrão.
- Piso impede valor negativo.
- Pergunta não atribuída à versão é ignorada.
- Snapshot da proposta não muda quando o preço base é alterado depois.
