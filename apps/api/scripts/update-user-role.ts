// Script to update a user's role to ADMIN
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserRole() {
  try {
    // Replace with the email of the user you want to update
    const userEmail = 'aaryansinha16@gmail.com'; // ← Change this to your user's email

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
