import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaInstagram, FaWhatsapp, FaShoppingCart, FaPlus, FaMinus, FaTimes, FaUser } from "react-icons/fa";

export default function AmandaRamosLanding() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<{ sku: string; nome: string; preco: number; qty: number }[]>([]);
  const [agent, setAgent] = useState<string>("auto"); // auto | amanda | luana | daniele | cristina

  // CONFIG — links e números
  const instagram = "https://instagram.com/amandaramosstore";
  const catalogoAtacado = "#";
  const logo = "/mnt/data/Logotipo Brilho Minimalista Chic .png";

  // Mapa local de colaboradores (para seleção manual)
  const agents = [
    { id: "auto",    label: "Automático (rodízio)" },
    { id: "amanda",  label: "Amanda (+55 62 8200-7545)", number: "+556282007545" },
    { id: "luana",   label: "Luana (+55 62 8642-1750)", number: "+556286421750" },
    { id: "daniele", label: "Daniele (+55 62 8157-0173)", number: "+556281570173" },
    { id: "cristina",label: "Cristina (+55 62 8200-8821)", number: "+556282008821" },
  ];

  const navItems = [
    { label: "Novidades", href: "#novidades" },
    { label: "Coleções", href: "#colecoes" },
    { label: "Atacado", href: "#atacado" },
    { label: "Depoimentos", href: "#depoimentos" },
    { label: "Contato", href: "#contato" },
  ];

  const produtos = [
    { sku: "SKY-001", nome: "Vestido Skyler", preco: 299.9, img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop" },
    { sku: "LIZ-002", nome: "Conjunto Lizzie", preco: 349.9, img: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop" },
    { sku: "SHE-003", nome: "Vestido Shelly", preco: 329.9, img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop" },
    { sku: "IVA-004", nome: "Conjunto Ivana",  preco: 379.9, img: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop" },
  ];

  // === ESTOQUE em tempo real ===
  useEffect(() => {
    const skus = produtos.map((p) => p.sku).join(",");
    const fetchStock = async () => {
      try {
        // Trocar URL base caso backend esteja em outro domínio
        const res = await fetch(`/api/stock?skus=${encodeURIComponent(skus)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("res estoque");
        const data = await res.json();
        setStock(data);
      } catch (e) {
        console.warn("Falha ao buscar estoque, usando mock", e);
        setStock({ "SKY-001": 14, "LIZ-002": 0, "SHE-003": 6, "IVA-004": 3 });
      }
    };
    fetchStock();
    const id = setInterval(fetchStock, 30000);
    return () => clearInterval(id);
  }, []);

  // Carrinho helpers
  const addToCart = (item: { sku: string; nome: string; preco: number }) => {
    const available = stock[item.sku] ?? 0;
    const existing = cart.find((c) => c.sku === item.sku)?.qty ?? 0;
    if (existing >= available) return;
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.sku === item.sku);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { sku: item.sku, nome: item.nome, preco: item.preco, qty: 1 }];
    });
  };
  const inc = (sku: string) => setCart((prev) => prev.map((i) => (i.sku === sku ? { ...i, qty: Math.min((stock[sku] ?? 0), i.qty + 1) } : i)));
  const dec = (sku: string) => setCart((prev) => prev.flatMap((i) => (i.sku === sku ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i])));
  const removeItem = (sku: string) => setCart((prev) => prev.filter((i) => i.sku !== sku));

  const total = useMemo(() => cart.reduce((acc, i) => acc + i.preco * i.qty, 0), [cart]);

  // Gera link de checkout WhatsApp com opção de atendente
  const whatsappCheckoutLink = async () => {
    const linhas = cart
      .map((i) => `• ${i.nome} (${i.sku}) x${i.qty} — R$ ${i.preco.toFixed(2).replace(".", ",")}`)
      .join("%0A");
    const msg = encodeURIComponent(
      `Olá! Quero finalizar este pedido:%0A${linhas}%0A%0ATotal: R$ ${total
        .toFixed(2)
        .replace(".", ",")} %0A%0ANome:%20_____%0ACEP:%20_____%0AForma%20de%20envio:%20_____%0AObservações:%20_____`
    );

    // Se usuário escolher atendente específico (local), usa número fixo
    if (agent !== "auto") {
      const item = agents.find((a) => a.id === agent && a.number);
      const number = item?.number || "+5562999999999";
      return `https://wa.me/${number.replace(/\+/g, "")}?text=${msg}`;
    }

    // Automático (round-robin no backend)
    try {
      const res = await fetch(`/api/whatsapp-target`, { cache: "no-store" });
      const data = await res.json();
      const number = (data?.number || "+5562999999999").replace(/\+/g, "");
      return `https://wa.me/${number}?text=${msg}`;
    } catch (e) {
      return `https://wa.me/${"+5562999999999".replace(/\+/g, "")}?text=${msg}`;
    }
  };

  return (
    <div className="min-h-dvh bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="#" className="flex items-center gap-2">
              <img src={logo} alt="Amanda Ramos Store" className="h-10 w-auto" />
            </a>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="text-sm hover:text-rose-600 transition-colors">
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => setCartOpen(true)}
                className="relative inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium border border-gray-300 hover:border-gray-400"
              >
                <FaShoppingCart /> Carrinho
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center">
                    {cart.reduce((a, i) => a + i.qty, 0)}
                  </span>
                )}
              </button>
            </nav>

            <button aria-label="Abrir menu" className="md:hidden inline-flex items-center justify-center rounded-xl p-2 hover:bg-gray-100" onClick={() => setOpen((v) => !v)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M3.75 6.75a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10"><div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100 via-white to-white" /></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">O luxo de se vestir <span className="text-rose-600">primeiro</span></h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-prose">Novidades 2x por semana, peças exclusivas e acabamento premium para você brilhar no evento, no rodeio e na balada.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#novidades" className="rounded-2xl bg-gray-900 text-white px-5 py-3 text-sm font-medium shadow hover:bg-black">Ver lançamentos</a>
              <button onClick={() => setCartOpen(true)} className="rounded-2xl border border-gray-300 px-5 py-3 text-sm font-medium hover:border-gray-400 flex items-center gap-2"><FaShoppingCart /> Ver carrinho</button>
            </div>
            <div className="mt-6 flex items-center gap-6 text-xs text-gray-500">
              <div>+10.000 clientes</div><div>Envio para todo o Brasil</div><div>Loja física em Goiânia</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
              <img src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1780&auto=format&fit=crop" alt="Modelos com vestidos" className="h-full w-full object-cover" />
              <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-4 py-2 text-xs shadow">Novos drops toda semana ✨</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Novidades */}
      <section id="novidades" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between"><h2 className="text-2xl sm:text-3xl font-semibold">Novidades da semana</h2><a href={instagram} className="text-sm text-rose-600 hover:underline">Ver no Instagram</a></div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {produtos.map((p, i) => {
            const disponivel = (stock[p.sku] ?? 0) > 0;
            return (
              <motion.article key={p.sku} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }} className="group">
                <div className="relative overflow-hidden rounded-3xl ring-1 ring-gray-200">
                  <img src={p.img} alt={p.nome} className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] shadow">SKU {p.sku}</div>
                  <div className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] shadow ${disponivel ? "bg-emerald-500 text-white" : "bg-gray-300 text-gray-700"}`}>{disponivel ? `${stock[p.sku]} em estoque` : "Esgotado"}</div>
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium leading-tight">{p.nome}</h3>
                    <p className="text-sm text-gray-600">R$ {p.preco.toFixed(2).replace(".", ",")}</p>
                  </div>
                  <button disabled={!disponivel} onClick={() => addToCart(p)} className={`rounded-xl text-white text-xs px-3 py-2 flex items-center gap-1 ${disponivel ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-300 cursor-not-allowed"}`}><FaPlus /> Adicionar</button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Footer (resumido) */}
      <footer id="contato" className="border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-4 gap-8">
          <div className="col-span-2"><a href="#" className="flex items-center gap-2"><img src={logo} alt="Amanda Ramos Store" className="h-10 w-auto" /></a><p className="mt-3 text-sm text-gray-600 max-w-prose">Moda feminina com exclusividade, acabamento premium e lançamentos semanais. Loja física em Goiânia e envio para todo o Brasil.</p>
            <div className="mt-4 flex gap-4"><a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline"><FaInstagram /> Instagram</a></div>
          </div>
          <div><h4 className="font-medium">Institucional</h4><ul className="mt-3 space-y-2 text-sm text-gray-600"><li><a href="#" className="hover:underline">Trocas & Devoluções</a></li><li><a href="#" className="hover:underline">Política de Privacidade</a></li><li><a href="#" className="hover:underline">Frete & Prazo</a></li></ul></div>
          <div><h4 className="font-medium">Contato</h4><ul className="mt-3 space-y-2 text-sm text-gray-600"><li>Loja: Shopping ABC, Goiânia</li><li>E-mail: contato@amandaramos.com.br</li></ul></div>
        </div>
        <div className="py-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} Amanda Ramos Store — Todos os direitos reservados.</div>
      </footer>

      {/* WhatsApp Floating Button (abre carrinho) */}
      <button onClick={() => setCartOpen(true)} aria-label="Abrir carrinho/WhatsApp" className="fixed bottom-5 right-5 z-40 inline-flex items-center justify-center rounded-full shadow-xl ring-1 ring-black/5 bg-green-500 text-white w-14 h-14 hover:scale-105 transition-transform"><FaWhatsapp className="text-2xl" /></button>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCartOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2"><FaShoppingCart /> Seu carrinho</h3>
              <button onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-gray-100"><FaTimes /></button>
            </div>

            {/* Seleção de atendente */}
            <div className="mt-4">
              <label className="text-xs text-gray-600 flex items-center gap-2"><FaUser /> Escolher atendente:</label>
              <select value={agent} onChange={(e) => setAgent(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm">
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-500">“Automático” distribui os pedidos entre Amanda, Luana, Daniele e Cristina.</p>
            </div>

            <div className="mt-4 flex-1 overflow-auto space-y-4">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500">Seu carrinho está vazio.</p>
              ) : (
                cart.map((i) => (
                  <div key={i.sku} className="flex items-center justify-between gap-3 border rounded-2xl p-3">
                    <div>
                      <div className="text-sm font-medium">{i.nome}</div>
                      <div className="text-xs text-gray-500">SKU {i.sku}</div>
                      <div className="text-xs text-gray-600 mt-1">R$ {i.preco.toFixed(2).replace(".", ",")}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => dec(i.sku)} className="rounded-xl border px-2 py-1 text-xs"><FaMinus /></button>
                      <span className="text-sm w-6 text-center">{i.qty}</span>
                      <button onClick={() => inc(i.sku)} className="rounded-xl border px-2 py-1 text-xs"><FaPlus /></button>
                      <button onClick={() => removeItem(i.sku)} className="rounded-xl border px-2 py-1 text-xs"><FaTimes /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm"><span>Total</span><span className="font-semibold">R$ {total.toFixed(2).replace(".", ",")}</span></div>
              <a
                onClick={async (e) => {
                  e.preventDefault();
                  const url = await whatsappCheckoutLink();
                  window.open(url, "_blank");
                }}
                href="#"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-sm bg-rose-600 text-white hover:bg-rose-700"
              >
                <FaWhatsapp /> Finalizar no WhatsApp
              </a>
              <p className="text-[11px] text-gray-500">Ao clicar, a lista de produtos será enviada ao WhatsApp do atendente selecionado.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
