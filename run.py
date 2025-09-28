import os
from app import create_app, db
from app.models import Usuario, Produto, NivelAcesso, Venda, ItemVenda, Pagamento, Desconto, Cancelamento, MovimentacaoEstoque

app = create_app()

with app.app_context():
    db.create_all()
    
    # Criar usuários padrão se não existirem
    if not Usuario.query.first():
        print("Criando usuários padrão...")
        admin = Usuario(nome_usuario='admin', nivel_acesso=NivelAcesso.GERENTE, nome_completo='Administrador')
        admin.set_password('admin123')
        
        caixa = Usuario(nome_usuario='caixa', nivel_acesso=NivelAcesso.CAIXA, nome_completo='Operador de Caixa')
        caixa.set_password('caixa123')
        
        db.session.add(admin)
        db.session.add(caixa)
        db.session.commit()
        print("✅ Usuários padrão criados!")

    # Criar produtos de exemplo se não existirem
    if not Produto.query.first():
        print("Criando produtos de exemplo...")
        produtos = [
            Produto(nome='Coca-Cola 350ml', sku='COCA350', preco=4.50, estoque_atual=100),
            Produto(nome='Pão Francês', sku='PAO001', preco=0.75, estoque_atual=50),
            Produto(nome='Leite Integral 1L', sku='LEITE1L', preco=5.20, estoque_atual=30),
            Produto(nome='Água Mineral 500ml', sku='AGUA500', preco=2.00, estoque_atual=200),
            Produto(nome='Chocolate Barra', sku='CHOC001', preco=3.50, estoque_atual=80)
        ]
        
        for produto in produtos:
            db.session.add(produto)
        db.session.commit()
        print("✅ Produtos de exemplo criados!")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


