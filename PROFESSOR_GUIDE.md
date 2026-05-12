# Evaluation Guide for Professor

Welcome! This guide explains how to instantly launch and evaluate the Kunuz application. 

You **do not need any source code**, Node.js, Python, or MongoDB installed on your computer. The entire application, including the database pre-loaded with data (users, posts, groups, etc.), is packaged and hosted on Docker Hub.

---

## 1. What You Need
To run the application, you only need:
1. **Docker Desktop** installed and running on your computer ([Download Docker Here](https://docs.docker.com/get-docker/)).
2. The `professor_docker_compose.yml` file provided by the student.

---

## 2. Launching the Application

1. Save the `professor_docker_compose.yml` file anywhere on your computer (for example, your Desktop).
2. Open your terminal (or Command Prompt / PowerShell) and navigate to the folder where you saved the file.
   ```bash
   cd Desktop
   ```
3. Run the following command to download and start the application:
   ```bash
   docker compose -f professor_docker_compose.yml up -d
   ```
   *Note: The first time you run this command, it will take a few minutes to download the images from Docker Hub.*

---

## 3. Accessing the Application

Once the command finishes running, the application is live! You can access it directly in your web browser:

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)

*(The database has been pre-seeded with our test data, so you will immediately see posts, users, and content when you open the frontend).*

---

## 4. Test Accounts

To instantly test the different roles and features of the platform without registering, you can log in with any of the following pre-configured accounts.
The password for all accounts is: **`TestPass1234`**

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **System Admin** | `admin@kunuz.com` | Full access to all admin and moderation features. |
| **Moderator** | `mod@kunuz.com` | Access to content moderation and user reports. |
| **Regular User** | `user1@kunuz.com` | Standard permissions (create posts, report others). |

---

## 5. Stopping the Application

When you are finished evaluating the project, you can cleanly stop and remove the running containers by executing this command in the same folder:

```bash
docker compose -f professor_docker_compose.yml down
```

Thank you for your time evaluating our project!
