#!/bin/sh
# RentWiFi Router Telemetry Push Script for OpenWrt
# Location on Router: /etc/opennds/sync-router.sh

DOMAIN="rentcondowifi.vercel.app"
SECRET="Oat13392_router_secret"

NDS=$(ndsctl status 2>/dev/null)
ARP=$(cat /proc/net/arp 2>/dev/null)
DNS=$(tail -n 300 /tmp/dnsmasq.log 2>/dev/null)

# Escape text safely if jq is available, or use awk fallback
if command -v jq >/dev/null 2>&1; then
  NDS_JSON=$(echo "$NDS" | jq -aRs .)
  ARP_JSON=$(echo "$ARP" | jq -aRs .)
  DNS_JSON=$(echo "$DNS" | jq -aRs .)
else
  NDS_JSON=$(echo "$NDS" | awk '{gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); gsub(/\r/, ""); printf "%s\\n", $0}' | awk '{printf "%s", $0}' | sed 's/^/"/' | sed 's/$/"/')
  ARP_JSON=$(echo "$ARP" | awk '{gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); gsub(/\r/, ""); printf "%s\\n", $0}' | awk '{printf "%s", $0}' | sed 's/^/"/' | sed 's/$/"/')
  DNS_JSON=$(echo "$DNS" | awk '{gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); gsub(/\r/, ""); printf "%s\\n", $0}' | awk '{printf "%s", $0}' | sed 's/^/"/' | sed 's/$/"/')
fi

curl -s -X POST "https://${DOMAIN}/api/admin/monitoring/push" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"${SECRET}\",\"ndsctlStatus\":${NDS_JSON},\"arpTable\":${ARP_JSON},\"dnsLog\":${DNS_JSON}}"
