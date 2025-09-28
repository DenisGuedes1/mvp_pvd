# Esquema do Banco de Dados do Sistema PDV (MVP)

Este documento descreve o esquema proposto para o banco de dados do sistema de Ponto de Venda (PDV), baseado nas regras de negócio fornecidas. O objetivo é garantir a integridade dos dados e suportar todas as funcionalidades exigidas.

## 1. Tabela `Produtos`
Armazena informações sobre os produtos disponíveis para venda.

| Campo         | Tipo de Dado | Descrição                                    | Restrições/Observações             |
| :------------ | :----------- | :------------------------------------------- | :--------------------------------- |
| `id`          | INT          | Chave primária, auto-incremento              | PK                                 |
| `nome`        | VARCHAR(255) | Nome do produto                              | NOT NULL, ÚNICO                    |
| `sku`         | VARCHAR(50)  | Código de identificação do produto (SKU)     | NOT NULL, ÚNICO                    |
| `preco`       | DECIMAL(10,2)| Preço unitário de venda                      | NOT NULL, > 0                      |
| `estoque_atual`| INT          | Quantidade atual em estoque                  | NOT NULL, >= 0                     |

## 2. Tabela `MovimentacoesEstoque`
Registra todas as alterações no estoque de produtos.

| Campo         | Tipo de Dado | Descrição                                    | Restrições/Observações             |
| :------------ | :----------- | :------------------------------------------- | :--------------------------------- |
| `id`          | INT          | Chave primária, auto-incremento              | PK                                 |
| `produto_id`  | INT          | ID do produto movimentado                    | FK para `Produtos.id`, NOT NULL    |
| `tipo_movimentacao`| VARCHAR(50) | Tipo da movimentação (ENTRADA, SAIDA, CANCELAMENTO_VENDA, AJUSTE) | NOT NULL                   |
| `quantidade`  | INT          | Quantidade movimentada                       | NOT NULL, != 0                     |
| `data_hora`   | DATETIME     | Data e hora da movimentação                  | NOT NULL, DEFAULT CURRENT_TIMESTAMP|
| `referencia_venda_id`| INT          | ID da venda associada (se houver)            | FK para `Vendas.id`, NULL permitid |
| `observacao`  | TEXT         | Detalhes adicionais sobre a movimentação     | NULL permitid                      |

## 3. Tabela `Vendas`
Armazena informações sobre cada transação de venda.

| Campo         | Tipo de Dado | Descrição                                    | Restrições/Observações             |
| :------------ | :----------- | :------------------------------------------- | :--------------------------------- |
| `id`          | INT          | Chave primária, auto-incremento              | PK                                 |
| `data_hora`   | DATETIME     | Data e hora da abertura da venda             | NOT NULL, DEFAULT CURRENT_TIMESTAMP|
| `status`      | VARCHAR(20)  | Estado da venda (OPEN, PAID, CANCELLED)      | NOT NULL                           |
| `total_bruto` | DECIMAL(10,2)| Soma dos preços dos itens antes do desconto  | NOT NULL, >= 0                     |
| `desconto_aplicado`| DECIMAL(10,2)| Valor total do desconto aplicado             | NOT NULL, >= 0, DEFAULT 0          |
| `total_liquido`| DECIMAL(10,2)| Total final após desconto                    | NOT NULL, >= 0                     |
| `usuario_caixa_id`| INT          | ID do usuário caixa que registrou a venda    | FK para `Usuarios.id`, NOT NULL    |

## 4. Tabela `ItensVenda`
Detalha os produtos incluídos em cada venda.

| Campo         | Tipo de Dado | Descrição                                    | Restrições/Observações             |
| :------------ | :----------- | :------------------------------------------- | :--------------------------------- |
| `id`          | INT          | Chave primária, auto-incremento              | PK                                 |
| `venda_id`    | INT          | ID da venda a que o item pertence            | FK para `Vendas.id`, NOT NULL      |
| `produto_id`  | INT          | ID do produto vendido                        | FK para `Produtos.id`, NOT NULL    |
| `quantidade`  | INT          | Quantidade do produto neste item da venda    | NOT NULL, > 0                      |
| `preco_unitario`| DECIMAL(10,2)| Preço unitário do produto no momento da venda| NOT NULL, > 0                      |
| `subtotal`    | DECIMAL(10,2)| `quantidade` * `preco_unitario`              | NOT NULL, >= 0                     |

## 5. Tabela `Pagamentos`
Registra os pagamentos efetuados para cada venda.

