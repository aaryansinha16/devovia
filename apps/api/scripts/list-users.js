// Script to list all users in the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAllUsers() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isVerified: true,
      },
    });
    
    console.log('Users in the database:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.username}) - Role: ${user.role}`);
    });
    
    console.log(`\nTotal users: ${users.length}`);
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers();
