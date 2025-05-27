
# Deigmata

**Deigmata** is a research-driven project focused on enhancing the **visual exploration of knowledge graphs** through interactive and user-centered methodologies. As the volume and complexity of structured semantic data grow, interpreting and extracting meaningful insights from knowledge graphs becomes increasingly challenging. This project proposes a **methodological process** that leverages **exploratory visualization techniques** to improve interaction and facilitate insight generation.

## Objectives

- Facilitate interpretation of large-scale knowledge graphs
- Enhance user interaction with semantic data through visualization
- Develop and validate a methodological process focused on the user journey

## Methodology

This project follows the **Design Science Research (DSR)** approach and is divided into two main stages:

### 1. Systematic Literature Review (SLR)
- 497 studies analyzed
- 77 studies selected for in-depth analysis
- Identified **7 recurring approaches** for knowledge graph visualization
- Mapped **20 tools** with potential for future testing

### 2. Semi-Structured Interviews
- Conducted **14 interviews** with experts and users
- Used to validate and improve the initial model
- Resulted in a **refined and validated methodological process**

## Results

- A consolidated methodological model for interactive visual exploration of knowledge graphs
- A categorized list of relevant tools and approaches from the literature
- Insights into user needs and practices when working with semantic data

## Future Work

- Evaluate and test the mapped tools for compatibility with the proposed model
- Implement prototypes based on the validated methodology
- Extend the model with feedback from further usability studies

---

**Deigmata** serves as a foundation for developing advanced, user-centered visualization strategies that make knowledge graphs more **accessible**, **insightful**, and **usable**.

---

<p align="center">
  <img src="https://mhtx.eci.ufmg.br/wp-content/uploads/2021/10/Logo-MHTX-horizontal-RGB-site-1-copiar.png" alt="MHTX Logo" width="400"/>
</p>

> 🧪 **Deigmata is part of the [MHTX Research Group](https://mhtx.eci.ufmg.br/)** – at the School of Information Science, Federal University of Minas Gerais (UFMG), Brazil.


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
