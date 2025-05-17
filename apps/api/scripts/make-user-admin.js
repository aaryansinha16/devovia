// Script to update a user's role and clear browser session storage
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeUserAdmin() {
  try {
    // Using your GitHub OAuth user's email
    const userEmail = 'aaryansinha16@gmail.com'; // Update this if needed
    
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
    console.log('\n---------------------------------------------------');
    console.log('IMPORTANT: To complete the process, please:');
    console.log('1. Log out of your account');
    console.log('2. Clear your browser\'s session storage:');
    console.log('   - Open browser DevTools (F12 or Right-click > Inspect)');
    console.log('   - Go to the "Application" tab');
    console.log('   - Select "Session Storage" on the left');
    console.log('   - Right-click and select "Clear"');
    console.log('3. Log back in using GitHub OAuth');
    console.log('---------------------------------------------------\n');
    
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeUserAdmin();
