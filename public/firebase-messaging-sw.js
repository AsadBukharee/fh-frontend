importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBmwKndwfT5SY9bshrNR6vYCmb_8X4esMc",
  authDomain: "foster-hartley-mobile.firebaseapp.com",
  projectId:"foster-hartley-mobile",
  storageBucket:"foster-hartley-mobile.firebasestorage.app",
  messagingSenderId:"466989475831",
  appId:"1:466989475831:web:eca2607fdbddaf7640f0f2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon.png",
  });
});