| Campo         | Tipo de Dado | Descrição                                    | Restrições/Observações             |
| :------------ | :----------- | :------------------------------------------- | :--------------------------------- |
| `id`          | INT          | Chave primária, auto-incremento              | PK                                 |
| `venda_id`    | INT          | ID da venda associada                        | FK para `Vendas.id`, NOT NULL      |
| `valor`       | DECIMAL(10,2)| Valor pago                                   | NOT NULL, > 0                      |
| `metodo`      | VARCHAR(50)  | Forma de pagamento (DINHEIRO, CARTAO, PIX)   | NOT NULL                           |
| `data_hora`   | DATETIME     | Data e hora do pagamento                     | NOT NULL, DEFAULT CURRENT_TIMESTAMP|
| `status`      | VARCHAR(20)  | Status do pagamento (APROVADO, REJEITADO)    | NOT NULL                           |
| `transacao_id`| VARCHAR(255) | ID da transação externa (se houver)          | NULL permitid                      |

## 6. Tabela `Descontos`
Registra os descontos aplicados nas vendas.

| Campo         | Tipo de Dado | Descrição                                    | Restrições/Observações             |
| :------------ | :----------- | :------------------------------------------- | :--------------------------------- |
| `id`          | INT          | Chave primária, auto-incremento              | PK                                 |
| `venda_id`    | INT          | ID da venda onde o desconto foi aplicado     | FK para `Vendas.id`, NOT NULL      |
| `valor`       | DECIMAL(10,2)| Valor do desconto aplicado                   | NOT NULL, > 0                      |
| `tipo`        | VARCHAR(20)  | Tipo de desconto (FIXO, PERCENTUAL)          | NOT NULL                           |
| `autorizado_por`| INT          | ID do usuário gerente que autorizou          | FK para `Usuarios.id`, NOT NULL    |
| `motivo`      | TEXT         | Motivo do desconto                           | NOT NULL                           |
| `data_hora`   | DATETIME     | Data e hora da aplicação do desconto         | NOT NULL, DEFAULT CURRENT_TIMESTAMP|

## 7. Tabela `Cancelamentos`
Registra os cancelamentos de vendas.

| Campo         | Tipo de Dado | Descrição                                    | Restrições/Observações             |
| :------------ | :----------- | :------------------------------------------- | :--------------------------------- |
| `id`          | INT          | Chave primária, auto-incremento              | PK                                 |
| `venda_id`    | INT          | ID da venda cancelada                        | FK para `Vendas.id`, NOT NULL      |
| `cancelado_por`| INT          | ID do usuário que realizou o cancelamento    | FK para `Usuarios.id`, NOT NULL    |
| `motivo`      | TEXT         | Motivo do cancelamento                       | NOT NULL                           |
| `data_hora`   | DATETIME     | Data e hora do cancelamento                  | NOT NULL, DEFAULT CURRENT_TIMESTAMP|
| `estorno_realizado`| BOOLEAN      | Indica se houve estorno de pagamento         | NOT NULL, DEFAULT FALSE            |
| `estoque_reposto`| BOOLEAN      | Indica se o estoque foi reposto              | NOT NULL, DEFAULT FALSE            |

## 8. Tabela `Usuarios`
Armazena informações sobre os usuários do sistema.

| Campo         | Tipo de Dado | Descrição                                    | Restrições/Observações             |
| :------------ | :----------- | :------------------------------------------- | :--------------------------------- |
| `id`          | INT          | Chave primária, auto-incremento              | PK                                 |
| `nome_usuario`| VARCHAR(50)  | Nome de usuário para login                   | NOT NULL, ÚNICO                    |
| `senha_hash`  | VARCHAR(255) | Hash da senha do usuário                     | NOT NULL                           |
| `nivel_acesso`| VARCHAR(20)  | Nível de acesso (CAIXA, GERENTE)             | NOT NULL                           |
| `nome_completo`| VARCHAR(255) | Nome completo do usuário                     | NULL permitid                      |

## 9. Tabela `LogsAuditoria`
Registra todas as operações sensíveis e importantes para auditoria.

| Campo         | Tipo de Dado | Descrição                                    | Restrições/Observações             |
| :------------ | :----------- | :------------------------------------------- | :--------------------------------- |
| `id`          | INT          | Chave primária, auto-incremento              | PK                                 |
| `usuario_id`  | INT          | ID do usuário que realizou a ação            | FK para `Usuarios.id`, NOT NULL    |
| `acao`        | VARCHAR(255) | Descrição da ação realizada                  | NOT NULL                           |
| `entidade_afetada`| VARCHAR(50) | Tabela ou entidade afetada (e.g., VENDAS, ESTOQUE) | NOT NULL                   |
| `entidade_id` | INT          | ID da entidade afetada                       | NULL permitid                      |
| `data_hora`   | DATETIME     | Data e hora da ação                          | NOT NULL, DEFAULT CURRENT_TIMESTAMP|
| `detalhes`    | TEXT         | Detalhes adicionais da ação                  | NULL permitid                      |

