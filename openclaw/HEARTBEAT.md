---
name: karen-heartbeat
description: Karen's response monitoring loop — polls for replies and payment events
interval: 30s
---

# Karen Heartbeat

Every heartbeat cycle, check:

1. **Active escalations** — poll the backend at `/api/escalations/active`
2. **Gmail threads** — for each active escalation, check if the target has replied
3. **Payment events** — check for any pending Venmo webhook confirmations

## On response detected

- Notify the backend: `POST /api/escalation/{id}/response-detected`
- The backend will pause the escalation after the current level completes
- Karen notes: "Response detected. Completing current action."

## On payment detected

- Do NOT auto-de-escalate
- Notify the backend: `POST /api/escalation/{id}/payment-detected`
- Wait for operator to click [INITIATE DE-ESCALATION]
- Karen notes: "Payment received. Awaiting operator confirmation to stand down."

## If nothing needs attention

HEARTBEAT_OK
