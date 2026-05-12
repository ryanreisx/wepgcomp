import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL!;
const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

const USER_IDS = {
  coordenador: '00000000-0000-0000-0000-000000000001',
  prof1: '00000000-0000-0000-0000-000000000002',
  prof2: '00000000-0000-0000-0000-000000000003',
  profPendente: '00000000-0000-0000-0000-000000000004',
  doc1: '00000000-0000-0000-0000-000000000005',
  doc2: '00000000-0000-0000-0000-000000000006',
  doc3: '00000000-0000-0000-0000-000000000007',
  doc4: '00000000-0000-0000-0000-000000000008',
  doc5: '00000000-0000-0000-0000-000000000009',
  ouvinte1: '00000000-0000-0000-0000-000000000010',
  ouvinte2: '00000000-0000-0000-0000-000000000011',
};

const EDITION_ID = '00000000-0000-0000-0000-100000000001';
const ROOM_IDS = {
  salaA: '00000000-0000-0000-0000-200000000001',
  salaB: '00000000-0000-0000-0000-200000000002',
  salaC: '00000000-0000-0000-0000-200000000003',
};

const BLOCK_IDS = {
  presBlock1: '00000000-0000-0000-0000-300000000001',
  presBlock2: '00000000-0000-0000-0000-300000000002',
  keynote: '00000000-0000-0000-0000-300000000003',
  coffeeBreak: '00000000-0000-0000-0000-300000000004',
};

const SUBMISSION_IDS = Array.from(
  { length: 10 },
  (_, i) =>
    `00000000-0000-0000-0000-400000000${String(i + 1).padStart(3, '0')}`,
);

const PRESENTATION_IDS = Array.from(
  { length: 8 },
  (_, i) =>
    `00000000-0000-0000-0000-500000000${String(i + 1).padStart(3, '0')}`,
);

const CRITERIA_IDS = Array.from(
  { length: 5 },
  (_, i) =>
    `00000000-0000-0000-0000-600000000${String(i + 1).padStart(3, '0')}`,
);

const GUIDANCE_ID = '00000000-0000-0000-0000-700000000001';

