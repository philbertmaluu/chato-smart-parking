## Frontend camera polling (LAN-only)

When the operator machine is on the same network as the camera, the frontend can poll the camera directly and push detections to the backend.

- Enable with `NEXT_PUBLIC_CAMERA_FRONTEND_POLLING_ENABLED=true`.
- Optional: `NEXT_PUBLIC_CAMERA_FRONTEND_POLLING_INTERVAL_MS=4000` (default 4000).
- Optional: `NEXT_PUBLIC_CAMERA_COMPUTER_ID=1` (matches the camera `computerid` query param).

Gate/device requirements:
- The selected gate must have an active device of `device_type === "camera"` with `ip_address` (and `http_port` if not 80).

Behavior:
- The browser pulls detections from the camera and POSTs only new ones to `/camera-detection/store`, including the gate id so the backend routes them to the correct operator gate.
- Detections are deduped per gate using localStorage.

Verification (manual):
- Open Operator Entry with a selected gate + camera device; confirm live feed still works.
- With polling enabled, watch network calls to the camera `jsonlastresults` endpoint and the backend `/camera-detection/store`.
- Trigger a plate on the camera; expect a toast “Local camera detected …” and see the log appear in Admin Detection Logs (after backend sync) and pending queues on operator pages.
- Refresh the page; the same detection should not re-post (dedupe persists via localStorage).