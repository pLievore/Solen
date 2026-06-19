import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a Vendy coleta, usa e protege seus dados pessoais (LGPD).",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Quem somos</h2>
            <p>
              A Vendy realiza a compra de eletrônicos usados (celulares, tablets,
              consoles e similares). Esta política descreve como tratamos seus
              dados pessoais, em conformidade com a Lei Geral de Proteção de
              Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Dados que coletamos</h2>
            <p>Ao solicitar uma avaliação, coletamos:</p>
            <ul className="list-disc pl-5">
              <li>Nome e número de WhatsApp;</li>
              <li>Endereço (CEP, cidade, bairro, rua e número);</li>
              <li>Informações sobre o aparelho que você deseja vender;</li>
              <li>Dados de navegação (cookies/analytics), de forma agregada.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Para que usamos</h2>
            <ul className="list-disc pl-5">
              <li>Calcular e enviar a proposta de compra do seu aparelho;</li>
              <li>Entrar em contato com você (principalmente via WhatsApp);</li>
              <li>Organizar a coleta/logística da negociação;</li>
              <li>Melhorar nosso site e atendimento.</li>
            </ul>
            <p>
              A base legal é a execução de procedimentos preliminares a um
              contrato, a seu pedido, e o legítimo interesse para contato.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Compartilhamento</h2>
            <p>
              Não vendemos seus dados. Eles podem ser tratados por provedores que
              viabilizam o serviço (ex.: WhatsApp para contato, e provedores de
              hospedagem e analytics), sempre limitados à finalidade descrita.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Retenção</h2>
            <p>
              Mantemos seus dados pelo tempo necessário para concluir a
              negociação e cumprir obrigações legais. Depois disso, são
              eliminados ou anonimizados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Seus direitos</h2>
            <p>
              Você pode solicitar acesso, correção, exclusão ou portabilidade dos
              seus dados, bem como revogar consentimentos. Basta entrar em
              contato pelos nossos canais de atendimento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Contato</h2>
            <p>
              Para exercer seus direitos ou tirar dúvidas sobre esta política,
              fale conosco pelo WhatsApp informado no site.
            </p>
          </section>

          <p className="text-xs text-muted">
            Este documento é um modelo inicial e deve ser revisado por um
            profissional jurídico antes do lançamento oficial.
          </p>
        </div>
      </main>
    </PublicShell>
  );
}
