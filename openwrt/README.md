# คู่มือการติดตั้งและตั้งค่า OpenNDS บน Router OpenWrt (Xiaomi AX3600)

## 📡 1. การติดตั้ง OpenNDS บน OpenWrt
เชื่อมต่อ SSH เข้าไปยัง Router OpenWrt ของคุณ:
```bash
opkg update
opkg install opennds
```

## ⚙️ 2. คัดลอกและตั้งค่า `/etc/opennds/opennds.conf`
นำเนื้อหาในไฟล์ [opennds.conf](file:///c:/Users/oatxs/Desktop/Rentwifi/openwrt/opennds.conf) ไปวางที่ `/etc/opennds/opennds.conf` บน Router:

```ini
# OpenNDS Configuration File for OpenWrt Router
# Location on Router: /etc/opennds/opennds.conf

# Gateway Interface (br-lan หรือ Guest WiFi interface)
gatewayinterface br-lan

# Gateway Port (Default 2050)
gatewayport 2050

# Client Session Timeout (Minutes) - 0 = ปล่อยให้ระบบจัดการผ่าน Database / API ตัดสิทธิ์
sessiontimeout 0
checkinterval 60

# Gateway Name
gatewayname RentWiFi Captive Portal

# Forward Authentication Service (FAS) Setup
# ใช้ FQDN ของ Vercel โดยตรง (OpenNDS จะ Resolve IP ของ fasremotefqdn ให้อัตโนมัติ)
fasremotefqdn rentcondowifi.vercel.app
fasport 443
fasssl 1
faspath /portal
```

## 🚀 3. รีสตาร์ทเซอร์วิส OpenNDS
```bash
service opennds restart
service opennds enable
```

OpenNDS จะทำการ Resolve IP ของ `rentcondowifi.vercel.app` และอนุญาตให้ผู้ใช้เข้าหน้าพอร์ทัล / สแกน PromptPay ได้โดยอัตโนมัติก่อนล็อกอินครับ!
