# Modern_Hospital_Mangement_system


# Modern Hospital Management System

Full-stack project:
- Frontend: React (Vite)
- Backend: Node.js + Express
- Database: Microsoft SQL Server (Docker)
- ORM: Prisma (SQL Server)

---
## Requirements (Teammates)
Install these before running:
1) Node.js (LTS recommended)
2) Git
3) Docker Desktop (with WSL2 enabled on Windows)

---

## 1) Project Structure

Modern Hospital Mangement system/
├── docker-compose.yml
├── server/
│ ├── prisma/
│ │ ├── schema.prisma
│ │ └── migrations/
│ ├── src/
│ │ ├── config/
│ │ │ └── db.js
│ │ ├── prismaClient.js
│ │ └── index.js
│ ├── package.json
│ └── .env (NOT committed)
└── client/ (optional frontend)



---

## 2) Requirements (Install These)

### ✅ Required
1. **Git**  
   https://git-scm.com/downloads

2. **Node.js (LTS)** (recommended Node 18 or 20+)  
   https://nodejs.org/

3. **Docker Desktop** (to run SQL Server)  
   https://www.docker.com/products/docker-desktop/

### ✅ Optional (Recommended)
4. **SQL Server Management Studio (SSMS)**  
   https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms

5. **Postman**  
   https://www.postman.com/downloads/

---

## 3) Clone the Repository


git clone <YOUR_GITHUB_REPO_URL>
cd "Modern Hospital Mangement system"


4) Start SQL Server Database (Docker)

From the root folder (where docker-compose.yml exists):

docker compose up -d


Check containers:

docker ps


You should see a container like:

modern_hospital_mssql

port 1433

5) Create Database (One-time Setup)

Run this from the root folder:

docker exec -it modern_hospital_mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Str0ng!Passw0rd123" -C -Q "IF DB_ID('ModernHospitalDB') IS NULL CREATE DATABASE ModernHospitalDB;"


Confirm DB exists:

docker exec -it modern_hospital_mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Str0ng!Passw0rd123" -C -Q "SELECT name FROM sys.databases;"

6) Backend Setup (Node + Prisma)

Go to backend folder:

cd server


Install dependencies:

npm install

7) Create .env file (IMPORTANT)

Inside server/, create a file named .env

server/.env

PORT=5000
DATABASE_URL="sqlserver://localhost:1433;database=ModernHospitalDB;user=sa;password=Str0ng!Passw0rd123;encrypt=true;trustServerCertificate=true;"


✅ .env must NOT be committed to GitHub.

8) Run Prisma Migrations (Create Tables)

Still inside server/:

npx prisma migrate dev


Check tables using Docker:

cd ..
docker exec -it modern_hospital_mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Str0ng!Passw0rd123" -C -d ModernHospitalDB -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;"


Expected tables include:

User

Doctor, Nurse, Patient

Appointment, Admission, Prescription

Department, StaffApplication

_prisma_migrations

9) Run the Backend Server

Go back to server folder:

cd server


Start dev server:

npm run dev


Expected output:

Server running on port 5000

10) Test API with Postman
✅ Health check

GET

http://localhost:5000/health


Expected response:

{
  "api": true,
  "db": true
}

✅ Create a user (example)

POST

http://localhost:5000/users


Body → raw → JSON:

{
  "email": "admin@demo.com",
  "passwordHash": "test123",
  "role": "ADMIN"
}


⚠️ If you send POST to /health, you will get:

Cannot POST /health


That is correct because /health is only GET.

11) Use SQL Server Management Studio (SSMS) (Optional)

To connect SSMS to the Docker SQL Server:

Server name

localhost,1433


Authentication

SQL Server Authentication

Username: sa

Password: Str0ng!Passw0rd123

Then open:
Databases → ModernHospitalDB → Tables

12) Common Issues & Fixes
❌ Postman: ECONNREFUSED 127.0.0.1:5000

✅ Fix:

Make sure backend is running:

cd server
npm run dev


Make sure .env has PORT=5000

❌ SQL SSL / certificate error

✅ Fix:
Ensure DATABASE_URL includes:

encrypt=true;trustServerCertificate=true;

❌ Prisma migration stuck / broken (dev only)

⚠️ WARNING: deletes all data

cd server
npx prisma migrate reset

13) Team Workflow Rules (IMPORTANT)

✅ When you change DB schema:

Edit: server/prisma/schema.prisma

Create migration:

cd server
npx prisma migrate dev --name your_change_name


Commit these files:

server/prisma/schema.prisma

server/prisma/migrations/**

✅ When teammates pull updates:

cd server
npx prisma migrate dev

14) Stop Everything

Stop containers:

cd ..
docker compose down
Stop + delete DB volume (deletes database completely):
docker compose down -v

**Notes**
Do NOT commit .env
Do NOT commit node_modules
Always commit Prisma migrations after schema changes


