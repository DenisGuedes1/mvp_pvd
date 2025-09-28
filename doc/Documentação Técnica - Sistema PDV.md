# Documentação Técnica - Sistema PDV

Este documento fornece informações técnicas detalhadas sobre a arquitetura, implementação e funcionamento do Sistema PDV desenvolvido.

## Arquitetura do Sistema

O sistema foi desenvolvido seguindo uma arquitetura de **separação de responsabilidades** com backend e frontend independentes, comunicando-se através de uma API RESTful.

### Componentes Principais

**Backend (Flask)**
- **Framework:** Flask com extensões para JWT, CORS e SQLAlchemy
- **Banco de Dados:** SQLite (configurável para PostgreSQL)
- **Autenticação:** JWT (JSON Web Tokens) com expiração configurável
- **API:** RESTful com endpoints organizados por funcionalidade

**Frontend (React)**
- **Framework:** React 18 com hooks modernos
- **Estilização:** Tailwind CSS com componentes shadcn/ui
- **Gráficos:** Recharts para visualizações de dados
- **Estado:** Context API do React para gerenciamento de estado

## Estrutura do Banco de Dados

### Tabelas Principais

**Produtos**
- Armazena informações dos produtos (nome, SKU, preço, estoque)
- Relacionamento 1:N com MovimentacoesEstoque e ItensVenda

**Usuarios**
- Sistema de autenticação com níveis de acesso (CAIXA, GERENTE)
- Senhas armazenadas com hash seguro usando Werkzeug

**Vendas**
- Estados controlados por enum (OPEN, PAID, CANCELLED)
- Cálculo automático de totais com desconto aplicado

**ItensVenda**
- Detalhamento dos produtos em cada venda
- Preço unitário capturado no momento da venda

**MovimentacoesEstoque**
- Histórico completo de todas as alterações de estoque
- Tipos: ENTRADA, SAIDA, CANCELAMENTO_VENDA, AJUSTE

### Relacionamentos

```
Usuario 1:N Venda (usuario_caixa_id)
Venda 1:N ItemVenda (venda_id)
Produto 1:N ItemVenda (produto_id)
Produto 1:N MovimentacaoEstoque (produto_id)
Venda 1:N MovimentacaoEstoque (referencia_venda_id)
Usuario 1:N Desconto (autorizado_por)
Usuario 1:N Cancelamento (cancelado_por)
```

## API Endpoints

### Autenticação
- `POST /api/login` - Autenticação de usuário
- Headers: `Content-Type: application/json`
- Body: `{"nome_usuario": "string", "senha": "string"}`
- Response: `{"access_token": "jwt_token", "usuario": {...}}`

### Produtos
- `GET /api/produtos` - Listar todos os produtos
- `POST /api/produtos` - Criar novo produto (requer autenticação)
- `PUT /api/produtos/{id}` - Atualizar produto (requer autenticação)

### Vendas
- `POST /api/vendas` - Criar nova venda
- `GET /api/vendas/{id}` - Obter detalhes da venda
- `POST /api/vendas/{id}/itens` - Adicionar item à venda
- `POST /api/vendas/{id}/pagamento` - Processar pagamento
- `POST /api/vendas/{id}/desconto` - Aplicar desconto (apenas gerente)
- `POST /api/vendas/{id}/cancelar` - Cancelar venda

### Relatórios
- `GET /api/relatorios/vendas` - Vendas dos últimos 30 dias
- `GET /api/relatorios/produtos-mais-vendidos` - Top 10 produtos

## Regras de Negócio Implementadas

### Controle de Estoque

**Regra 1: Estoque só é decrementado após pagamento**
```python
# Em routes.py - processar_pagamento()
if venda.status != StatusVenda.OPEN:
    return jsonify({'message': 'Venda não está aberta para pagamento'}), 400

# Verificar estoque antes de finalizar
for item in venda.itens:
    if item.produto.estoque_atual < item.quantidade:
        return jsonify({'message': f'Estoque insuficiente para {item.produto.nome}'}), 400

# Só após validação, decrementar estoque
venda.status = StatusVenda.PAID
for item in venda.itens:
    item.produto.estoque_atual -= item.quantidade
```

**Regra 2: Cancelamento repõe estoque se venda estava paga**
```python
# Em routes.py - cancelar_venda()
if venda.status == StatusVenda.PAID:
    for item in venda.itens:
        item.produto.estoque_atual += item.quantidade
        # Registrar movimentação
        movimentacao = MovimentacaoEstoque(...)
```

### Sistema de Permissões

**Controle de Acesso por Nível**
```python
# Verificação de permissão para desconto
if usuario.nivel_acesso != NivelAcesso.GERENTE:
    return jsonify({'message': 'Apenas gerentes podem aplicar descontos'}), 403
```

**Autenticação JWT**
```python
@jwt_required()
def protected_route():
    usuario_id = get_jwt_identity()
    # Lógica da rota protegida
```

