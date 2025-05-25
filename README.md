
# Setup Instructions

## 1. Install a Relational Database Management System (RDBMS)

You can use any RDBMS of your choice. If you prefer **PostgreSQL**, you can use the `docker-compose.yml` provided here:

👉 [PostgreSQL Docker Compose Gist](https://gist.github.com/rafaro/a2e3ff15be51932972a1edbc0e0bf671)

After starting the container, **create a new database and user** in your PostgreSQL instance.

---

## 2. Configure the Application

Create a file named `production.yml` in the following path:

```
./deigmata/api/config/
```

Use the example configuration below:

```yaml
server:
  port: 3000
  cors: true

db:
  host: '192.168.x.x' # If using Docker, do NOT use localhost. Use your machine's IP address.
  type: 'postgres'
  port: 5432
  database: 'deigmata' # Name of the database you created
  username: 'usrdei'   # Username you created
  password: 'usrdei'
  sync: true
```

---

## 3. Start the Application

Navigate to the `./deigmata` directory and run:

```bash
docker compose up
```

> **Note:** After every `git pull`, you must rebuild the containers:

```bash
docker compose up --build
```

---

## 4. Initialize the Application

Open your browser and navigate to:

👉 [http://localhost:8080/#/init](http://localhost:8080/#/init)

---

## 5. Log In

Once the initialization is complete, you can log in at:

👉 [http://localhost:8080/#/auth/login](http://localhost:8080/#/auth/login)

Use the following credentials:

- **Email:** `test@test.com`
- **Password:** `testtest`
