# 🚀 Data Sunwin API

REST API quản lý account và accountChecked.

## 📦 Tech Stack

* Node.js
* Express
* MongoDB (Mongoose)

---

## ⚙️ Setup

### 1. Clone project

```bash
git clone <your-repo>
cd data-sunwin-api
```

### 2. Cài dependency

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env`:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/data-sunwin
```

---

## ▶️ Chạy server

```bash
npm run dev
```

hoặc

```bash
npm start
```

Server chạy tại:

```
http://localhost:3000
```

---

## 📚 API Endpoints

### 🔹 Account

#### Tạo account

```http
POST /accounts
```

Body:

```json
{
  "fileName": "file1.txt",
  "username": "abc",
  "password": "123"
}
```

#### Lấy tất cả account

```http
GET /accounts
```

---

### 🔹 Account Checked

#### Tạo accountChecked

```http
POST /account-checked
```

Body:

```json
{
  "accountId": "ObjectId",
  "username": "abc",
  "password": "123",
  "phone": "0123456789",
  "balance": 1000,
  "status": "SUCCESS",
  "message": "OK"
}
```

#### Lấy tất cả accountChecked

```http
GET /account-checked
```

---

## 🧠 Gợi ý mở rộng

* Import từ TXT / Excel
* Check trùng username
* Queue xử lý login
* Retry khi sai captcha
* Log chi tiết theo từng account

---

## 🗂️ Cấu trúc project

```
src/
 ├─ config/
 ├─ controllers/
 ├─ models/
 ├─ routes/
 ├─ app.js
 └─ server.js
```

---

## 📌 Notes

* DB: `data-sunwin`
* Collection:

  * `accounts`
  * `accountcheckeds`

---

## 👨‍💻 Author

Dev by you 😎
