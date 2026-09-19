// Viral Angola — backend de notícias
// Agrega feeds RSS reais (configurados em feeds.json), normaliza e expõe uma API simples
// que o frontend (index.html) consome para preencher as secções com conteúdo real.
//
// Como correr localmente:
//   1) npm install
//   2) npm start
//   3) API disponível em http://localhost:3000/api/noticias?categoria=agora
//
// Como publicar (grátis): Render.com, Railway.app ou Fly.io funcionam bem para isto.
// Depois de publicado, edita a constante API_BASE no index.html do PWA para apontar
// para o URL público do teu backend (ex: https://viral-angola-api.onrender.com).

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");
const NodeCache = require("node-cache");
const feeds = require("./feeds.json");

const app = express();
const parser = new Parser({ timeout: 8000 });
// cache de 10 minutos — evita bater nos feeds a cada pedido e mantém o site rápido
const cache = new NodeCache({ stdTTL: 600 });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve admin.html em /admin.html

const OPORTUNIDADES_FILE = path.join(__dirname, "oportunidades.json");
// Password do painel: define ADMIN_PASSWORD nas variáveis de ambiente do Render.
// Se não definires nenhuma, usa "muda-esta-password" — troca isto antes de divulgares o site.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "muda-esta-password";

function exigirAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ erro: "Password incorreta" });
  }
  next();
}

function lerOportunidades() {
  try {
    return JSON.parse(fs.readFileSync(OPORTUNIDADES_FILE, "utf-8"));
  } catch (e) {
    return [];
  }
}
function gravarOportunidades(lista) {
  fs.writeFileSync(OPORTUNIDADES_FILE, JSON.stringify(lista, null, 2));
}

// --- Oportunidades: leitura pública (o site consome isto) ---
app.get("/api/oportunidades", (req, res) => {
  const lista = lerOportunidades().sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  res.json({ oportunidades: lista });
});

// --- Oportunidades: gestão protegida (o painel /admin.html consome isto) ---
app.get("/api/admin/oportunidades", exigirAdmin, (req, res) => {
  res.json(lerOportunidades());
});

app.post("/api/admin/oportunidades", exigirAdmin, (req, res) => {
  const lista = lerOportunidades();
  const nova = {
    id: Date.now().toString(),
    titulo: req.body.titulo || "",
    categoria: req.body.categoria || "emprego",
    instituicao: req.body.instituicao || "",
    prazo: req.body.prazo || "",
    link: req.body.link || "",
    criado_em: new Date().toISOString(),
  };
  lista.push(nova);
  gravarOportunidades(lista);
  res.json(nova);
});

app.delete("/api/admin/oportunidades/:id", exigirAdmin, (req, res) => {
  const lista = lerOportunidades().filter((o) => o.id !== req.params.id);
  gravarOportunidades(lista);
  res.json({ ok: true });
});

const CATEGORIAS_VALIDAS = ["agora", "angola", "desporto", "tecnologia", "oportunidades"];

async function buscarCategoria(categoria) {
  const cacheKey = "noticias_" + categoria;
  const emCache = cache.get(cacheKey);
  if (emCache) return emCache;

  const urls = feeds[categoria] || [];
  const resultados = [];

  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items.slice(0, 12)) {
        resultados.push({
          titulo: item.title || "",
          link: item.link || "",
          fonte: (item.source && item.source.title) || feed.title || "",
          data: item.isoDate || item.pubDate || null,
          resumo: (item.contentSnippet || "").slice(0, 220),
        });
      }
    } catch (erro) {
      console.error(`Falhou a ler o feed ${url}:`, erro.message);
      // continua para os outros feeds mesmo que um falhe
    }
  }

  // ordena do mais recente para o mais antigo
  resultados.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

  cache.set(cacheKey, resultados);
  return resultados;
}

app.get("/api/noticias", async (req, res) => {
  const categoria = (req.query.categoria || "agora").toLowerCase();
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return res.status(400).json({ erro: "Categoria inválida", categorias: CATEGORIAS_VALIDAS });
  }
  try {
    const noticias = await buscarCategoria(categoria);
    res.json({ categoria, atualizado_em: new Date().toISOString(), noticias });
  } catch (erro) {
    res.status(500).json({ erro: "Falha ao buscar notícias" });
  }
});

app.get("/api/noticias/todas", async (req, res) => {
  const todas = {};
  for (const categoria of CATEGORIAS_VALIDAS) {
    todas[categoria] = await buscarCategoria(categoria);
  }
  res.json({ atualizado_em: new Date().toISOString(), categorias: todas });
});

app.get("/", (req, res) => {
  res.send("Viral Angola API — usa /api/noticias?categoria=agora");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Viral Angola API a correr na porta ${PORT}`));
