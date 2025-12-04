/**
 * Attendance Debug & Fix Script
 * 
 * This script helps diagnose and fix attendance issues.
 * Run this on your production database to:
 * 1. Check the schema for default values
 * 2. List today's attendance records
 * 3. Optionally fix any incorrect records
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAttendance() {
    console.log('=== Attendance Debug Script ===\n');

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Checking attendance for: ${today.toISOString().split('T')[0]}`);
    console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}\n`);

    // Fetch today's records
    const records = await prisma.attendance.findMany({
        where: {
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    console.log(`Found ${records.length} attendance record(s) for today:\n`);

    records.forEach((record, index) => {
        console.log(`${index + 1}. ${record.user.name} (${record.user.email})`);
        console.log(`   Status: ${record.status}`);
        console.log(`   Date: ${record.date.toISOString()}`);
        console.log(`   Created: ${record.createdAt.toISOString()}`);
        console.log(`   Updated: ${record.updatedAt.toISOString()}`);
        console.log(`   Notes: ${record.notes || 'None'}`);
        console.log('');
    });

    // Check for any records that might have been auto-set to PRESENT
    const suspiciousRecords = records.filter(r =>
        r.status === 'PRESENT' &&
        r.notes === '' &&
        Math.abs(r.createdAt.getTime() - r.updatedAt.getTime()) < 1000
    );

    if (suspiciousRecords.length > 0) {
        console.log(`⚠️  Warning: Found ${suspiciousRecords.length} record(s) that might have been auto-set to PRESENT`);
        console.log('These records were created with PRESENT status and no notes.\n');
    }

    console.log('=== Schema Check ===');
    console.log('To verify the schema has no default value for status:');
    console.log('Run: npx prisma db pull');
    console.log('Then check schema.prisma line ~197 for: status String (no @default)\n');

    console.log('=== To Fix Issues ===');
    console.log('1. Ensure latest code is deployed to Render');
    console.log('2. Check Render logs for "prisma db push" success');
    console.log('3. Manually update incorrect records via the UI');
    console.log('4. Or delete today\'s records and re-mark attendance\n');
}

debugAttendance()
    .catch(e => {
        console.error('Error:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
