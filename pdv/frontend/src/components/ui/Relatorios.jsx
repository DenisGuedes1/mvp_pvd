import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function Relatorios() {
  const [vendasPorDia, setVendasPorDia] = useState([])
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([])

  useEffect(() => {
    const fetchRelatorios = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        // Fetch Vendas por Dia
        const vendasResponse = await fetch('http://127.0.0.1:5000/api/relatorios/vendas', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (vendasResponse.ok) {
          const data = await vendasResponse.json()
          setVendasPorDia(data.map(item => ({ ...item, total: parseFloat(item.total).toFixed(2) })))
        } else {
          console.error('Erro ao carregar vendas por dia:', await vendasResponse.json())
        }

        // Fetch Produtos Mais Vendidos
        const produtosResponse = await fetch('http://127.0.0.1:5000/api/relatorios/produtos-mais-vendidos', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (produtosResponse.ok) {
          const data = await produtosResponse.json()
          setProdutosMaisVendidos(data)
        } else {
          console.error('Erro ao carregar produtos mais vendidos:', await produtosResponse.json())
        }

      } catch (error) {
        console.error('Erro ao buscar dados de relatórios:', error)
      }
    }

    fetchRelatorios()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios de Vendas</CardTitle>
          <CardDescription>Visão geral das vendas e produtos mais vendidos.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Vendas por Dia */}
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Dia (Últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#8884d8" name="Total Vendas (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Produtos Mais Vendidos */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={produtosMaisVendidos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_vendido" fill="#82ca9d" name="Quantidade Vendida" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

export default Relatorios
