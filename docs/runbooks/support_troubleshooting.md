# Ekaguru Support Runbook

## 🆘 Critical Issue: "My child is stuck/frustrated"

**Likely Cause**: The Struggle Agent is not providing the right scaffold, or the Fear Index is too high without triggering a break.

**Troubleshooting Steps**:
1.  **Check Fear Index**:
    - Go to Grafana Dashboard (`http://localhost:3000/d/learning-health`).
    - Look at the "Fear Index" gauge.
    - If > 0.8, the system *should* have triggered a "Compassionate" response.

2.  **Verify Avatar State**:
    - Check the `avatar_controller` logs: `kubectl logs -l app=avatar-controller`
    - Look for `Transitioning to state: COMPASSIONATE`.
    - If missing, restart the avatar pod: `kubectl rollout restart deployment/avatar-controller`

3.  **Manual Override (Admin API)**:
    - If the AI is stuck, reset the student state via API:
    ```bash
    curl -X POST http://api.ekaguru.com/memory/v1/state/reset \
      -d '{"student_id": "student_123", "reason": "parent_request"}'
    ```

---

## 🐛 Bug: "Dashboard shows no data"

**Likely Cause**: Analytics aggregation failed or MongoDB is down.

**Troubleshooting Steps**:
1.  **Check MongoDB**:
    - `kubectl get pods -n cognitive-data` -> Ensure `mongodb-0` is Running.

2.  **Check CronJob**:
    - `kubectl get cronjobs` -> `analytics-aggregator`
    - Run manually: `kubectl create job --from=cronjob/analytics-aggregator manual-001`

3.  **Inspect Logs**:
    - `kubectl logs -l app=memory-service | grep "Analytics error"`
