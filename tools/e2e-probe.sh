#!/usr/bin/env bash
set -u

RUN="${1:-baseline}"
TIMEOUT="${2:-180}"

PID="probe-${RUN}-$(date +%s)"
SENT=$(date +%s)
MESSAGE_ID="$(cat /proc/sys/kernel/random/uuid)"

echo "probe_id,sent_epoch,found_epoch,latency_s,status" > "results/e2e-${RUN}.csv"

curl -s -o /dev/null -X POST "$BASE_URL/api/public/apps/identify" \
  -H "Authorization: $WRITE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "identify",
    "userId": "'"$PID"'",
    "messageId": "'"$MESSAGE_ID"'",
    "traits": {
      "city": "Chisinau"
    }
  }'

STATUS="timeout"
FOUND=""

for i in $(seq 1 "$TIMEOUT"); do
  R=$(curl -s -X POST "$BASE_URL/api/admin/users/" \
    -H "Authorization: Bearer $ADMIN_KEY" \
    -H 'Content-Type: application/json' \
    -d '{
      "workspaceId": "'"$WORKSPACE_ID"'",
      "userIds": ["'"$PID"'"],
      "limit": 10
    }')

  if echo "$R" | jq -e '.users[]?.properties[]? | select(.name=="city" and .value=="Chisinau")' >/dev/null 2>&1; then
    FOUND=$(date +%s)
    STATUS="ok"
    break
  fi

  sleep 1
done

[ -z "$FOUND" ] && FOUND=$(date +%s)

LATENCY=$((FOUND - SENT))

echo "$PID,$SENT,$FOUND,$LATENCY,$STATUS" >> "results/e2e-${RUN}.csv"

echo "E2E result:"
cat "results/e2e-${RUN}.csv"
