from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func

from app.models import db, Usuario, Produto, Venda, ItemVenda, Pagamento, Desconto, Cancelamento, MovimentacaoEstoque, NivelAcesso, StatusVenda, TipoMovimentacao, TipoPagamento, TipoDesconto

main = Blueprint("main", __name__)

@main.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"message": "API PDV funcionando", "status": "OK"}), 200

@main.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    nome_usuario = data.get("nome_usuario", None)
    senha = data.get("senha", None)

    usuario = Usuario.query.filter_by(nome_usuario=nome_usuario).first()

    if usuario and usuario.check_password(senha):
        access_token = create_access_token(identity=usuario.id)
        return jsonify(access_token=access_token, user=usuario.to_dict()), 200
    return jsonify({"message": "Credenciais inválidas"}), 401

@main.route("/api/produtos", methods=["GET"])
@jwt_required()
def get_produtos():
    produtos = Produto.query.all()
    return jsonify([p.to_dict() for p in produtos]), 200

@main.route("/api/produtos", methods=["POST"])
@jwt_required()
def create_produto():
    data = request.get_json()
    produto = Produto(nome=data["nome"], sku=data["sku"], preco=data["preco"], estoque_atual=data["estoque_atual"])
    db.session.add(produto)
    db.session.commit()
    return jsonify(produto.to_dict()), 201

@main.route("/api/vendas", methods=["POST"])
@jwt_required()
def create_venda():
    usuario_id = get_jwt_identity()
    venda = Venda(usuario_caixa_id=usuario_id)
    db.session.add(venda)
    db.session.commit()
    return jsonify(venda.to_dict()), 201

@main.route("/api/vendas/<int:venda_id>", methods=["GET"])
@jwt_required()
def get_venda(venda_id):
    venda = Venda.query.get_or_404(venda_id)
    return jsonify(venda.to_dict()), 200

@main.route("/api/vendas/<int:venda_id>/itens", methods=["POST"])
@jwt_required()
def add_item_venda(venda_id):
    venda = Venda.query.get_or_404(venda_id)
    data = request.get_json()
    produto_id = data["produto_id"]
    quantidade = data["quantidade"]

    produto = Produto.query.get_or_404(produto_id)

    if produto.estoque_atual < quantidade:
        return jsonify({"message": f"Estoque insuficiente para {produto.nome}. Disponível: {produto.estoque_atual}"}), 400

    item_venda = ItemVenda(
        venda_id=venda.id,
        produto_id=produto.id,
        quantidade=quantidade,
        preco_unitario=produto.preco,
        subtotal=quantidade * produto.preco
    )
    db.session.add(item_venda)
    venda.calcular_totais()
    db.session.commit()
    return jsonify(venda.to_dict()), 201

@main.route("/api/vendas/<int:venda_id>/pagamento", methods=["POST"])
@jwt_required()
def processar_pagamento(venda_id):
    venda = Venda.query.get_or_404(venda_id)
    data = request.get_json()
    metodo_pagamento = data["metodo"]
    valor_pago = data["valor"]

    if venda.status != StatusVenda.OPEN:
        return jsonify({"message": "Venda não está aberta para pagamento"}), 400

    if valor_pago < venda.total_liquido:
        return jsonify({"message": "Valor pago insuficiente"}), 400

    # Verificar estoque antes de finalizar
    for item in venda.itens:
        if item.produto.estoque_atual < item.quantidade:
            return jsonify({"message": f"Estoque insuficiente para {item.produto.nome}. Disponível: {item.produto.estoque_atual}"}), 400

    # Registrar pagamento
    pagamento = Pagamento(
        venda_id=venda.id,
        valor=valor_pago,
        metodo=TipoPagamento(metodo_pagamento)
    )
    db.session.add(pagamento)

    # Atualizar estoque e status da venda
    venda.status = StatusVenda.PAID
    for item in venda.itens:
        item.produto.estoque_atual -= item.quantidade
        # Registrar movimentação de estoque
        movimentacao = MovimentacaoEstoque(
            produto_id=item.produto_id,
            tipo_movimentacao=TipoMovimentacao.SAIDA,
            quantidade=item.quantidade,
            referencia_venda_id=venda.id,
            observacao=f"Venda #{venda.id}"
        )
        db.session.add(movimentacao)

    db.session.commit()
    return jsonify(venda.to_dict()), 200

