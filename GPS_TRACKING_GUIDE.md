# 🎯 GPS Tracking Implementation Guide - RunSwim Frontend

## ✅ What's Been Implemented

### 1. **Full-Screen Activity Recording**
A complete activity recording interface similar to Strava with three states:
- **Select Mode**: Choose between Running or Swimming
- **Recording Mode**: Live tracking with real-time stats and map
- **Review Mode**: Summary and final edits before saving

### 2. **Real-Time Stats Display**
During recording, users see live updates:
- ⏱️ **Time**: HH:MM:SS format
- 📏 **Distance**: km (running) or meters (swimming)  
- ❤️ **Heart Rate**: Current BPM (simulated with realistic patterns)
- 🏃 **Pace**: Minutes per km
- 📈 **Elevation**: Meters gained (simulated terrain variation)
- 🔥 **Calories**: Burned during activity
- 📊 **Splits**: Per-kilometer splits with pace and HR data

### 3. **Live Map with Route Visualization**
- Interactive map using MapLibre GL
- Real-time route line (orange)
- Start point marker (green)
- Auto-follows your current position
- Full zoom/pan controls

### 4. **GPS Data Collection**
- High-accuracy GPS tracking (enableHighAccuracy: true)
- Automatic error handling if GPS unavailable
- Stores complete route as JSON
- Timestamps for each GPS point
- Haversine formula for accurate distance calculation

### 5. **Recording Controls**
```
Recording:  [⏸ Pause]  [⏹ Stop]
Paused:     [▶ Resume] [⏹ Stop]
```

### 6. **Heart Rate Simulation**
- Realistic variations (140±20 bpm)
- Pattern-based on distance/effort
- 5-minute rolling average
- Suitable for demo/testing

### 7. **Split Tracking**
- Automatic detection of km completions
- Split time, pace, and heart rate per km
- Visible in review screen
- Helps pace optimization

---

## 🚀 How to Use

### For Running Activity:
```
1. Click "+ Thêm hoạt động" button
2. Select "Chạy bộ" (Running)
3. Recording interface opens full-screen
4. Tap [Start Recording]
5. Run with GPS enabled
6. Real-time stats update every second
7. View live route on map
8. Tap [Pause] to take a break
9. Tap [Resume] to continue or [Stop] to finish
10. Add title and notes in review screen
11. Tap [Save Activity]
```

### For Swimming Activity:
```
1. Click "+ Thêm hoạt động"
2. Select "Bơi lội" (Swimming)
3. Recording interface opens (no map for swimming)
4. Manual entry: distance, time, heart rate, calories
5. Tap [Save Activity]
```

---

## 📊 Technical Details

### GPS Data Structure
```typescript
type GpsPoint = {
  lat: number;      // Latitude
  lng: number;      // Longitude
  ts: number;       // Timestamp (milliseconds)
};

type RecordingStats = {
  distanceM: number;    // Distance in meters
  elev: number;         // Elevation gain
  hrCurrent: number;    // Current heart rate
  hrAvg: number;        // Average heart rate
  splits: Split[];      // Per-km splits
};

type Split = {
  kmNumber: number;     // Split number (1, 2, 3...)
  timeAtKm: number;     // Seconds when this km completed
  paceSeconds: number;  // Pace for this split (sec/km)
  hrAtKm: number;       // Heart rate during this split
};
```

### Distance Calculation
Uses Haversine formula for accuracy:
```
distance = 2R × atan2(√a, √(1-a))
where: a = sin²(Δφ/2) + cos φ1 × cos φ2 × sin²(Δλ/2)
R = 6,371 km (Earth radius)
```

### Heart Rate Simulation
```javascript
hrCurrent = 140 + sin(distance × 0.0003) × 15 + random(8)
```
Creates natural variation based on activity progression.

---

## 🔧 API Integration

### Save Activity Endpoint
```typescript
POST /activities

payload: {
  userId: number;
  athleteName: string;
  sportType: "RUN" | "SWIM";
  title: string;
  description: string;
  durationMinutes: number;
  distanceMeters: number;
  averageHeartRate: number;
  calories: number;
  elevationGainMeters: number;
  gpsRouteJson: string;        // JSON stringified GpsPoint[]
  averagePaceSecondsPerKm: number;
  visibility: "PUBLIC" | "PRIVATE";
  routeName: string;
}
```

---

## 🧪 Testing Guide

### Desktop Browser Testing
1. **With Chrome DevTools**:
   - Open DevTools → Sensors
   - Can simulate GPS locations
   - Useful for testing without moving

2. **Permission Handling**:
   - First access will request geolocation
   - Grant permission to proceed
   - Shows error if permission denied

