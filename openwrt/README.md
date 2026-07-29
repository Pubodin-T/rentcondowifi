# คู่มือการติดตั้งและเชื่อมต่อ OpenNDS บน Router OpenWrt (Xiaomi AX3600)

## 📡 1. การติดตั้ง OpenNDS บน OpenWrt
เชื่อมต่อ SSH เข้าไปยัง Router OpenWrt ของคุณ:
```bash
opkg update
opkg install opennds
```

## ⚙️ 2. คัดลอกและตั้งค่า `/etc/opennds/opennds.conf`
นำไฟล์ [opennds.conf](file:///c:/Users/oatxs/Desktop/Rentwifi/openwrt/opennds.conf) ไปวางที่ `/etc/opennds/opennds.conf` บน Router
และสั่งรีสตาร์ทบริการ:
```bash
service opennds restart
service opennds enable
```

## 🌐 3. การทำงานของระบบ Captive Portal
1. ลูกค้าเชื่อมต่อ WiFi แบบเปิด (Free WiFi ไม่มีรหัส)
2. เมื่อเปิดเบราว์เซอร์ OpenNDS จะทำการ Redirect ไปยังหน้าเว็บของคุณ (`/portal`)
3. ลูกค้าทำการเลือกแพ็กเกจ (เช่น 7 วัน 75 บาท / 30 วัน 250 บาท) -> สแกน PromptPay QR -> แนบสลิปชำระเงิน
4. ลูกค้าได้รับ Username / Password และสิทธิ์ใช้งานอินเทอร์เน็ตทันที
5. ผู้ดูแลระบบ (Admin) เข้าไปที่หน้า `/admin` เพื่อตรวจสอบภาพสลิป หากพบสลิปปลอม สามารถกด **"ระงับบัญชี (Suspend User)"** ได้ทันที
