# Guia Rápido: Como Rodar o Projeto PDV

Este guia fornece os comandos essenciais para colocar o projeto PDV (Ponto de Venda) em funcionamento. O projeto é dividido em duas partes: **Backend (Flask)** e **Frontend (React com Vite)**.

---

## 1. Estrutura do Projeto

O projeto está organizado da seguinte forma:

```
pdv/
├── backend/        # Contém a API Flask
│   ├── app/        # Módulos da aplicação Flask (models, routes, config)
│   ├── run.py      # Ponto de entrada da aplicação Flask
│   └── requirements.txt # Dependências do Python
└── frontend/       # Contém a aplicação React
    ├── src/
    │   └── components/ # Componentes React
    ├── package.json  # Dependências do Node.js
    └── ... (outros arquivos do frontend)
```

---

## 2. Pré-requisitos

Certifique-se de ter instalado em sua máquina:

*   **Python 3.x**
*   **pip** (gerenciador de pacotes do Python)
*   **Node.js** (versão LTS recomendada)
*   **npm** (gerenciador de pacotes do Node.js, geralmente vem com o Node.js)

---

## 3. Rodando o Backend (API Flask)

O backend é a API que o frontend irá consumir. Ele usa Flask e SQLite3 como banco de dados.

1.  **Navegue até o diretório do backend:**
    ```bash
    cd mvp/backend
    ```

2.  **Crie e ative um ambiente virtual (recomendado):**
    Isso isola as dependências do seu projeto.
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Instale as dependências do Python:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Execute a aplicação Flask:**
    ```bash
    python run.py
    ```
    *   Você verá mensagens como "Criando usuários padrão..." e "Criando produtos de exemplo..." na primeira execução.
    *   A API estará rodando em `http://127.0.0.1:5000`.
    *   O banco de dados `pdv.db` será criado automaticamente no diretório `mvp/backend/instance/`.

---

## 4. Rodando o Frontend (Aplicação React)

O frontend é a interface do usuário construída com React e Vite.

1.  **Navegue até o diretório do frontend:**
    ```bash
    cd mvp/frontend
    ```

2.  **Instale as dependências do Node.js:**
    ```bash
    npm install
    ```

3.  **Execute a aplicação em modo de desenvolvimento:**
    ```bash
    npm run dev
    ```
    *   A aplicação estará disponível em `http://localhost:5173/`.

---

## 5. Fluxo de Trabalho Típico

Para ter o projeto completo funcionando, você precisará rodar o backend e o frontend **simultaneamente** em terminais separados:

*   **Terminal 1 (Para o Backend):**
    ```bash
    cd mvp/backend
    source venv/bin/activate
    python run.py
    ```

*   **Terminal 2 (Para o Frontend):**
    ```bash
    cd mvp/frontend
    npm run dev
    ```

---

## 6. Ambientes de Teste e Produção (Informações Adicionais)

### Teste

Para testes, você pode usar as mesmas instruções de desenvolvimento. Para testes automatizados, o backend está configurado para usar um banco de dados em memória (`sqlite:///:memory:`) quando `FLASK_ENV` é definido como `testing`.

### Produção

Para um ambiente de produção, as etapas são mais complexas e visam segurança e performance:

*   **Backend:**
    *   Use um servidor WSGI como [Gunicorn](https://gunicorn.org/) para servir a aplicação Flask.
    *   Configure variáveis de ambiente (`SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL` para um banco de dados robusto como PostgreSQL) no seu ambiente de hospedagem.
    *   Exemplo de execução com Gunicorn (após `pip install gunicorn`):
        ```bash
        cd mvp/backend
        gunicorn -w 4 "app:create_app()" -b 0.0.0.0:5000
        ```

*   **Frontend:**
    *   Crie a versão otimizada para produção:
        ```bash
        cd mvp/frontend
        npm run build
        ```
        Os arquivos estáticos serão gerados na pasta `dist/`.
    *   Sirva esses arquivos estáticos usando um servidor web como [Nginx](https://nginx.org/en/) ou [Apache](https://httpd.apache.org/).
    *   Configure um proxy reverso (Nginx/Apache) para direcionar as requisições da API para o backend e as requisições de arquivos estáticos para o frontend.

---

**Autor:** Manus AI  
**Data:** 27 de setembro de 2025  
**Versão:** 1.0.0


