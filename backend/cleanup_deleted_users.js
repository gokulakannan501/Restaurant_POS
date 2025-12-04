/**
 * Cleanup Script for Deleted Users
 * 
 * This script renames email and mobile for deleted users to free them up for reuse.
 * Run this when you get "User with this email or mobile already exists" error.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDeletedUsers() {
    console.log('🔍 Looking for deleted users with conflicting email/mobile...\n');

    try {
        // Find all deleted users
        const deletedUsers = await prisma.user.findMany({
            where: {
                isDeleted: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true
            }
        });

        if (deletedUsers.length === 0) {
            console.log('✅ No deleted users found. Database is clean!');
            return;
        }

        console.log(`Found ${deletedUsers.length} deleted user(s):\n`);
        deletedUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Mobile: ${user.mobile || 'None'}`);
            console.log('');
        });

        console.log('🔧 Renaming email and mobile for all deleted users...\n');

        // Update each deleted user
        const timestamp = Date.now();
        const updatePromises = deletedUsers.map((user, index) => {
            const uniqueTimestamp = timestamp + index; // Ensure uniqueness
            return prisma.user.update({
                where: { id: user.id },
                data: {
                    email: `deleted_${uniqueTimestamp}_${user.email}`,
                    mobile: user.mobile ? `deleted_${uniqueTimestamp}_${user.mobile}` : null
                }
            });
        });

        await Promise.all(updatePromises);

        console.log(`✅ Successfully cleaned up ${deletedUsers.length} deleted user(s)!`);
        console.log('\n📝 You can now create new users with the same email/mobile.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

cleanupDeletedUsers()
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    });
