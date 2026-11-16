# 💬 MERN Real-Time Chat App

A full-stack real-time messaging application built with the **MERN stack**, **Socket.IO**, and **Cloudinary**. Users can connect with friends, exchange messages instantly, share media and files, and enjoy interactive messaging features.

## 🎥 Live Demo

Watch the application in action:

[▶️ View Chat App Demo](https://www.awesomescreenshot.com/video/58357882?key=eceeba3f57adef7727cbd92ef3dcef37)

## 📸 Screenshots

### Signup Page
<img width="800" height="426" alt="p2" src="https://github.com/user-attachments/assets/6eb98572-8a18-47a3-a1ed-0960ca1e8c6a" />

### Home Page (when 2 users chat)
<img width="800" height="426" alt="p1" src="https://github.com/user-attachments/assets/9578132f-8ea4-433e-a1a4-a388eae2ff36" />

###  Profile Page
<img width="800" height="426" alt="p5" src="https://github.com/user-attachments/assets/c13f8108-869a-459e-b69b-df0a20698b40" />

### Freinds Page
<img width="800" height="426" alt="photo_6_2026-11-14_21-47-49" src="https://github.com/user-attachments/assets/d8d99d06-8e24-4d4f-a3ac-48f611b0b26c" />

### Settings
<img width="800" height="426" alt="p6" src="https://github.com/user-attachments/assets/854e4e30-07a8-4b3a-a9d9-e6915235177f" />

### Login page
<img width="800" height="426" alt="p3" src="https://github.com/user-attachments/assets/f4798f7c-15ba-4e8f-a152-b5265ae01fea" />

## ✨ Features

- 🔐 Secure authentication with JWT, HTTP-only cookies, and bcrypt.
- 👥 Friend requests and friendship management.
- 💬 Real-time messaging with Socket.IO.
- 🟢 Online status and typing indicators.
- ✓ Message delivery and read receipts.
- 🖼️ Image sharing and voice messages.
- 📎 File sharing (documents, videos, audio, archives, and more).
- ↩️ Reply, edit, delete, and forward messages.
- ❤️ Emoji reactions and message search.
- 🎨 Responsive UI with customizable themes.

## 🛠️ Tech Stack

**Frontend:** React, Vite, Zustand, Axios, Tailwind CSS, DaisyUI.

**Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.IO.

**Other Tools:** JWT, bcrypt, Cloudinary, Multer, React Hot Toast, Lucide React.

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd chat-app
```

### 2. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the backend directory:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run the application

Backend:

```bash
cd backend
npm run dev
```

Frontend (in another terminal):

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🏗️ Architecture

- **React:** User interface.
- **Zustand:** Frontend state management.
- **Express & Node.js:** Backend APIs and application logic.
- **MongoDB & Mongoose:** Data storage and modeling.
- **Socket.IO:** Real-time communication.
- **Cloudinary:** Media and file storage.

## 👨‍💻 Author

**Abdulkerim Neja**

[GitHub](https://github.com/abdulkerimN)


##### Inspired by a YouTube tutorial and extended with additional features and custom implementations.

---

*Built with ❤️ using the MERN stack and Socket.IO.*
