# Innovai Web Lite

Versão web independente e limitada do Innovai 1.5 Beta, criada para funcionar em computadores e navegadores móveis, incluindo Safari no iPhone.

## O que já funciona

- Interface responsiva para PC e celular.
- Chat com histórico mantido durante a sessão atual da página.
- Configuração da própria chave de API e modelo compatível com o protocolo OpenAI.
- Pesquisa automática na web para cada pergunta, usando resultados públicos do DuckDuckGo sem exigir chave de busca separada.
- Respostas orientadas a citar links de fontes; links ficam clicáveis no chat.
- Para pesquisa mais extensa, o usuário pode escrever “pesquisa aprofundada” na mensagem; são solicitados mais resultados e uma comparação maior entre fontes.
- Presets para OpenRouter, Gemini API, OpenAI e Groq, além de URL personalizada.
- Sem seletor Fácil/Médio/Pro.
- PWA básico: manifest, ícone e cache do shell; o chat exige internet.
- A versão web não executa comandos locais, não abre aplicativos e não tem acesso à tela, arquivos ou microfone do dispositivo.

## Rodar no VS Code / Windows

1. Instale Python 3.11 ou 3.12.
2. Extraia esta pasta e abra-a no VS Code.
3. No terminal, execute:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python app.py
   ```

4. Abra `http://127.0.0.1:5000` no navegador.

## Publicar gratuitamente com endereço web

Um caminho possível é usar GitHub para guardar o código e Render para hospedar o serviço. O Render pode fornecer um subdomínio gratuito `onrender.com`, sujeito às regras e limites atuais do plano gratuito.

1. Crie um repositório privado no GitHub e envie os arquivos desta pasta.
2. No Render, crie um novo Web Service conectado ao repositório.
3. Use `pip install -r requirements.txt` como build command e `gunicorn app:app --workers 1 --threads 8 --timeout 90` como start command.
4. Após publicar, abra a URL HTTPS que o Render fornecer.

Não envie chaves de API para o GitHub. Este projeto não contém chaves embutidas.

## Segurança da chave de API

- A chave é mantida apenas na memória do processo do servidor; não é escrita em arquivos nem em banco de dados.
- A chave é enviada ao servidor que hospeda o site. Portanto, publique apenas numa hospedagem e num domínio sob seu controle e use HTTPS.
- O armazenamento em memória não equivale a um cofre de segredos. Um operador com acesso ao processo do servidor poderia, tecnicamente, inspecioná-la. Nunca informe sua chave num site de terceiros em que não confie.
- A chave pode ser perdida quando o servidor reinicia ou entra em suspensão. No plano gratuito, a hospedagem também pode suspender o serviço por inatividade.
- O exemplo usa um dicionário em memória e um único worker Gunicorn para manter o protótipo simples. Não é uma arquitetura pronta para escala nem para dados sensíveis. Antes de abrir para público amplo, implemente limites de requisições, proteção contra abuso e monitoramento sem registrar segredos.
- Para maior privacidade, uma evolução seria manter a chave apenas no navegador e chamar diretamente provedores que suportem CORS; isso depende do provedor e tem outros riscos. Não substitua a arquitetura sem testar cuidadosamente.

## Limitações atuais

- Não tem contas de usuário, histórico persistente, sincronização entre dispositivos, anexos, voz, leitura de tela ou automações locais.
- A conversa permanece no estado da página; recarregar a página limpa o histórico visual.
- O usuário paga ou utiliza a cota disponibilizada pelo próprio provedor de IA. O site não oferece créditos gratuitos.
- A instalação como PWA depende do navegador e da hospedagem HTTPS. No iPhone, o usuário pode usar Safari > Compartilhar > Adicionar à Tela de Início.

## Observação

Esta é uma implementação web nova, inspirada na proposta e no nome do Innovai 1.5 Beta; ela não reaproveita diretamente o motor desktop Python, porque os recursos locais desse motor não funcionam automaticamente dentro de um site hospedado.

## Pesquisa automática na internet

O servidor tenta buscar resultados públicos na web para cada pergunta. Isso não garante que toda informação esteja correta ou atualizada: resultados podem falhar, mudar ou trazer páginas de baixa qualidade. O modelo deve informar quando não consegue confirmar um fato e fornecer links para as fontes usadas. A pesquisa depende da disponibilidade do DuckDuckGo e de acesso à internet pelo servidor.

A pesquisa é feita no servidor com a pergunta enviada pelo usuário. Não coloque informações sensíveis em mensagens. Para um serviço público, configure limites de uso e proteção contra abuso, pois cada pergunta gera tráfego de pesquisa e uma chamada à API do provedor de IA.
