# MyCafe 👋

## App Name

MyCafe

## ✨ Short Description

MyCafe is a simple and easy-to-use mobile app designed to help café owners manage customer orders and streamline daily operations. It makes order tracking faster, more organized, and hassle-free.

## ⚠️ Problem Statement

Many café businesses still rely on manual processes such as writing down customer orders, calculating totals by hand, and tracking daily sales on paper. These traditional methods are time-consuming and prone to errors, such as incorrect orders, miscalculations, and lost records. As a result, operations become inefficient during busy hours, leading to delays, customer dissatisfaction, and difficulty in monitoring business performance.

## 🎯 Target Users

The primary users of MyCafe are café owners and small café business operators who want a more organized way to manage their daily transactions and operations.

---

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Privacy & Security

- User authentication is required to access Firestore and Storage data.
- Firestore data is scoped to the authenticated user's `users/{uid}` document and subcollections.
- Storage uploads are restricted to `profilePics/{uid}` and `productImages/{uid}` paths for the signed-in user.
- Profile uploads and offline data are cached locally using AsyncStorage, and synced only when network connectivity returns.
- Sensitive app data is not shared across users; each authenticated user manages only their own products, orders, and profile data.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
