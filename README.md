🎧 SaaS Guide Audio Platform

A SaaS platform developed with React.js (frontend) and Laravel (backend) that provides an interactive audio guide system for museums, art galleries, libraries, and other cultural spaces.

The project includes an Admin Panel for managing content (museums, rooms, objects, tickets) and a User Platform where visitors can explore collections using valid tickets.

The entire system is fully responsive, with a modern and user-friendly UI.

🚀 Features
🔐 Admin Panel (Super Admin & Admins)

Authentication System: Only authorized users can access.

Super Admin:

Manage (CRUD) Admins (clients = museum/library owners).

Admins (Clients):

CRUD operations on Rooms, Objects, and Tickets.

Each admin can only manage their own content.

🎟️ Ticket System

Tickets are auto-generated for each visitor.

Each ticket is valid for 24 hours.

Includes QR code support (scan or enter code to access).

🏛️ User Platform

Visitors with a valid ticket can:

Access the chosen museum/library.

Browse available rooms.

Explore objects within rooms.

View detailed information and listen to audio descriptions.

💻 Other Features

Full CRUD on admins, rooms, objects, and tickets.

QR code scanning for quick access.

Modern responsive UI across all devices.

🛠️ Tech Stack

Frontend (Showcase Platform): React.js

Frontend (Admin Panel): React.js

Backend: Laravel

Database: MySQL

Authentication: Laravel Auth System (Breeze)

QR Code: Auto-generated for each ticket

📂 Project Structure
guide-audio-saas/
│
├── museum-audio-guide-backend/                   # Laravel Backend
│   ├── app/                   # Core application logic
│   ├── database/              # Migrations & seeders
│   └── public/                # Public assets
│
├── museum-dashboard/            # React.js frontend (Admin Panel)
│   ├── src/                   
│   └── public/                
│
├── museum-audio-guide-frontend/         # React.js frontend (Visitor Platform)
│   ├── src/                   
│   └── public/                
│
│
└── README.md                  # Project documentation

⚙️ How It Works

Super Admin creates Admins (museum/library owners).

Admins create Rooms, Objects, and Tickets.

Visitors purchase or receive a ticket (QR code generated automatically).

With a valid ticket, visitors access the Showcase Platform:

Enter/scan ticket → Access museum → Explore Rooms → View & Listen to Objects.

Tickets expire automatically after 24 hours.

📦 Installation & Usage
🔧 Backend (Laravel)

Clone the repository:

git [clone https://github.com/hamou592/guide-audio-saas.git](https://github.com/hamou592/guide-audio-project)


Install dependencies:

composer install


Configure .env file (database, mail, etc.).

Import the database:

mysql -u root -p guide_audio_db < ../database/guide_audio_db.sql


Run migrations & seeders:

php artisan migrate --seed


Start server:

php artisan serve

💻 Frontend (Admin & Showcase Platforms)

Install dependencies:

npm install


Start development server:

npm start

<--📸 Screenshots
Admin Panel

Dashboard (Screenshot)

Manage Admins (Screenshot)

Manage Rooms (Screenshot)

Manage Objects (Screenshot)

Manage Tickets (Screenshot)

User Platform

Ticket Validation (Screenshot)

Museum Rooms (Screenshot)

Objects Showcase with Audio (Screenshot) !-->

🔮 Future Improvements

Add multi-language support.

Add payment integration for ticket purchases.

Implement analytics for admins to track visitor activity.

Mobile App version for visitors.

👨‍💻 Author

Developed by Hamou Nasreddine
GitHub: [hamou592](https://github.com/hamou592)
