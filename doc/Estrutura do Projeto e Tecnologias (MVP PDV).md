# Estrutura do Projeto e Tecnologias (MVP PDV)

Este documento detalha a estrutura de diretórios e as tecnologias a serem utilizadas no desenvolvimento do MVP do sistema PDV.

## 1. Estrutura de Diretórios

A estrutura do projeto será dividida em duas partes principais: `backend` (Flask) e `frontend` (React), com uma pasta `docs` para a documentação.

```
pdv-system/
├── docs/
│   ├── database_schema.md
│   └── project_structure_and_tech.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── routes.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── product_service.py
│   │       ├── sale_service.py
│   │       └── user_service.py
│   ├── config.py
│   ├── run.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── styles/
│   ├── package.json
│   └── .env
└── .gitignore
```

## 2. Tecnologias Escolhidas

### Backend

*   **Framework:** [Flask](https://flask.palletsprojects.com/) - Um microframework web em Python, leve e flexível, ideal para APIs RESTful.
*   **Banco de Dados:** [SQLite](https://www.sqlite.org/index.html) (para MVP, fácil de configurar e usar) ou [PostgreSQL](https://www.postgresql.org/) (para escalabilidade futura).
*   **ORM (Object-Relational Mapper):** [SQLAlchemy](https://www.sqlalchemy.org/) com [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/) - Para interagir com o banco de dados de forma orientada a objetos.
*   **Autenticação:** [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/en/stable/) - Para autenticação baseada em tokens JWT.
*   **Validação de Dados:** [Marshmallow](https://marshmallow.readthedocs.io/en/stable/) - Para serialização/desserialização e validação de objetos Python.

### Frontend

*   **Framework:** [React](https://react.dev/) - Biblioteca JavaScript para construção de interfaces de usuário interativas.
*   **Gerenciamento de Estado:** [React Context API](https://react.dev/learn/passing-props-with-a-context) ou [Redux Toolkit](https://redux-toolkit.js.org/) (se a complexidade aumentar).
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/) ou [Styled Components](https://styled-components.com/) - Para um desenvolvimento de UI rápido e consistente.
*   **Requisições HTTP:** [Axios](https://axios-http.com/) - Cliente HTTP baseado em Promises para o navegador e Node.js.

### Outras Ferramentas

*   **Controle de Versão:** [Git](https://git-scm.com/) / [GitHub](https://github.com/)
*   **Gerenciador de Pacotes (Python):** [pip](https://pip.pypa.io/en/stable/)
*   **Gerenciador de Pacotes (JavaScript):** [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)

## 3. Considerações de Segurança

*   **Senhas:** Armazenar senhas como hashes (ex: usando `werkzeug.security.generate_password_hash`).
*   **Autenticação:** Implementar autenticação baseada em tokens para proteger as rotas da API.
*   **Validação:** Validar todas as entradas de dados no backend para prevenir injeção de SQL e outros ataques.

---

**Autor:** Manus AI
**Data:** 27 de setembro de 2025
