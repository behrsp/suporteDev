import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Database,
  Sliders,
  LifeBuoy,
  Search,
  Plus,
  Copy,
  Check,
  Edit3,
  Trash2,
  X,
  Layers,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Terminal,
  BookOpen,
  Wrench,
} from 'lucide-react';
import {
  ActiveTab,
  FormCategory,
  ProtheusHelp,
  ProtheusParametro,
  ProtheusTabela,
  TipoParametro,
} from './types';
import { ImageUploader } from './components/ImageUploader';
import { ImageLightbox } from './components/ImageLightbox';
import { processDeviceImage } from './utils/image';

const TIPOS_PARAMETRO: TipoParametro[] = ['Caractere', 'Numero', 'Logico', 'Data'];

const TIPO_BADGE_STYLES: Record<TipoParametro, string> = {
  Caractere: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Numero: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  Logico: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  Data: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipoFilter, setSelectedTipoFilter] = useState<string>('TODOS');

  const [tabelas, setTabelas] = useState<ProtheusTabela[]>([]);
  const [parametros, setParametros] = useState<ProtheusParametro[]>([]);
  const [helps, setHelps] = useState<ProtheusHelp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCategory, setFormCategory] = useState<FormCategory>('tabelas');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields - Tabela
  const [alias, setAlias] = useState('');
  const [tabelaDescricao, setTabelaDescricao] = useState('');

  // Form fields - Parametro
  const [paramNome, setParamNome] = useState('');
  const [paramTipo, setParamTipo] = useState<TipoParametro>('Caractere');
  const [paramDescricao, setParamDescricao] = useState('');

  // Form fields - Help
  const [nomeHelp, setNomeHelp] = useState('');
  const [helpDescritivo, setHelpDescritivo] = useState('');
  const [helpSolucao, setHelpSolucao] = useState('');

  // Shared Form Images (from device, camera or clipboard)
  const [formImages, setFormImages] = useState<string[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/overview');
      if (!res.ok) {
        throw new Error(`Erro ao carregar dados (${res.status})`);
      }
      const data = await res.json();
      setTabelas(data.tabelas || []);
      setParametros(data.parametros || []);
      setHelps(data.helps || []);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Support Ctrl+V image paste when modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            try {
              const base64 = await processDeviceImage(file);
              setFormImages((prev) => [...prev, base64]);
              showToast('Imagem colada da área de transferência!');
            } catch {
              // ignore paste error
            }
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isModalOpen, showToast]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const resetForm = () => {
    setEditingId(null);
    setAlias('');
    setTabelaDescricao('');
    setParamNome('');
    setParamTipo('Caractere');
    setParamDescricao('');
    setNomeHelp('');
    setHelpDescritivo('');
    setHelpSolucao('');
    setFormImages([]);
  };

  const openNewModal = (defaultCat?: FormCategory) => {
    resetForm();
    if (defaultCat) {
      setFormCategory(defaultCat);
    } else if (activeTab === 'tabelas' || activeTab === 'parametros' || activeTab === 'helps') {
      setFormCategory(activeTab);
    } else {
      setFormCategory('helps');
    }
    setIsModalOpen(true);
  };

  const openEditTabela = (item: ProtheusTabela) => {
    resetForm();
    setFormCategory('tabelas');
    setEditingId(item.id);
    setAlias(item.alias);
    setTabelaDescricao(item.descricao);
    const imgs =
      Array.isArray(item.imagens) && item.imagens.length > 0
        ? item.imagens
        : item.imagem_url
        ? [item.imagem_url]
        : [];
    setFormImages(imgs);
    setIsModalOpen(true);
  };

  const openEditParametro = (item: ProtheusParametro) => {
    resetForm();
    setFormCategory('parametros');
    setEditingId(item.id);
    setParamNome(item.nome);
    setParamTipo(item.tipo);
    setParamDescricao(item.descricao);
    const imgs =
      Array.isArray(item.imagens) && item.imagens.length > 0
        ? item.imagens
        : item.imagem_url
        ? [item.imagem_url]
        : [];
    setFormImages(imgs);
    setIsModalOpen(true);
  };

  const openEditHelp = (item: ProtheusHelp) => {
    resetForm();
    setFormCategory('helps');
    setEditingId(item.id);
    setNomeHelp(item.nome_help);
    setHelpDescritivo(item.descritivo);
    setHelpSolucao(item.solucao);
    const imgs =
      Array.isArray(item.imagens) && item.imagens.length > 0
        ? item.imagens
        : item.imagem_url
        ? [item.imagem_url]
        : [];
    setFormImages(imgs);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const endpointBase = `/api/${formCategory}`;
      const url = editingId ? `${endpointBase}/${editingId}` : endpointBase;
      const method = editingId ? 'PUT' : 'POST';

      let payload: Record<string, any> = {};
      if (formCategory === 'tabelas') {
        payload = {
          alias: alias.trim().toUpperCase(),
          descricao: tabelaDescricao.trim(),
          imagem_url: formImages[0] || null,
          imagens: formImages,
        };
      } else if (formCategory === 'parametros') {
        payload = {
          nome: paramNome.trim().toUpperCase(),
          tipo: paramTipo,
          descricao: paramDescricao.trim(),
          imagem_url: formImages[0] || null,
          imagens: formImages,
        };
      } else {
        payload = {
          nome_help: nomeHelp.trim(),
          descritivo: helpDescritivo.trim(),
          solucao: helpSolucao.trim(),
          imagem_url: formImages[0] || null,
          imagens: formImages,
        };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || 'Erro ao salvar registro.');
      }

      const saved = await res.json();

      if (formCategory === 'tabelas') {
        setTabelas((prev) =>
          editingId
            ? prev.map((t) => (t.id === editingId ? saved : t))
            : [saved, ...prev].sort((a, b) => a.alias.localeCompare(b.alias)),
        );
      } else if (formCategory === 'parametros') {
        setParametros((prev) =>
          editingId
            ? prev.map((p) => (p.id === editingId ? saved : p))
            : [saved, ...prev].sort((a, b) => a.nome.localeCompare(b.nome)),
        );
      } else {
        setHelps((prev) =>
          editingId ? prev.map((h) => (h.id === editingId ? saved : h)) : [saved, ...prev],
        );
      }

      setIsModalOpen(false);
      resetForm();
      showToast(editingId ? 'Registro atualizado com sucesso!' : 'Cadastro realizado com sucesso!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: FormCategory, id: number, label: string) => {
    if (!window.confirm(`Deseja realmente excluir "${label}" da base de conhecimento?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/${category}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir registro.');

      if (category === 'tabelas') {
        setTabelas((prev) => prev.filter((item) => item.id !== id));
      } else if (category === 'parametros') {
        setParametros((prev) => prev.filter((item) => item.id !== id));
      } else {
        setHelps((prev) => prev.filter((item) => item.id !== id));
      }
      showToast(`"${label}" removido com sucesso.`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao excluir.', 'error');
    }
  };

  // Filtered lists for instant consultation
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredTabelas = useMemo(() => {
    if (!normalizedQuery) return tabelas;
    return tabelas.filter(
      (t) =>
        t.alias.toLowerCase().includes(normalizedQuery) ||
        t.descricao.toLowerCase().includes(normalizedQuery),
    );
  }, [tabelas, normalizedQuery]);

  const filteredParametros = useMemo(() => {
    return parametros.filter((p) => {
      const matchesTipo = selectedTipoFilter === 'TODOS' || p.tipo === selectedTipoFilter;
      const matchesQuery =
        !normalizedQuery ||
        p.nome.toLowerCase().includes(normalizedQuery) ||
        p.descricao.toLowerCase().includes(normalizedQuery) ||
        p.tipo.toLowerCase().includes(normalizedQuery);
      return matchesTipo && matchesQuery;
    });
  }, [parametros, normalizedQuery, selectedTipoFilter]);

  const filteredHelps = useMemo(() => {
    if (!normalizedQuery) return helps;
    return helps.filter(
      (h) =>
        h.nome_help.toLowerCase().includes(normalizedQuery) ||
        h.descritivo.toLowerCase().includes(normalizedQuery) ||
        h.solucao.toLowerCase().includes(normalizedQuery),
    );
  }, [helps, normalizedQuery]);

  const totalResults =
    filteredTabelas.length + filteredParametros.length + filteredHelps.length;

  const getItemImages = (item: { imagem_url?: string | null; imagens?: string[] }): string[] => {
    if (Array.isArray(item.imagens) && item.imagens.length > 0) {
      return item.imagens;
    }
    if (item.imagem_url) {
      return [item.imagem_url];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col pb-20 md:pb-10">
      {/* Subtle Top Ambient Glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-gradient-to-b from-blue-600/15 via-blue-900/5 to-transparent z-0" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-blue-500/15 bg-[#070d19]/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between gap-3">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-600/30 border border-blue-400/30">
                <Terminal className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Suporte <span className="text-blue-400">Protheus</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300 border border-blue-500/30">
                    TOTVS Base
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Consulta rápida de Tabelas, Parâmetros SX6 e Helps com Soluções
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={fetchAllData}
                title="Atualizar base de dados"
                className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-slate-300 hover:border-blue-500/40 hover:text-blue-300 transition cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => openNewModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/25 border border-blue-400/30 transition cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Novo Cadastro</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 space-y-6">
        {/* Search & Quick Category Bar */}
        <section className="rounded-2xl border border-blue-500/20 bg-slate-900/75 p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Instant Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar alias (SA1, SC5), parâmetro (MV_ULMES) ou código/descrição de Help..."
                className="w-full rounded-xl border border-slate-700/80 bg-[#070d19]/90 pl-11 pr-10 py-3 text-sm sm:text-base text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Direct Quick-Add Buttons on Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => openNewModal('tabelas')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2.5 text-xs font-medium text-blue-200 transition cursor-pointer"
              >
                <Database className="h-3.5 w-3.5 text-blue-400" />
                <span>+ Tabela</span>
              </button>
              <button
                type="button"
                onClick={() => openNewModal('parametros')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-2.5 text-xs font-medium text-cyan-200 transition cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                <span>+ Parâmetro</span>
              </button>
              <button
                type="button"
                onClick={() => openNewModal('helps')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2.5 text-xs font-medium text-indigo-200 transition cursor-pointer"
              >
                <LifeBuoy className="h-3.5 w-3.5 text-indigo-400" />
                <span>+ Help</span>
              </button>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('todos')}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                  activeTab === 'todos'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Todos</span>
                <span className="rounded-full bg-slate-950/50 px-2 py-0.5 text-[11px]">
                  {totalResults}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tabelas')}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                  activeTab === 'tabelas'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Database className="h-4 w-4" />
                <span>Tabelas Protheus</span>
                <span className="rounded-full bg-slate-950/50 px-2 py-0.5 text-[11px]">
                  {filteredTabelas.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('parametros')}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                  activeTab === 'parametros'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>Parâmetros</span>
                <span className="rounded-full bg-slate-950/50 px-2 py-0.5 text-[11px]">
                  {filteredParametros.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('helps')}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                  activeTab === 'helps'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LifeBuoy className="h-4 w-4" />
                <span>Helps & Soluções</span>
                <span className="rounded-full bg-slate-950/50 px-2 py-0.5 text-[11px]">
                  {filteredHelps.length}
                </span>
              </button>
            </div>

            {/* Filter by Tipo when viewing Parametros */}
            {(activeTab === 'parametros' || activeTab === 'todos') && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 mr-1">
                  Tipo SX6:
                </span>
                {(['TODOS', ...TIPOS_PARAMETRO] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setSelectedTipoFilter(tipo)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                      selectedTipoFilter === tipo
                        ? 'bg-blue-500/25 text-blue-200 border border-blue-400/50'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {tipo === 'TODOS' ? 'Todos' : tipo}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Error Banner */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchAllData}
              className="rounded-lg bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-200 transition cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && tabelas.length === 0 && parametros.length === 0 && helps.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-36 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="h-5 w-24 rounded bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full rounded bg-slate-800" />
                  <div className="h-3.5 w-3/4 rounded bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* SECTION 1: TABELAS PROTHEUS */}
            {(activeTab === 'todos' || activeTab === 'tabelas') && (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        Tabelas Protheus (SX2)
                        <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-300 border border-blue-500/20">
                          {filteredTabelas.length}
                        </span>
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openNewModal('tabelas')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Cadastrar Tabela</span>
                  </button>
                </div>

                {filteredTabelas.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center">
                    <p className="text-sm text-slate-400">
                      Nenhuma tabela encontrada para a busca atual.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredTabelas.map((item) => {
                      const imgs = getItemImages(item);
                      return (
                        <div
                          key={item.id}
                          className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/70 hover:bg-slate-900 hover:border-blue-500/40 p-4 transition-all shadow-md"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-lg bg-blue-600/20 border border-blue-500/40 px-2.5 py-1 font-mono text-sm font-bold text-blue-300">
                                  {item.alias}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.alias, `tab-${item.id}`)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-300 transition cursor-pointer"
                                  title="Copiar Alias"
                                >
                                  {copiedKey === `tab-${item.id}` ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center gap-1 opacity-85 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => openEditTabela(item)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-500/15 hover:text-blue-300 transition cursor-pointer"
                                  title="Editar Tabela"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete('tabelas', item.id, item.alias)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition cursor-pointer"
                                  title="Excluir Tabela"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                              {item.descricao}
                            </p>

                            {imgs.length > 0 && (
                              <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                                {imgs.map((imgUrl, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      setLightboxImage({
                                        url: imgUrl,
                                        title: `Tabela ${item.alias}`,
                                      })
                                    }
                                    className="relative h-14 w-24 rounded-lg overflow-hidden border border-blue-500/30 shrink-0 group/img cursor-pointer"
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={item.alias}
                                      className="h-full w-full object-cover group-hover/img:scale-105 transition"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* SECTION 2: PARAMETROS SX6 */}
            {(activeTab === 'todos' || activeTab === 'parametros') && (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      <Sliders className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        Parâmetros (SX6)
                        <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
                          {filteredParametros.length}
                        </span>
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openNewModal('parametros')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Cadastrar Parâmetro</span>
                  </button>
                </div>

                {filteredParametros.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center">
                    <p className="text-sm text-slate-400">
                      Nenhum parâmetro encontrado para o filtro atual.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredParametros.map((item) => {
                      const imgs = getItemImages(item);
                      return (
                        <div
                          key={item.id}
                          className="group flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/70 hover:bg-slate-900 hover:border-cyan-500/40 p-4 transition-all shadow-md"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-lg bg-slate-950 border border-blue-500/30 px-2.5 py-1 font-mono text-sm font-bold text-blue-300">
                                  {item.nome}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                                    TIPO_BADGE_STYLES[item.tipo] || TIPO_BADGE_STYLES.Caractere
                                  }`}
                                >
                                  {item.tipo}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.nome, `param-${item.id}`)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-300 transition cursor-pointer"
                                  title="Copiar Nome do Parâmetro"
                                >
                                  {copiedKey === `param-${item.id}` ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditParametro(item)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-500/15 hover:text-blue-300 transition cursor-pointer"
                                  title="Editar Parâmetro"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete('parametros', item.id, item.nome)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition cursor-pointer"
                                  title="Excluir Parâmetro"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                              {item.descricao}
                            </p>

                            {imgs.length > 0 && (
                              <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                                {imgs.map((imgUrl, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      setLightboxImage({
                                        url: imgUrl,
                                        title: `Parâmetro ${item.nome}`,
                                      })
                                    }
                                    className="relative h-14 w-24 rounded-lg overflow-hidden border border-cyan-500/30 shrink-0 cursor-pointer"
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={item.nome}
                                      className="h-full w-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* SECTION 3: HELPS & SOLUÇÕES */}
            {(activeTab === 'todos' || activeTab === 'helps') && (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      <LifeBuoy className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        Helps & Soluções
                        <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/20">
                          {filteredHelps.length}
                        </span>
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openNewModal('helps')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Cadastrar Help</span>
                  </button>
                </div>

                {filteredHelps.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center">
                    <p className="text-sm text-slate-400">
                      Nenhum Help encontrado para a busca atual.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredHelps.map((item) => {
                      const imgs = getItemImages(item);
                      return (
                        <div
                          key={item.id}
                          className="group flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/75 hover:bg-slate-900 hover:border-blue-500/40 p-5 transition-all shadow-lg space-y-4"
                        >
                          <div className="space-y-3.5">
                            {/* Header of Help Card */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-1 font-mono text-sm font-bold text-blue-200 truncate">
                                  {item.nome_help}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.nome_help, `help-${item.id}`)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-300 transition shrink-0 cursor-pointer"
                                  title="Copiar Nome do Help"
                                >
                                  {copiedKey === `help-${item.id}` ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditHelp(item)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-500/15 hover:text-blue-300 transition cursor-pointer"
                                  title="Editar Help"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete('helps', item.id, item.nome_help)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition cursor-pointer"
                                  title="Excluir Help"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Descritivo */}
                            <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                                <span>Descritivo / Problema</span>
                              </div>
                              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                                {item.descritivo}
                              </p>
                            </div>

                            {/* Solução */}
                            <div className="rounded-xl bg-blue-950/25 border border-blue-500/25 p-3.5 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-300">
                                  <Wrench className="h-3.5 w-3.5 text-blue-400" />
                                  <span>Solução Recomendada</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(item.solucao, `help-sol-${item.id}`)
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-300/80 hover:text-blue-200 cursor-pointer"
                                >
                                  {copiedKey === `help-sol-${item.id}` ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-400" />
                                      <span>Copiado</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Copiar solução</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-line">
                                {item.solucao}
                              </p>
                            </div>

                            {/* Attached Images */}
                            {imgs.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                  <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                                  <span>
                                    {imgs.length === 1
                                      ? '1 imagem anexada (clique para ampliar)'
                                      : `${imgs.length} imagens anexadas (clique para ampliar)`}
                                  </span>
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {imgs.map((imgUrl, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() =>
                                        setLightboxImage({
                                          url: imgUrl,
                                          title: `${item.nome_help} - Anexo ${idx + 1}`,
                                        })
                                      }
                                      className="group/img relative aspect-video rounded-xl overflow-hidden border border-blue-500/30 bg-slate-950 cursor-pointer"
                                    >
                                      <img
                                        src={imgUrl}
                                        alt={`${item.nome_help} anexo ${idx + 1}`}
                                        className="h-full w-full object-cover group-hover/img:scale-105 transition duration-200"
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t border-blue-500/20 bg-[#070d19]/95 backdrop-blur-xl px-2 py-1.5">
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('todos')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-medium transition ${
              activeTab === 'todos' ? 'text-blue-400 bg-blue-500/15' : 'text-slate-400'
            }`}
          >
            <Layers className="h-4 w-4 mb-0.5" />
            <span>Todos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tabelas')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-medium transition ${
              activeTab === 'tabelas' ? 'text-blue-400 bg-blue-500/15' : 'text-slate-400'
            }`}
          >
            <Database className="h-4 w-4 mb-0.5" />
            <span>Tabelas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('parametros')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-medium transition ${
              activeTab === 'parametros' ? 'text-blue-400 bg-blue-500/15' : 'text-slate-400'
            }`}
          >
            <Sliders className="h-4 w-4 mb-0.5" />
            <span>Parâmetros</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('helps')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-medium transition ${
              activeTab === 'helps' ? 'text-blue-400 bg-blue-500/15' : 'text-slate-400'
            }`}
          >
            <LifeBuoy className="h-4 w-4 mb-0.5" />
            <span>Helps</span>
          </button>
        </div>
      </nav>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-blue-500/30 bg-[#0b1324] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {editingId ? 'Editar Registro' : 'Novo Cadastro Rápido'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5">
              {/* Category Selector (only when creating new) */}
              {!editingId && (
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950 p-1.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormCategory('tabelas')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      formCategory === 'tabelas'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Database className="h-4 w-4" />
                    <span>Tabela</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('parametros')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      formCategory === 'parametros'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sliders className="h-4 w-4" />
                    <span>Parâmetro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('helps')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      formCategory === 'helps'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LifeBuoy className="h-4 w-4" />
                    <span>Help</span>
                  </button>
                </div>
              )}

              {/* FORM: TABELA PROTHEUS */}
              {formCategory === 'tabelas' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1.5">
                      Alias da Tabela *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.toUpperCase())}
                      placeholder="Ex: SA1, SB1, SC5, SE1..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 font-mono text-sm uppercase text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1.5">
                      Descrição *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={tabelaDescricao}
                      onChange={(e) => setTabelaDescricao(e.target.value)}
                      placeholder="Descreva a finalidade da tabela, principais campos de relacionamento ou observações..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              )}

              {/* FORM: PARAMETROS */}
              {formCategory === 'parametros' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1.5">
                        Nome do Parâmetro *
                      </label>
                      <input
                        type="text"
                        required
                        value={paramNome}
                        onChange={(e) => setParamNome(e.target.value.toUpperCase())}
                        placeholder="Ex: MV_ULMES, MV_ESTADO..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 font-mono text-sm uppercase text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1.5">
                        Tipo *
                      </label>
                      <select
                        value={paramTipo}
                        onChange={(e) => setParamTipo(e.target.value as TipoParametro)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      >
                        {TIPOS_PARAMETRO.map((t) => (
                          <option key={t} value={t} className="bg-slate-900 text-white">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1.5">
                      Descrição *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={paramDescricao}
                      onChange={(e) => setParamDescricao(e.target.value)}
                      placeholder="Explique o que este parâmetro controla, conteúdos possíveis e impactos na rotina..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              )}

              {/* FORM: HELPS */}
              {formCategory === 'helps' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1.5">
                      Nome Help / Código do Erro *
                    </label>
                    <input
                      type="text"
                      required
                      value={nomeHelp}
                      onChange={(e) => setNomeHelp(e.target.value)}
                      placeholder="Ex: A410VST, MA410COR, MV_ULMES, Bloqueio de Estoque..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1.5">
                      Descritivo (Sintoma / Mensagem apresentada) *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={helpDescritivo}
                      onChange={(e) => setHelpDescritivo(e.target.value)}
                      placeholder="Descreva a mensagem exibida pelo Protheus ou em qual rotina o problema ocorre..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1.5">
                      Solução Passo a Passo *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={helpSolucao}
                      onChange={(e) => setHelpSolucao(e.target.value)}
                      placeholder="Informe como solucionar o problema (tabelas, parâmetros, pontos de entrada ou rotinas a ajustar)..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              )}

              {/* Image Uploader from Device */}
              <ImageUploader
                images={formImages}
                onChange={setFormImages}
                label={
                  formCategory === 'helps'
                    ? 'Upload de Imagem do Help (pelo Dispositivo / Câmera)'
                    : 'Upload de Imagem Opcional (pelo Dispositivo)'
                }
              />

              {/* Submit / Cancel Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  <span>{submitting ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Salvar Cadastro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox */}
      <ImageLightbox
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title}
        onClose={() => setLightboxImage(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-blue-500/40 bg-slate-900/95 px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md">
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
