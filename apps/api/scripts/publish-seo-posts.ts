import { PrismaClient } from "@prisma/client";
import { sanitizePostHtml } from "../src/blog/sanitize-post-html";

const prisma = new PrismaClient();

type SeoPost = {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  metaDescription: string;
  content: string;
};

const posts: SeoPost[] = [
  {
    title: "Quanto vale um iPhone 11 usado? Veja o que muda o preço",
    slug: "quanto-vale-iphone-11-usado",
    excerpt:
      "Armazenamento, bateria, tela, Face ID e conservação mudam bastante o valor. Entenda como avaliar seu iPhone 11 usado.",
    seoTitle: "Quanto vale um iPhone 11 usado?",
    metaDescription:
      "Descubra o que define o valor de um iPhone 11 usado: memória, bateria, tela, Face ID, peças e conservação. Faça uma avaliação gratuita.",
    content: `
      <p>O iPhone 11 continua sendo um aparelho bastante procurado no mercado de usados. Mas dois aparelhos do mesmo modelo podem receber propostas diferentes, porque o valor depende da versão e, principalmente, do estado real do dispositivo.</p>

      <p>Se você quer saber <strong>quanto vale seu iPhone 11 usado</strong>, o melhor caminho é avaliar os itens abaixo em conjunto. Comparar apenas anúncios publicados pode enganar: preço anunciado não é necessariamente preço de venda, e muitos anúncios não informam defeitos, bateria ou peças substituídas.</p>

      <h2>O que mais influencia no valor do iPhone 11?</h2>

      <h3>1. Armazenamento: 64 GB, 128 GB ou 256 GB</h3>
      <p>A capacidade de armazenamento identifica a versão exata do aparelho. Modelos com mais espaço podem ter avaliação diferente, mas conservação e funcionamento continuam pesando mais do que a memória isoladamente.</p>

      <h3>2. Saúde da bateria</h3>
      <p>A capacidade máxima da bateria ajuda a indicar seu desgaste. Uma bateria com autonomia reduzida pode exigir substituição e, por isso, influenciar a proposta.</p>
      <p>Você pode conferir em <strong>Ajustes → Bateria → Saúde da Bateria e Carregamento</strong>. Veja também nosso guia sobre <a href="/blog/saude-bateria-iphone">como verificar a saúde da bateria do iPhone</a>.</p>

      <h3>3. Tela e funcionamento do toque</h3>
      <p>Trincas, manchas, linhas, falhas no toque e brilho irregular têm impactos diferentes. Uma tela trincada não significa que o aparelho perdeu todo o valor, mas o custo e o tipo de reparo necessário entram na avaliação.</p>
      <p>Se esse é o seu caso, leia <a href="/blog/quanto-vale-iphone-tela-quebrada">quanto vale um iPhone com a tela quebrada</a>.</p>

      <h3>4. Face ID, câmeras, áudio e conectividade</h3>
      <p>O Face ID deve reconhecer o rosto normalmente. Também são verificados câmeras, microfones, alto-falantes, Wi-Fi, Bluetooth, carregamento e botões. Um defeito funcional costuma ter impacto maior que um risco superficial.</p>

      <h3>5. Peças trocadas e mensagens do sistema</h3>
      <p>Reparos anteriores não impedem necessariamente a venda. Porém, mensagens de peça desconhecida, componentes incompatíveis ou serviços mal executados podem reduzir o valor e exigir análise adicional.</p>

      <h3>6. Bloqueios e origem do aparelho</h3>
      <p>O iPhone precisa estar desvinculado da Conta Apple e sem restrições que impeçam sua ativação. Um aparelho bloqueado, com origem não comprovada ou impossibilitado de ser restaurado pode não ser elegível para compra normal.</p>

      <h2>iPhone 11 quebrado ainda tem valor?</h2>
      <p>Em muitos casos, sim. Aparelhos com tela quebrada, bateria desgastada, câmera com defeito ou marcas fortes ainda podem receber proposta. Quando um problema impede o uso normal ou a recuperação econômica, a avaliação pode seguir como sucata.</p>

      <p>O valor exato depende da combinação dos defeitos. Por isso, uma avaliação que pergunta sobre cada componente é mais confiável que uma tabela única para todos os aparelhos.</p>

      <h2>Como receber uma proposta pelo seu iPhone 11</h2>
      <ol>
        <li>Acesse a <a href="/vender/iphones">avaliação de iPhones</a>;</li>
        <li>selecione iPhone 11 e a capacidade correta;</li>
        <li>responda sobre bateria, tela, câmeras, Face ID e conservação;</li>
        <li>confira a estimativa calculada;</li>
        <li>escolha um ponto de coleta ou envio e continue pelo WhatsApp.</li>
      </ol>

      <p>A avaliação é gratuita e não obriga você a concluir a venda. Antes de entregar o aparelho, siga também o guia sobre <a href="/blog/o-que-fazer-antes-de-vender-iphone-ipad">como preparar o iPhone para venda com segurança</a>.</p>
    `,
  },
  {
    title: "Onde vender Apple Watch usado e o que define o valor",
    slug: "onde-vender-apple-watch-usado",
    excerpt:
      "Modelo, tamanho, bateria, tela e Bloqueio de Ativação influenciam a proposta. Veja como vender seu Apple Watch usado com segurança.",
    seoTitle: "Onde vender Apple Watch usado?",
    metaDescription:
      "Saiba onde vender Apple Watch usado, quais fatores influenciam o valor e como preparar o relógio para receber uma proposta segura.",
    content: `
      <p>Quem procura <strong>onde vender um Apple Watch usado</strong> normalmente quer equilibrar três pontos: receber um valor coerente, evitar golpes e não perder tempo respondendo dezenas de mensagens.</p>

      <p>Antes de escolher onde anunciar ou vender, identifique a versão correta e confira o estado do relógio. Essas informações fazem diferença na avaliação.</p>

      <h2>O que define o valor de um Apple Watch usado?</h2>

      <h3>Modelo e geração</h3>
      <p>Series 5, Series 6, Series 7, SE, Series 8, Series 9 e Ultra pertencem a faixas diferentes. A geração também determina recursos, compatibilidade e procura no mercado.</p>

      <h3>Tamanho da caixa</h3>
      <p>O tamanho — por exemplo, 41 mm ou 45 mm — identifica a versão exata. Essa informação aparece na parte traseira do relógio ou no app Watch do iPhone.</p>

      <h3>GPS ou GPS + Cellular</h3>
      <p>Versões Cellular possuem conectividade móvel compatível com operadoras. Mesmo quando o plano não está ativo, é importante informar corretamente a variante.</p>

      <h3>Tela, caixa e Digital Crown</h3>
      <p>Riscos leves são diferentes de trincas, manchas ou falhas no toque. Também devem funcionar normalmente a Digital Crown, o botão lateral, alto-falante, microfone, carregamento e sensores.</p>

      <h3>Bateria</h3>
      <p>Autonomia muito curta ou desligamentos inesperados podem indicar desgaste. No relógio, consulte <strong>Ajustes → Bateria → Saúde da Bateria</strong>, quando essa opção estiver disponível.</p>

      <h3>Bloqueio de Ativação</h3>
      <p>Para uma nova pessoa configurar o relógio, ele deve ser removido da Conta Apple do proprietário anterior. Apenas apagar o conteúdo diretamente no relógio pode não remover o Bloqueio de Ativação.</p>

      <h2>Vender por anúncio ou receber uma proposta direta?</h2>
      <p>Um anúncio pode permitir negociar diretamente com compradores, mas exige fotos, descrição, respostas, negociação, cuidados com pagamento e encontro. Uma proposta direta tende a reduzir esse esforço, embora a avaliação considere custos de inspeção, revenda e garantia operacional.</p>

      <p>Compare não apenas o valor anunciado, mas também segurança, tempo até a venda, risco de contestação e necessidade de envio.</p>

      <h2>Como vender seu Apple Watch pela Vendy</h2>
      <ol>
        <li>Acesse a <a href="/vender/apple-watches">avaliação de Apple Watch</a>;</li>
        <li>selecione a geração e o tamanho corretos;</li>
        <li>informe o estado e os detalhes solicitados;</li>
        <li>receba a estimativa e escolha a forma de entrega;</li>
        <li>continue o atendimento pelo WhatsApp.</li>
      </ol>

      <h2>O que fazer antes da entrega</h2>
      <p>Não remova seus dados antes de decidir vender, pois você pode precisar do relógio para concluir a avaliação. Depois de confirmar a negociação, faça backup quando aplicável, desemparelhe usando o iPhone e confirme que o Bloqueio de Ativação foi removido.</p>

      <p>Veja o passo a passo completo em <a href="/blog/como-preparar-apple-watch-para-vender">como preparar o Apple Watch para vender</a>.</p>
    `,
  },
  {
    title: "Quanto vale um PS5 usado? Entenda como avaliar o console",
    slug: "quanto-vale-ps5-usado",
    excerpt:
      "Versão com leitor ou Digital, controles, funcionamento, conservação e acessórios influenciam o valor de um PlayStation 5 usado.",
    seoTitle: "Quanto vale um PS5 usado?",
    metaDescription:
      "Veja o que define o valor de um PS5 usado: versão, leitor, controles, acessórios, funcionamento e conservação. Faça uma avaliação gratuita.",
    content: `
      <p>O valor de um <strong>PS5 usado</strong> varia conforme a versão, o estado e os acessórios incluídos. Um console completo, bem conservado e funcionando normalmente não deve ser comparado com anúncios sem controle, com defeito ou sem leitor.</p>

      <p>Também é importante separar preço anunciado de preço realmente negociado. Promoções de consoles novos, garantia restante e custos de envio mudam o mercado ao longo do tempo.</p>

      <h2>Qual é a versão do seu PS5?</h2>

      <h3>PS5 com leitor</h3>
      <p>A versão com unidade de disco aceita jogos físicos e Blu-ray. O funcionamento do leitor deve ser testado com mídia compatível, verificando leitura, ejeção e ruídos anormais.</p>

      <h3>PS5 Digital</h3>
      <p>Essa versão depende de jogos digitais associados à conta do usuário. Contas e jogos digitais pessoais não devem ser anunciados como parte do console: a transferência de credenciais pode gerar riscos e violações dos termos do serviço.</p>

      <h3>PS5 Slim</h3>
      <p>O modelo Slim possui construção e configurações próprias. Informe se há leitor, a capacidade e quais acessórios físicos acompanham o conjunto.</p>

      <h2>O que mais influencia o valor?</h2>

      <h3>Funcionamento e temperatura</h3>
      <p>O console deve iniciar, acessar menus, conectar à rede e executar jogos sem desligamentos. Superaquecimento, alertas, travamentos ou ruídos incomuns precisam ser informados.</p>

      <h3>Controle DualSense</h3>
      <p>Drift nos analógicos, gatilhos com falha, botões presos e bateria fraca reduzem o valor do conjunto. Um segundo controle funcional pode ser considerado como acessório adicional, conforme a negociação.</p>

      <h3>Leitor de disco</h3>
      <p>Nas versões com leitor, falhas para reconhecer ou ejetar discos têm peso relevante. Teste mais de uma mídia em bom estado antes da avaliação.</p>

      <h3>Conservação e acessórios</h3>
      <p>Marcas leves de uso são diferentes de trincas, peças faltando ou sinais de líquido. Cabos originais, base, caixa e comprovante podem facilitar a conferência, mas não substituem o teste funcional.</p>

      <h3>Manutenção anterior</h3>
      <p>Limpeza ou reparo não tornam o console automaticamente sem valor. O importante é informar o serviço realizado e verificar se o equipamento funciona de maneira estável.</p>

      <h2>PS5 com defeito ainda pode ser vendido?</h2>
      <p>Dependendo do problema, sim. Consoles que não ligam, apresentam falha de vídeo, superaquecimento ou leitor defeituoso podem receber avaliação reduzida ou de sucata. Não tente esconder o defeito: uma descrição correta evita divergências na inspeção.</p>

      <h2>Como avaliar seu PS5 usado</h2>
      <ol>
        <li>Acesse a <a href="/vender/consoles">avaliação de consoles</a>;</li>
        <li>selecione PlayStation 5 e a versão correta;</li>
        <li>informe conservação, funcionamento e acessórios;</li>
        <li>confira a estimativa sem compromisso;</li>
        <li>combine coleta ou envio pelo WhatsApp.</li>
      </ol>

      <p>Após confirmar a venda, faça backup dos dados necessários e redefina o console. A orientação oficial está no guia da PlayStation sobre <a href="https://www.playstation.com/pt-br/support/hardware/transfer-dispose-console/" target="_blank">transferir ou descartar um console</a>.</p>
    `,
  },
  {
    title: "O que fazer antes de vender um iPhone ou iPad",
    slug: "o-que-fazer-antes-de-vender-iphone-ipad",
    excerpt:
      "Faça backup, saia da Conta Apple, remova o Bloqueio de Ativação e apague seus dados com segurança antes de entregar o aparelho.",
    seoTitle: "O que fazer antes de vender iPhone ou iPad",
    metaDescription:
      "Checklist para vender iPhone ou iPad: backup, Conta Apple, Buscar, eSIM e apagamento seguro dos dados antes da entrega.",
    content: `
      <p>Antes de vender um iPhone ou iPad, é importante proteger seus dados e deixar o aparelho pronto para ser configurado pelo novo proprietário. A ordem dos passos faz diferença: primeiro confirme que suas informações foram salvas; só depois apague o dispositivo.</p>

      <p>Este checklist segue as orientações da Apple e serve para vendas, trocas ou doações.</p>

      <h2>1. Confirme a negociação antes de apagar</h2>
      <p>Durante a avaliação, você pode precisar consultar armazenamento, saúde da bateria, IMEI ou testar componentes. Por isso, não apague o aparelho antes de receber e aceitar a proposta.</p>

      <h2>2. Faça backup dos dados</h2>
      <p>Use o iCloud ou um computador para salvar fotos, contatos, mensagens e arquivos importantes. Confirme se o backup terminou e, se você já tiver o aparelho novo, verifique se os dados essenciais foram transferidos.</p>

      <h2>3. Transfira autenticadores e acessos importantes</h2>
      <p>Aplicativos bancários, autenticação em dois fatores, eSIM e carteiras digitais podem exigir procedimentos próprios. Garanta o acesso às contas antes de apagar o aparelho antigo.</p>

      <h2>4. Desemparelhe o Apple Watch, se houver</h2>
      <p>Se um Apple Watch estiver pareado, desemparelhe-o pelo app Watch. Isso cria um backup do relógio e ajuda a remover o Bloqueio de Ativação dele.</p>

      <h2>5. Saia da Conta Apple e desative o Buscar</h2>
      <p>O recurso Buscar ativa o Bloqueio de Ativação, que impede outra pessoa de configurar o aparelho. Ao seguir o fluxo de apagamento e informar a senha da Conta Apple, o dispositivo deve ser desvinculado corretamente.</p>

      <p>Se você já não está com o aparelho, consulte a orientação da Apple para <a href="https://support.apple.com/pt-br/108934" target="_blank">remover o dispositivo pelo iCloud</a>.</p>

      <h2>6. Apague Conteúdo e Ajustes</h2>
      <p>No iPhone ou iPad, acesse:</p>
      <p><strong>Ajustes → Geral → Transferir ou Redefinir → Apagar Conteúdo e Ajustes.</strong></p>

      <p>Siga as confirmações na tela. Se houver eSIM, avalie se ele deve ser apagado e confirme com sua operadora como transferir ou encerrar a linha.</p>

      <h2>7. Remova o chip e acessórios pessoais</h2>
      <p>Retire o SIM físico, cartões de memória quando aplicável, películas com informações pessoais e acessórios que não façam parte da negociação.</p>

      <h2>8. Confira a tela “Olá”</h2>
      <p>Depois do apagamento, o dispositivo deve reiniciar na tela inicial de configuração. Não avance configurando uma nova conta. Se aparecer solicitação da Conta Apple anterior, o Bloqueio de Ativação ainda precisa ser removido.</p>

      <h2>Checklist rápido</h2>
      <ul>
        <li>backup concluído;</li>
        <li>dados transferidos e acessos confirmados;</li>
        <li>Apple Watch desemparelhado;</li>
        <li>Conta Apple e Buscar desvinculados;</li>
        <li>conteúdo apagado;</li>
        <li>SIM físico removido;</li>
        <li>aparelho na tela “Olá”.</li>
      </ul>

      <p>A Apple mantém um guia oficial sobre <a href="https://support.apple.com/pt-br/109511" target="_blank">o que fazer antes de vender, dar ou trocar um iPhone ou iPad</a>.</p>

      <h2>Ainda não sabe quanto vale?</h2>
      <p>Antes de apagar, faça a <a href="/vender/iphones">avaliação do seu iPhone</a> ou a <a href="/vender/ipads">avaliação do seu iPad</a>. Você recebe uma estimativa e só prepara o aparelho depois de decidir continuar.</p>
    `,
  },
  {
    title: "Como preparar o Apple Watch para vender com segurança",
    slug: "como-preparar-apple-watch-para-vender",
    excerpt:
      "Aprenda a identificar o relógio, fazer backup, desemparelhar e remover o Bloqueio de Ativação antes da entrega.",
    seoTitle: "Como preparar o Apple Watch para vender",
    metaDescription:
      "Passo a passo para vender Apple Watch com segurança: identificar modelo, fazer backup, desemparelhar e remover o Bloqueio de Ativação.",
    content: `
      <p>Preparar um Apple Watch para venda exige mais do que apagar o conteúdo pelo próprio relógio. O ponto principal é remover o <strong>Bloqueio de Ativação</strong>, para que o novo proprietário possa configurar o dispositivo.</p>

      <h2>Antes de apagar: identifique e teste o relógio</h2>
      <p>Confirme geração, tamanho da caixa e conectividade. Essas informações podem ser consultadas no app Watch, em dados do dispositivo ou na inscrição da caixa.</p>

      <p>Teste tela, toque, Digital Crown, botão lateral, alto-falante, microfone, carregamento e sensores. Observe também riscos, trincas e autonomia da bateria.</p>

      <h2>Faça a avaliação antes do apagamento</h2>
      <p>Você pode precisar do relógio pareado para consultar informações e realizar testes. Primeiro faça a <a href="/vender/apple-watches">avaliação do Apple Watch</a>; depois de aceitar a proposta, prossiga com a preparação.</p>

      <h2>Como desemparelhar corretamente</h2>
      <ol>
        <li>Mantenha o Apple Watch e o iPhone próximos;</li>
        <li>abra o app Watch no iPhone;</li>
        <li>toque em <strong>Todos os Relógios</strong>;</li>
        <li>toque no botão de informações ao lado do relógio;</li>
        <li>escolha <strong>Desemparelhar Apple Watch</strong>;</li>
        <li>informe a senha da Conta Apple quando solicitado.</li>
      </ol>

      <p>Segundo a Apple, o desemparelhamento pelo iPhone apaga o relógio, restaura os ajustes de fábrica e remove o Bloqueio de Ativação. O processo também cria um backup que pode ser usado em outro Apple Watch.</p>

      <h2>E se eu não estiver com o iPhone pareado?</h2>
      <p>Apagar pelo menu do Apple Watch restaura o conteúdo, mas pode manter o Bloqueio de Ativação. Nesse caso, também será necessário remover o dispositivo da Conta Apple pelo Buscar/iCloud.</p>

      <p>Não entregue o relógio enquanto ele ainda solicitar a conta do proprietário anterior.</p>

      <h2>Apple Watch Cellular</h2>
      <p>Se a versão possuir plano celular, remova ou transfira o plano conforme as orientações da operadora. Desemparelhar o relógio não significa necessariamente cancelar a cobrança do serviço móvel.</p>

      <h2>O que entregar junto?</h2>
      <ul>
        <li>carregador combinado na negociação;</li>
        <li>pulseiras incluídas na proposta;</li>
        <li>caixa e comprovante, se disponíveis;</li>
        <li>sem senhas, contas ou dados pessoais.</li>
      </ul>

      <h2>Checklist final</h2>
      <ul>
        <li>modelo e tamanho conferidos;</li>
        <li>avaliação concluída;</li>
        <li>relógio desemparelhado pelo iPhone;</li>
        <li>Bloqueio de Ativação removido;</li>
        <li>plano Cellular tratado com a operadora;</li>
        <li>acessórios separados conforme a negociação.</li>
      </ul>

      <p>Consulte também a orientação oficial da Apple sobre <a href="https://support.apple.com/pt-br/102542" target="_blank">o que fazer antes de vender ou trocar o Apple Watch</a> e sobre <a href="https://support.apple.com/pt-br/108372" target="_blank">desemparelhar e apagar o relógio</a>.</p>

      <p>Se ainda estiver comparando opções, veja <a href="/blog/onde-vender-apple-watch-usado">onde vender Apple Watch usado e o que define o valor</a>.</p>
    `,
  },
];

async function main() {
  const publishedAt = new Date();

  for (const post of posts) {
    const content = sanitizePostHtml(post.content);
    await prisma.post.upsert({
      where: { slug: post.slug },
      create: {
        ...post,
        content,
        status: "PUBLISHED",
        publishedAt,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        seoTitle: post.seoTitle,
        metaDescription: post.metaDescription,
        content,
        status: "PUBLISHED",
      },
    });
    console.log(`Publicado: ${post.slug}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
