# Tasks Dashboard - Microservices

## Descrição
Dashboard de gerenciamento de tarefas com arquitetura de microsserviços (Users API, Tasks API) e frontend em HTML/CSS/JS.

## Como rodar
1. Users API
```bash
cd users-api
npm install
npm start
```
2.Tasks API
```bash
cd tasks-api
npm install
npm start
````
3. Frontend
```bash
cd frontend
npx serve . -p 8080
# abrir http://localhost:8080
````
## Endpoints principais:
- ```GET /users ``` (Users API)
- ```GET /users/:id ```
- ```GET /tasks ``` (Tasks API)
- ```GET /tasks/user/:userId ```
- ```POST /tasks ``` { userId, description }
- ```DELETE /tasks/:id ```

## Próximos passos (melhorias)

- Persistir com MongoDB/Postgres
- Autenticação (JWT)
- Docker + Docker Compose
- Testes automatizados e CI (GitHub Actions)
