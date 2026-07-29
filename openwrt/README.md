# คู่มือการติดตั้งและตั้งค่า OpenNDS บน Router OpenWrt (Xiaomi AX3600)

## 📡 1. การติดตั้ง OpenNDS และแพ็กเกจ SSL
เชื่อมต่อ SSH เข้าไปยัง Router OpenWrt ของคุณ:
```bash
opkg update
opkg install opennds ca-bundle ca-certificates
```

## ⚙️ 2. คัดลอกและตั้งค่า `/etc/opennds/opennds.conf`
นำเนื้อหาในไฟล์ [opennds.conf](file:///c:/Users/oatxs/Desktop/Rentwifi/openwrt/opennds.conf) ไปวางที่ `/etc/opennds/opennds.conf` บน Router:

```ini
# OpenNDS Configuration File for OpenWrt Router
# Location on Router: /etc/opennds/opennds.conf

gatewayinterface br-lan
gatewayport 2050
sessiontimeout 0
checkinterval 60

gatewayname RentWiFi Captive Portal

# *** สำคัญมาก: fassecurelevel 1 บังคับใช้ Remote FAS ***
fassecurelevel 1

fasremotefqdn rentcondowifi.vercel.app
fasport 443
fasssl 1
faspath /portal

preauthenticated_users {
    allow tcp port 443 to 0.0.0.0/0
}
```

## 🚀 3. รีสตาร์ทเซอร์วิส OpenNDS
```bash
service opennds restart
service opennds enable
```

## 💡 วิธีการทดสอบบนมือถือ (กรณีเน็ตยังเด้งเข้าหน้าเดิม):
1. **กด Forget/ลบเครือข่าย WiFi บนมือถือเดิม** ออกก่อน เพื่อล้างแคช Captive Portal
2. เชื่อมต่อ WiFi ใหม่อีกครั้ง มือถือจะเด้งไปที่ `https://rentcondowifi.vercel.app/portal` ทันที!
