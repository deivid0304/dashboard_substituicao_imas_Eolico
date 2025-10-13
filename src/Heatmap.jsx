// Componente HeatmapCustom.jsx - Crie este arquivo
import React from 'react';

const HeatmapCustom = ({ data, width = 800, height = 400 }) => {
  // Agrupar carreiras por "blocos" para melhor visualização
  const blocos = [];
  const tamanhoBloco = 10; // 10 carreiras por bloco
  
  for (let i = 0; i < data.length; i += tamanhoBloco) {
    const bloco = data.slice(i, i + tamanhoBloco);
    const intensidadeMedia = bloco.reduce((sum, item) => sum + item.media, 0) / bloco.length;
    
    blocos.push({
      carreiras: bloco.map(c => c.carreira),
      intensidade: intensidadeMedia,
      totalImas: bloco.reduce((sum, item) => sum + item.imas, 0)
    });
  }

  const getCorIntensidade = (intensidade) => {
    if (intensidade > 8) return 'bg-red-500';      // Crítico
    if (intensidade > 4) return 'bg-orange-500';   // Alto
    if (intensidade > 2) return 'bg-yellow-500';   // Médio
    return 'bg-green-500';                         // Baixo
  };

  const getTextoCor = (intensidade) => {
    return intensidade > 4 ? 'text-white' : 'text-gray-800';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Mapa de Calor - Intensidade por Bloco de Carreiras</h3>
      
      <div className="grid grid-cols-5 gap-2 mb-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span className="text-sm">Baixo (0-2)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
          <span className="text-sm">Médio (2-4)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
          <span className="text-sm">Alto (4-8)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          <span className="text-sm">Crítico (8+)</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {blocos.map((bloco, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg shadow-md transition-all hover:scale-105 cursor-pointer ${getCorIntensidade(bloco.intensidade)} ${getTextoCor(bloco.intensidade)}`}
            title={`Bloco ${index + 1}: ${bloco.carreiras[0]} a ${bloco.carreiras[bloco.carreiras.length - 1]} | Média: ${bloco.intensidade.toFixed(1)}`}
          >
            <div className="text-center">
              <div className="font-bold text-lg mb-1">B{index + 1}</div>
              <div className="text-xs opacity-90">
                {bloco.carreiras[0]}-{bloco.carreiras[bloco.carreiras.length - 1]}
              </div>
              <div className="text-sm font-semibold mt-1">
                {bloco.intensidade.toFixed(1)}
              </div>
              <div className="text-xs opacity-75">
                {bloco.totalImas} ímãs
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">Blocos Críticos Identificados:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {blocos.filter(b => b.intensidade > 4).map((bloco, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
              <span className="font-medium">
                {bloco.carreiras[0]} a {bloco.carreiras[bloco.carreiras.length - 1]}
              </span>
              <Badge className={
                bloco.intensidade > 8 ? "bg-red-500 text-white" :
                "bg-orange-500 text-white"
              }>
                {bloco.intensidade > 8 ? "CRÍTICO" : "ALERTA"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeatmapCustom;