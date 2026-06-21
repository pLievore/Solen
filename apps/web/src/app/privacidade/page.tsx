import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import { apiGet } from "@/lib/api";
import CookiePreferences from "./CookiePreferences";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Saiba como a Vendy coleta, utiliza, compartilha e protege dados pessoais.",
  alternates: { canonical: "/privacidade" },
  robots: { index: true, follow: true },
};

type PublicConfig = {
  privacyContactWhatsapp: string | null;
  privacyContactEmail: string | null;
};

async function getContact(): Promise<PublicConfig> {
  return apiGet<PublicConfig>("/config", {
    next: { revalidate: 300 },
  } as RequestInit).catch(() => ({
    privacyContactWhatsapp: null,
    privacyContactEmail: null,
  }));
}

export default async function PrivacyPage() {
  const contact = await getContact();
  const whatsappUrl = contact.privacyContactWhatsapp
    ? `https://wa.me/${contact.privacyContactWhatsapp}?text=${encodeURIComponent(
        "Olá! Quero falar sobre privacidade e meus dados pessoais na Vendy.",
      )}`
    : null;

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted">
          Última atualização: 20 de junho de 2026
        </p>

        <div className="prose prose-sm mt-8 max-w-none text-sm leading-relaxed">
          <p>
            Esta Política explica como a Vendy trata dados pessoais no site{" "}
            <a href="https://www.vendybrasil.com">vendybrasil.com</a>, durante a
            avaliação e eventual compra de eletrônicos usados. O tratamento é
            realizado conforme a Lei nº 13.709/2018 (Lei Geral de Proteção de
            Dados — LGPD) e demais normas aplicáveis.
          </p>

          <section>
            <h2>1. Controlador e contato</h2>
            <p>
              A Vendy, operação inscrita no CNPJ nº 66.123.276/0001-75 e
              disponível neste domínio, atua como controladora dos dados
              tratados para avaliação, atendimento, negociação e compra dos
              aparelhos.
            </p>
            <p>
              Solicitações sobre privacidade ou exercício de direitos podem ser
              encaminhadas:
            </p>
            <ul>
              {contact.privacyContactEmail && (
                <li>
                  pelo e-mail{" "}
                  <a href={`mailto:${contact.privacyContactEmail}`}>
                    {contact.privacyContactEmail}
                  </a>
                  ;
                </li>
              )}
              {whatsappUrl && (
                <li>
                  pelo{" "}
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    canal oficial de WhatsApp da Vendy
                  </a>
                  .
                </li>
              )}
              {!contact.privacyContactEmail && !whatsappUrl && (
                <li>pelo canal de WhatsApp utilizado no atendimento.</li>
              )}
            </ul>
          </section>

          <section>
            <h2>2. Dados pessoais tratados</h2>
            <p>Conforme sua interação, podemos tratar:</p>
            <ul>
              <li>
                <strong>identificação e contato:</strong> nome e número de
                WhatsApp;
              </li>
              <li>
                <strong>endereço e logística:</strong> CEP, cidade, bairro, rua,
                número e ponto de coleta ou modalidade de envio escolhida;
              </li>
              <li>
                <strong>dados do aparelho:</strong> categoria, modelo, versão,
                estado de conservação, respostas da avaliação, valor calculado
                e token da proposta;
              </li>
              <li>
                <strong>dados técnicos e de uso:</strong> endereço IP, data e
                horário, navegador, dispositivo, páginas acessadas e eventos de
                interação, quando necessários à segurança ou quando o analytics
                opcional estiver autorizado;
              </li>
              <li>
                <strong>comunicações:</strong> mensagens e informações
                fornecidas durante o atendimento e a negociação.
              </li>
            </ul>
            <p>
              Não solicitamos dados pessoais sensíveis para a avaliação. Evite
              enviar senhas, documentos, dados bancários ou conteúdo pessoal
              armazenado no aparelho pelo formulário ou WhatsApp.
            </p>
          </section>

          <section>
            <h2>3. Finalidades e bases legais</h2>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Finalidade</th>
                    <th>Base legal principal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      Calcular a estimativa, registrar a proposta, atender,
                      negociar e organizar coleta ou envio.
                    </td>
                    <td>
                      Procedimentos preliminares e execução de contrato, a
                      pedido do titular.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Prevenir fraude, abuso, acessos indevidos e proteger a
                      operação.
                    </td>
                    <td>Legítimo interesse e exercício regular de direitos.</td>
                  </tr>
                  <tr>
                    <td>
                      Cumprir deveres fiscais, contábeis, regulatórios e ordens
                      de autoridades.
                    </td>
                    <td>Cumprimento de obrigação legal ou regulatória.</td>
                  </tr>
                  <tr>
                    <td>
                      Medir audiência e melhorar o site por meio do Google
                      Analytics 4.
                    </td>
                    <td>Consentimento, que pode ser recusado ou revogado.</td>
                  </tr>
                  <tr>
                    <td>Defender direitos em processos ou reclamações.</td>
                    <td>Exercício regular de direitos.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>4. Avaliação automatizada</h2>
            <p>
              A estimativa é calculada automaticamente a partir do modelo,
              versão, estado e respostas fornecidas. As regras podem aplicar
              preço-base, descontos e valor de sucata. A proposta pode ser
              confirmada ou revisada após conferência física, autenticidade,
              funcionamento e correspondência das informações.
            </p>
            <p>
              Você pode pedir esclarecimentos ou revisão humana pelo canal
              indicado na seção 1.
            </p>
          </section>

          <section>
            <h2>5. Cookies e Google Analytics</h2>
            <p>
              Cookies estritamente necessários, armazenamento de sessão e
              recursos equivalentes podem ser usados para manter o fluxo da
              avaliação, segurança e preferências. O Google Analytics 4 somente
              é carregado depois de sua autorização no banner.
            </p>
            <p>
              Quando autorizado, o analytics pode registrar páginas,
              categoria, modelo, início e conclusão de etapas, faixa de valor e
              ponto de coleta. Não enviamos nome, WhatsApp, endereço ou token da
              proposta ao Google Analytics.
            </p>
            <p>
              A recusa não impede a avaliação nem o envio da proposta. Você
              pode alterar sua escolha neste navegador a qualquer momento:
            </p>
            <CookiePreferences />
          </section>

          <section>
            <h2>6. Compartilhamento e operadores</h2>
            <p>
              Não comercializamos dados pessoais. Podemos compartilhá-los, no
              limite necessário, com:
            </p>
            <ul>
              <li>
                <strong>Supabase:</strong> banco de dados, autenticação e
                armazenamento;
              </li>
              <li>
                <strong>Vercel e Render:</strong> hospedagem do site e da API;
              </li>
              <li>
                <strong>Meta/WhatsApp:</strong> quando você opta por continuar o
                atendimento no WhatsApp;
              </li>
              <li>
                <strong>ViaCEP:</strong> consulta do CEP para preenchimento do
                endereço;
              </li>
              <li>
                <strong>Google Analytics:</strong> somente após consentimento;
              </li>
              <li>
                <strong>Resend:</strong> envio interno de alerta de nova
                proposta, quando habilitado;
              </li>
              <li>
                prestadores de logística, coleta, pagamento, contabilidade,
                assessoria e autoridades, quando necessário ou exigido por lei.
              </li>
            </ul>
            <p>
              Alguns fornecedores mantêm infraestrutura fora do Brasil. Nesses
              casos, podem ocorrer transferências internacionais com medidas
              contratuais, técnicas e organizacionais compatíveis com a LGPD.
              Cada fornecedor também possui seus próprios termos e políticas.
            </p>
          </section>

          <section>
            <h2>7. Retenção e eliminação</h2>
            <p>
              Os dados são mantidos somente pelo período necessário às
              finalidades informadas. Em regra:
            </p>
            <ul>
              <li>
                propostas, negociações e comprovantes podem ser conservados por
                até 5 anos após a última interação ou conclusão do negócio, para
                cumprimento de obrigações e defesa de direitos;
              </li>
              <li>
                registros técnicos e de acesso são mantidos pelo período
                necessário à segurança e pelo prazo legal aplicável;
              </li>
              <li>
                dados de analytics seguem a configuração de retenção do Google
                Analytics e podem ser agregados ou anonimizados.
              </li>
            </ul>
            <p>
              Os prazos podem ser ampliados em caso de obrigação legal, ordem
              de autoridade, prevenção de fraude ou disputa em andamento. Após
              o prazo, os dados serão eliminados ou anonimizados quando possível.
            </p>
          </section>

          <section>
            <h2>8. Segurança</h2>
            <p>
              Adotamos controles proporcionais ao risco, incluindo comunicação
              criptografada por HTTPS, controle de acesso administrativo,
              restrição de acesso direto ao banco, limitação de requisições,
              logs, atualizações e monitoramento de disponibilidade.
            </p>
            <p>
              Nenhum ambiente é completamente imune a incidentes. Se houver
              evento relevante envolvendo dados pessoais, serão adotadas as
              medidas de contenção, investigação e comunicação exigidas pela
              legislação.
            </p>
          </section>

          <section>
            <h2>9. Direitos do titular</h2>
            <p>Nos termos da LGPD, você pode solicitar, quando aplicável:</p>
            <ul>
              <li>confirmação da existência de tratamento e acesso;</li>
              <li>correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>
                anonimização, bloqueio ou eliminação de dados desnecessários,
                excessivos ou tratados em desconformidade;
              </li>
              <li>portabilidade, observada a regulamentação aplicável;</li>
              <li>informações sobre compartilhamentos;</li>
              <li>oposição ao tratamento e revisão de decisão automatizada;</li>
              <li>
                revogação do consentimento e eliminação dos dados tratados com
                essa base, ressalvadas hipóteses legais de conservação;
              </li>
              <li>peticionamento perante a Autoridade Nacional de Proteção de Dados.</li>
            </ul>
            <p>
              Podemos pedir informações para confirmar sua identidade e impedir
              que terceiros acessem ou alterem seus dados indevidamente.
            </p>
          </section>

          <section>
            <h2>10. Crianças e adolescentes</h2>
            <p>
              O serviço não é direcionado a crianças. Menores de idade devem
              utilizar o serviço com assistência ou representação de seus
              responsáveis legais, conforme a legislação aplicável.
            </p>
          </section>

          <section>
            <h2>11. Alterações desta Política</h2>
            <p>
              Esta Política pode ser atualizada para refletir mudanças legais,
              operacionais ou tecnológicas. A versão vigente e a data da última
              atualização permanecerão disponíveis nesta página. Mudanças
              relevantes poderão ser comunicadas por destaque no site ou pelos
              canais de atendimento.
            </p>
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
