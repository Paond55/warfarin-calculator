// ตั้งชื่อ "กล่อง" ที่จะใช้เก็บไฟล์
const CACHE_NAME = 'warfarin-calculator-v2';

// รายชื่อไฟล์ทั้งหมดที่จำเป็นต่อการทำงานของเว็บแอป
const urlsToCache = [
  '/warfarin-calculator/',
  '/warfarin-calculator/index.html',
  '/warfarin-calculator/style.css',
  '/warfarin-calculator/script.js',
  '/warfarin-calculator/manifest.json',
  '/warfarin-calculator/icon-192x192.png',
  '/warfarin-calculator/icon-512x512.png'
];
// เหตุการณ์: "ติดตั้ง" Service Worker
// เมื่อติดตั้งสำเร็จ ให้เปิด "กล่อง" แล้วนำไฟล์ทั้งหมดใน `urlsToCache` ใส่ลงไป
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// เหตุการณ์: "Fetch" (เมื่อมีการเรียกขอไฟล์ เช่น รูปภาพ, CSS, JS)
// ให้ Service Worker ค้นหาไฟล์ใน "กล่อง" ที่เก็บไว้ก่อน
// - ถ้าเจอ: ให้ส่งไฟล์จากในกล่องไปแสดงผลทันที (ทำงานออฟไลน์ได้)
// - ถ้าไม่เจอ: ให้ไปดึงจากอินเทอร์เน็ตตามปกติ
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // คืนค่าจาก Cache
        }
        return fetch(event.request); // ไปดึงจาก Network
      })
  );
});