# 🚨 RescuNet

Intelligent disaster management & offline mesh communication when cell networks go down.

---

## 💡 The Problem & Solution
During natural disasters, cell towers collapse, leaving survivors stranded and first responders blind.  
**RescuNet** creates an offline peer-to-peer (P2P) mesh network that routes SOS signals, pushes real-time hazard alerts, and guides users along safe evacuation paths—even with **zero internet**.

---

## ✨ Key Features (Prototype)

- 📡 **Offline P2P Mesh Network:** Uses BLE (Bluetooth Low Energy) and Wi-Fi Direct to hop distress messages phone-to-phone until reaching a connected node.
- 🗺️ **Dynamic Hazard-Avoidance Routing:** Re-routes evacuees around active flood, landslide, or fire zones using offline vector maps.
- 🆘 **Automated Welfare Tracking & SOS:** Sends automated check-in prompts. If unanswered or flagged as distress, auto-escalates an SOS containing GPS, battery level, and health info to the rescue dashboard.
- 📸 **AI Hazard Verification:** Civilians upload photos of blocked roads; an AI model verifies the hazard to update evacuation routes.
- 🔋 **Ultra-Low-Power Mode:** Local vector map caching with a minimal dark UI to save critical battery life.
- 🖥️ **Central Rescue Dashboard:** Web dashboard for first responders to view regional demographics, locate victims, and prioritize triage.

---

## 🏗️ How It Works

```text
[ Offline User A ] ──(BLE/Wi-Fi Direct)──► [ Offline User B ]
                                                    │
                                            (P2P Mesh Hop)
                                                    ▼
[ Rescue Dashboard ] ◄──(Active Link)─── [ Connected Gateway ]
  - Live triage map
  - SOS & medical info
