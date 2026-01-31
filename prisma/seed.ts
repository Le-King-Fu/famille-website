import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Créer l'administrateur
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mafamillelandry.ca' },
    update: {},
    create: {
      email: 'admin@mafamillelandry.ca',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Landry',
      role: 'ADMIN',
    },
  })
  console.log('Admin créé:', admin.email)

  // Créer les questions de sécurité par défaut
  const securityQuestions = [
    { question: 'Quel est le prénom de la grand-mère maternelle ?', answer: 'marie', order: 1 },
    { question: 'Dans quelle ville les grands-parents se sont-ils rencontrés ?', answer: 'montreal', order: 2 },
    { question: 'Quel est le plat préféré de Mamie pour Noël ?', answer: 'tourtiere', order: 3 },
  ]

  for (const q of securityQuestions) {
    await prisma.securityQuestion.upsert({
      where: { id: q.order.toString() },
      update: {
        question: q.question,
        answer: q.answer.toLowerCase(),
        order: q.order,
      },
      create: {
        id: q.order.toString(),
        question: q.question,
        answer: q.answer.toLowerCase(),
        order: q.order,
        isActive: true,
      },
    })
  }
  console.log('Questions de sécurité créées')

  // Créer les catégories du forum
  const forumCategories = [
    { name: 'Général', description: 'Discussions générales', order: 1 },
    { name: 'Recettes', description: 'Partage de recettes familiales', order: 2 },
    { name: 'Souvenirs', description: 'Histoires et anecdotes de famille', order: 3 },
    { name: 'Organisation', description: 'Planification d\'événements', order: 4 },
  ]

  for (const cat of forumCategories) {
    await prisma.forumCategory.upsert({
      where: { id: cat.order.toString() },
      update: {
        name: cat.name,
        description: cat.description,
        order: cat.order,
      },
      create: {
        id: cat.order.toString(),
        name: cat.name,
        description: cat.description,
        order: cat.order,
      },
    })
  }
  console.log('Catégories du forum créées')

  // Créer un code d'invitation de test
  const invitationCode = await prisma.invitationCode.upsert({
    where: { code: 'FAMILLE-2024' },
    update: {},
    create: {
      code: 'FAMILLE-2024',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
      createdById: admin.id,
    },
  })
  console.log('Code d\'invitation créé:', invitationCode.code)

  console.log('Seeding terminé!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