async function main() {
  console.log('Seeding database...');

  // ─── Users ──────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@1234', SALT_ROUNDS);
  const defaultPassword = await bcrypt.hash('Senha@1234', SALT_ROUNDS);

  const users = [
    {
      id: USER_IDS.coordenador,
      name: 'Coordenador WEPGCOMP',
      email: 'admin@ufba.br',
      password: adminPassword,
      registrationNumber: '999999',
      profile: 'Professor' as const,
      level: 'Superadmin' as const,
      isActive: true,
      isVerified: true,
    },
    {
      id: USER_IDS.prof1,
      name: 'Prof. Maria Santos',
      email: 'maria.santos@ufba.br',
      password: defaultPassword,
      registrationNumber: '100001',
      profile: 'Professor' as const,
      level: 'Default' as const,
      isActive: true,
      isVerified: true,
    },
    {
      id: USER_IDS.prof2,
      name: 'Prof. Carlos Oliveira',
      email: 'carlos.oliveira@ufba.br',
      password: defaultPassword,
      registrationNumber: '100002',
      profile: 'Professor' as const,
      level: 'Default' as const,
      isActive: true,
      isVerified: true,
    },
    {
      id: USER_IDS.profPendente,
      name: 'Prof. Ana Rodrigues',
      email: 'ana.rodrigues@ufba.br',
      password: defaultPassword,
      registrationNumber: '100003',
      profile: 'Professor' as const,
      level: 'Default' as const,
      isActive: false,
      isVerified: true,
    },
    {
      id: USER_IDS.doc1,
      name: 'Alice Ferreira',
      email: 'alice.ferreira@ufba.br',
      password: defaultPassword,
      registrationNumber: '200001',
      profile: 'DoctoralStudent' as const,
      level: 'Default' as const,
      isActive: true,
      isVerified: true,
    },
    {
      id: USER_IDS.doc2,
      name: 'Bruno Costa',
      email: 'bruno.costa@ufba.br',
      password: defaultPassword,
      registrationNumber: '200002',
      profile: 'DoctoralStudent' as const,
      level: 'Default' as const,
      isActive: true,
      isVerified: true,
    },
    {
      id: USER_IDS.doc3,
      name: 'Carla Mendes',
      email: 'carla.mendes@ufba.br',
      password: defaultPassword,
      registrationNumber: '200003',
      profile: 'DoctoralStudent' as const,
      level: 'Default' as const,
      isActive: true,
      isVerified: true,
    },
    {
      id: USER_IDS.doc4,
      name: 'Daniel Lima',
      email: 'daniel.lima@ufba.br',
      password: defaultPassword,
      registrationNumber: '200004',
      profile: 'DoctoralStudent' as const,
      level: 'Default' as const,
      isActive: true,
      isVerified: true,
    },
    {
      id: USER_IDS.doc5,
      name: 'Elena Souza',
      email: 'elena.souza@ufba.br',
      password: defaultPassword,
      registrationNumber: '200005',
      profile: 'DoctoralStudent' as const,
      level: 'Default' as const,
      isActive: true,
      isVerified: true,
    },
    {
      id: USER_IDS.ouvinte1,
      name: 'Felipe Araújo',
      email: 'felipe.araujo@gmail.com',
      password: defaultPassword,
      profile: 'Listener' as const,
      level: 'Default' as const,
      isActive: true,
      isVerified: true,
    },
    {
      id: USER_IDS.ouvinte2,
      name: 'Gabriela Nunes',
      email: 'gabriela.nunes@gmail.com',
      password: defaultPassword,
      profile: 'Listener' as const,
      level: 'Default' as const,
      isActive: true,
      isVerified: true,
    },
  ];

  for (const u of users) {
    await prisma.userAccount.upsert({
      where: { id: u.id },
      update: { ...u },
      create: { ...u },
    });
  }
  console.log(`  ✓ ${users.length} users`);

  // ─── Event Edition ──────────────────────────────────
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 30);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3);
  const submissionStartDate = new Date();
  submissionStartDate.setDate(submissionStartDate.getDate() - 30);
  const submissionDeadline = new Date(startDate);
  submissionDeadline.setDate(submissionDeadline.getDate() - 7);

  await prisma.eventEdition.upsert({
    where: { id: EDITION_ID },
    update: {},
    create: {
      id: EDITION_ID,
      name: 'WEPGCOMP 2024',
      description:
        'Workshop de Estudantes da Pós-Graduação em Computação da UFBA — Edição 2024.',
      callForPapersText:
        'Submeta seu trabalho para o WEPGCOMP 2024. Aceitamos trabalhos de todas as áreas da Computação.',
      partnersText: 'UFBA, IC-UFBA, PGCOMP',
      location: 'Instituto de Computação — UFBA, Salvador, BA',
      startDate,
      endDate,
      submissionStartDate,
      submissionDeadline,
      isActive: true,
      isEvaluationRestrictToLoggedUsers: true,
      presentationDuration: 20,
      presentationsPerPresentationBlock: 6,
    },
  });
  console.log('  ✓ 1 event edition');

  // ─── Evaluation Criteria ────────────────────────────
  const criteria = [
    {
      id: CRITERIA_IDS[0],
      title: 'Conteúdo',
      description:
        'Avaliação do conteúdo e profundidade do trabalho apresentado.',
    },
    {
      id: CRITERIA_IDS[1],
      title: 'Qualidade e Clareza',
      description:
        'Avaliação da qualidade da apresentação e clareza na comunicação.',
    },
    {
      id: CRITERIA_IDS[2],
      title: 'Relevância ao Tema',
      description:
        'Avaliação da relevância do trabalho para a área de Computação.',
    },
    {
      id: CRITERIA_IDS[3],
      title: 'Solução Proposta',
      description:
        'Avaliação da originalidade e viabilidade da solução proposta.',
    },
    {
      id: CRITERIA_IDS[4],
      title: 'Resultados',
      description: 'Avaliação dos resultados obtidos e sua significância.',
    },
  ];

  for (const c of criteria) {
    await prisma.evaluationCriteria.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, eventEditionId: EDITION_ID },
    });
  }
  console.log(`  ✓ ${criteria.length} evaluation criteria`);

  // ─── Committee Members ──────────────────────────────
  const committeeMembers = [
    {
      eventEditionId: EDITION_ID,
      userId: USER_IDS.coordenador,
      level: 'Coordinator' as const,
      role: 'Organizer' as const,
    },
    {
      eventEditionId: EDITION_ID,
      userId: USER_IDS.prof1,
      level: 'Committee' as const,
      role: 'Organizer' as const,
    },
    {
      eventEditionId: EDITION_ID,
      userId: USER_IDS.prof2,
      level: 'Committee' as const,
      role: 'Reviewer' as const,
    },
    {
      eventEditionId: EDITION_ID,
      userId: USER_IDS.doc1,
      level: 'Committee' as const,
      role: 'Evaluator' as const,
    },
    {
      eventEditionId: EDITION_ID,
      userId: USER_IDS.doc2,
      level: 'Committee' as const,
      role: 'Evaluator' as const,
    },
  ];

  for (const cm of committeeMembers) {
    await prisma.committeeMember.upsert({
      where: {
        eventEditionId_userId: {
          eventEditionId: cm.eventEditionId,
          userId: cm.userId,
        },
      },
      update: {},
      create: cm,
    });
  }
  console.log(`  ✓ ${committeeMembers.length} committee members`);

  // ─── Rooms ──────────────────────────────────────────
  const rooms = [
    {
      id: ROOM_IDS.salaA,
      name: 'Sala A',
      description: 'Auditório principal do IC.',
    },
    {
      id: ROOM_IDS.salaB,
      name: 'Sala B',
      description: 'Sala de seminários do IC.',
    },
    {
      id: ROOM_IDS.salaC,
      name: 'Sala C',
      description: 'Laboratório de apresentações.',
    },
  ];

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { id: r.id },
      update: {},
      create: { ...r, eventEditionId: EDITION_ID },
    });
  }
  console.log(`  ✓ ${rooms.length} rooms`);

  // ─── Presentation Blocks ───────────────────────────
  const blockStart = new Date(startDate);
  blockStart.setHours(9, 0, 0, 0);

  const blocks = [
    {
      id: BLOCK_IDS.presBlock1,
      eventEditionId: EDITION_ID,
      roomId: ROOM_IDS.salaA,
      type: 'Presentation' as const,
      title: 'Sessão de Apresentações I',
      startTime: new Date(blockStart),
      duration: 120,
    },
    {
      id: BLOCK_IDS.presBlock2,
      eventEditionId: EDITION_ID,
      roomId: ROOM_IDS.salaB,
      type: 'Presentation' as const,
      title: 'Sessão de Apresentações II',
      startTime: new Date(blockStart),
      duration: 120,
    },
    {
      id: BLOCK_IDS.keynote,
      eventEditionId: EDITION_ID,
      roomId: ROOM_IDS.salaA,
      type: 'Keynote' as const,
      title: 'Palestra — Avanços em IA',
      speakerName: 'Prof. João da Silva',
      startTime: new Date(blockStart.getTime() + 3 * 60 * 60 * 1000),
      duration: 60,
    },
    {
      id: BLOCK_IDS.coffeeBreak,
      eventEditionId: EDITION_ID,
      type: 'Break' as const,
      title: 'Coffee Break',
      startTime: new Date(blockStart.getTime() + 2 * 60 * 60 * 1000),
      duration: 30,
    },
  ];

  for (const b of blocks) {
    await prisma.presentationBlock.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }
  console.log(`  ✓ ${blocks.length} presentation blocks`);

  // ─── Submissions ────────────────────────────────────
  const advisors = [USER_IDS.prof1, USER_IDS.prof2, USER_IDS.coordenador];
  const docStudents = [
    USER_IDS.doc1,
    USER_IDS.doc2,
    USER_IDS.doc3,
    USER_IDS.doc4,
    USER_IDS.doc5,
  ];

  const submissionData = [
    {
      title: 'Machine Learning aplicado a redes de sensores',
      advisor: 0,
      author: 0,
    },
    { title: 'Análise de sentimentos em redes sociais', advisor: 1, author: 1 },
    { title: 'Otimização de consultas em bancos NoSQL', advisor: 2, author: 2 },
    { title: 'Segurança em IoT: desafios e soluções', advisor: 0, author: 3 },
    {
      title: 'Processamento de linguagem natural para português',
      advisor: 1,
      author: 4,
    },
    {
      title: 'Computação em nuvem para aplicações científicas',
      advisor: 2,
      author: 0,
    },
    { title: 'Blockchain e contratos inteligentes', advisor: 0, author: 1 },
    {
      title: 'Visão computacional para diagnóstico médico',
      advisor: 1,
      author: 2,
    },
    {
      title: 'Algoritmos de grafos para redes complexas',
      advisor: 2,
      author: 3,
    },
    {
      title: 'Engenharia de software para sistemas embarcados',
      advisor: 0,
      author: 4,
    },
  ];

  for (let i = 0; i < submissionData.length; i++) {
    const s = submissionData[i];
    await prisma.submission.upsert({
      where: { id: SUBMISSION_IDS[i] },
      update: {},
      create: {
        id: SUBMISSION_IDS[i],
        advisorId: advisors[s.advisor],
        mainAuthorId: docStudents[s.author],
        eventEditionId: EDITION_ID,
        title: s.title,
        abstract: `Resumo do trabalho: ${s.title}. Este trabalho apresenta contribuições significativas para a área.`,
        pdfFile: `uploads/submissions/${SUBMISSION_IDS[i]}/paper.pdf`,
        phoneNumber: `7199${String(i + 1).padStart(7, '0')}`,
        status: 'Submitted',
      },
    });
  }
  console.log(`  ✓ ${submissionData.length} submissions`);

  // ─── Presentations ─────────────────────────────────
  const presentationAssignments = [
    { blockId: BLOCK_IDS.presBlock1, submissionIdx: 0, position: 1 },
    { blockId: BLOCK_IDS.presBlock1, submissionIdx: 1, position: 2 },
    { blockId: BLOCK_IDS.presBlock1, submissionIdx: 2, position: 3 },
    { blockId: BLOCK_IDS.presBlock1, submissionIdx: 3, position: 4 },
    { blockId: BLOCK_IDS.presBlock2, submissionIdx: 4, position: 1 },
    { blockId: BLOCK_IDS.presBlock2, submissionIdx: 5, position: 2 },
    { blockId: BLOCK_IDS.presBlock2, submissionIdx: 6, position: 3 },
    { blockId: BLOCK_IDS.presBlock2, submissionIdx: 7, position: 4 },
  ];

  for (let i = 0; i < presentationAssignments.length; i++) {
    const a = presentationAssignments[i];
    await prisma.presentation.upsert({
      where: { id: PRESENTATION_IDS[i] },
      update: {},
      create: {
        id: PRESENTATION_IDS[i],
        submissionId: SUBMISSION_IDS[a.submissionIdx],
        presentationBlockId: a.blockId,
        positionWithinBlock: a.position,
        status: 'Scheduled',
      },
    });
  }
  console.log(`  ✓ ${presentationAssignments.length} presentations`);

  // ─── Panelists ──────────────────────────────────────
  const panelistAssignments = [
    { blockId: BLOCK_IDS.presBlock1, userId: USER_IDS.coordenador },
    { blockId: BLOCK_IDS.presBlock1, userId: USER_IDS.prof1 },
    { blockId: BLOCK_IDS.presBlock2, userId: USER_IDS.prof2 },
  ];

  for (const p of panelistAssignments) {
    const existing = await prisma.panelist.findFirst({
      where: { presentationBlockId: p.blockId, userId: p.userId },
    });
    if (!existing) {
      await prisma.panelist.create({ data: p });
    }
  }
  console.log(`  ✓ ${panelistAssignments.length} panelists`);

  // ─── Guidance ───────────────────────────────────────
  await prisma.guidance.upsert({
    where: { id: GUIDANCE_ID },
    update: {},
    create: {
      id: GUIDANCE_ID,
      eventEditionId: EDITION_ID,
      summary:
        'O WEPGCOMP é o Workshop de Estudantes da Pós-Graduação em Computação da UFBA, realizado anualmente.',
      authorGuidance:
        'Autores devem preparar uma apresentação de no máximo 20 minutos, seguida de 5 minutos para perguntas. O trabalho deve ser submetido em formato PDF via portal.',
      reviewerGuidance:
        'Avaliadores devem avaliar os trabalhos com base nos critérios definidos para a edição. Cada critério possui uma escala de 1 a 5 estrelas.',
      audienceGuidance:
        'A audiência pode participar avaliando as apresentações pelo portal. Basta acessar a página de avaliação e atribuir notas aos critérios disponíveis.',
    },
  });
  console.log('  ✓ 1 guidance');

  // ─── Bookmarks ──────────────────────────────────────
  const bookmarks = [
    { userId: USER_IDS.ouvinte1, presentationId: PRESENTATION_IDS[0] },
    { userId: USER_IDS.ouvinte1, presentationId: PRESENTATION_IDS[3] },
    { userId: USER_IDS.ouvinte2, presentationId: PRESENTATION_IDS[1] },
    { userId: USER_IDS.ouvinte2, presentationId: PRESENTATION_IDS[5] },
  ];

  for (const b of bookmarks) {
    await prisma.presentation.update({
      where: { id: b.presentationId },
      data: {
        bookmarkedUsers: { connect: { id: b.userId } },
      },
    });
  }
  console.log(`  ✓ ${bookmarks.length} bookmarks`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
