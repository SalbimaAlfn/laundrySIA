import { PrismaClient } from './src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Update the settings
    await prisma.setting.updateMany({
      where: { key: 'shop.name' },
      data: { value: 'Bee Bee Laundry' }
    });
    
    await prisma.setting.updateMany({
      where: { key: 'shop.address' },
      data: { value: 'Jalan Abdul Gani Atas' }
    });
    
    await prisma.setting.updateMany({
      where: { key: 'shop.receipt_footer' },
      data: { value: 'Terima kasih sudah mencuci di Bee Bee Laundry.' }
    });
    
    // Verify the changes
    const settings = await prisma.setting.findMany();
    console.log('Updated settings:');
    settings.forEach(s => console.log(' -', s.key, ':', s.value));
    
    await prisma.$disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
