import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Wind, AlertTriangle, CheckCircle, TrendingUp, Calendar } from 'lucide-react'
import './App.css'
import dashboardData from './assets/dashboard_data.json'

const COLORS = {
  baixa: '#22c55e',
  media: '#f59e0b', 
  alta: '#ef4444',
  primary: '#3b82f6'
}

function App() {
  const [data, setData] = useState(null)

  useEffect(() => {
    setData(dashboardData)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const oxidacaoData = data.ciclos.map(ciclo => ({
    ciclo: ciclo.Ciclo.replace(' Ciclo', ''),
    'Oxidação Baixa': ciclo['Oxidação Baixa'],
    'Oxidação Média': ciclo['Oxidação Média'],
    'Oxidação Alta': ciclo['Oxidação Alta']
  }))

  const imasData = data.ciclos.map(ciclo => ({
    ciclo: ciclo.Ciclo.replace(' Ciclo', ''),
    imas: ciclo['Imãs Trocados']
  }))

  const anosData = data.anos.map(ano => ({
    ano: ano.Ano.toString(),
    imas: ano['Qtd. Imas trocados']
  }))

  const totalOxidacao = data.ciclos.reduce((acc, ciclo) => 
    acc + ciclo['Oxidação Baixa'] + ciclo['Oxidação Média'] + ciclo['Oxidação Alta'], 0
  )

  const pieData = [
    { name: 'Oxidação Baixa', value: data.ciclos.reduce((acc, c) => acc + c['Oxidação Baixa'], 0), color: COLORS.baixa },
    { name: 'Oxidação Média', value: data.ciclos.reduce((acc, c) => acc + c['Oxidação Média'], 0), color: COLORS.media },
    { name: 'Oxidação Alta', value: data.ciclos.reduce((acc, c) => acc + c['Oxidação Alta'], 0), color: COLORS.alta }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Wind className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Dashboard - Análise de Ímãs Eólicos</h1>
          </div>
          <p className="text-lg text-gray-600">Complexo Eólico com 47 Turbinas - Período {data.resumo.periodo_analise}</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Turbinas</CardTitle>
              <Wind className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.resumo.total_turbinas}</div>
              <p className="text-xs text-muted-foreground">Complexo eólico</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ímãs Trocados</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.resumo.total_imas_trocados}</div>
              <p className="text-xs text-muted-foreground">Período completo</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Oxidações</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalOxidacao}</div>
              <p className="text-xs text-muted-foreground">Todas as inspeções</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Máquinas Paradas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0</div>
              <p className="text-xs text-muted-foreground">Todas operacionais</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Ímãs Trocados por Ciclo */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Ímãs Trocados por Ciclo de Inspeção</CardTitle>
              <CardDescription>Quantidade de ímãs substituídos em cada ciclo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={imasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ciclo" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="imas" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Oxidação por Ciclo */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Oxidação por Ciclo de Inspeção</CardTitle>
              <CardDescription>Classificação dos níveis de oxidação encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={oxidacaoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ciclo" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Oxidação Baixa" stackId="a" fill={COLORS.baixa} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Oxidação Média" stackId="a" fill={COLORS.media} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Oxidação Alta" stackId="a" fill={COLORS.alta} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Ímãs por Ano */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Ímãs Trocados por Ano</CardTitle>
              <CardDescription>Evolução temporal das trocas de ímãs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={anosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ano" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="imas" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Distribuição de Oxidação */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Distribuição de Oxidação</CardTitle>
              <CardDescription>Proporção dos tipos de oxidação encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Resumo Detalhado por Inspeção</CardTitle>
            <CardDescription>Dados consolidados de todas as inspeções realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Inspeção</th>
                    <th className="text-center p-4 font-semibold">Máquinas Paradas</th>
                    <th className="text-center p-4 font-semibold">Ímãs Trocados</th>
                    <th className="text-center p-4 font-semibold">Oxidação Baixa</th>
                    <th className="text-center p-4 font-semibold">Oxidação Média</th>
                    <th className="text-center p-4 font-semibold">Oxidação Alta</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ciclos.map((ciclo, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{ciclo.Ciclo}</td>
                      <td className="text-center p-4">
                        <Badge variant={ciclo['Máquinas Paradas'] === 0 ? 'default' : 'destructive'}>
                          {ciclo['Máquinas Paradas']}
                        </Badge>
                      </td>
                      <td className="text-center p-4 font-semibold text-blue-600">{ciclo['Imãs Trocados']}</td>
                      <td className="text-center p-4">
                        <Badge style={{ backgroundColor: COLORS.baixa, color: 'white' }}>
                          {ciclo['Oxidação Baixa']}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge style={{ backgroundColor: COLORS.media, color: 'white' }}>
                          {ciclo['Oxidação Média']}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge style={{ backgroundColor: COLORS.alta, color: 'white' }}>
                          {ciclo['Oxidação Alta']}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Dashboard gerado automaticamente • Dados atualizados em {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  )
}

export default App
