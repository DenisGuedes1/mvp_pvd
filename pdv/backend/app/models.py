from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import enum

from . import db # Importar db do __init__.py

class NivelAcesso(enum.Enum):
    CAIXA = "CAIXA"
    GERENTE = "GERENTE"

class StatusVenda(enum.Enum):
    OPEN = "OPEN"
    PAID = "PAID"
    CANCELLED = "CANCELLED"

class TipoMovimentacao(enum.Enum):
    ENTRADA = "ENTRADA"
    SAIDA = "SAIDA"
    CANCELAMENTO_VENDA = "CANCELAMENTO_VENDA"
    AJUSTE = "AJUSTE"

class TipoPagamento(enum.Enum):
    DINHEIRO = "DINHEIRO"
    CARTAO = "CARTAO"
    PIX = "PIX"

class TipoDesconto(enum.Enum):
    FIXO = "FIXO"
    PERCENTUAL = "PERCENTUAL"

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome_usuario = db.Column(db.String(80), unique=True, nullable=False)
    senha_hash = db.Column(db.String(128), nullable=False)
    nivel_acesso = db.Column(db.Enum(NivelAcesso), nullable=False, default=NivelAcesso.CAIXA)
    nome_completo = db.Column(db.String(120), nullable=True)

    # Relacionamentos
    vendas_realizadas = db.relationship("Venda", backref="caixa", lazy=True, foreign_keys="Venda.usuario_caixa_id")
    descontos_autorizados = db.relationship("Desconto", backref="autorizado_por_usuario", lazy=True)
    cancelamentos_registrados = db.relationship("Cancelamento", backref="cancelado_por_usuario", lazy=True)

    def set_password(self, password):
        self.senha_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.senha_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "nome_usuario": self.nome_usuario,
            "nivel_acesso": self.nivel_acesso.value,
            "nome_completo": self.nome_completo
        }

class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    sku = db.Column(db.String(80), unique=True, nullable=False)
    preco = db.Column(db.Float, nullable=False)
    estoque_atual = db.Column(db.Integer, default=0)

    # Relacionamentos
    movimentacoes = db.relationship("MovimentacaoEstoque", backref="produto", lazy=True)
    itens_venda = db.relationship("ItemVenda", backref="produto", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "sku": self.sku,
            "preco": self.preco,
            "estoque_atual": self.estoque_atual
        }

class Venda(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    data_hora = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.Enum(StatusVenda), nullable=False, default=StatusVenda.OPEN)
    total_bruto = db.Column(db.Float, default=0.0)
    desconto_aplicado = db.Column(db.Float, default=0.0)
    total_liquido = db.Column(db.Float, default=0.0)
    usuario_caixa_id = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False)

    # Relacionamentos
    itens = db.relationship("ItemVenda", backref="venda", lazy=True, cascade="all, delete-orphan")
    pagamentos = db.relationship("Pagamento", backref="venda", lazy=True, cascade="all, delete-orphan")
    descontos = db.relationship("Desconto", backref="venda", lazy=True, cascade="all, delete-orphan")
    cancelamento = db.relationship("Cancelamento", backref="venda", lazy=True, uselist=False, cascade="all, delete-orphan")

    def calcular_totais(self):
        self.total_bruto = sum(item.subtotal for item in self.itens)
        self.total_liquido = self.total_bruto - self.desconto_aplicado

    def to_dict(self):
        return {
            "id": self.id,
            "data_hora": self.data_hora.isoformat(),
            "status": self.status.value,
            "total_bruto": self.total_bruto,
            "desconto_aplicado": self.desconto_aplicado,
            "total_liquido": self.total_liquido,
            "usuario_caixa": self.caixa.to_dict() if self.caixa else None,
            "itens": [item.to_dict() for item in self.itens],
            "pagamentos": [pag.to_dict() for pag in self.pagamentos],
            "descontos": [desc.to_dict() for desc in self.descontos],
            "cancelamento": self.cancelamento.to_dict() if self.cancelamento else None
        }

class ItemVenda(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    venda_id = db.Column(db.Integer, db.ForeignKey("venda.id"), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey("produto.id"), nullable=False)
    quantidade = db.Column(db.Integer, nullable=False)
    preco_unitario = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "produto_id": self.produto_id,
            "nome_produto": self.produto.nome,
            "quantidade": self.quantidade,
            "preco_unitario": self.preco_unitario,
            "subtotal": self.subtotal
        }

class Pagamento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    venda_id = db.Column(db.Integer, db.ForeignKey("venda.id"), nullable=False)
    data_hora = db.Column(db.DateTime, default=datetime.utcnow)
    valor = db.Column(db.Float, nullable=False)
    metodo = db.Column(db.Enum(TipoPagamento), nullable=False)
    status = db.Column(db.String(50), default="APROVADO") # Ex: APROVADO, PENDENTE, RECUSADO

    def to_dict(self):
        return {
            "id": self.id,
            "venda_id": self.venda_id,
            "data_hora": self.data_hora.isoformat(),
            "valor": self.valor,
            "metodo": self.metodo.value,
            "status": self.status
        }

class Desconto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    venda_id = db.Column(db.Integer, db.ForeignKey("venda.id"), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    tipo = db.Column(db.Enum(TipoDesconto), nullable=False)
    autorizado_por = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False)
    motivo = db.Column(db.String(255), nullable=True)
    data_hora = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "venda_id": self.venda_id,
            "valor": self.valor,
            "tipo": self.tipo.value,
            "autorizado_por": self.autorizado_por_usuario.nome_usuario if self.autorizado_por_usuario else None,
            "motivo": self.motivo,
            "data_hora": self.data_hora.isoformat()
        }

class Cancelamento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    venda_id = db.Column(db.Integer, db.ForeignKey("venda.id"), unique=True, nullable=False)
    cancelado_por = db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=False)
    motivo = db.Column(db.String(255), nullable=False)
    data_hora = db.Column(db.DateTime, default=datetime.utcnow)
    estoque_reposto = db.Column(db.Boolean, default=False)
    estorno_realizado = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "venda_id": self.venda_id,
            "cancelado_por": self.cancelado_por_usuario.nome_usuario if self.cancelado_por_usuario else None,
            "motivo": self.motivo,
            "data_hora": self.data_hora.isoformat(),
            "estoque_reposto": self.estoque_reposto,
            "estorno_realizado": self.estorno_realizado
        }

class MovimentacaoEstoque(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    produto_id = db.Column(db.Integer, db.ForeignKey("produto.id"), nullable=False)
    tipo_movimentacao = db.Column(db.Enum(TipoMovimentacao), nullable=False)
    quantidade = db.Column(db.Integer, nullable=False)
    data_hora = db.Column(db.DateTime, default=datetime.utcnow)
    referencia_venda_id = db.Column(db.Integer, db.ForeignKey("venda.id"), nullable=True)
    observacao = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "produto_id": self.produto_id,
            "nome_produto": self.produto.nome,
            "tipo_movimentacao": self.tipo_movimentacao.value,
            "quantidade": self.quantidade,
            "data_hora": self.data_hora.isoformat(),
            "referencia_venda_id": self.referencia_venda_id,
            "observacao": self.observacao
        }