# Rotas de Descontos
@main.route("/api/vendas/<int:venda_id>/desconto", methods=["POST"])
@jwt_required()
def aplicar_desconto(venda_id):
    venda = Venda.query.get_or_404(venda_id)

    if venda.status != StatusVenda.OPEN:
        return jsonify({"message": "Desconto só pode ser aplicado em vendas abertas"}), 400

    data = request.get_json()
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)

    # Verificar se o usuário tem permissão para aplicar desconto
    if usuario.nivel_acesso != NivelAcesso.GERENTE:
        return jsonify({"message": "Apenas gerentes podem aplicar descontos"}), 403

    # Calcular valor do desconto
    valor_desconto = data["valor"]
    if data["tipo"] == "PERCENTUAL":
        valor_desconto = (venda.total_bruto * data["valor"]) / 100

    # Criar registro de desconto
    desconto = Desconto(
        venda_id=venda_id,
        valor=valor_desconto,
        tipo=TipoDesconto(data["tipo"]),
        autorizado_por=usuario_id,
        motivo=data["motivo"]
    )

    db.session.add(desconto)

    # Atualizar venda
    venda.desconto_aplicado = valor_desconto
    venda.calcular_totais()

    db.session.commit()

    return jsonify({
        "message": "Desconto aplicado com sucesso",
        "desconto_id": desconto.id,
        "valor_desconto": float(valor_desconto),
        "total_liquido": float(venda.total_liquido)
    }), 200

# Rotas de Cancelamento
@main.route("/api/vendas/<int:venda_id>/cancelar", methods=["POST"])
@jwt_required()
def cancelar_venda(venda_id):
    venda = Venda.query.get_or_404(venda_id)
    data = request.get_json()
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)

    # Verificar permissões
    if venda.status == StatusVenda.PAID and usuario.nivel_acesso != NivelAcesso.GERENTE:
        return jsonify({"message": "Apenas gerentes podem cancelar vendas pagas"}), 403

    if venda.status == StatusVenda.CANCELLED:
        return jsonify({"message": "Venda já foi cancelada"}), 400

    # Criar registro de cancelamento
    cancelamento = Cancelamento(
        venda_id=venda_id,
        cancelado_por=usuario_id,
        motivo=data["motivo"]
    )

    # Se a venda estava paga, repor estoque
    if venda.status == StatusVenda.PAID:
        for item in venda.itens:
            item.produto.estoque_atual += item.quantidade

            # Registrar movimentação de estoque
            movimentacao = MovimentacaoEstoque(
                produto_id=item.produto.id,
                tipo_movimentacao=TipoMovimentacao.CANCELAMENTO_VENDA,
                quantidade=item.quantidade,
                referencia_venda_id=venda_id,
                observacao=f"Cancelamento da venda #{venda_id}"
            )
            db.session.add(movimentacao)

        cancelamento.estoque_reposto = True
        cancelamento.estorno_realizado = True

    # Atualizar status da venda
    venda.status = StatusVenda.CANCELLED

    db.session.add(cancelamento)
    db.session.commit()

    return jsonify({
        "message": "Venda cancelada com sucesso",
        "cancelamento_id": cancelamento.id
    }), 200

# Rota para relatórios básicos
@main.route("/api/relatorios/vendas", methods=["GET"])
@jwt_required()
def relatorio_vendas():
    data_inicio = datetime.now() - timedelta(days=30)

    vendas = db.session.query(
        func.date(Venda.data_hora).label("data"),
        func.count(Venda.id).label("quantidade"),
        func.sum(Venda.total_liquido).label("total")
    ).filter(
        Venda.data_hora >= data_inicio,
        Venda.status == StatusVenda.PAID
    ).group_by(func.date(Venda.data_hora)).all()

    return jsonify([{
        "data": venda.data.isoformat(),
        "quantidade": venda.quantidade,
        "total": float(venda.total or 0)
    } for venda in vendas]), 200

@main.route("/api/relatorios/produtos-mais-vendidos", methods=["GET"])
@jwt_required()
def produtos_mais_vendidos():
    produtos = db.session.query(
        Produto.nome,
        func.sum(ItemVenda.quantidade).label("total_vendido")
    ).join(ItemVenda).join(Venda).filter(
        Venda.status == StatusVenda.PAID
    ).group_by(Produto.id, Produto.nome).order_by(
        func.sum(ItemVenda.quantidade).desc()
    ).limit(10).all()

    return jsonify([{
        "nome": produto.nome,
        "total_vendido": int(produto.total_vendido or 0)
    } for produto in produtos]), 200
