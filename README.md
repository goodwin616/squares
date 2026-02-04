# Squares

A web application for managing Super Bowl squares games. Built with Angular and Firebase, it simplifies the process of creating games, inviting friends, tracking payments, and viewing live results.

## Features

- **Interactive Grid:** easy-to-use interface for players to select and claim their squares.
- **Game Management:**
  - Create custom games with configurable prices and payout structures.
  - "Draft" mode for filling the grid before locking it.
  - Randomized number assignment for rows and columns.
- **Payment Integration:**
  - Venmo deep-linking for easy payments.
  - Admin dashboard to track who has paid and who still owes.
- **Real-time Updates:** Powered by Firebase Firestore for instant state synchronization across all devices.
- **Mobile Responsive:** Designed to work great on phones and desktops.
- **Authentication:** Secure sign-in via Firebase Auth.

## Tech Stack

- **Frontend:** [Angular](https://angular.io/) (v21+), Angular Material
- **Backend:** [Firebase](https://firebase.google.com/) (Firestore, Authentication, Cloud Functions)
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm
- Angular CLI (`npm install -g @angular/cli`)
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/squares.git
    cd squares
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Firebase Setup:**
    - Create a project in the [Firebase Console](https://console.firebase.google.com/).
    - Enable **Firestore** and **Authentication**.
    - Update `src/environments/environment.ts` (and `environment.prod.ts`) with your Firebase config keys.
    - Login to Firebase CLI:
      ```bash
      firebase login
      ```

### Development

Run the local development server:

```bash
npm start
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Build

To build the project for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Deployment

To deploy to Firebase Hosting:

```bash
ng build
firebase deploy
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
