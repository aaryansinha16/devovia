// Script to update a user's role to ADMIN
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserRole() {
  try {
    // Using an existing user from your database
    const userEmail = 'aaryansinha16@gmail.com'; // This user exists in your database
    
    // Update the user's role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });
    
    console.log('User role updated successfully:', updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole();
