# 🚀 Quick Start - GPS Testing

## Setup & Launch

### 1. Start Frontend Dev Server
```bash
cd frontend
npm install        # If needed
npm run dev       # Start Vite dev server
# Opens: http://localhost:5173
```

### 2. Ensure Backend is Running
```bash
# In another terminal
cd [backend folder]
docker-compose up  # Or your backend startup command
```

### 3. Open Frontend in Browser
- Go to: http://localhost:5173
- Sign up or login with credentials
- Dashboard loads

---

## Testing GPS Recording

### Quick Test (Without Moving)
1. Click **"+ Thêm hoạt động"** button
2. Select **"Chạy bộ"** (Running)
3. Full-screen recording opens
4. Click **"Bắt đầu"** (Start)
5. Watch stats update (simulated GPS)
6. Pause after 30 seconds
7. Click **"Kết thúc"** (Stop)
8. Edit title/notes
9. Click **"Lưu buổi tập"**
10. Activity appears on dashboard

### Chrome DevTools Simulation
```
1. Open DevTools (F12)
2. Go to: ⋮ → More tools → Sensors
3. Location section:
   - Override location: Enable
   - Choose a city (e.g., "San Francisco")
4. Run activity recording
5. Check real-time map update
```

### Real Mobile Test
1. Run frontend on local IP (not localhost):
   ```bash
   # Note your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
   npm run dev -- --host 0.0.0.0
   ```
2. Open http://YOUR_IP:5173 on phone
3. Allow GPS permission when prompted
4. Walk/run while recording
5. Watch live map track your route

---

## Verification Checklist

### Recording Interface
- [ ] Three screens visible: Select → Recording → Review
- [ ] Stats update every second
- [ ] Map shows route in real-time
- [ ] Start point marker appears (green)
- [ ] Pause/Resume buttons work
- [ ] Heart rate varies naturally

### Stats Display
- [ ] Time increases correctly
- [ ] Distance increases smoothly
- [ ] Heart rate fluctuates (140±20 bpm range)
- [ ] Pace calculates correctly
- [ ] Calories update based on time
- [ ] Elevation shows gain

### GPS Data
- [ ] GPS points collect during recording
- [ ] Minimum 50+ points for accurate distance
- [ ] Points have lat, lng, timestamp
- [ ] Distance calculated via Haversine
- [ ] Route visible on map

### Splits
- [ ] Splits appear after completing km
- [ ] Each split shows: km, time, pace, HR
- [ ] Split times increase (non-decreasing)
- [ ] Pace improves with consistent running

### Save Flow
- [ ] Title field accepts input
- [ ] Notes field accepts multi-line text
- [ ] Save button shows loading state
- [ ] Activity saved to backend
- [ ] Activity appears on dashboard
- [ ] GPS route stored with activity

---

## Common Issues & Solutions

### "GPS not available"
```
✓ Solution: Open settings → Location services → Enable
✓ Or use Chrome DevTools Sensors simulation
✓ Or wait 30 seconds for GPS fix
```

### "Map stays blank"
```
✓ Check internet (needs to load map tiles)
✓ Try browser refresh
✓ Check console for CORS errors
✓ Verify MapLibre GL working
```

### "Distance/Pace showing 0"
```
✓ GPS might not have fixed yet
✓ Simulate movement using DevTools
✓ Or actually move during recording
✓ Need at least 2 GPS points
```

### "Heart rate stuck at same value"
```
✓ Normal - simulated values update
✓ Check console for errors
✓ Try restarting recording
```

### "Button not responding"
```
✓ Check recording state (icon should animate)
✓ Verify JavaScript not blocked
✓ Try different browser
✓ Check console for errors
```

---

## Debug Mode

### Enable Console Logs
Add to `App.tsx` inside tracking update:
```javascript
console.log("GPS Update:", {
  distanceKm: distanceKm.toFixed(2),
  paceSecsPerKm,
  hrCurrent: stats.hrCurrent,
  pointsCount: gpsPoints.length
});
```

### Monitor Network
1. Open DevTools → Network
2. Start recording
3. Watch for `/activities` POST request
4. Check response payload
5. Verify all fields present

### Memory Profiling
1. DevTools → Performance
2. Start recording
3. Run for 5 minutes
4. Stop and analyze
5. Check for memory leaks

---

## Test Scenarios

### ✅ Scenario 1: Short 1km Run
- Time: ~5 minutes
- Start recording
- Walk/simulate 1km
- Stop, save
- Expected: 1 complete split, good pace display

### ✅ Scenario 2: Interval Training  
- Time: ~10 minutes
- Pause multiple times
- Resume and continue
- Stop, save
- Expected: Multiple pauses recorded correctly

### ✅ Scenario 3: Long Run
- Time: 30+ minutes
- Continuous recording
- Watch multiple splits appear
- Monitor battery/memory
- Stop, save
- Expected: Stable performance, accurate data

### ✅ Scenario 4: GPS Loss Recovery
- Start recording
- Go indoors (GPS loss)
- Go back outdoors
- Recording continues
- Tracks gap correctly
- Stop, save
- Expected: Route shows gap, data preserved

---

## Performance Metrics

### Target Performance
- First GPS fix: < 30 seconds
- Map rendering: < 1 second
- Stats update: Every 1 second
- Memory for 1 hour run: < 50MB
- GPS points/min: ~60 (at 1Hz polling)

### Optimization Tips
- Reduce map complexity on mobile
- Batch state updates
- Use React.memo for components
- Cleanup timers/listeners
- Throttle GPS updates if needed

---

## Cleanup & Reset

### Between Tests
```bash
# Clear localStorage
Open DevTools Console:
localStorage.clear()
```

### Hard Reset
```bash
# Full reset
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Debug Network Issues
```bash
# Check API endpoint
curl http://localhost:8080/api/activities

# Monitor API calls
DevTools → Network → Filter by "activities"
```

---

## Success Indicators ✅

Activity recorded successfully when:
- Dashboard shows new activity row
- Activity displays distance/time/pace
- Clicking activity shows details
- Route visible with GPS points
- Backend has GPS JSON stored
- User feed shows activity (if public)

---

## Next Steps

After testing GPS recording:
1. ✅ Verify all features working
2. Test on multiple devices
3. Test with real workouts
4. Gather user feedback
5. Optimize performance
6. Deploy to production

---

**Ready to test?** Start with `npm run dev` and click "+ Thêm hoạt động"! 🏃💨