3. **Demo Mode**:
   - Works offline
   - Simulates GPS with synthetic data
   - All features functional

### Mobile Device Testing
1. **iOS**:
   - App must have location permission
   - Open Chrome/Safari
   - Go to RunSwim web app
   - Grant location permission when prompted
   - Start recording outdoors

2. **Android**:
   - Ensure location services enabled
   - Grant app permission for "While using the app"
   - Requires internet for map tiles

### Performance Testing
- Long recordings (1+ hour):
  - Monitor memory usage
  - Check for memory leaks
  - Verify battery drain
- Multiple rapid start/stop cycles
- GPS signal loss scenarios

---

## 📱 Mobile Responsiveness

### Current Implementation
- Full-screen layout for recording
- Touch-friendly buttons (min 44×44px)
- Readable text at mobile sizes
- Map responsive to screen width

### Recommendations
- Test on various screen sizes
- Verify button accessibility
- Check map gesture handling
- Optimize for one-handed use

---

## 🛠️ Troubleshooting

### GPS Not Working
- ❌ Error: "Trình duyệt không hỗ trợ GPS"
  - ✅ Solution: Use modern browser (Chrome 50+, Safari 13+, Firefox 24+)

- ❌ Error: "Không thể lấy GPS. Bật định vị chính xác."
  - ✅ Solution: 
    - Grant location permission
    - Enable GPS on device
    - Try outdoors (better signal)
    - Wait 30 seconds for first fix

### Map Not Showing
- ❌ Black/blank map
  - ✅ Solution: Check internet connection (needs map tiles)
  - ✅ Try restarting app
  - ✅ Check browser console for errors

### Stats Not Updating
- ❌ Time/distance frozen
  - ✅ Solution: GPS signal may be lost
  - ✅ Move to open area
  - ✅ Check battery saver mode not activated

---

## 🔮 Future Enhancements

### Planned Features
1. **GPX File Import**
   - Load workouts from Garmin/Strava
   - Parse elevation data
   - Import split times

2. **Real Heart Rate Integration**
   - Bluetooth HRM support
   - Polar/Garmin device sync
   - ANT+ protocol

3. **Advanced Analytics**
   - Vo2Max estimation
   - Training zones
   - Power output (cycling)

4. **Offline Mode**
   - Record without internet
   - Sync when reconnected
   - Cached map tiles

5. **Social Features**
   - Live activity sharing
   - Friends tracking
   - Real-time notifications

---

## 📋 File Changes Summary

### Modified: `frontend/src/App.tsx`

**New Components:**
- Enhanced `ActivityModal` with recording states
- Real-time stats calculations
- GPS tracking logic
- Split tracking algorithm
- Map integration

**New Type Definitions:**
```typescript
type Split = { kmNumber, timeAtKm, paceSeconds, hrAtKm }
type RecordingStats = { distanceM, elev, hrCurrent, hrAvg, splits }
```

**New Functions:**
- `parseGpxFile()`: GPX file parser
- `calculateSplits()`: Per-km split calculation
- Real-time state management for GPS

**Preserved:**
- All existing components
- API integration patterns
- UI styling and layout
- Authentication flow

---

## 🎓 Code Examples

### Starting Activity Recording
```jsx
function startRecording() {
  setGpsPoints([]);
  setRecordedSeconds(0);
  setStats({ distanceM: 0, elev: 0, hrCurrent: 140, hrAvg: 135, splits: [] });
  setTrackingState("recording");
}
```

### Calculating Pace
```javascript
const distanceKm = stats.distanceM / 1000;
const paceSecsPerKm = distanceKm > 0.1 
  ? Math.round(recordedSeconds / distanceKm) 
  : 0;
```

### Retrieving GPS Stats
```javascript
const stats = {
  distanceM: calcGpsDistance(gpsPoints),
  elev: calculateElevation(gpsPoints),
  hrCurrent: lastHeartRate,
  hrAvg: averageHeartRate(hrHistory),
  splits: calculateSplits(gpsPoints, recordedSeconds)
};
```

---

## 🔗 Integration Checklist

- ✅ GPS tracking implementation
- ✅ Real-time stats display
- ✅ Live map visualization
- ✅ Heart rate simulation
- ✅ Split tracking
- ✅ Error handling
- ⏳ Backend endpoint testing
- ⏳ Mobile device GPS testing
- ⏳ Performance optimization
- ⏳ Production deployment

---

## 📞 Support & Questions

For issues or questions about GPS tracking:
1. Check browser console for errors
2. Verify GPS permission granted
3. Test with demo mode first
4. Check network connectivity
5. Try different browser
6. Check device GPS hardware

---

**Last Updated**: May 12, 2026  
**Build Status**: ✅ Successful  
**Testing Status**: Ready for QA