### Estados da Venda

**Transições Válidas**
- OPEN → PAID (após pagamento bem-sucedido)
- OPEN → CANCELLED (cancelamento simples)
- PAID → CANCELLED (cancelamento com estorno)

**Validações de Estado**
```python
# Desconto só em venda aberta
if venda.status != StatusVenda.OPEN:
    return jsonify({'message': 'Desconto só pode ser aplicado em vendas abertas'}), 400

# Cancelamento de venda paga requer gerente
if venda.status == StatusVenda.PAID and usuario.nivel_acesso != NivelAcesso.GERENTE:
    return jsonify({'message': 'Apenas gerentes podem cancelar vendas pagas'}), 403
```

## Componentes Frontend

### Estrutura de Componentes

**App.jsx** - Componente principal com:
- Gerenciamento de estado global
- Roteamento por abas
- Autenticação e logout
- Integração com API

**Relatorios.jsx** - Dashboard de relatórios:
- Gráficos interativos com Recharts
- Métricas de desempenho
- Tabelas de ranking

**DescontoModal.jsx** - Modal para aplicação de desconto:
- Formulário com validação
- Tipos: fixo ou percentual
- Integração com API de desconto

**CancelamentoModal.jsx** - Modal para cancelamento:
- Confirmação com motivo
- Alertas para vendas pagas
- Tratamento de permissões

### Gerenciamento de Estado

**Estados Principais**
```javascript
const [currentUser, setCurrentUser] = useState(null)
const [vendaAtual, setVendaAtual] = useState(null)
const [itensVenda, setItensVenda] = useState([])
const [produtos, setProdutos] = useState([])
```

**Fluxo de Dados**
1. Login → armazena token no localStorage
2. Carregamento de produtos → estado produtos
3. Criação de venda → estado vendaAtual
4. Adição de itens → estado itensVenda
5. Pagamento → reset dos estados

### Integração com API

**Configuração de Requisições**
```javascript
const token = localStorage.getItem('token')
const response = await fetch('http://localhost:5000/api/endpoint', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
```

**Tratamento de Erros**
```javascript
if (response.ok) {
  const data = await response.json()
  // Sucesso
} else {
  const error = await response.json()
  alert(error.message)
}
```

## Segurança

### Autenticação e Autorização

**JWT Configuration**
```python
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-string'
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
```

**Hash de Senhas**
```python
def set_password(self, password):
    self.senha_hash = generate_password_hash(password)

def check_password(self, password):
    return check_password_hash(self.senha_hash, password)
```

### CORS Configuration

```python
CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173'])
```

### Validação de Dados

**Backend Validation**
- Verificação de tipos de dados
- Validação de valores mínimos/máximos
- Sanitização de entrada

**Frontend Validation**
- Campos obrigatórios
- Tipos de input apropriados
- Feedback visual de erros

## Performance e Otimizações

### Backend
- Uso de índices no banco de dados
- Lazy loading nos relacionamentos SQLAlchemy
- Paginação em endpoints que retornam listas

### Frontend
- Componentes funcionais com hooks
- Lazy loading de componentes pesados
- Otimização de re-renders com useCallback/useMemo

## Monitoramento e Logs

### Auditoria
- Tabela LogsAuditoria para operações críticas
- Registro de usuário, ação e timestamp
- Detalhes das operações para rastreabilidade

### Logs de Sistema
- Flask debug mode para desenvolvimento
- Logs de erros e exceções
- Histórico de movimentações de estoque

## Deployment

### Desenvolvimento
```bash
# Backend
cd backend && python3 run.py

# Frontend
cd frontend && pnpm run dev --host
```

### Produção
- Configurar variáveis de ambiente
- Usar servidor WSGI (Gunicorn) para Flask
- Build do React para arquivos estáticos
- Configurar proxy reverso (Nginx)

## Extensibilidade

### Adição de Novas Funcionalidades

**Novos Endpoints**
1. Adicionar rota em `routes.py`
2. Implementar validações e lógica de negócio
3. Atualizar documentação da API

**Novos Componentes Frontend**
1. Criar componente em `src/components/`
2. Integrar com API existente
3. Adicionar à navegação principal

### Modificações no Banco
1. Atualizar modelos em `models.py`
2. Criar migration (se usando Flask-Migrate)
3. Atualizar endpoints relacionados

## Testes

### Estrutura de Testes Recomendada

**Backend**
- Testes unitários para modelos
- Testes de integração para endpoints
- Testes de validação de regras de negócio

**Frontend**
- Testes de componentes com React Testing Library
- Testes de integração com API
- Testes E2E com Cypress

### Exemplo de Teste
```python
def test_criar_venda():
    with app.test_client() as client:
        response = client.post('/api/vendas', 
                             headers={'Authorization': f'Bearer {token}'})
        assert response.status_code == 201
```

---

**Autor:** Manus AI  
**Data:** 27 de setembro de 2025  
**Versão:** 1.0.0
