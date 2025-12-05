-- Fix Existing Attendance Records
-- This script adds checkout times to all PRESENT attendance records that are missing them
-- Run this ONCE after deploying the hours calculation fix

-- Update all PRESENT records that have checkIn but no checkOut
-- Sets checkout to 8 hours after checkin (standard work day)
UPDATE "Attendance"
SET "checkOut" = 
    CASE 
        WHEN EXTRACT(HOUR FROM "checkIn") = 9 THEN 
            -- If check-in is at 9:00 AM, set checkout to 5:00 PM same day
            DATE_TRUNC('day', "checkIn") + INTERVAL '17 hours'
        ELSE 
            -- Otherwise, add 8 hours to checkin time
            "checkIn" + INTERVAL '8 hours'
    END,
    "updatedAt" = NOW()
WHERE status = 'PRESENT' 
  AND "checkIn" IS NOT NULL 
  AND "checkOut" IS NULL;

-- Verify the update
SELECT 
    id,
    "userId",
    date,
    status,
    "checkIn",
    "checkOut",
    EXTRACT(EPOCH FROM ("checkOut" - "checkIn")) / 3600 as hours_worked
FROM "Attendance"
WHERE status = 'PRESENT'
ORDER BY date DESC
LIMIT 20;
