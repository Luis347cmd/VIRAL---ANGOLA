# Viral Angola — pacote de código-fonte

Este pacote tem duas partes:

```
pwa/        → o site (frontend), pronto a instalar como app no Android, iPhone e Windows
backend/    → API que agrega notícias reais via RSS, para o site deixar de usar dados de exemplo
```

## 1. Publicar o site (pwa/)

O site é ficheiros estáticos — não precisa de servidor próprio. Opções grátis mais simples:

**Netlify (mais fácil):**
1. Cria conta em https://netlify.com
2. Arrasta a pasta `pwa/` inteira para o Netlify Drop (https://app.netlify.com/drop)
3. Pronto — recebes um link tipo `https://viral-angola.netlify.app`

**Vercel / GitHub Pages** funcionam de forma semelhante: sobes a pasta `pwa/` para um repositório do GitHub e ligas ao serviço escolhido.

⚠️ Importante: a instalação como app (PWA) só funciona em **HTTPS** — todos os serviços acima já servem em HTTPS automaticamente.

### Como instalar no telemóvel/computador depois de publicado
- **Android (Chrome):** abre o link → aparece automaticamente um botão "Instalar app" no site (ou usa o menu ⋮ → "Instalar aplicação")
- **iPhone (Safari):** abre o link → toca no ícone de partilha (□↑) → "Adicionar ao ecrã principal"
- **Windows (Chrome/Edge):** abre o link → ícone de instalação (⊕) aparece na barra de endereço → "Instalar"

## 2. Publicar o backend de notícias (backend/)

O backend já vem configurado com feeds RSS reais (Google News filtrado para Angola, por categoria) em `backend/feeds.json` — funciona assim que publicares, sem precisares de mexer em nada. Mais tarde podes trocar por feeds diretos de órgãos angolanos específicos.

**Publicar grátis (Render.com):**
1. Cria conta em https://render.com
2. "New Web Service" → liga ao teu repositório com a pasta `backend/`
3. Build command: `npm install` — Start command: `npm start`
4. Depois de publicado, recebes um URL tipo `https://viral-angola-api.onrender.com`

**Testar localmente antes de publicar:**
```
cd backend
npm install
npm start
```
Depois abre `http://localhost:3000/api/noticias?categoria=agora` no navegador — deves ver JSON com notícias reais.

### Ligar o site ao backend
Abre `pwa/index.html`, procura a linha:
```js
const API_BASE = "";
```
e substitui por:
```js
const API_BASE = "https://viral-angola-api.onrender.com";
```
(usa o URL real que o Render te deu). A partir daí, as secções Angola/Desporto/Tecnologia/Oportunidades e o ticker "AGORA" passam a mostrar notícias reais automaticamente — e voltam sozinhas ao conteúdo de exemplo se a API estiver em baixo, para o site nunca ficar vazio.

## 3. Adicionar mais fontes de notícias reais

Edita `backend/feeds.json` e acrescenta URLs RSS de outros órgãos (ANGOP, Jornal de Angola, Novo Jornal, etc.) assim que tiveres os links — normalmente encontram-se junto de "/rss" no site, ou no código-fonte da página (`<link type="application/rss+xml">`). Não é preciso mexer no `server.js`.

## 4. Sobre a monetização (publicidade)

Depois de o site estar no ar com domínio próprio, o próximo passo é criar conta no Google AdSense e colocar os blocos de anúncio no `pwa/index.html` (o guia oficial do AdSense explica onde colar o código). Isto só compensa depois de teres tráfego real e consistente.

## 5. Painel de gestão de Oportunidades (sem código)

Empregos, bolsas de estudo, concursos e cursos gratuitos não vêm de nenhum feed RSS — precisam de curadoria manual. Por isso o backend tem um painel simples em `backend/admin.html`, acessível depois de publicado em:

```
https://viral-angola.onrender.com/admin.html
```

- Password: define a variável de ambiente `ADMIN_PASSWORD` no Render (Settings → Environment). Se não definires nenhuma, a password por omissão é `muda-esta-password` — **troca isto antes de divulgares o site**.
- No painel dás para adicionar e apagar oportunidades (título, categoria, instituição, prazo, link) sem tocar em código. O site (`pwa/index.html`) mostra-as automaticamente na secção "💰 Oportunidades".
- ⚠️ Nota técnica: no plano gratuito do Render, o ficheiro `oportunidades.json` pode ser apagado sempre que fizeres um novo deploy (redeploy) do backend — é uma limitação do armazenamento gratuito, não é bug. Para guardar de forma permanente e sem surpresas, o próximo passo (quando fizer sentido) é trocar a leitura/escrita do ficheiro por uma base de dados gratuita como o MongoDB Atlas (camada grátis) — nessa altura ajudo-te a fazer essa troca no `server.js`.

## 6. Como teres acesso total ao código para alterares tudo quando quiseres

A forma mais prática é teres **um único repositório no GitHub** com as duas pastas (`pwa/` e `backend/`) e ligar tanto o Netlify como o Render diretamente a ele — assim, sempre que alterares um ficheiro e fizeres "commit" no GitHub, os dois sites (frontend e API) atualizam-se sozinhos, sem teres de andar a arrastar pastas manualmente.

**Passo a passo:**
1. Cria um repositório novo no GitHub chamado, por exemplo, `viral-angola` (Public, sem README nem .gitignore)
2. Faz upload de tudo — as pastas `pwa/`, `backend/` e o `README.md` — pela mesma forma de arrastar ficheiros que já usaste (podes arrastar as pastas desta vez, o GitHub mantém a estrutura)
3. No Netlify: Site settings → "Link to Git provider" → escolhe o repositório `viral-angola` → em "Base directory" escreve `pwa` (para o Netlify saber que só essa pasta é o site)
4. No Render: no serviço já criado, vai a Settings → "Root Directory" e escreve `backend` (assim o Render também só olha para essa pasta)
5. A partir daqui, para alterares qualquer coisa (cores, textos, ferramentas, lógica do backend): edita o ficheiro localmente → no GitHub, abre o ficheiro → ícone de lápis (✏️) para editar direto no navegador, ou faz upload do ficheiro alterado outra vez → "Commit changes" → o Netlify e o Render publicam a alteração automaticamente em 1-2 minutos.

Se preferires editar pelo computador em vez do navegador do GitHub, o mais simples é instalar o **VS Code** (grátis) com a extensão "GitHub Pull Requests" — permite editar os ficheiros e enviar (`commit` + `push`) sem usar a linha de comandos.

