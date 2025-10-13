import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis, ComposedChart
} from 'recharts';
import {
  Wind, AlertTriangle, CheckCircle, TrendingUp, BarChart3, Calendar, ClipboardList,
  Download, Filter, RefreshCw, Activity, MapPin, Layers, Cpu, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import './App.css';
import dashboardData from './assets/dashboard_data.json';
import maquinasParadasData from './assets/maquinas_paradas.json'; // ← ADICIONE ESTA LINHA

// --- Constantes e Configurações ---
const COLORS = {
  baixa: '#10b981',
  media: '#f59e0b',
  alta: '#ef4444',
  primary: '#3b82f6',
  gradient: {
    start: '#6366f1',
    end: '#3b82f6'
  }
};

// Sistema de Abas com três níveis
const tabs = [
  { id: "macro", label: "Visão Macro", icon: <BarChart3 size={18} />, description: "Análise por ciclos" },
  { id: "mesio", label: "Visão Mésio", icon: <Cpu size={18} />, description: "Análise por turbinas" },
  { id: "micro", label: "Visão Micro", icon: <Layers size={18} />, description: "Análise por carreiras" },
  { id: "temporal", label: "Análise Temporal", icon: <Calendar size={18} />, description: "Evolução mensal" },
  { id: "paradas", label: "Turbinas Parada no Periodo", icon: <AlertTriangle size={18} />, description: "Máquinas paradas" }, // NOVA ABA
  { id: "resumo", label: "Relatórios", icon: <ClipboardList size={18} />, description: "Tabelas detalhadas" },
];

// --- Componente de Abas ---
function CustomTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 p-1 rounded-2xl flex space-x-2 shadow-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center gap-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 focus:outline-none whitespace-nowrap min-w-[120px] ${activeTab === tab.id
              ? "text-white"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
            <span className={`relative z-10 text-xs font-normal ${activeTab === tab.id ? 'text-white/90' : 'text-gray-500'
              }`}>
              {tab.description}
            </span>

            {activeTab === tab.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg z-0"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Componente Heatmap Customizado ---
function HeatmapCustom({ data }) {
  // Verificação mais robusta
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado disponível para o heatmap</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processamento com verificações
  const blocos = [];
  const tamanhoBloco = 10;

  for (let i = 0; i < data.length; i += tamanhoBloco) {
    const bloco = data.slice(i, i + tamanhoBloco);

    // Verificar se há dados válidos no bloco
    const blocoValido = bloco.filter(item => item && item.media !== undefined);

    if (blocoValido.length > 0) {
      const intensidadeMedia = blocoValido.reduce((sum, item) => sum + (item.media || 0), 0) / blocoValido.length;
      const totalImas = blocoValido.reduce((sum, item) => sum + (item.imas || 0), 0);

      blocos.push({
        id: i,
        carreiras: blocoValido.map(c => c.carreira || ''),
        intensidade: intensidadeMedia,
        totalImas: totalImas,
        primeiraCarreira: blocoValido[0]?.carreira || '',
        ultimaCarreira: blocoValido[blocoValido.length - 1]?.carreira || ''
      });
    }
  }

  const getCorIntensidade = (intensidade) => {
    if (intensidade > 8) return 'bg-red-500 hover:bg-red-600';      // Crítico
    if (intensidade > 4) return 'bg-orange-500 hover:bg-orange-600'; // Alto
    if (intensidade > 2) return 'bg-yellow-500 hover:bg-yellow-600'; // Médio
    return 'bg-green-500 hover:bg-green-600';                       // Baixo
  };

  const getTextoCor = (intensidade) => {
    return intensidade > 4 ? 'text-white' : 'text-gray-800';
  };

  const getNivelRisco = (intensidade) => {
    if (intensidade > 8) return { texto: 'CRÍTICO', cor: 'bg-red-500 text-white' };
    if (intensidade > 4) return { texto: 'ALTO', cor: 'bg-orange-500 text-white' };
    if (intensidade > 2) return { texto: 'MÉDIO', cor: 'bg-yellow-500 text-gray-800' };
    return { texto: 'BAIXO', cor: 'bg-green-500 text-white' };
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Activity className="h-5 w-5 text-red-600" />
          Mapa de Calor - Intensidade por Bloco de Carreiras
        </CardTitle>
        <CardDescription>
          Visualização por blocos de 10 carreiras - Cores indicam a intensidade média de trocas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legenda */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <div>
              <span className="text-sm font-medium">Baixo</span>
              <div className="text-xs text-gray-500">0-2 ímãs/turbina</div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <div>
              <span className="text-sm font-medium">Médio</span>
              <div className="text-xs text-gray-500">2-4 ímãs/turbina</div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
            <div>
              <span className="text-sm font-medium">Alto</span>
              <div className="text-xs text-gray-500">4-8 ímãs/turbina</div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <div>
              <span className="text-sm font-medium">Crítico</span>
              <div className="text-xs text-gray-500">8+ ímãs/turbina</div>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {blocos.map((bloco) => {
            const nivel = getNivelRisco(bloco.intensidade);
            return (
              <motion.div
                key={bloco.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className={`p-3 rounded-lg shadow-md transition-all cursor-pointer ${getCorIntensidade(bloco.intensidade)} ${getTextoCor(bloco.intensidade)}`}
                title={`Bloco ${bloco.primeiraCarreira} a ${bloco.ultimaCarreira} | Média: ${bloco.intensidade.toFixed(1)} ímãs/turbina | Total: ${bloco.totalImas} ímãs`}
              >
                <div className="text-center">
                  <div className="font-bold text-lg mb-1">
                    {bloco.primeiraCarreira.replace('C-', '')}
                  </div>
                  <div className="text-xs opacity-90 mb-1">
                    a {bloco.ultimaCarreira.replace('C-', '')}
                  </div>
                  <div className="text-sm font-semibold mb-1">
                    {bloco.intensidade.toFixed(1)}
                  </div>
                  <div className="text-xs opacity-75">
                    {bloco.totalImas} ímãs
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Blocos Críticos */}
        {blocos.filter(b => b.intensidade > 4).length > 0 && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Blocos Críticos Identificados ({blocos.filter(b => b.intensidade > 4).length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {blocos
                .filter(b => b.intensidade > 4)
                .sort((a, b) => b.intensidade - a.intensidade)
                .map((bloco, index) => {
                  const nivel = getNivelRisco(bloco.intensidade);
                  return (
                    <div key={bloco.id} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <div>
                        <span className="font-medium text-gray-800">
                          {bloco.primeiraCarreira} a {bloco.ultimaCarreira}
                        </span>
                        <div className="text-xs text-gray-500">
                          Média: {bloco.intensidade.toFixed(1)} ímãs/turbina
                        </div>
                      </div>
                      <Badge className={nivel.cor}>
                        {nivel.texto}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Componente de Tooltip Customizado ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl">
        <p className="font-bold text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2 text-sm" style={{ color: entry.color }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Componente Principal ---
function App() {

  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("macro");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFiltros, setShowFiltros] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());

  useEffect(() => {
    const loadData = () => {
      try {
        setTimeout(() => {
          // UNIFICAR OS DADOS DOS DOIS JSONs
          const dadosCompletos = {
            ...dashboardData,
            maquinas_paradas: maquinasParadasData // Adiciona os dados das máquinas paradas
          };

          console.log("🔍 DADOS UNIFICADOS:", dadosCompletos);
          console.log("📊 MAQUINAS_PARADAS:", dadosCompletos.maquinas_paradas);

          if (dadosCompletos && dadosCompletos.resumo) {
            setData(dadosCompletos);
            setError(null);
          } else {
            setError('Estrutura de dados inválida');
          }
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError('Erro crítico ao carregar dados: ' + err.message);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // ACESSAR OS NOVOS DADOS
  const maquinasParadas = data?.maquinas_paradas || {};
  const maquinasLista = maquinasParadas.maquinas_paradas || [];
  const resumoCiclos = maquinasParadas.resumo_por_ciclo || {};

  // --- FUNÇÃO DE ORDENAÇÃO CORRIGIDA ---
  const ordenarCiclos = (a, b) => {
    const ordemCiclos = {
      'Primeiro': 1,
      'Segundo': 2,
      'Terceiro': 3,
      'Quarto': 4,
      'Troca de spindle': 5,
      'Spindle': 5, // caso tenha ambos os nomes
      'Análise Geral': 6,
      'Não Especificado': 7
    };

    const ordemA = ordemCiclos[a.ciclo] || 999;
    const ordemB = ordemCiclos[b.ciclo] || 999;

    return ordemA - ordemB;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  // --- PROCESSAMENTO DE DADOS COM VERIFICAÇÃO E ORDENAÇÃO ---

  // Dados Macro (agora com criticidade)
  const macroData = (data?.ciclos || [])
    .map(ciclo => ({
      ciclo: (ciclo.Ciclo || '').replace(' Ciclo', ''),
      imas: ciclo.Imas_Trocados || 0,
      maquinas_paradas: ciclo.Maquinas_Paradas || 0,
      dias_parada: ciclo.Dias_Parada_Medio || 0,
      criticidade_baixa: ciclo.Criticidade_Baixa || 0,
      criticidade_media: ciclo.Criticidade_Media || 0,
      criticidade_alta: ciclo.Criticidade_Alta || 0
    }))
    .sort(ordenarCiclos);

  // Dados Mésio - COM VERIFICAÇÃO DE SEGURANÇA
  const mesioData = (data?.turbinas || []).map(turbina => ({
    turbina: turbina.Turbina || 'N/A',
    imas: turbina.Total_Imas_Trocados || 0,
    dias_parada: turbina.Dias_Parada_Acumulados || 0,
    mtbf: turbina.MTBF_Dias || 0,
    mttr: turbina.MTTR_Dias || 0,
    risco: turbina.Nivel_Risco || '🟩 BAIXO RISCO'
  }));

  // Dados Micro
  const microData = (data?.carreiras || []).map(carreira => ({
    carreira: carreira.Carreira || 'N/A',
    imas: carreira.Total_Imas_Trocados || 0,
    turbinas: carreira.Turbinas_Afetadas || 0,
    intervencoes: carreira.Total_Intervencoes || 0,
    media: carreira.Media_Imas_Por_Turbina || 0
  }));

  // Dados Temporais
  const temporalData = (data?.mensal || []).map(mes => ({
    mes: mes.Mes_Ano || 'N/A',
    imas: mes.Imas_Trocados || 0,
    turbinas_unicas: mes.Turbinas_Unicas || 0,
    dias_parada: mes.Dias_Parada_Total || 0
  }));

  // Dados de Oxidação
  const oxidacaoData = (data?.oxidacao || []).map(oxi => ({
    ciclo: oxi.Ciclo_Inspecao || 'N/A',
    baixa: oxi.Oxidacao_Baixa || 0,
    media: oxi.Oxidacao_Media || 0,
    alta: oxi.Oxidacao_Alta || 0,
    total: oxi.Total_Oxidacao || 0
  }));

  // --- Handlers ---
  const handleExport = () => {
    window.print();
  };

  const handleAtualizar = () => {
    setIsLoading(true);
    setTimeout(() => {
      setUltimaAtualizacao(new Date());
      setIsLoading(false);
      alert('Dados atualizados com sucesso!');
    }, 1500);
  };

  const handleFiltrar = () => {
    setShowFiltros(true);
  };

  // --- Renderização ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 mb-8"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <Wind className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Dashboard - Análise de troca dos Ímãs dos Geradores.
              </h1>
              <p className="text-lg text-gray-600 font-medium">Complexo Eólico Santo Inácio • {data.resumo.periodo_analise}</p>
            </div>
          </div>

          {/* Barra de Ações */}
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all hover:bg-blue-50 hover:border-blue-200">
              <Download size={16} /> Exportar
            </button>
            <button onClick={handleFiltrar} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all hover:bg-green-50 hover:border-green-200">
              <Filter size={16} /> Filtrar
            </button>
            <button onClick={handleAtualizar} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all hover:bg-orange-50 hover:border-orange-200 disabled:opacity-50">
              {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" /> : <RefreshCw size={16} />}
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </motion.header>

        {/* Sistema de Abas */}
        <CustomTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Conteúdo das Abas */}
        <main>
          {/* ABA MACRO */}
          {activeTab === 'macro' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Total de Turbinas", value: data.resumo.total_turbinas, icon: Wind, color: "blue", desc: "Complexo eólico" },
                  { title: "Total Ímãs Trocados", value: data.resumo.total_imas_trocados, icon: TrendingUp, color: "green", desc: "Período completo" },
                  { title: "Qtd. Turbinas com Oxidações", value: data.resumo.total_oxidacao, icon: AlertTriangle, color: "orange", desc: "Todas as inspeções" },
                  { title: "Total Carreiras", value: data.resumo.total_carreiras, icon: MapPin, color: "purple", desc: "Carreiras com substituição" }
                ].map((item, index) => (
                  <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <Card className="relative bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
                      <div className={`absolute left-0 top-0 h-full w-2 rounded-r-2xl ${item.color === 'blue' ? 'bg-blue-500' :
                        item.color === 'green' ? 'bg-green-500' :
                          item.color === 'orange' ? 'bg-orange-500' : 'bg-purple-500'
                        }`} />
                      <CardContent className="p-6 pl-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{item.title}</p>
                            <p className={`text-3xl font-bold ${item.color === 'blue' ? 'text-blue-600' :
                              item.color === 'green' ? 'text-green-600' :
                                item.color === 'orange' ? 'text-orange-600' : 'text-purple-600'
                              } mt-2`}>{item.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                          </div>
                          <div className={`p-3 rounded-xl ${item.color === 'blue' ? 'bg-blue-100' :
                            item.color === 'green' ? 'bg-green-100' :
                              item.color === 'orange' ? 'bg-orange-100' : 'bg-purple-100'
                            } group-hover:scale-110 transition-transform`}>
                            <item.icon className={`h-6 w-6 ${item.color === 'blue' ? 'text-blue-600' :
                              item.color === 'green' ? 'text-green-600' :
                                item.color === 'orange' ? 'text-orange-600' : 'text-purple-600'
                              }`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Ímãs Trocados por Ciclo
                    </CardTitle>
                    <CardDescription>Quantidade de ímãs substituídos em cada ciclo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={macroData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorImas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="ciclo" tick={{ fill: '#6b7280' }} axisLine={false} />
                        <YAxis tick={{ fill: '#6b7280' }} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="imas" fill="url(#colorImas)" radius={[8, 8, 0, 0]}>
                          <LabelList dataKey="imas" position="top" style={{ fill: '#374151', fontWeight: 'bold', fontSize: '14px' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Cpu className="h-5 w-5 text-red-600" />
                      Máquinas Paradas por Ciclo
                    </CardTitle>
                    <CardDescription>Quantidade de turbinas paradas em cada ciclo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={macroData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorMaquinas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ec4899" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#db2777" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="ciclo" tick={{ fill: '#6b7280' }} axisLine={false} />
                        <YAxis tick={{ fill: '#6b7280' }} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="maquinas_paradas" fill="url(#colorMaquinas)" radius={[8, 8, 0, 0]}>
                          <LabelList dataKey="maquinas_paradas" position="top" style={{ fill: '#374151', fontWeight: 'bold', fontSize: '14px' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* ABA MÉSIO */}
          {activeTab === 'mesio' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Activity className="h-5 w-5 text-green-600" />
                      Top 10 Turbinas com Mais Ímãs Trocados
                    </CardTitle>
                    <CardDescription>Ranking das turbinas com maior necessidade de manutenção</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={mesioData.sort((a, b) => b.imas - a.imas).slice(0, 10)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        layout="vertical"
                      >
                        <defs>
                          <linearGradient id="colorTopTurbinas" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" tick={{ fill: '#6b7280' }} axisLine={false} />
                        <YAxis
                          type="category"
                          dataKey="turbina"
                          width={100}
                          tick={{ fill: '#6b7280' }}
                          fontSize={12}
                          axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="imas" fill="url(#colorTopTurbinas)" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="imas" position="right" style={{ fill: '#374151', fontWeight: 'bold', fontSize: '12px' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      Dias de Parada Acumulados
                    </CardTitle>
                    <CardDescription>Tempo total de parada por turbina</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={mesioData.sort((a, b) => b.dias_parada - a.dias_parada).slice(0, 10)}
                        margin={{ top: 20, right: 0, left: 0, bottom: 60 }}
                      >
                        <defs>
                          <linearGradient id="colorDiasAcumulados" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="turbina"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={false}
                        />
                        <YAxis tick={{ fill: '#6b7280' }} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="dias_parada" fill="url(#colorDiasAcumulados)" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="dias_parada" position="top" style={{ fill: '#374151', fontWeight: 'bold', fontSize: '12px' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* ABA MICRO */}
          {activeTab === 'micro' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Layers className="h-5 w-5 text-purple-600" />
                      Top 15 Carreiras com Mais Ímãs Trocados
                    </CardTitle>
                    <CardDescription>Carreiras com maior volume de substituições</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={500}>
                      <BarChart
                        data={microData.sort((a, b) => b.imas - a.imas).slice(0, 15)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <defs>
                          <linearGradient id="colorCarreiras" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="carreira"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={false}
                        />
                        <YAxis tick={{ fill: '#6b7280' }} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="imas" fill="url(#colorCarreiras)" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="imas" position="top" style={{ fill: '#374151', fontWeight: 'bold', fontSize: '12px' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MapPin className="h-5 w-5 text-pink-600" />
                      Turbinas Afetadas por Carreira
                    </CardTitle>
                    <CardDescription>Quantidade de turbinas impactadas em cada carreira</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={500}>
                      <BarChart
                        data={microData.sort((a, b) => b.turbinas - a.turbinas).slice(0, 15)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <defs>
                          <linearGradient id="colorTurbinasCarreira" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ec4899" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#db2777" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="carreira"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={false}
                        />
                        <YAxis tick={{ fill: '#6b7280' }} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="turbinas" fill="url(#colorTurbinasCarreira)" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="turbinas" position="top" style={{ fill: '#374151', fontWeight: 'bold', fontSize: '12px' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* ABA TEMPORAL */}
          {activeTab === 'temporal' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Evolução Mensal de Ímãs Trocados
                    </CardTitle>
                    <CardDescription>
                      Histórico de substituições ao longo do tempo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart
                        data={temporalData}
                        margin={{ top: 30, right: 30, left: 10, bottom: 60 }}
                      >
                        <defs>
                          <linearGradient id="colorTemporal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                        <XAxis
                          dataKey="mes"
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={false}
                          angle={-35}              // Inclina as datas
                          textAnchor="end"         // Alinha à esquerda
                          interval={0}             // Mostra todas as datas
                          height={70}              // Cria espaço abaixo
                        />

                        <YAxis tick={{ fill: '#6b7280' }} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Área com gradiente + rótulos de dados */}
                        <Area
                          type="monotone"
                          dataKey="imas"
                          stroke="#1d4ed8"
                          strokeWidth={3}
                          fill="url(#colorTemporal)"
                          dot={{ fill: '#1d4ed8', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 7, fill: '#1e40af' }}
                        >
                          <LabelList
                            dataKey="imas"
                            position="top"
                            fill="#1e40af"
                            fontSize={12}
                            fontWeight="bold"
                            offset={10}
                            formatter={(value) => (value > 0 ? value : '')}
                          />
                        </Area>
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* GRÁFICO 2: COMPARAÇÃO ENTRE CICLOS */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Comparação de Oxidações entre Ciclos
                    </CardTitle>
                    <CardDescription>Distribuição dos níveis de oxidação em cada ciclo (valores absolutos)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={data?.oxidacao_temporal?.variacao_entre_ciclos || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="Ciclo" tick={{ fill: '#6b7280' }} axisLine={false} />
                        <YAxis tick={{ fill: '#6b7280' }} axisLine={false} />
                        <Tooltip
                          formatter={(value, name) => {
                            const labels = {
                              'Oxidacao_Baixa': 'Baixa',
                              'Oxidacao_Media': 'Média',
                              'Oxidacao_Alta': 'Alta'
                            };
                            return [value, labels[name] || name];
                          }}
                        />
                        <Legend
                          formatter={(value) => {
                            const labels = {
                              'Oxidacao_Baixa': 'Baixa',
                              'Oxidacao_Media': 'Média',
                              'Oxidacao_Alta': 'Alta'
                            };
                            return labels[value] || value;
                          }}
                        />
                        <Bar dataKey="Oxidacao_Baixa" stackId="a" fill="#10b981" name="Oxidacao_Baixa">
                          <LabelList dataKey="Oxidacao_Baixa" position="inside" fill="white" fontSize={12} fontWeight="bold" formatter={(value) => value > 0 ? `${value}` : ''} />
                        </Bar>
                        <Bar dataKey="Oxidacao_Media" stackId="a" fill="#f59e0b" name="Oxidacao_Media">
                          <LabelList dataKey="Oxidacao_Media" position="inside" fill="white" fontSize={12} fontWeight="bold" formatter={(value) => value > 0 ? `${value}` : ''} />
                        </Bar>
                        <Bar dataKey="Oxidacao_Alta" stackId="a" fill="#ef4444" name="Oxidacao_Alta">
                          <LabelList dataKey="Oxidacao_Alta" position="inside" fill="white" fontSize={12} fontWeight="bold" formatter={(value) => value > 0 ? `${value}` : ''} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* NOVA ABA - HISTÓRICO DE PARADAS */}
          {activeTab === 'paradas' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              {/* CARDS DE RESUMO */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "1º Ciclo", value: resumoCiclos.primeiro_ciclo || 0, icon: AlertTriangle, color: "red", desc: "Paradas primeiro ciclo" },
                  { title: "2º Ciclo", value: resumoCiclos.segundo_ciclo || 0, icon: AlertTriangle, color: "red", desc: "Paradas segundo ciclo" },
                  { title: "3º Ciclo", value: resumoCiclos.terceiro_ciclo || 0, icon: AlertTriangle, color: "red", desc: "Paradas terceiro ciclo" },
                  { title: "Troca de Spindle", value: resumoCiclos.troca_spindle || 0, icon: AlertTriangle, color: "red", desc: "Paradas Troca de Spindle" }
                ].map((item, index) => (
                  <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <Card className="relative bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
                      <div className={`absolute left-0 top-0 h-full w-2 rounded-r-2xl ${item.color === 'red' ? 'bg-red-500' :
                        item.color === 'blue' ? 'bg-blue-500' :
                          item.color === 'green' ? 'bg-green-500' : 'bg-orange-500'
                        }`} />
                      <CardContent className="p-6 pl-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{item.title}</p>
                            <p className={`text-3xl font-bold ${item.color === 'red' ? 'text-red-600' :
                              item.color === 'blue' ? 'text-blue-600' :
                                item.color === 'green' ? 'text-green-600' : 'text-orange-600'
                              } mt-2`}>{item.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                          </div>
                          <div className={`p-3 rounded-xl ${item.color === 'red' ? 'bg-red-100' :
                            item.color === 'blue' ? 'bg-blue-100' :
                              item.color === 'green' ? 'bg-green-100' : 'bg-orange-100'
                            } group-hover:scale-110 transition-transform`}>
                            <item.icon className={`h-6 w-6 ${item.color === 'red' ? 'text-red-600' :
                              item.color === 'blue' ? 'text-blue-600' :
                                item.color === 'green' ? 'text-green-600' : 'text-orange-600'
                              }`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* TABELA DETALHADA */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    Histórico Completo de Máquinas Paradas
                  </CardTitle>
                  <CardDescription>Registro detalhado de todas as paradas por ciclo de inspeção</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left p-3 font-semibold text-gray-700">Data Parada</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Turbina</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Data Retorno</th>
                          <th className="text-center p-3 font-semibold text-gray-700">Dias</th>
                          <th className="text-center p-3 font-semibold text-gray-700">Ciclo</th>
                          <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maquinasLista.map((maquina, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                            <td className="p-3 font-medium text-gray-900">{maquina["Data da Parada"]}</td>
                            <td className="p-3 font-medium text-blue-600">{maquina["Tag da Turbina"]}</td>
                            <td className="p-3 text-gray-700">{maquina["Data de Retorno"]}</td>
                            <td className="text-center p-3">
                              <Badge className={
                                maquina["Dias Parada"] > 150 ? "bg-red-100 text-red-800" :
                                  maquina["Dias Parada"] > 100 ? "bg-orange-100 text-orange-800" :
                                    "bg-yellow-100 text-yellow-800"
                              }>
                                {maquina["Dias Parada"]} dias
                              </Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge variant="outline" className="rounded-full">
                                {maquina.Ciclo}
                              </Badge>
                            </td>
                            <td className="text-center p-3">
                              <span className="text-xs text-gray-600 max-w-[120px] truncate block">
                                {maquina.Status || "N/A"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {maquinasLista.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum registro de máquina parada encontrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ABA RESUMO */}
          {activeTab === 'resumo' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                      Resumo por Ciclo de Inspeção
                    </CardTitle>
                    <CardDescription>Dados consolidados por tipo de ciclo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left p-3 font-semibold text-gray-700">Ciclo</th>
                            <th className="text-center p-3 font-semibold text-gray-700">Máquinas Paradas</th>
                            <th className="text-center p-3 font-semibold text-gray-700">Ímãs Trocados</th>
                            <th className="text-center p-3 font-semibold text-gray-700">Dias Parada (Médio)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {macroData.map((ciclo, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                              <td className="p-3 font-medium text-gray-900">{ciclo.ciclo}</td>
                              <td className="text-center p-3">
                                <Badge variant={ciclo.maquinas_paradas > 0 ? "destructive" : "default"} className="rounded-full">
                                  {ciclo.maquinas_paradas}
                                </Badge>
                              </td>
                              <td className="text-center p-3">
                                <Badge className="bg-blue-100 text-blue-800 rounded-full">
                                  {ciclo.imas}
                                </Badge>
                              </td>
                              <td className="text-center p-3">
                                <Badge variant="outline" className="rounded-full">
                                  {ciclo.dias_parada.toFixed(1)}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Activity className="h-5 w-5 text-green-600" />
                      Resumo por Carreira
                    </CardTitle>
                    <CardDescription>Carreiras coincidentes em outras Turbinas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left p-3 font-semibold text-gray-700">Carreira</th>
                            <th className="text-center p-3 font-semibold text-gray-700">Ímãs Trocados</th>
                            <th className="text-center p-3 font-semibold text-gray-700">Turbinas</th>
                            <th className="text-center p-3 font-semibold text-gray-700">Média/Turbina</th>
                          </tr>
                        </thead>
                        <tbody>
                          {microData.sort((a, b) => b.imas - a.imas).slice(0, 10).map((carreira, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                              <td className="p-3 font-medium text-gray-900">{carreira.carreira}</td>
                              <td className="text-center p-3">
                                <Badge className="bg-purple-100 text-purple-800 rounded-full">
                                  {carreira.imas}
                                </Badge>
                              </td>
                              <td className="text-center p-3">
                                <Badge variant="outline" className="rounded-full">
                                  {carreira.turbinas}
                                </Badge>
                              </td>
                              <td className="text-center p-3">
                                <Badge className={
                                  carreira.media > 10 ? "bg-red-100 text-red-800" :
                                    carreira.media > 5 ? "bg-orange-100 text-orange-800" :
                                      "bg-green-100 text-green-800"
                                }>
                                  {carreira.media.toFixed(1)}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* MELHORIA 5: Turbinas de Alto Risco Ordenadas por Ímãs Trocados */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Turbinas Mais Criticas no Periodo
                  </CardTitle>
                  <CardDescription>Turbinas Com Maior Numero de Ímãs Trocados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left p-3 font-semibold text-gray-700">Turbina</th>
                          <th className="text-center p-3 font-semibold text-gray-700">Ímãs Trocados</th>
                          <th className="text-center p-3 font-semibold text-gray-700">Dias Parada</th>
                          <th className="text-center p-3 font-semibold text-gray-700">MTBF</th>
                          <th className="text-center p-3 font-semibold text-gray-700">MTTR</th>
                          <th className="text-center p-3 font-semibold text-gray-700">Nível Risco</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mesioData
                          .filter(t => t.risco === '🟥 ALTO RISCO')
                          .sort((a, b) => b.imas - a.imas) // Ordenação do maior para o menor
                          .map((turbina, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                              <td className="p-3 font-medium text-gray-900">{turbina.turbina}</td>
                              <td className="text-center p-3">
                                <Badge className="bg-red-100 text-red-800 rounded-full">
                                  {turbina.imas}
                                </Badge>
                              </td>
                              <td className="text-center p-3">
                                <Badge variant="outline" className="rounded-full">
                                  {turbina.dias_parada}
                                </Badge>
                              </td>
                              <td className="text-center p-3">
                                <Badge variant="outline" className="rounded-full">
                                  {turbina.mtbf.toFixed(1)}
                                </Badge>
                              </td>
                              <td className="text-center p-3">
                                <Badge variant="outline" className="rounded-full">
                                  {turbina.mttr.toFixed(1)}
                                </Badge>
                              </td>
                              <td className="text-center p-3">
                                <Badge className="bg-red-500 text-white rounded-full">
                                  {turbina.risco}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>

        {/* Modal de Filtros */}
        {showFiltros && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">Filtrar Dados</h3>
              <p className="text-gray-600 mb-4">Funcionalidade de filtros em desenvolvimento...</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowFiltros(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                  Fechar
                </button>
                <button onClick={() => setShowFiltros(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-gray-500 text-sm pt-8">
          <div className="bg-white/100 backdrop-blur-sm rounded-2xl p-4 border border-gray-200">
            <p>Dashboard gerado automaticamente • Última atualização: {ultimaAtualizacao.toLocaleString('pt-BR')}</p>
            <p className="text-xs mt-1">Dados processados: {data.resumo.data_ultima_atualizacao}</p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;
