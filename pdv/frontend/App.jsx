import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { ShoppingCart, Package, Users, BarChart3, CreditCard, Trash2, Plus, Minus, Percent, X } from 'lucide-react'
import Relatorios from './components/Relatorios.jsx'
import DescontoModal from './components/DescontoModal.jsx'
import CancelamentoModal from './components/CancelamentoModal.jsx'
import './App.css'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('vendas')
  const [produtos, setProdutos] = useState([])
  const [vendaAtual, setVendaAtual] = useState(null)
  const [itensVenda, setItensVenda] = useState([])
  const [loginData, setLoginData] = useState({ nome_usuario: '', senha: '' })
  const [showDescontoModal, setShowDescontoModal] = useState(false)
  const [showCancelamentoModal, setShowCancelamentoModal] = useState(false)

  // Função para fazer login
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        setCurrentUser(data.user)
        carregarProdutos()
      } else {
        const error = await response.json()
        alert(error.message)
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      alert('Erro ao conectar com o servidor. Tente novamente.')
    }
  }

  // Função para carregar produtos
  const carregarProdutos = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://127.0.0.1:5000/api/produtos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProdutos(data)
      } else {
        const error = await response.json()
        alert(error.message)
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  // Função para adicionar produto à venda
  const adicionarProdutoVenda = async (produto) => {
    try {
      const token = localStorage.getItem('token')
      let currentVendaId = vendaAtual?.id

      // Se não houver venda atual, cria uma nova
      if (!currentVendaId) {
        const createVendaResponse = await fetch('http://127.0.0.1:5000/api/vendas', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (!createVendaResponse.ok) {
          const error = await createVendaResponse.json()
          alert(error.message)
          return
        }
        const newVenda = await createVendaResponse.json()
        setVendaAtual(newVenda)
        currentVendaId = newVenda.id
      }

      // Adiciona o item à venda
      const addItemResponse = await fetch(`http://127.0.0.1:5000/api/vendas/${currentVendaId}/itens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ produto_id: produto.id, quantidade: 1 }),
      })

      if (addItemResponse.ok) {
        const updatedVenda = await addItemResponse.json()
        setVendaAtual(updatedVenda)
        setItensVenda(updatedVenda.itens)
        carregarProdutos() // Atualiza o estoque na lista de produtos
      } else {
        const error = await addItemResponse.json()
        alert(error.message)
      }
    } catch (error) {
      console.error('Erro ao adicionar produto à venda:', error)
      alert('Erro ao adicionar produto à venda.')
    }
  }

  // Função para processar pagamento
  const processarPagamento = async (metodo) => {
    if (!vendaAtual || itensVenda.length === 0) {
      alert('Adicione itens à venda antes de processar o pagamento.')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://127.0.0.1:5000/api/vendas/${vendaAtual.id}/pagamento`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metodo: metodo, valor: vendaAtual.total_liquido }),
      })

      if (response.ok) {
        alert('Pagamento processado com sucesso!')
        setVendaAtual(null)
        setItensVenda([])
        carregarProdutos() // Recarregar produtos para atualizar estoque
      } else {
        const error = await response.json()
        alert(error.message)
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
    }
  }

  // Função para lidar com desconto aplicado
  const handleDescontoAplicado = (data) => {
    alert(data.message)
    // Recarregar dados da venda
    if (vendaAtual) {
      setVendaAtual(prev => ({
        ...prev,
        desconto_aplicado: data.valor_desconto,
        total_liquido: data.total_liquido
      }))
    }
  }

  // Função para lidar com venda cancelada
  const handleVendaCancelada = (data) => {
    alert(data.message)
    setVendaAtual(null)
    setItensVenda([])
    carregarProdutos() // Recarregar produtos para atualizar estoque
  }

  // Função para logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    setCurrentUser(null)
    setVendaAtual(null)
    setItensVenda([])
  }

  // Verificar se há token salvo ao carregar a página
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Em um app real, você validaria o token no backend
      // Por simplicidade, aqui apenas assumimos que é válido
      // e tentamos carregar o usuário e produtos
      const fetchUserAndProducts = async () => {
        try {
          const userResponse = await fetch('http://127.0.0.1:5000/api/user_info', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (userResponse.ok) {
            const userData = await userResponse.json()
            setCurrentUser(userData)
            carregarProdutos()
          } else {
            localStorage.removeItem('token')
          }
        } catch (error) {
          console.error('Erro ao carregar informações do usuário:', error)
          localStorage.removeItem('token')
        }
      }
      fetchUserAndProducts()
    }
  }, [])

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md p-6 space-y-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Sistema PDV</CardTitle>
            <CardDescription>Faça login para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_usuario">Usuário</Label>
                <Input
                  id="nome_usuario"
                  placeholder="Digite seu usuário"
                  value={loginData.nome_usuario}
                  onChange={(e) => setLoginData({ ...loginData, nome_usuario: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Digite sua senha"
                  value={loginData.senha}
                  onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>Usuários de teste:</p>
              <p>admin / admin123 (Gerente)</p>
              <p>caixa / caixa123 (Caixa)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold">Sistema PDV</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {currentUser.nivel_acesso} - {currentUser.nome_completo}
          </span>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Sair
          </Button>
        </div>
      </header>

      {/* Navegação Principal */}
      <nav className="flex justify-center bg-gray-100 p-2 shadow-inner">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'vendas' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('vendas')}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Vendas
          </Button>
          <Button
            variant={activeTab === 'produtos' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('produtos')}
          >
            <Package className="h-4 w-4 mr-2" />
            Produtos
          </Button>
          <Button
            variant={activeTab === 'usuarios' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('usuarios')}
          >
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </Button>
          <Button
            variant={activeTab === 'relatorios' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('relatorios')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6">
        {activeTab === 'vendas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Produtos */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Produtos Disponíveis</CardTitle>
                <CardDescription>Clique em um produto para adicionar à venda</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                {produtos.map((produto) => (
                  <Card
                    key={produto.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => adicionarProdutoVenda(produto)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg">{produto.nome}</h3>
                      <p className="text-gray-600">R$ {produto.preco.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">SKU: {produto.sku}</p>
                      <Badge
                        variant={produto.estoque_atual > 0 ? 'default' : 'destructive'}
                        className="mt-2"
                      >
                        Estoque: {produto.estoque_atual}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Carrinho de Vendas */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Venda Atual</CardTitle>
                <CardDescription>
                  {vendaAtual ? `ID da Venda: ${vendaAtual.id}` : 'Nenhum item adicionado'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {itensVenda.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                    <ShoppingCart className="h-16 w-16 mb-4" />
                    <p>Clique em um produto para começar</p>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {itensVenda.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.nome_produto}</p>
                            <p className="text-sm text-gray-500">
                              {item.quantidade} x R$ {item.preco_unitario.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-semibold">R$ {item.subtotal.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="flex justify-between font-medium">
                        <span>Subtotal:</span>
                        <span>R$ {vendaAtual?.total_bruto?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between font-medium text-red-600">
                        <span>Desconto:</span>
                        <span>- R$ {vendaAtual?.desconto_aplicado?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-xl">
                        <span>Total:</span>
                        <span>R$ {vendaAtual?.total_liquido?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4">
                      {/* Botões de Ação */}
                      <div className="flex space-x-2 mb-3">
                        {currentUser.nivel_acesso === 'GERENTE' && (
                          <Button
                            onClick={() => setShowDescontoModal(true)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Percent className="h-4 w-4 mr-1" />
                            Desconto
                          </Button>
                        )}
                        <Button
                          onClick={() => setShowCancelamentoModal(true)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>

                      {/* Botões de Pagamento */}
                      <Button
                        onClick={() => processarPagamento('DINHEIRO')}
                        className="w-full"
                        variant="default"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar em Dinheiro
                      </Button>
                      <Button
                        onClick={() => processarPagamento('CARTAO')}
                        className="w-full"
                        variant="outline"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar no Cartão
                      </Button>
                      <Button
                        onClick={() => processarPagamento('PIX')}
                        className="w-full"
                        variant="outline"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar via PIX
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'produtos' && (
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Produtos</CardTitle>
              <CardDescription>Visualize e gerencie o estoque de produtos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estoque
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {produtos.map((produto) => (
                      <tr key={produto.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {produto.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {produto.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {produto.preco.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {produto.estoque_atual}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Badge variant={produto.estoque_atual > 10 ? 'default' : produto.estoque_atual > 0 ? 'secondary' : 'destructive'}>
                            {produto.estoque_atual > 10 ? 'Em Estoque' : produto.estoque_atual > 0 ? 'Baixo Estoque' : 'Esgotado'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'usuarios' && (
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>Visualize e gerencie os usuários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'relatorios' && <Relatorios />}
      </main>

      {/* Modais */}
      <DescontoModal
        isOpen={showDescontoModal}
        onClose={() => setShowDescontoModal(false)}
        vendaId={vendaAtual?.id}
        onDescontoAplicado={handleDescontoAplicado}
      />

      <CancelamentoModal
        isOpen={showCancelamentoModal}
        onClose={() => setShowCancelamentoModal(false)}
        vendaId={vendaAtual?.id}
        vendaStatus={vendaAtual?.status}
        onVendaCancelada={handleVendaCancelada}
      />
    </div>
  )
}

export default App
