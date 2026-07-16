import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, QuestionKind } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Languages
  const [en, kn, hi] = await Promise.all([
    prisma.language.upsert({ where: { code: 'EN' }, update: {}, create: { code: 'EN', name: 'English' } }),
    prisma.language.upsert({ where: { code: 'KN' }, update: {}, create: { code: 'KN', name: 'Kannada' } }),
    prisma.language.upsert({ where: { code: 'HI' }, update: {}, create: { code: 'HI', name: 'Hindi' } }),
  ]);
  console.log('✅ Languages');

  // Designations
  const [teamMember,
       teamLeader,
  groupLeader,
  seniorGroupLeader,
  engineer,
  seniorEngineer,
  assistantManager,
  deputyManager,
  manager,
  generalManager,
  executiveVicePresident,
  vicePresident,
  director,
  managingDirector,
  ] = await Promise.all([
    prisma.designation.upsert({ where: { code: 'TEAM_MEMBER' }, update: {}, create: { code: 'TEAM_MEMBER', name: 'Team Member', description: 'General team member', sortOrder: 1 } }),
    prisma.designation.upsert({ where: { code: 'TEAM_LEADER' }, update: {}, create: { code: 'TEAM_LEADER', name: 'Team Leader', description: 'Lead of a team', sortOrder: 2 } }),
    prisma.designation.upsert({ where: { code: 'GROUP_LEADER' }, update: {}, create: { code: 'GROUP_LEADER', name: 'Group Leader', description: 'Lead of a group', sortOrder: 3 } }),
    prisma.designation.upsert({ where: { code: 'SNR_GROUP_LEADER' }, update: {}, create: { code: 'SNR_GROUP_LEADER', name: 'Senior Group Leader', description: 'Senior lead of a group', sortOrder: 4 } }),
    prisma.designation.upsert({ where: { code: 'ENGINEER' }, update: {}, create: { code: 'ENGINEER', name: 'Engineer', description: 'Technical specialist', sortOrder: 5 } }),
    prisma.designation.upsert({ where: { code: 'SNR_ENGINEER' }, update: {}, create: { code: 'SNR_ENGINEER', name: 'Senior Engineer', description: 'Senior technical specialist', sortOrder: 6 } }),
    prisma.designation.upsert({ where: { code: 'AST_MANAGER' }, update: {}, create: { code: 'AST_MANAGER', name: 'Assistant Manager', description: 'Supporting manager', sortOrder: 7 } }),
    prisma.designation.upsert({ where: { code: 'DEPUTY_MANAGER' }, update: {}, create: { code: 'DEPUTY_MANAGER', name: 'Deputy Manager', description: 'Supporting manager', sortOrder: 8 } }),
    prisma.designation.upsert({ where: { code: 'MANAGER' }, update: {}, create: { code: 'MANAGER', name: 'Manager', description: 'General manager', sortOrder: 9 } }),
    prisma.designation.upsert({ where: { code: 'GNRL_MANAGER' }, update: {}, create: { code: 'GNRL_MANAGER', name: 'General Manager', description: 'Overall manager', sortOrder: 10 } }),
    prisma.designation.upsert({ where: { code: 'EVP' }, update: {}, create: { code: 'EVP', name: 'Executive Vice President', description: 'Executive vice president', sortOrder: 11 } }),
    prisma.designation.upsert({ where: { code: 'VP' }, update: {}, create: { code: 'VP', name: 'Vice President', description: 'Vice president', sortOrder: 12 } }),
    prisma.designation.upsert({ where: { code: 'DRCTR' }, update: {}, create: { code: 'DRCTR', name: 'Director', description: 'Director', sortOrder: 13 } }),
    prisma.designation.upsert({ where: { code: 'MD' }, update: {}, create: { code: 'MD', name: 'Managing Director', description: 'Managing director', sortOrder: 14 } }),

  ]);
  console.log('✅ Designations');

  // Lines
  const [ptEd, sealer, primerTopCoat,repairOffline,inspection, qbi,qe,pes] = await Promise.all([
    prisma.line.upsert({ where: { code: 'PT_ED' }, update: {}, create: { code: 'PT_ED', name: 'PT ED Line', sortOrder: 1 } }),
    prisma.line.upsert({ where: { code: 'SEALER' }, update: {}, create: { code: 'SEALER', name: 'Sealer Line', sortOrder: 2 } }),
    prisma.line.upsert({ where: { code: 'PRMR_TP_COAT' }, update: {}, create: { code: 'PRMR_TP_COAT', name: 'Primer & Top Coat Line', sortOrder: 3 } }),
    prisma.line.upsert({ where: { code: 'REPAIR_OFFLINE' }, update: {}, create: { code: 'REPAIR_OFFLINE', name: 'Repair & Offline Line', sortOrder: 4 } }),
    prisma.line.upsert({ where: { code: 'INSPECTION' }, update: {}, create: { code: 'INSPECTION', name: 'Inspection Line', sortOrder: 5 } }),
    prisma.line.upsert({ where: { code: 'QBI' }, update: {}, create: { code: 'QBI', name: 'QBI Line', sortOrder: 6 } }),
    prisma.line.upsert({ where: { code: 'QE' }, update: {}, create: { code: 'QE', name: 'QE Line', sortOrder: 7 } }),
    prisma.line.upsert({ where: { code: 'PES' }, update: {}, create: { code: 'PES', name: 'PES Line', sortOrder: 8 } }),
  ]);
  console.log('✅ Lines');

  // Plants
  const [p1, p2, p3, p4, p5] = await Promise.all([
    prisma.plant.upsert({ where: { code: 'PLANT_001' }, update: {}, create: { code: 'PLANT_001', name: 'P1', location: 'Bangalore, India', description: 'Primary paint shop facility with all production lines', sortOrder: 1 } }),
    prisma.plant.upsert({ where: { code: 'PLANT_002' }, update: {}, create: { code: 'PLANT_002', name: 'P2', location: 'Chennai, India', description: 'Secondary facility for assembly and finishing', sortOrder: 2 } }),
    prisma.plant.upsert({ where: { code: 'PLANT_003' }, update: {}, create: { code: 'PLANT_003', name: 'P3', location: 'Chennai, India', description: 'Secondary facility for assembly and finishing', sortOrder: 3 } }),
    prisma.plant.upsert({ where: { code: 'PLANT_004' }, update: {}, create: { code: 'PLANT_004', name: 'P4', location: 'Chennai, India', description: 'Secondary facility for assembly and finishing', sortOrder: 4 } }),
    prisma.plant.upsert({ where: { code: 'PLANT_005' }, update: {}, create: { code: 'PLANT_005', name: 'LC', location: 'Chennai, India', description: 'Secondary facility for assembly and finishing', sortOrder: 5 } }),
  ]);
  console.log('✅ Plants');

  // Participant Types
  const [employee, contractor] = await Promise.all([
    prisma.participantType.upsert({ where: { code: 'EMPLOYEE' }, update: {}, create: { code: 'EMPLOYEE', name: 'Employee', sortOrder: 1 } }),
    prisma.participantType.upsert({ where: { code: 'CONTRACTOR' }, update: {}, create: { code: 'CONTRACTOR', name: 'Contractor', sortOrder: 2 } }),
  ]);
  console.log('✅ Participant Types');

  // Default Admin
  const defaultAdminEmail    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@tkm.co.in';
  const defaultAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-please';
  const defaultAdminName     = process.env.SEED_ADMIN_NAME     ?? 'Default Admin';

  const passwordHash = await bcrypt.hash(defaultAdminPassword, 10);
  await prisma.admin.upsert({
    where:  { email: defaultAdminEmail },
    update: { name: defaultAdminName },                                // never overwrite passwordHash on re-seed
    create: { email: defaultAdminEmail, passwordHash, name: defaultAdminName, role: 'SUPER_ADMIN' },
  });
  console.log(`✅ Admin (${defaultAdminEmail}) — password: ${defaultAdminPassword === 'change-me-please' ? defaultAdminPassword + ' (CHANGE THIS)' : '***'}`);

  // Report Recipients

//   "
// 
// 
// 
// 
// "
  const reportRecipients = [
    {
      email: 'thejashree_tkm@toyota-kirloskar.co.in',
      name: 'Thejashree',
      notes: 'All Type',
      access: [
        { reportType: 'DAILY' as const, enabled: true },
        { reportType: 'WEEKLY' as const, enabled: true },
        { reportType: 'MONTHLY' as const, enabled: true },
      ],
    },
    {
      email: 'pareexit_nayak@toyota-kirloskar.co.in',
      name: 'Pareexit Nayak',
      notes: 'Daily + Weekly',
      access: [
        { reportType: 'DAILY' as const, enabled: true },
        { reportType: 'WEEKLY' as const, enabled: true },
        { reportType: 'MONTHLY' as const, enabled: false },
      ],
    },
    {
      email: 'senthil_raja@toyota-kirloskar.co.in',
      name: 'Senthil Raja',
      notes: 'Weekly + Monthly',
      access: [
        { reportType: 'DAILY' as const, enabled: false },
        { reportType: 'WEEKLY' as const, enabled: true },
        { reportType: 'MONTHLY' as const, enabled: true },
      ],
    },
     {
      email: 'karthik_basavaraj@toyota-kirloskar.co.in',
      name: 'Karthik Basavaraj',
      notes: 'Weekly + Monthly',
      access: [
        { reportType: 'DAILY' as const, enabled: false },
        { reportType: 'WEEKLY' as const, enabled: true },
        { reportType: 'MONTHLY' as const, enabled: true },
      ],
    },
     {
      email: 'jeetendradoshi@toyota-kirloskar.co.in',
      name: 'Jeetendra Doshi',
      notes: 'Weekly + Monthly',
      access: [
        { reportType: 'DAILY' as const, enabled: false },
        { reportType: 'WEEKLY' as const, enabled: true },
        { reportType: 'MONTHLY' as const, enabled: true },
      ],
    },
     {
      email: 'srinivasd@toyota-kirloskar.co.in',
      name: 'Srinivas D',
      notes: 'Weekly + Monthly',
      access: [
        { reportType: 'DAILY' as const, enabled: false },
        { reportType: 'WEEKLY' as const, enabled: true },
        { reportType: 'MONTHLY' as const, enabled: true },
      ],
    },
  ];

  for (const r of reportRecipients) {
    const recipient = await prisma.reportRecipient.upsert({
      where: { email: r.email },
      update: { name: r.name, notes: r.notes, isActive: true },
      create: {
        email: r.email,
        name: r.name,
        notes: r.notes,
        isActive: true,
      },
    });

    for (const access of r.access) {
      await prisma.reportAccess.upsert({
        where: {
          recipientId_reportType: {
            recipientId: recipient.id,
            reportType: access.reportType,
          },
        },
        update: { enabled: access.enabled },
        create: {
          recipientId: recipient.id,
          reportType: access.reportType,
          enabled: access.enabled,
        },
      });
    }
  }
  console.log('Report Recipients + Access');

  // Performance Levels
  await Promise.all([
    prisma.performanceLevel.upsert({ where: { code: 'EXCELLENT' }, update: {}, create: { code: 'EXCELLENT', name: 'Excellent', minScore: 90, maxScore: 100, color: '#22c55e' } }),
    prisma.performanceLevel.upsert({ where: { code: 'GOOD' }, update: {}, create: { code: 'GOOD', name: 'Good', minScore: 70, maxScore: 89.99, color: '#3b82f6' } }),
    prisma.performanceLevel.upsert({ where: { code: 'AVERAGE' }, update: {}, create: { code: 'AVERAGE', name: 'Average', minScore: 50, maxScore: 69.99, color: '#f59e0b' } }),
    prisma.performanceLevel.upsert({ where: { code: 'NEEDS_IMPROVEMENT' }, update: {}, create: { code: 'NEEDS_IMPROVEMENT', name: 'Needs Improvement', minScore: 0, maxScore: 49.99, color: '#ef4444' } }),
  ]);
  console.log('✅ Performance Levels');

  // Sample Participants
  const participants = [
    { code: 'EMP001', name: 'Rajesh Kumar', designationId: teamMember.id, lineId: ptEd.id, participantTypeId: employee.id, plantId: p1.id },
    { code: 'EMP002', name: 'Priya Sharma', designationId: teamMember.id, lineId: sealer.id, participantTypeId: employee.id, plantId: p1.id },
    { code: 'EMP003', name: 'Arun Nair', designationId: groupLeader.id, lineId: sealer.id, participantTypeId: employee.id, plantId: p1.id },
    { code: 'TRN001', name: 'Vikram Singh', designationId: teamMember.id, lineId: repairOffline.id, participantTypeId: contractor.id, plantId: p2.id },
    { code: 'CON001', name: 'Suresh Reddy', designationId: manager.id, lineId: qbi.id, participantTypeId: contractor.id, plantId: p1.id },
  ];

  for (const p of participants) {
    await prisma.participant.upsert({ where: { code: p.code }, update: {}, create: p });
  }
  console.log('✅ Participants');

  // Game: Paint Shop Process Flow (Phaser game on the second kiosk)
  const flow = await prisma.gameFlow.upsert({
    where: { code: 'PAINT_SHOP_FLOW' },
    update: {},
    create: {
      code: 'PAINT_SHOP_FLOW',
      name: 'Paint Shop Process Flow',
      description: 'Identify the correct next process in the car painting line',
      pointsPerCorrect: 20,
      penaltyPerWrong: 10, // set to 2.5 to enable negative marking
      penaltyPerHint: 15,
      maxWrongAttempts: 3,
    },
  });
  console.log('✅ Game Flow');

  // Judgement bands — absolute scores; adjust to your final maxScore.
  const bands = [
    {
      code: 'EXCELLENT',
      name: 'Excellent',
      minScore: 45,
      maxScore: 9999,
      color: '#22c55e',
      certificateEligible: true,
    },
    {
      code: 'GOOD',
      name: 'Good',
      minScore: 30,
      maxScore: 44.99,
      color: '#3b82f6',
      certificateEligible: false,
    },
    {
      code: 'NEEDS_IMPROVEMENT',
      name: 'Needs Improvement',
      minScore: 0,
      maxScore: 29.99,
      color: '#ef4444',
      certificateEligible: false,
    },
  ];
  for (const b of bands) {
    await prisma.gameJudgementBand.upsert({
      where: { flowId_code: { flowId: flow.id, code: b.code } },
      update: {},
      create: { flowId: flow.id, ...b },
    });
  }
  console.log('✅ Game Judgement Bands');

  // Each "stage" is one screen the trainee plays. It splits into two records:
  //   • a GameProcess (answer catalog entry — its name + what applying it does)
  //   • a GameQuestion (the screen — the state shown + the question asked)
  // For a PROCESS_PICK screen the correct answer is the stage's OWN process
  // (e.g. the dusty-car screen → Degreasing). COLOUR_PICK / CONFIRM screens are
  // shown but not process-scored (correctProcess is null). `purposes` become the
  // process's progressive hints (order 1 → shown after 1st wrong, etc.).
  const stages: {
    stepNo: number;
    code: string;
    kind: QuestionKind;
    name: string;
    questionText: string;
    initialVisualText: string;
    carVisualBefore: string;
    carVisualAfter: string;
    animationFeedback: string;
    developerNotes: string;
    purposes: string[];
  }[] = [
    {
      stepNo: 1,
      code: 'DEGREASING',
      kind: QuestionKind.PROCESS_PICK,
      name: 'Degreasing',
      questionText: 'What is the ideal next process?',
      initialVisualText: 'Dusty, oily, unclean car from Weld Shop',
      carVisualBefore: 'initial',
      carVisualAfter: 'degreasing',
      animationFeedback: 'Car dips in degreasing bath → dirt/oil washed off',
      developerNotes:
        'Greasy, dull surface with oil drips. Bath process: car dips in hot soap solution.',
      purposes: [
        'Removes oils, dirt, and grease',
        'Prepares surface for ED',
        'Ensures adhesion in next steps',
      ],
    },
    {
      stepNo: 2,
      code: 'PHOSPHATING',
      kind: QuestionKind.PROCESS_PICK,
      name: 'Surface Conditioning & Phosphating',
      questionText: 'What is the next process?',
      initialVisualText: 'Cleaned car post degreasing',
      carVisualBefore: 'degreasing',
      carVisualAfter: 'phosphate',
      animationFeedback:
        'Car dips into green water bath → turns matte greenish',
      developerNotes:
        'Bubbling tank visuals, slight surface texture change to smooth.',
      purposes: [
        'Converts metal surface chemically',
        'Creates crystalline layer for ED adhesion',
        'Enhances corrosion resistance',
      ],
    },
    {
      stepNo: 3,
      code: 'ED',
      kind: QuestionKind.PROCESS_PICK,
      name: 'Electrodeposition (ED)',
      questionText: 'What comes next?',
      initialVisualText: 'Phosphated car appears',
      carVisualBefore: 'phosphate',
      carVisualAfter: 'ed',
      animationFeedback: 'Car dips in tank → solid grey cathodic coat',
      developerNotes: 'Electro-bath animation, slight glow effect post ED.',
      purposes: [
        'Applies anti-corrosion coat',
        'Uses electric charge to coat evenly',
        'Reaches complex surfaces & corners',
      ],
    },
    {
      stepNo: 4,
      code: 'OVEN_BAKE_1',
      kind: QuestionKind.PROCESS_PICK,
      name: 'Oven Bake 1',
      questionText: 'What is the next process?',
      initialVisualText: 'Car with full ED coat',
      carVisualBefore: 'ed',
      carVisualAfter: 'oven_1',
      animationFeedback: 'Car enters oven → heat waves cure the coating',
      developerNotes: 'Oven animation, heat shimmer, moisture evaporates.',
      purposes: [
        'Cures ED coating',
        'Evaporates residual moisture',
        'Ensures hard, durable finish',
      ],
    },
    {
      stepNo: 5,
      code: 'SEALER',
      kind: QuestionKind.PROCESS_PICK,
      name: 'Sealer & Pre-heat Oven',
      questionText: 'Next process after ED?',
      initialVisualText: 'Cured ED car',
      carVisualBefore: 'oven_1',
      carVisualAfter: 'sealer',
      animationFeedback: 'Sealer applied → underbody & gaps coated',
      developerNotes:
        'Seam highlighting, underbody focus, water-leak animation.',
      purposes: [
        'Seals joints and welds',
        'Prevents water leak',
        'Reduces NVH (Noise, Vibration, Harshness)',
      ],
    },
    {
      stepNo: 6,
      code: 'BODY_PREP',
      kind: QuestionKind.PROCESS_PICK,
      name: 'Body Preparation Zone',
      questionText: 'What is the next process?',
      initialVisualText: 'ED + Sealer-applied car',
      carVisualBefore: 'sealer',
      carVisualAfter: 'body_prep',
      animationFeedback: 'Wiping animation across full body → dust removed',
      developerNotes: 'Tack-wipe motion, zero-dust emphasis.',
      purposes: [
        'Wiping on full body',
        'Ensure zero dust / contamination',
        'Improves paint finish',
      ],
    },
    {
      stepNo: 7,
      code: 'PRIMER',
      kind: QuestionKind.PROCESS_PICK,
      name: 'Primer',
      questionText: 'What is the next process?',
      initialVisualText: 'Dust-free prepared body',
      carVisualBefore: 'body_prep',
      carVisualAfter: 'primer',
      animationFeedback: 'Spray booth → light primer coating',
      developerNotes: 'Spray arm animation, paint flakes on wrong choice.',
      purposes: [
        'Provides base layer for paint',
        'Enhances adhesion of topcoat',
        'Protects against corrosion',
      ],
    },
    {
      stepNo: 8,
      code: 'BASE_COAT',
      kind: QuestionKind.COLOUR_PICK,
      name: 'Base Coat',
      questionText: 'Apply base coat — choose your colour!',
      initialVisualText: 'Primed car',
      carVisualBefore: 'primer',
      carVisualAfter: 'base_coat',
      animationFeedback: 'Selected colour sprays over car body',
      developerNotes: 'Colour palette selection, smooth coat animation.',
      purposes: [
        'Adds colour and appearance',
        'Provides aesthetic finish',
        'Supports UV resistance',
      ],
    },
    {
      stepNo: 9,
      code: 'CLEAR_COAT',
      kind: QuestionKind.PROCESS_PICK,
      name: 'Clear Coat',
      questionText: 'Apply the final paint protection layer',
      initialVisualText: 'Car in selected base colour',
      carVisualBefore: 'base_coat',
      carVisualAfter: 'clear_coat',
      animationFeedback: 'Shiny layer forms → reflections appear',
      developerNotes: 'Light reflections, car rotation for gloss effect.',
      purposes: [
        'Adds gloss and shine',
        'Provides scratch resistance',
        'Shields from UV / weather',
      ],
    },
    {
      stepNo: 10,
      code: 'FLASH_OFF',
      kind: QuestionKind.PROCESS_PICK,
      name: 'Flash-Off',
      questionText: 'What is the next process?',
      initialVisualText: 'Freshly clear-coated car',
      carVisualBefore: 'clear_coat',
      carVisualAfter: 'flash_off',
      animationFeedback: 'Solvents evaporate → surface stabilises',
      developerNotes: 'Subtle shimmer / heat-haze, no oven yet.',
      purposes: [
        'Allows solvents to evaporate',
        'Stabilises top coat',
        'Improves paint finish',
      ],
    },
    {
      stepNo: 11,
      code: 'OVEN_BAKE_2',
      kind: QuestionKind.PROCESS_PICK,
      name: 'Oven Bake 2 (Final)',
      questionText: 'What is the final process?',
      initialVisualText: 'Flash-off complete car',
      carVisualBefore: 'flash_off',
      carVisualAfter: 'oven_2',
      animationFeedback: 'Final bake in oven → all layers cure',
      developerNotes: 'Oven animation, full-curing glow.',
      purposes: [
        'Final curing of paint system',
        'Strengthens all layers',
        'Ensures paint durability',
      ],
    },
    {
      stepNo: 12,
      code: 'DREAM_READY',
      kind: QuestionKind.CONFIRM,
      name: 'Dream Car Ready!',
      questionText: 'Final check — ready for dispatch?',
      initialVisualText: 'Fully painted glossy car',
      carVisualBefore: 'oven_2',
      carVisualAfter: 'final',
      animationFeedback: "Car on conveyor, 'OK' tag, sparkle",
      developerNotes: 'Smiley car on pass, dispatch-ready.',
      purposes: [
        'Smooth, glossy finish',
        'Durable and corrosion-free',
        'Visually attractive and factory-ready',
      ],
    },
  ];

  // Pass 1: create the answer catalog (GameProcess + hints). CONFIRM stages
  // ("Dream Car Ready!") are pure acknowledge screens, not real processes, so
  // they are NOT added to the catalog.
  const processByCode = new Map<string, { id: string }>();
  const processCatalog = stages.filter((s) => s.kind !== QuestionKind.CONFIRM);
  for (const s of processCatalog) {
    const rec = await prisma.gameProcess.upsert({
      where: { flowId_code: { flowId: flow.id, code: s.code } },
      update: {},
      create: {
        flowId: flow.id,
        code: s.code,
        name: s.name,
        carVisualAfter: s.carVisualAfter,
        animationFeedback: s.animationFeedback,
        developerNotes: s.developerNotes,
        hints: {
          create: s.purposes.map((text, i) => ({ order: i + 1, text })),
        },
      },
    });
    processByCode.set(s.code, rec);
  }

  // Pass 2: create the screens (GameQuestion). A PROCESS_PICK screen's correct
  // answer is its OWN process (the state shown → the action to apply); COLOUR_PICK
  // / CONFIRM screens store no correct answer.
  const questionByStep = new Map<number, { id: string }>();
  for (const s of stages) {
    const correctProcessId =
      s.kind === QuestionKind.PROCESS_PICK
        ? processByCode.get(s.code)!.id
        : null;
    const rec = await prisma.gameQuestion.upsert({
      where: { flowId_stepNo: { flowId: flow.id, stepNo: s.stepNo } },
      update: {},
      create: {
        flowId: flow.id,
        stepNo: s.stepNo,
        kind: s.kind,
        questionText: s.questionText,
        initialVisualText: s.initialVisualText,
        carVisualBefore: s.carVisualBefore,
        correctProcessId,
      },
    });
    questionByStep.set(s.stepNo, rec);
  }
  console.log(
    `✅ ${processCatalog.length} Game Processes + ${stages.length} Game Questions (+ hints)`,
  );

  // ── Game content translations (sample) ────────────────────────────────────
  // Per-language overrides of process/hint text. Only what's listed here is
  // localized; anything missing falls back to the English base at runtime.
  // NOTE: sample KN/HI below should be reviewed by a native speaker.
  type ProcessI18n = {
    name: string;
    questionText: string;
    initialVisualText?: string;
    carVisualBefore?: string;
    carVisualAfter?: string;
    animationFeedback?: string;
    purposes?: string[]; // hint text by order (1-based)
  };
  const processTranslations: Record<number, Partial<Record<'KN' | 'HI', ProcessI18n>>> = {
    1: {
      HI: {
        name: 'डीग्रीज़िंग (तेल-चिकनाई हटाना)',
        questionText: 'आदर्श अगली प्रक्रिया कौन सी है?',
        initialVisualText: 'वेल्ड शॉप से आई धूल भरी, तैलीय, गंदी कार',
        carVisualBefore: 'गंदा मेटैलिक ग्रे',
        carVisualAfter: 'साफ मेटैलिक ग्रे',
        animationFeedback: 'कार डीग्रीज़िंग बाथ में डूबती है → गंदगी/तेल धुल जाता है',
        purposes: [
          'तेल, गंदगी और चिकनाई हटाता है',
          'ED के लिए सतह तैयार करता है',
          'अगले चरणों में आसंजन सुनिश्चित करता है',
        ],
      },
      KN: {
        name: 'ಡಿಗ್ರೀಸಿಂಗ್ (ಎಣ್ಣೆ ತೆಗೆಯುವಿಕೆ)',
        questionText: 'ಸೂಕ್ತವಾದ ಮುಂದಿನ ಪ್ರಕ್ರಿಯೆ ಯಾವುದು?',
        initialVisualText: 'ವೆಲ್ಡ್ ಶಾಪ್‌ನಿಂದ ಬಂದ ಧೂಳಿನ, ಎಣ್ಣೆಯುಕ್ತ, ಕೊಳಕು ಕಾರು',
        carVisualBefore: 'ಕೊಳಕು ಮೆಟಾಲಿಕ್ ಬೂದು',
        carVisualAfter: 'ಸ್ವಚ್ಛ ಮೆಟಾಲಿಕ್ ಬೂದು',
        animationFeedback: 'ಕಾರು ಡಿಗ್ರೀಸಿಂಗ್ ಸ್ನಾನದಲ್ಲಿ ಮುಳುಗುತ್ತದೆ → ಕೊಳೆ/ಎಣ್ಣೆ ತೊಳೆಯಲ್ಪಡುತ್ತದೆ',
        purposes: [
          'ಎಣ್ಣೆ, ಕೊಳೆ ಮತ್ತು ಗ್ರೀಸ್ ತೆಗೆದುಹಾಕುತ್ತದೆ',
          'ED ಗಾಗಿ ಮೇಲ್ಮೈ ಸಿದ್ಧಪಡಿಸುತ್ತದೆ',
          'ಮುಂದಿನ ಹಂತಗಳಲ್ಲಿ ಅಂಟಿಕೊಳ್ಳುವಿಕೆ ಖಚಿತಪಡಿಸುತ್ತದೆ',
        ],
      },
    },
    2: {
      HI: {
        name: 'सतह कंडीशनिंग और फॉस्फेटिंग',
        questionText: 'अगली प्रक्रिया क्या है?',
        initialVisualText: 'डीग्रीज़िंग के बाद साफ की गई कार',
        carVisualBefore: 'अच्छा मेटैलिक ग्रे',
        carVisualAfter: 'स्पष्ट ग्रे मेटैलिक',
        animationFeedback: 'कार हरे पानी के बाथ में डूबती है → मैट हरे रंग में बदल जाती है',
        purposes: [
          'धातु की सतह को रासायनिक रूप से परिवर्तित करता है',
          'ED आसंजन के लिए क्रिस्टलीय परत बनाता है',
          'जंग प्रतिरोध बढ़ाता है',
        ],
      },
      KN: {
        name: 'ಮೇಲ್ಮೈ ಕಂಡೀಷನಿಂಗ್ ಮತ್ತು ಫಾಸ್ಫೇಟಿಂಗ್',
        questionText: 'ಮುಂದಿನ ಪ್ರಕ್ರಿಯೆ ಯಾವುದು?',
        initialVisualText: 'ಡಿಗ್ರೀಸಿಂಗ್ ನಂತರ ಸ್ವಚ್ಛಗೊಳಿಸಿದ ಕಾರು',
        carVisualBefore: 'ಉತ್ತಮ ಮೆಟಾಲಿಕ್ ಬೂದು',
        carVisualAfter: 'ಸ್ಪಷ್ಟ ಬೂದು ಮೆಟಾಲಿಕ್',
        animationFeedback: 'ಕಾರು ಹಸಿರು ನೀರಿನ ಸ್ನಾನದಲ್ಲಿ ಮುಳುಗುತ್ತದೆ → ಮ್ಯಾಟ್ ಹಸಿರು ಬಣ್ಣಕ್ಕೆ ತಿರುಗುತ್ತದೆ',
        purposes: [
          'ಲೋಹದ ಮೇಲ್ಮೈಯನ್ನು ರಾಸಾಯನಿಕವಾಗಿ ಪರಿವರ್ತಿಸುತ್ತದೆ',
          'ED ಅಂಟಿಕೊಳ್ಳುವಿಕೆಗಾಗಿ ಸ್ಫಟಿಕದಂತಹ ಪದರವನ್ನು ಸೃಷ್ಟಿಸುತ್ತದೆ',
          'ತುಕ್ಕು ನಿರೋಧಕತೆಯನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ',
        ],
      },
    },
    3: {
      HI: {
        name: 'इलेक्ट्रोडिपॉज़िशन (ED)',
        questionText: 'आगे क्या होता है?',
        initialVisualText: 'फॉस्फेटेड कार दिखाई देती है',
        carVisualBefore: 'हल्का हरापन लिए',
        carVisualAfter: 'चिकनी ग्रे (ED कोट)',
        animationFeedback: 'कार टैंक में डूबती है → ठोस ग्रे कैथोडिक कोट',
        purposes: [
          'जंग-रोधी कोट लगाता है',
          'समान रूप से कोट करने के लिए विद्युत आवेश का उपयोग करता है',
          'जटिल सतहों और कोनों तक पहुँचता है',
        ],
      },
      KN: {
        name: 'ಎಲೆಕ್ಟ್ರೋಡಿಪೊಸಿಷನ್ (ED)',
        questionText: 'ಮುಂದೆ ಏನಾಗುತ್ತದೆ?',
        initialVisualText: 'ಫಾಸ್ಫೇಟ್ ಮಾಡಿದ ಕಾರು ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ',
        carVisualBefore: 'ತಿಳಿ ಹಸಿರು ಬಣ್ಣ',
        carVisualAfter: 'ನಯವಾದ ಬೂದು (ED ಕೋಟ್)',
        animationFeedback: 'ಕಾರು ಟ್ಯಾಂಕ್‌ನಲ್ಲಿ ಮುಳುಗುತ್ತದೆ → ಘನ ಬೂದು ಕ್ಯಾಥೋಡಿಕ್ ಕೋಟ್',
        purposes: [
          'ತುಕ್ಕು-ನಿರೋಧಕ ಲೇಪನವನ್ನು ಅನ್ವಯಿಸುತ್ತದೆ',
          'ಸಮವಾಗಿ ಲೇಪಿಸಲು ವಿದ್ಯುತ್ ಚಾರ್ಜ್ ಬಳಸುತ್ತದೆ',
          'ಸಂಕೀರ್ಣ ಮೇಲ್ಮೈಗಳು ಮತ್ತು ಮೂಲೆಗಳನ್ನು ತಲುಪುತ್ತದೆ',
        ],
      },
    },
    4: {
      HI: {
        name: 'ओवन बेक 1',
        questionText: 'अगली प्रक्रिया क्या है?',
        initialVisualText: 'पूर्ण ED कोट वाली कार',
        carVisualBefore: 'चिकनी ग्रे (ED कोट)',
        carVisualAfter: 'ग्रे ED कोट (क्योर्ड)',
        animationFeedback: 'कार ओवन में प्रवेश करती है → गर्मी की लहरें कोटिंग को क्योर करती हैं',
        purposes: [
          'ED कोटिंग को क्योर करता है',
          'बची हुई नमी को वाष्पित करता है',
          'कठोर, टिकाऊ फिनिश सुनिश्चित करता है',
        ],
      },
      KN: {
        name: 'ಓವನ್ ಬೇಕ್ 1',
        questionText: 'ಮುಂದಿನ ಪ್ರಕ್ರಿಯೆ ಯಾವುದು?',
        initialVisualText: 'ಪೂರ್ಣ ED ಕೋಟ್ ಹೊಂದಿರುವ ಕಾರು',
        carVisualBefore: 'ನಯವಾದ ಬೂದು (ED ಕೋಟ್)',
        carVisualAfter: 'ಬೂದು ED ಕೋಟ್ (ಕ್ಯೂರ್ ಆದ)',
        animationFeedback: 'ಕಾರು ಓವನ್ ಪ್ರವೇಶಿಸುತ್ತದೆ → ಶಾಖದ ಅಲೆಗಳು ಲೇಪನವನ್ನು ಕ್ಯೂರ್ ಮಾಡುತ್ತವೆ',
        purposes: [
          'ED ಲೇಪನವನ್ನು ಕ್ಯೂರ್ ಮಾಡುತ್ತದೆ',
          'ಉಳಿದ ತೇವಾಂಶವನ್ನು ಆವಿಯಾಗಿಸುತ್ತದೆ',
          'ಗಟ್ಟಿಯಾದ, ಬಾಳಿಕೆ ಬರುವ ಫಿನಿಶ್ ಖಚಿತಪಡಿಸುತ್ತದೆ',
        ],
      },
    },
    5: {
      HI: {
        name: 'सीलर और प्री-हीट ओवन',
        questionText: 'ED के बाद अगली प्रक्रिया?',
        initialVisualText: 'क्योर्ड ED कार',
        carVisualBefore: 'ग्रे ED कोट',
        carVisualAfter: 'सील लाइनों के साथ ग्रे ED कोट',
        animationFeedback: 'सीलर लगाया गया → अंडरबॉडी और गैप्स कोटेड',
        purposes: [
          'जोड़ों और वेल्ड को सील करता है',
          'पानी के रिसाव को रोकता है',
          'NVH (शोर, कंपन, कठोरता) को कम करता है',
        ],
      },
      KN: {
        name: 'ಸೀಲರ್ ಮತ್ತು ಪ್ರೀ-ಹೀಟ್ ಓವನ್',
        questionText: 'ED ನಂತರದ ಮುಂದಿನ ಪ್ರಕ್ರಿಯೆ?',
        initialVisualText: 'ಕ್ಯೂರ್ ಆದ ED ಕಾರು',
        carVisualBefore: 'ಬೂದು ED ಕೋಟ್',
        carVisualAfter: 'ಸೀಲ್ ರೇಖೆಗಳೊಂದಿಗೆ ಬೂದು ED ಕೋಟ್',
        animationFeedback: 'ಸೀಲರ್ ಅನ್ವಯಿಸಲಾಗಿದೆ → ಅಂಡರ್‌ಬಾಡಿ ಮತ್ತು ಅಂತರಗಳು ಲೇಪಿತವಾಗಿವೆ',
        purposes: [
          'ಜಂಟಿಗಳು ಮತ್ತು ವೆಲ್ಡ್‌ಗಳನ್ನು ಸೀಲ್ ಮಾಡುತ್ತದೆ',
          'ನೀರು ಸೋರಿಕೆಯನ್ನು ತಡೆಯುತ್ತದೆ',
          'NVH (ಶಬ್ದ, ಕಂಪನ, ಒರಟುತನ) ಅನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ',
        ],
      },
    },
    6: {
      HI: {
        name: 'बॉडी प्रिपरेशन ज़ोन',
        questionText: 'अगली प्रक्रिया क्या है?',
        initialVisualText: 'ED + सीलर लगी कार',
        carVisualBefore: 'सील लाइनों के साथ ग्रे ED कोट',
        carVisualAfter: 'साफ, धूल-रहित बॉडी',
        animationFeedback: 'पूरी बॉडी पर वाइपिंग एनिमेशन → धूल हटाई गई',
        purposes: [
          'पूरी बॉडी पर वाइपिंग',
          'शून्य धूल / संदूषण सुनिश्चित करना',
          'पेंट फिनिश में सुधार करता है',
        ],
      },
      KN: {
        name: 'ಬಾಡಿ ಪ್ರಿಪರೇಶನ್ ಝೋನ್',
        questionText: 'ಮುಂದಿನ ಪ್ರಕ್ರಿಯೆ ಯಾವುದು?',
        initialVisualText: 'ED + ಸೀಲರ್ ಅನ್ವಯಿಸಿದ ಕಾರು',
        carVisualBefore: 'ಸೀಲ್ ರೇಖೆಗಳೊಂದಿಗೆ ಬೂದು ED ಕೋಟ್',
        carVisualAfter: 'ಸ್ವಚ್ಛ, ಧೂಳು-ಮುಕ್ತ ಬಾಡಿ',
        animationFeedback: 'ಪೂರ್ಣ ಬಾಡಿಯಾದ್ಯಂತ ಒರೆಸುವ ಅನಿಮೇಷನ್ → ಧೂಳು ತೆಗೆದುಹಾಕಲಾಗಿದೆ',
        purposes: [
          'ಪೂರ್ಣ ಬಾಡಿಯ ಮೇಲೆ ಒರೆಸುವಿಕೆ',
          'ಶೂನ್ಯ ಧೂಳು / ಮಾಲಿನ್ಯವನ್ನು ಖಚಿತಪಡಿಸುವುದು',
          'ಪೇಂಟ್ ಫಿನಿಶ್ ಅನ್ನು ಸುಧಾರಿಸುತ್ತದೆ',
        ],
      },
    },
    7: {
      HI: {
        name: 'प्राइमर',
        questionText: 'अगली प्रक्रिया क्या है?',
        initialVisualText: 'धूल-रहित तैयार बॉडी',
        carVisualBefore: 'साफ, धूल-रहित बॉडी',
        carVisualAfter: 'हल्का ग्रे (प्राइमर)',
        animationFeedback: 'स्प्रे बूथ → हल्की प्राइमर कोटिंग',
        purposes: [
          'पेंट के लिए आधार परत प्रदान करता है',
          'टॉपकोट के आसंजन को बढ़ाता है',
          'जंग से बचाता है',
        ],
      },
      KN: {
        name: 'ಪ್ರೈಮರ್',
        questionText: 'ಮುಂದಿನ ಪ್ರಕ್ರಿಯೆ ಯಾವುದು?',
        initialVisualText: 'ಧೂಳು-ಮುಕ್ತ ಸಿದ್ಧಪಡಿಸಿದ ಬಾಡಿ',
        carVisualBefore: 'ಸ್ವಚ್ಛ, ಧೂಳು-ಮುಕ್ತ ಬಾಡಿ',
        carVisualAfter: 'ತಿಳಿ ಬೂದು (ಪ್ರೈಮರ್)',
        animationFeedback: 'ಸ್ಪ್ರೇ ಬೂತ್ → ತಿಳಿ ಪ್ರೈಮರ್ ಲೇಪನ',
        purposes: [
          'ಪೇಂಟ್‌ಗೆ ಬೇಸ್ ಲೇಯರ್ ಒದಗಿಸುತ್ತದೆ',
          'ಟಾಪ್‌ಕೋಟ್‌ನ ಅಂಟಿಕೊಳ್ಳುವಿಕೆಯನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ',
          'ತುಕ್ಕಿನಿಂದ ರಕ್ಷಿಸುತ್ತದೆ',
        ],
      },
    },
    8: {
      HI: {
        name: 'बेस कोट',
        questionText: 'बेस कोट लगाएं — अपना रंग चुनें!',
        initialVisualText: 'प्राइम्ड कार',
        carVisualBefore: 'हल्का ग्रे (प्राइमर)',
        carVisualAfter: 'लाल / नीला / काला / सफेद',
        animationFeedback: 'चयनित रंग कार की बॉडी पर स्प्रे होता है',
        purposes: [
          'रंग और रूप जोड़ता है',
          'सौंदर्यपूर्ण फिनिश प्रदान करता है',
          'UV प्रतिरोध का समर्थन करता है',
        ],
      },
      KN: {
        name: 'ಬೇಸ್ ಕೋಟ್',
        questionText: 'ಬೇಸ್ ಕೋಟ್ ಅನ್ವಯಿಸಿ — ನಿಮ್ಮ ಬಣ್ಣವನ್ನು ಆರಿಸಿ!',
        initialVisualText: 'ಪ್ರೈಮ್ ಮಾಡಿದ ಕಾರು',
        carVisualBefore: 'ತಿಳಿ ಬೂದು (ಪ್ರೈಮರ್)',
        carVisualAfter: 'ಕೆಂಪು / ನೀಲಿ / ಕಪ್ಪು / ಬಿಳಿ',
        animationFeedback: 'ಆಯ್ಕೆ ಮಾಡಿದ ಬಣ್ಣ ಕಾರಿನ ಬಾಡಿಯ ಮೇಲೆ ಸಿಂಪಡಿಸುತ್ತದೆ',
        purposes: [
          'ಬಣ್ಣ ಮತ್ತು ನೋಟವನ್ನು ಸೇರಿಸುತ್ತದೆ',
          'ಸೌಂದರ್ಯದ ಫಿನಿಶ್ ಒದಗಿಸುತ್ತದೆ',
          'UV ನಿರೋಧಕತೆಯನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ',
        ],
      },
    },
    9: {
      HI: {
        name: 'क्लियर कोट',
        questionText: 'अंतिम पेंट सुरक्षा परत लगाएं',
        initialVisualText: 'चयनित बेस रंग में कार',
        carVisualBefore: 'लाल / नीला / काला / सफेद',
        carVisualAfter: 'चयनित रंग का चमकदार संस्करण',
        animationFeedback: 'चमकदार परत बनती है → प्रतिबिंब दिखाई देते हैं',
        purposes: [
          'चमक और शाइन जोड़ता है',
          'खरोंच प्रतिरोध प्रदान करता है',
          'UV / मौसम से बचाता है',
        ],
      },
      KN: {
        name: 'ಕ್ಲಿಯರ್ ಕೋಟ್',
        questionText: 'ಅಂತಿಮ ಪೇಂಟ್ ರಕ್ಷಣಾ ಪದರವನ್ನು ಅನ್ವಯಿಸಿ',
        initialVisualText: 'ಆಯ್ಕೆ ಮಾಡಿದ ಬೇಸ್ ಬಣ್ಣದಲ್ಲಿ ಕಾರು',
        carVisualBefore: 'ಕೆಂಪು / ನೀಲಿ / ಕಪ್ಪು / ಬಿಳಿ',
        carVisualAfter: 'ಆಯ್ಕೆ ಮಾಡಿದ ಬಣ್ಣದ ಹೊಳಪುಳ್ಳ ಆವೃತ್ತಿ',
        animationFeedback: 'ಹೊಳಪುಳ್ಳ ಪದರ ರೂಪುಗೊಳ್ಳುತ್ತದೆ → ಪ್ರತಿಫಲನಗಳು ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ',
        purposes: [
          'ಹೊಳಪು ಮತ್ತು ಶೈನ್ ಸೇರಿಸುತ್ತದೆ',
          'ಗೀರು ನಿರೋಧಕತೆಯನ್ನು ಒದಗಿಸುತ್ತದೆ',
          'UV / ಹವಾಮಾನದಿಂದ ರಕ್ಷಿಸುತ್ತದೆ',
        ],
      },
    },
    10: {
      HI: {
        name: 'फ्लैश-ऑफ',
        questionText: 'अगली प्रक्रिया क्या है?',
        initialVisualText: 'ताज़ा क्लियर-कोटेड कार',
        carVisualBefore: 'चमकदार (गीली) कोट',
        carVisualAfter: 'स्थिर चमकदार कोट',
        animationFeedback: 'सॉल्वेंट्स वाष्पित होते हैं → सतह स्थिर होती है',
        purposes: [
          'सॉल्वेंट्स को वाष्पित होने देता है',
          'टॉप कोट को स्थिर करता है',
          'पेंट फिनिश में सुधार करता है',
        ],
      },
      KN: {
        name: 'ಫ್ಲ್ಯಾಶ್-ಆಫ್',
        questionText: 'ಮುಂದಿನ ಪ್ರಕ್ರಿಯೆ ಯಾವುದು?',
        initialVisualText: 'ತಾಜಾ ಕ್ಲಿಯರ್-ಕೋಟೆಡ್ ಕಾರು',
        carVisualBefore: 'ಹೊಳಪುಳ್ಳ (ಒದ್ದೆ) ಕೋಟ್',
        carVisualAfter: 'ಸ್ಥಿರಗೊಂಡ ಹೊಳಪುಳ್ಳ ಕೋಟ್',
        animationFeedback: 'ದ್ರಾವಕಗಳು ಆವಿಯಾಗುತ್ತವೆ → ಮೇಲ್ಮೈ ಸ್ಥಿರಗೊಳ್ಳುತ್ತದೆ',
        purposes: [
          'ದ್ರಾವಕಗಳನ್ನು ಆವಿಯಾಗಲು ಅನುಮತಿಸುತ್ತದೆ',
          'ಟಾಪ್ ಕೋಟ್ ಅನ್ನು ಸ್ಥಿರಗೊಳಿಸುತ್ತದೆ',
          'ಪೇಂಟ್ ಫಿನಿಶ್ ಅನ್ನು ಸುಧಾರಿಸುತ್ತದೆ',
        ],
      },
    },
    11: {
      HI: {
        name: 'ओवन बेक 2 (अंतिम)',
        questionText: 'अंतिम प्रक्रिया क्या है?',
        initialVisualText: 'फ्लैश-ऑफ पूर्ण कार',
        carVisualBefore: 'स्थिर चमकदार कोट',
        carVisualAfter: 'पूरी तरह क्योर्ड चमकदार रंग',
        animationFeedback: 'ओवन में अंतिम बेक → सभी परतें क्योर होती हैं',
        purposes: [
          'पेंट सिस्टम का अंतिम क्योरिंग',
          'सभी परतों को मजबूत करता है',
          'पेंट की टिकाऊपन सुनिश्चित करता है',
        ],
      },
      KN: {
        name: 'ಓವನ್ ಬೇಕ್ 2 (ಅಂತಿಮ)',
        questionText: 'ಅಂತಿಮ ಪ್ರಕ್ರಿಯೆ ಯಾವುದು?',
        initialVisualText: 'ಫ್ಲ್ಯಾಶ್-ಆಫ್ ಪೂರ್ಣಗೊಂಡ ಕಾರು',
        carVisualBefore: 'ಸ್ಥಿರಗೊಂಡ ಹೊಳಪುಳ್ಳ ಕೋಟ್',
        carVisualAfter: 'ಸಂಪೂರ್ಣವಾಗಿ ಕ್ಯೂರ್ ಆದ ಹೊಳಪುಳ್ಳ ಬಣ್ಣ',
        animationFeedback: 'ಓವನ್‌ನಲ್ಲಿ ಅಂತಿಮ ಬೇಕ್ → ಎಲ್ಲಾ ಪದರಗಳು ಕ್ಯೂರ್ ಆಗುತ್ತವೆ',
        purposes: [
          'ಪೇಂಟ್ ಸಿಸ್ಟಂನ ಅಂತಿಮ ಕ್ಯೂರಿಂಗ್',
          'ಎಲ್ಲಾ ಪದರಗಳನ್ನು ಬಲಪಡಿಸುತ್ತದೆ',
          'ಪೇಂಟ್ ಬಾಳಿಕೆಯನ್ನು ಖಚಿತಪಡಿಸುತ್ತದೆ',
        ],
      },
    },
    12: {
      HI: {
        name: 'ड्रीम कार तैयार!',
        questionText: 'अंतिम जांच — डिस्पैच के लिए तैयार?',
        initialVisualText: 'पूरी तरह पेंट की गई चमकदार कार',
        carVisualBefore: 'चयनित रंग का चमकदार संस्करण',
        carVisualAfter: 'अंतिम चमकदार रंग, तैयार',
        animationFeedback: "कन्वेयर पर कार, 'OK' टैग, चमक",
        purposes: [
          'चिकनी, चमकदार फिनिश',
          'टिकाऊ और जंग-मुक्त',
          'दृष्टिगत रूप से आकर्षक और फैक्ट्री-रेडी',
        ],
      },
      KN: {
        name: 'ಡ್ರೀಮ್ ಕಾರ್ ರೆಡಿ!',
        questionText: 'ಅಂತಿಮ ಪರಿಶೀಲನೆ — ರವಾನೆಗೆ ಸಿದ್ಧವೇ?',
        initialVisualText: 'ಸಂಪೂರ್ಣವಾಗಿ ಪೇಂಟ್ ಮಾಡಿದ ಹೊಳಪುಳ್ಳ ಕಾರು',
        carVisualBefore: 'ಆಯ್ಕೆ ಮಾಡಿದ ಬಣ್ಣದ ಹೊಳಪುಳ್ಳ ಆವೃತ್ತಿ',
        carVisualAfter: 'ಅಂತಿಮ ಹೊಳಪುಳ್ಳ ಬಣ್ಣ, ಸಿದ್ಧ',
        animationFeedback: "ಕನ್ವೇಯರ್ ಮೇಲೆ ಕಾರು, 'OK' ಟ್ಯಾಗ್, ಹೊಳಪು",
        purposes: [
          'ನಯವಾದ, ಹೊಳಪುಳ್ಳ ಫಿನಿಶ್',
          'ಬಾಳಿಕೆ ಬರುವ ಮತ್ತು ತುಕ್ಕು-ಮುಕ್ತ',
          'ದೃಷ್ಟಿಗೋಚರವಾಗಿ ಆಕರ್ಷಕ ಮತ್ತು ಫ್ಯಾಕ್ಟರಿ-ಸಿದ್ಧ',
        ],
      },
    },
  };

  const langId = new Map(
    (
      await prisma.language.findMany({
        where: { code: { in: ['EN', 'KN', 'HI'] } },
        select: { id: true, code: true },
      })
    ).map((l) => [l.code, l.id]),
  );

  const stageByStep = new Map(stages.map((s) => [s.stepNo, s]));

  for (const [stepNoStr, byLang] of Object.entries(processTranslations)) {
    const stepNo = Number(stepNoStr);
    const stage = stageByStep.get(stepNo);
    const question = questionByStep.get(stepNo);
    if (!stage || !question) continue;
    const proc = processByCode.get(stage.code); // null for CONFIRM screens
    const hints = proc
      ? await prisma.gameProcessHint.findMany({
          where: { processId: proc.id },
          orderBy: { order: 'asc' },
        })
      : [];

    for (const [code, t] of Object.entries(byLang)) {
      const languageId = langId.get(code);
      if (!languageId || !t) continue;

      // The screen's prompt copy lives on the question.
      await prisma.gameQuestionTranslation.upsert({
        where: { questionId_languageId: { questionId: question.id, languageId } },
        update: {},
        create: {
          questionId: question.id,
          languageId,
          questionText: t.questionText,
          initialVisualText: t.initialVisualText ?? null,
          carVisualBefore: t.carVisualBefore ?? null,
        },
      });

      // The answer/reveal copy + hints live on the process (skip CONFIRM screens).
      if (proc) {
        await prisma.gameProcessTranslation.upsert({
          where: { processId_languageId: { processId: proc.id, languageId } },
          update: {},
          create: {
            processId: proc.id,
            languageId,
            name: t.name,
            carVisualAfter: t.carVisualAfter ?? null,
            animationFeedback: t.animationFeedback ?? null,
          },
        });

        for (let i = 0; i < (t.purposes?.length ?? 0); i++) {
          const hint = hints[i];
          if (!hint) continue;
          await prisma.gameProcessHintTranslation.upsert({
            where: { hintId_languageId: { hintId: hint.id, languageId } },
            update: {},
            create: { hintId: hint.id, languageId, text: t.purposes![i] },
          });
        }
      }
    }
  }
  console.log('✅ Game content translations (sample)');

  // ── Car models ─────────────────────────────────────────────────────────────
  // Each model plays its own subset+order of the shared question set. Here:
  // Hycross plays all 12 screens; Hyryder skips step 11 (Oven Bake 2 (Final)).
  const allSteps = stages.map((s) => s.stepNo).sort((a, b) => a - b);
  const modelDefs = [
    { code: 'HYRYDER', name: 'Hyryder', sortOrder: 1, steps: allSteps.filter((n) => n !== 11) },
    { code: 'HYCROSS', name: 'Hycross', sortOrder: 2, steps: allSteps },
  ];
  const modelByCode = new Map<string, { id: string }>();
  for (const def of modelDefs) {
    const model = await prisma.carModel.upsert({
      where: { code: def.code },
      update: { name: def.name, sortOrder: def.sortOrder },
      create: { flowId: flow.id, code: def.code, name: def.name, sortOrder: def.sortOrder },
    });
    // Rewrite the model's sequence idempotently (positions are 1-based, contiguous).
    await prisma.carModelQuestion.deleteMany({ where: { carModelId: model.id } });
    await prisma.carModelQuestion.createMany({
      data: def.steps.map((baseStep, i) => ({
        carModelId: model.id,
        questionId: questionByStep.get(baseStep)!.id,
        stepNo: i + 1,
      })),
    });
    modelByCode.set(def.code, model);
  }
  const hycrossId = modelByCode.get('HYCROSS')!.id;
  console.log(`✅ ${modelDefs.length} Car Models (+ sequences)`);

  // ── Car colours ────────────────────────────────────────────────────────────
  // Colours don't change the process flow — they drive the in-game visuals (hex)
  // and are recorded on the run. Availability is per model (CarModelColour).
  const colourDefs = [
    { code: 'MICA', name: 'White', hex: '#F5F5F5', sortOrder: 1 },
    { code: 'BLACK', name: 'Black', hex: '#0E0E10', sortOrder: 2 },
    { code: 'SILVER', name: 'Silver', hex: '#C0C0C4', sortOrder: 3 },
    { code: 'BLUE', name: 'Blue', hex: '#1B3A6B', sortOrder: 4 },
  ];
  const colourByCode = new Map<string, { id: string }>();
  for (const c of colourDefs) {
    const colour = await prisma.carColour.upsert({
      where: { code: c.code },
      update: { name: c.name, hex: c.hex, sortOrder: c.sortOrder },
      create: c,
    });
    colourByCode.set(c.code, colour);
  }

  const modelColours: Record<string, string[]> = {
    HYRYDER: ['MICA', 'BLACK', 'SILVER', 'BLUE'],
    HYCROSS: ['MICA', 'BLACK', 'SILVER', 'BLUE'],
  };
  for (const [modelCode, codes] of Object.entries(modelColours)) {
    const model = modelByCode.get(modelCode)!;
    await prisma.carModelColour.deleteMany({ where: { carModelId: model.id } });
    await prisma.carModelColour.createMany({
      data: codes.map((cc, i) => ({
        carModelId: model.id,
        carColourId: colourByCode.get(cc)!.id,
        sortOrder: i + 1,
      })),
    });
  }
  const hycrossMicaId = colourByCode.get('MICA')!.id; // MICA is available for Hycross
  // Backfill demo runs that predate colours (keeps analytics fixtures coherent).
  await prisma.gameRun.updateMany({
    where: { carModelId: hycrossId, carColourId: null },
    data: { carColourId: hycrossMicaId },
  });
  console.log(`✅ ${colourDefs.length} Car Colours (+ per-model availability)`);

  // ── Dummy game runs (analytics demo) ──────────────────────────────────────
  // Idempotent: only seed when there are no runs yet. Demo runs use Hycross
  // (the full-sequence model), matching the base process order below.
  if ((await prisma.gameRun.count()) === 0) {
    // Demo runs play the Hycross sequence (all 12 screens, in order). Each
    // scored screen's correct answer is its OWN process; distractors are other
    // processes. COLOUR_PICK / CONFIRM screens are acknowledged, not scored.
    const hycrossPlay = stages.map((s) => ({
      questionId: questionByStep.get(s.stepNo)!.id,
      correctProcessId:
        s.kind === QuestionKind.PROCESS_PICK
          ? processByCode.get(s.code)!.id
          : null,
    }));
    const allProcessIds = [...processByCode.values()].map((p) => p.id);
    const scoredCount = hycrossPlay.filter((p) => p.correctProcessId).length;
    const runMaxScore = scoredCount * flow.pointsPerCorrect; // 10 * 5 = 50

    // A single screen in a scenario: `stepNo` = 1-based position in the Hycross
    // sequence, `wrongAttempts` = wrong clicks before settling, `correct` =
    // whether it was eventually answered right (false = run abandoned here).
    type StepSpec = { stepNo: number; wrongAttempts: number; correct: boolean };

    const seedRun = async (opts: {
      participantId: string;
      languageCode: string;
      status: 'COMPLETED' | 'ABANDONED';
      steps: StepSpec[];
    }) => {
      const participant = await prisma.participant.findUnique({
        where: { id: opts.participantId },
        select: { lineId: true },
      });

      // Game plays are GAME-kind kiosk sessions; the run derives its participant
      // through the session (same as QuizAttempt → ParticipantSession).
      const session = await prisma.participantSession.create({
        data: {
          participantId: opts.participantId,
          kind: 'GAME',
          lineId: participant?.lineId ?? null,
          languageCode: opts.languageCode,
          status: 'IN_PROGRESS',
        },
      });

      const run = await prisma.gameRun.create({
        data: {
          sessionId: session.id,
          flowId: flow.id,
          carModelId: hycrossId,
          carColourId: hycrossMicaId,
          maxScore: runMaxScore,
        },
      });

      let score = 0;
      let elapsed = 0;

      for (const s of opts.steps) {
        const play = hycrossPlay[s.stepNo - 1];
        const timeTaken = 6 + s.wrongAttempts * 4;
        elapsed += timeTaken;

        // Non-scored screen (colour pick / confirm): acknowledged, no points.
        if (!play.correctProcessId) {
          await prisma.gameRunStep.create({
            data: {
              runId: run.id,
              questionId: play.questionId,
              shownProcessIds: [],
              wrongAttempts: 0,
              isCorrect: true,
              pointsAwarded: 0,
              timeTaken,
            },
          });
          continue;
        }

        const correctId = play.correctProcessId;
        const distractorPool = allProcessIds.filter((id) => id !== correctId);
        const wrongIds = distractorPool.slice(0, s.wrongAttempts);
        const shown = [correctId, ...distractorPool.slice(0, 3)];
        const pointsAwarded = s.correct
          ? Math.max(0, flow.pointsPerCorrect - s.wrongAttempts * flow.penaltyPerWrong)
          : 0;

        const step = await prisma.gameRunStep.create({
          data: {
            runId: run.id,
            questionId: play.questionId,
            shownProcessIds: shown,
            wrongAttempts: s.wrongAttempts,
            isCorrect: s.correct,
            pointsAwarded,
            timeTaken,
          },
        });

        let attemptNo = 0;
        for (const w of wrongIds) {
          attemptNo++;
          await prisma.gameAnswerEvent.create({
            data: {
              stepId: step.id,
              chosenProcessId: w,
              attemptNo,
              isCorrect: false,
              hintRevealed: attemptNo, // 1st wrong → hint 1, etc.
            },
          });
        }
        if (s.correct) {
          attemptNo++;
          await prisma.gameAnswerEvent.create({
            data: { stepId: step.id, chosenProcessId: correctId, attemptNo, isCorrect: true },
          });
          score += pointsAwarded;
        }
      }

      const band =
        opts.status === 'COMPLETED'
          ? await prisma.gameJudgementBand.findFirst({
              where: { flowId: flow.id, minScore: { lte: score }, maxScore: { gte: score } },
            })
          : null;

      const completedAt = new Date();

      await prisma.gameRun.update({
        where: { id: run.id },
        data: {
          score,
          status: opts.status,
          timeTaken: elapsed,
          completedAt,
          judgementBandId: band?.id ?? null,
        },
      });

      // Mirror the outcome onto the shared kiosk session (see completeRun).
      await prisma.participantSession.update({
        where: { id: session.id },
        data: {
          status: opts.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
          completedAt,
          durationSeconds: elapsed,
          score: Math.round(score),
          maxScore: Math.round(runMaxScore),
          isPassed: band?.certificateEligible ?? false,
        },
      });
    };

    const [pRajesh, pPriya, pArun] = await Promise.all([
      prisma.participant.findUniqueOrThrow({ where: { code: 'EMP001' } }),
      prisma.participant.findUniqueOrThrow({ where: { code: 'EMP002' } }),
      prisma.participant.findUniqueOrThrow({ where: { code: 'EMP003' } }),
    ]);

    // Scenario 1 — Rajesh: flawless run, every screen first try → 50, Excellent.
    await seedRun({
      participantId: pRajesh.id,
      languageCode: 'EN',
      status: 'COMPLETED',
      steps: hycrossPlay.map((_, i) => ({
        stepNo: i + 1,
        wrongAttempts: 0,
        correct: true,
      })),
    });

    // Scenario 2 — Priya: completed but struggled on screens 3, 7 and 9 (used
    // hints). With penalty 0 she still scores 50, but the events show the
    // confusion — useful for "which step trips people up" analytics.
    const priyaStruggles: Record<number, number> = { 3: 2, 7: 1, 9: 3 };
    await seedRun({
      participantId: pPriya.id,
      languageCode: 'KN',
      status: 'COMPLETED',
      steps: hycrossPlay.map((_, i) => ({
        stepNo: i + 1,
        wrongAttempts: priyaStruggles[i + 1] ?? 0,
        correct: true,
      })),
    });

    // Scenario 3 — Arun: abandons mid-game. Clears screens 1–4 (one struggle),
    // then gets screen 5 wrong twice and quits → score 20, status ABANDONED,
    // no judgement band attached.
    await seedRun({
      participantId: pArun.id,
      languageCode: 'HI',
      status: 'ABANDONED',
      steps: [
        { stepNo: 1, wrongAttempts: 0, correct: true },
        { stepNo: 2, wrongAttempts: 1, correct: true },
        { stepNo: 3, wrongAttempts: 0, correct: true },
        { stepNo: 4, wrongAttempts: 0, correct: true },
        { stepNo: 5, wrongAttempts: 2, correct: false }, // walked away here
      ],
    });

    console.log('✅ 3 Dummy Game Runs (Excellent / struggled / abandoned)');
  } else {
    console.log('⏭️  Game runs already present — skipping dummy runs');
  }

  // Quiz Questions — 20 questions with EN/KN/HI translations
  const questions = [
    {
      enText: 'What does ED Coat stand for in automobile paint shop?',
      knText: 'ಆಟೋಮೊಬೈಲ್ ಪೇಂಟ್ ಶಾಪ್‌ನಲ್ಲಿ ED Coat ಎಂದರೆ ಏನು?',
      hiText: 'ऑटोमोबाइल पेंट शॉप में ED Coat का क्या मतलब है?',
      options: [
        { enText: 'Electrodeposition Coat', knText: 'ಎಲೆಕ್ಟ್ರೋಡಿಪೊಸಿಶನ್ ಕೋಟ್', hiText: 'इलेक्ट्रोडिपॉजिशन कोट', isCorrect: true },
        { enText: 'External Dust Coat', knText: 'ಎಕ್ಸ್ಟರ್ನಲ್ ಡಸ್ಟ್ ಕೋಟ್', hiText: 'एक्सटर्नल डस्ट कोट', isCorrect: false },
        { enText: 'Epoxy Dip Coat', knText: 'ಎಪೊಕ್ಸಿ ಡಿಪ್ ಕೋಟ್', hiText: 'एपॉक्सी डिप कोट', isCorrect: false },
        { enText: 'Enhanced Durable Coat', knText: 'ಎನ್‌ಹ್ಯಾನ್ಸ್ಡ್ ಡ್ಯೂರಬಲ್ ಕೋಟ್', hiText: 'एन्हांस्ड ड्यूरेबल कोट', isCorrect: false },
      ],
    },
    {
      enText: 'Which coat provides corrosion protection as the base layer?',
      knText: 'ಬೇಸ್ ಲೇಯರ್ ಆಗಿ ತುಕ್ಕು ರಕ್ಷಣೆ ನೀಡುವ ಕೋಟ್ ಯಾವುದು?',
      hiText: 'आधार परत के रूप में जंग-रोधी सुरक्षा कौन सा कोट देता है?',
      options: [
        { enText: 'ED Coat', knText: 'ED ಕೋಟ್', hiText: 'ED कोट', isCorrect: true },
        { enText: 'Clear Coat', knText: 'ಕ್ಲಿಯರ್ ಕೋಟ್', hiText: 'क्लियर कोट', isCorrect: false },
        { enText: 'Base Coat', knText: 'ಬೇಸ್ ಕೋಟ್', hiText: 'बेस कोट', isCorrect: false },
        { enText: 'Primer Coat', knText: 'ಪ್ರೈಮರ್ ಕೋಟ್', hiText: 'प्राइमर कोट', isCorrect: false },
      ],
    },
    {
      enText: 'What is the correct order of the paint shop process?',
      knText: 'ಪೇಂಟ್ ಶಾಪ್ ಪ್ರಕ್ರಿಯೆಯ ಸರಿಯಾದ ಕ್ರಮ ಯಾವುದು?',
      hiText: 'पेंट शॉप प्रक्रिया का सही क्रम क्या है?',
      options: [
        { enText: 'ED Coat → Sealer → Primer → Base Coat → Clear Coat', knText: 'ED ಕೋಟ್ → ಸೀಲರ್ → ಪ್ರೈಮರ್ → ಬೇಸ್ ಕೋಟ್ → ಕ್ಲಿಯರ್ ಕೋಟ್', hiText: 'ED कोट → सीलर → प्राइमर → बेस कोट → क्लियर कोट', isCorrect: true },
        { enText: 'Primer → ED Coat → Sealer → Base Coat → Clear Coat', knText: 'ಪ್ರೈಮರ್ → ED ಕೋಟ್ → ಸೀಲರ್ → ಬೇಸ್ ಕೋಟ್ → ಕ್ಲಿಯರ್ ಕೋಟ್', hiText: 'प्राइमर → ED कोट → सीलर → बेस कोट → क्लियर कोट', isCorrect: false },
        { enText: 'Base Coat → Sealer → ED Coat → Primer → Clear Coat', knText: 'ಬೇಸ್ ಕೋಟ್ → ಸೀಲರ್ → ED ಕೋಟ್ → ಪ್ರೈಮರ್ → ಕ್ಲಿಯರ್ ಕೋಟ್', hiText: 'बेस कोट → सीलर → ED कोट → प्राइमर → क्लियर कोट', isCorrect: false },
        { enText: 'Clear Coat → Base Coat → Primer → Sealer → ED Coat', knText: 'ಕ್ಲಿಯರ್ ಕೋಟ್ → ಬೇಸ್ ಕೋಟ್ → ಪ್ರೈಮರ್ → ಸೀಲರ್ → ED ಕೋಟ್', hiText: 'क्लियर कोट → बेस कोट → प्राइमर → सीलर → ED कोट', isCorrect: false },
      ],
    },
    {
      enText: 'What is the main purpose of the clear coat?',
      knText: 'ಕ್ಲಿಯರ್ ಕೋಟ್‌ನ ಮುಖ್ಯ ಉದ್ದೇಶ ಏನು?',
      hiText: 'क्लियर कोट का मुख्य उद्देश्य क्या है?',
      options: [
        { enText: 'Gloss finish and UV protection', knText: 'ಗ್ಲಾಸ್ ಫಿನಿಶ್ ಮತ್ತು UV ರಕ್ಷಣೆ', hiText: 'ग्लॉस फिनिश और UV सुरक्षा', isCorrect: true },
        { enText: 'Colour application', knText: 'ಬಣ್ಣ ಅನ್ವಯ', hiText: 'रंग लगाना', isCorrect: false },
        { enText: 'Corrosion resistance', knText: 'ತುಕ್ಕು ನಿರೋಧಕತೆ', hiText: 'जंग प्रतिरोध', isCorrect: false },
        { enText: 'Surface adhesion', knText: 'ಮೇಲ್ಮೈ ಅಂಟುವಿಕೆ', hiText: 'सतह चिपकाव', isCorrect: false },
      ],
    },
    {
      enText: 'What defect is caused by paint running down a vertical surface?',
      knText: 'ಲಂಬ ಮೇಲ್ಮೈಯಿಂದ ಬಣ್ಣ ಕೆಳಗೆ ಹರಿಯುವುದರಿಂದ ಯಾವ ದೋಷ ಉಂಟಾಗುತ್ತದೆ?',
      hiText: 'किस दोष में पेंट ऊर्ध्वाधर सतह पर बह जाता है?',
      options: [
        { enText: 'Sag / Run', knText: 'ಸ್ಯಾಗ್ / ರನ್', hiText: 'सैग / रन', isCorrect: true },
        { enText: 'Orange Peel', knText: 'ಆರೆಂಜ್ ಪೀಲ್', hiText: 'ऑरेंज पील', isCorrect: false },
        { enText: 'Fish Eye', knText: 'ಫಿಶ್ ಐ', hiText: 'फिश आई', isCorrect: false },
        { enText: 'Cratering', knText: 'ಕ್ರೇಟರಿಂಗ್', hiText: 'क्रेटरिंग', isCorrect: false },
      ],
    },
    {
      enText: 'What causes "orange peel" texture in a painted surface?',
      knText: '"ಆರೆಂಜ್ ಪೀಲ್" ಟೆಕ್ಸ್ಚರ್‌ಗೆ ಕಾರಣ ಏನು?',
      hiText: '"ऑरेंज पील" टेक्सचर का क्या कारण है?',
      options: [
        { enText: 'Incorrect atomisation of paint spray', knText: 'ಪೇಂಟ್ ಸ್ಪ್ರೇ ಅಟಮೈಸೇಶನ್ ತಪ್ಪಾಗಿರುವುದು', hiText: 'पेंट स्प्रे का गलत परमाणुकरण', isCorrect: true },
        { enText: 'Too much paint applied', knText: 'ಹೆಚ್ಚು ಬಣ್ಣ ಹಚ್ಚಿದ್ದು', hiText: 'बहुत अधिक पेंट लगाना', isCorrect: false },
        { enText: 'Contaminated surface', knText: 'ಮಲಿನ ಮೇಲ್ಮೈ', hiText: 'दूषित सतह', isCorrect: false },
        { enText: 'High oven temperature', knText: 'ಅಧಿಕ ಓವನ್ ತಾಪಮಾನ', hiText: 'उच्च ओवन तापमान', isCorrect: false },
      ],
    },
    {
      enText: 'What temperature range is typically used in a paint cure oven?',
      knText: 'ಪೇಂಟ್ ಕ್ಯೂರ್ ಓವನ್‌ನಲ್ಲಿ ಸಾಮಾನ್ಯವಾಗಿ ಯಾವ ತಾಪಮಾನ ಶ್ರೇಣಿ ಬಳಸಲಾಗುತ್ತದೆ?',
      hiText: 'पेंट क्योर ओवन में आमतौर पर कौन सी तापमान सीमा उपयोग की जाती है?',
      options: [
        { enText: '140–180°C', knText: '140–180°C', hiText: '140–180°C', isCorrect: true },
        { enText: '50–80°C', knText: '50–80°C', hiText: '50–80°C', isCorrect: false },
        { enText: '200–250°C', knText: '200–250°C', hiText: '200–250°C', isCorrect: false },
        { enText: '300–350°C', knText: '300–350°C', hiText: '300–350°C', isCorrect: false },
      ],
    },
    {
      enText: 'What does "tack wipe" do before applying paint?',
      knText: 'ಬಣ್ಣ ಹಚ್ಚುವ ಮೊದಲು "ಟ್ಯಾಕ್ ವೈಪ್" ಏನು ಮಾಡುತ್ತದೆ?',
      hiText: 'पेंट लगाने से पहले "टैक वाइप" क्या करता है?',
      options: [
        { enText: 'Removes dust and static particles from the surface', knText: 'ಮೇಲ್ಮೈಯಿಂದ ಧೂಳು ಮತ್ತು ಸ್ಥಿರ ಕಣಗಳನ್ನು ತೆಗೆದುಹಾಕುತ್ತದೆ', hiText: 'सतह से धूल और स्टेटिक कणों को हटाता है', isCorrect: true },
        { enText: 'Adds adhesion promoter', knText: 'ಅಡ್ಹೀಶನ್ ಪ್ರಮೋಟರ್ ಸೇರಿಸುತ್ತದೆ', hiText: 'अडहेशन प्रमोटर जोड़ता है', isCorrect: false },
        { enText: 'Applies a thin primer coat', knText: 'ತೆಳುವಾದ ಪ್ರೈಮರ್ ಕೋಟ್ ಹಚ್ಚುತ್ತದೆ', hiText: 'एक पतला प्राइमर कोट लगाता है', isCorrect: false },
        { enText: 'Seals the surface pores', knText: 'ಮೇಲ್ಮೈ ರಂಧ್ರಗಳನ್ನು ಮುಚ್ಚುತ್ತದೆ', hiText: 'सतह के छिद्रों को सील करता है', isCorrect: false },
      ],
    },
    {
      enText: 'What is phosphate treatment used for in the paint shop?',
      knText: 'ಪೇಂಟ್ ಶಾಪ್‌ನಲ್ಲಿ ಫಾಸ್ಫೇಟ್ ಟ್ರೀಟ್‌ಮೆಂಟ್ ಯಾವ ಉದ್ದೇಶಕ್ಕಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ?',
      hiText: 'पेंट शॉप में फॉस्फेट ट्रीटमेंट किस लिए उपयोग किया जाता है?',
      options: [
        { enText: 'Improve ED coat adhesion and corrosion resistance', knText: 'ED ಕೋಟ್ ಅಡ್ಹಿಶನ್ ಮತ್ತು ತುಕ್ಕು ನಿರೋಧಕತೆ ಸುಧಾರಿಸಲು', hiText: 'ED कोट आसंजन और जंग प्रतिरोध सुधारने के लिए', isCorrect: true },
        { enText: 'Apply colour to the body', knText: 'ಬಾಡಿಗೆ ಬಣ್ಣ ಹಚ್ಚಲು', hiText: 'बॉडी पर रंग लगाने के लिए', isCorrect: false },
        { enText: 'Increase paint gloss', knText: 'ಪೇಂಟ್ ಹೊಳಪು ಹೆಚ್ಚಿಸಲು', hiText: 'पेंट की चमक बढ़ाने के लिए', isCorrect: false },
        { enText: 'Reduce paint viscosity', knText: 'ಪೇಂಟ್ ಸ್ನಿಗ್ಧತೆ ಕಡಿಮೆ ಮಾಡಲು', hiText: 'पेंट की श्यानता कम करने के लिए', isCorrect: false },
      ],
    },
    {
      enText: 'What PPE is mandatory when spraying paint in the paint booth?',
      knText: 'ಪೇಂಟ್ ಬೂತ್‌ನಲ್ಲಿ ಸ್ಪ್ರೇ ಮಾಡುವಾಗ ಯಾವ PPE ಕಡ್ಡಾಯವಾಗಿದೆ?',
      hiText: 'पेंट बूथ में स्प्रे करते समय कौन सा PPE अनिवार्य है?',
      options: [
        { enText: 'Respirator, gloves, coverall, and eye protection', knText: 'ರೆಸ್ಪಿರೇಟರ್, ಗ್ಲೌಸ್, ಕವರಾಲ್ ಮತ್ತು ಕಣ್ಣಿನ ರಕ್ಷಣೆ', hiText: 'रेस्पिरेटर, दस्ताने, कवरऑल और नेत्र सुरक्षा', isCorrect: true },
        { enText: 'Only safety shoes', knText: 'ಕೇವಲ ಸೇಫ್ಟಿ ಶೂ', hiText: 'केवल सेफ्टी शूज', isCorrect: false },
        { enText: 'Hard hat and gloves', knText: 'ಹಾರ್ಡ್ ಹ್ಯಾಟ್ ಮತ್ತು ಗ್ಲೌಸ್', hiText: 'हार्ड हैट और दस्ताने', isCorrect: false },
        { enText: 'No PPE required in automated booths', knText: 'ಸ್ವಯಂಚಾಲಿತ ಬೂತ್‌ಗಳಲ್ಲಿ PPE ಅಗತ್ಯವಿಲ್ಲ', hiText: 'स्वचालित बूथ में PPE की आवश्यकता नहीं', isCorrect: false },
      ],
    },
    {
      enText: 'What is the purpose of flash-off time between paint coats?',
      knText: 'ಪೇಂಟ್ ಕೋಟ್‌ಗಳ ನಡುವೆ ಫ್ಲ್ಯಾಶ್-ಆಫ್ ಸಮಯದ ಉದ್ದೇಶ ಏನು?',
      hiText: 'पेंट कोट के बीच फ्लैश-ऑफ समय का उद्देश्य क्या है?',
      options: [
        { enText: 'Allow solvents to evaporate before next coat', knText: 'ಮುಂದಿನ ಕೋಟ್ ಮೊದಲು ದ್ರಾವಕಗಳನ್ನು ಆವಿಯಾಗಲು ಬಿಡಿ', hiText: 'अगले कोट से पहले सॉल्वेंट को वाष्पित होने दें', isCorrect: true },
        { enText: 'Cool down the oven', knText: 'ಓವನ್ ತಣ್ಣಗಾಗಲು', hiText: 'ओवन को ठंडा करने के लिए', isCorrect: false },
        { enText: 'Mix the paint colours', knText: 'ಬಣ್ಣಗಳನ್ನು ಮಿಶ್ರ ಮಾಡಲು', hiText: 'पेंट रंगों को मिलाने के लिए', isCorrect: false },
        { enText: 'Check the film thickness', knText: 'ಫಿಲ್ಮ್ ದಪ್ಪವನ್ನು ಪರೀಕ್ಷಿಸಲು', hiText: 'फिल्म की मोटाई जांचने के लिए', isCorrect: false },
      ],
    },
    {
      enText: 'What instrument measures dry film thickness of paint?',
      knText: 'ಬಣ್ಣದ ಒಣ ಫಿಲ್ಮ್ ದಪ್ಪ ಅಳೆಯಲು ಯಾವ ಉಪಕರಣ ಬಳಸುತ್ತಾರೆ?',
      hiText: 'पेंट की शुष्क फिल्म मोटाई मापने के लिए कौन सा उपकरण उपयोग किया जाता है?',
      options: [
        { enText: 'DFT gauge (Dry Film Thickness gauge)', knText: 'DFT ಗೇಜ್', hiText: 'DFT गेज', isCorrect: true },
        { enText: 'Viscosity cup', knText: 'ವಿಸ್ಕಾಸಿಟಿ ಕಪ್', hiText: 'विस्कोसिटी कप', isCorrect: false },
        { enText: 'Gloss meter', knText: 'ಗ್ಲಾಸ್ ಮೀಟರ್', hiText: 'ग्लॉस मीटर', isCorrect: false },
        { enText: 'Temperature gun', knText: 'ತಾಪಮಾನ ಗನ್', hiText: 'तापमान गन', isCorrect: false },
      ],
    },
    {
      enText: 'What causes a "fish eye" defect in paint?',
      knText: '"ಫಿಶ್ ಐ" ದೋಷಕ್ಕೆ ಕಾರಣ ಏನು?',
      hiText: '"फिश आई" दोष का क्या कारण है?',
      options: [
        { enText: 'Silicone or oil contamination on the surface', knText: 'ಮೇಲ್ಮೈಯಲ್ಲಿ ಸಿಲಿಕೋನ್ ಅಥವಾ ಎಣ್ಣೆ ಮಾಲಿನ್ಯ', hiText: 'सतह पर सिलिकॉन या तेल का दूषण', isCorrect: true },
        { enText: 'Too much hardener in the paint', knText: 'ಪೇಂಟ್‌ನಲ್ಲಿ ಹೆಚ್ಚಿನ ಹಾರ್ಡನರ್', hiText: 'पेंट में बहुत अधिक हार्डनर', isCorrect: false },
        { enText: 'Low spray gun pressure', knText: 'ಕಡಿಮೆ ಸ್ಪ್ರೇ ಗನ್ ಒತ್ತಡ', hiText: 'कम स्प्रे गन दबाव', isCorrect: false },
        { enText: 'Excessive sanding marks', knText: 'ಅತಿಯಾದ ಸ್ಯಾಂಡಿಂಗ್ ಗುರುತುಗಳು', hiText: 'अत्यधिक सैंडिंग के निशान', isCorrect: false },
      ],
    },
    {
      enText: 'Which of these is NOT a standard paint defect type?',
      knText: 'ಇವುಗಳಲ್ಲಿ ಯಾವುದು ಪ್ರಮಾಣಿತ ಪೇಂಟ್ ದೋಷ ಪ್ರಕಾರ ಅಲ್ಲ?',
      hiText: 'इनमें से कौन सा मानक पेंट दोष प्रकार नहीं है?',
      options: [
        { enText: 'Colour absorption', knText: 'ಕಲರ್ ಅಬ್ಸಾರ್ಪ್ಶನ್', hiText: 'कलर अब्सॉर्प्शन', isCorrect: true },
        { enText: 'Cratering', knText: 'ಕ್ರೇಟರಿಂಗ್', hiText: 'क्रेटरिंग', isCorrect: false },
        { enText: 'Blistering', knText: 'ಬ್ಲಿಸ್ಟರಿಂಗ್', hiText: 'ब्लिस्टरिंग', isCorrect: false },
        { enText: 'Delamination', knText: 'ಡೆಲ್ಯಾಮಿನೇಶನ್', hiText: 'डिलेमिनेशन', isCorrect: false },
      ],
    },
    {
      enText: 'What does "gloss" measurement indicate in paint quality?',
      knText: 'ಪೇಂಟ್ ಗುಣಮಟ್ಟದಲ್ಲಿ "ಗ್ಲಾಸ್" ಅಳತೆ ಏನನ್ನು ಸೂಚಿಸುತ್ತದೆ?',
      hiText: 'पेंट गुणवत्ता में "ग्लॉस" मापन क्या दर्शाता है?',
      options: [
        { enText: 'Reflectivity / sheen level of the paint surface', knText: 'ಪೇಂಟ್ ಮೇಲ್ಮೈಯ ಪ್ರತಿಫಲನ ಮಟ್ಟ', hiText: 'पेंट सतह की परावर्तनशीलता / चमक स्तर', isCorrect: true },
        { enText: 'Hardness of the paint film', knText: 'ಪೇಂಟ್ ಫಿಲ್ಮ್‌ನ ಗಡಸುತನ', hiText: 'पेंट फिल्म की कठोरता', isCorrect: false },
        { enText: 'Thickness of the paint layer', knText: 'ಪೇಂಟ್ ಪದರದ ದಪ್ಪ', hiText: 'पेंट परत की मोटाई', isCorrect: false },
        { enText: 'Adhesion strength', knText: 'ಅಡ್ಹೀಶನ್ ಬಲ', hiText: 'आसंजन शक्ति', isCorrect: false },
      ],
    },
    {
      enText: 'What is the recommended action if paint viscosity is too high?',
      knText: 'ಪೇಂಟ್ ಸ್ನಿಗ್ಧತೆ ತುಂಬಾ ಹೆಚ್ಚಿದ್ದರೆ ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ ಏನು?',
      hiText: 'यदि पेंट की श्यानता बहुत अधिक है तो अनुशंसित कार्रवाई क्या है?',
      options: [
        { enText: 'Thin with appropriate solvent as per TDS', knText: 'TDS ಪ್ರಕಾರ ಸೂಕ್ತ ದ್ರಾವಕದಿಂದ ತೆಳುವಾಗಿಸಿ', hiText: 'TDS के अनुसार उचित सॉल्वेंट से पतला करें', isCorrect: true },
        { enText: 'Apply more coats to compensate', knText: 'ಸರಿದೂಗಿಸಲು ಹೆಚ್ಚು ಕೋಟ್ ಹಚ್ಚಿ', hiText: 'क्षतिपूर्ति के लिए अधिक कोट लगाएं', isCorrect: false },
        { enText: 'Heat the paint to reduce viscosity', knText: 'ಸ್ನಿಗ್ಧತೆ ಕಡಿಮೆ ಮಾಡಲು ಪೇಂಟ್ ಅನ್ನು ಬಿಸಿ ಮಾಡಿ', hiText: 'श्यानता कम करने के लिए पेंट को गर्म करें', isCorrect: false },
        { enText: 'Discard the paint batch', knText: 'ಪೇಂಟ್ ಬ್ಯಾಚ್ ಅನ್ನು ಎಸೆಯಿರಿ', hiText: 'पेंट बैच को नष्ट करें', isCorrect: false },
      ],
    },
    {
      enText: 'Which quality check is done after the final clear coat bake?',
      knText: 'ಅಂತಿಮ ಕ್ಲಿಯರ್ ಕೋಟ್ ಬೇಕ್ ನಂತರ ಯಾವ ಗುಣಮಟ್ಟ ತಪಾಸಣೆ ಮಾಡಲಾಗುತ್ತದೆ?',
      hiText: 'अंतिम क्लियर कोट बेक के बाद कौन सी गुणवत्ता जांच की जाती है?',
      options: [
        { enText: 'Gloss, DOI, film thickness, and visual inspection', knText: 'ಗ್ಲಾಸ್, DOI, ಫಿಲ್ಮ್ ದಪ್ಪ ಮತ್ತು ದೃಶ್ಯ ತಪಾಸಣೆ', hiText: 'ग्लॉस, DOI, फिल्म मोटाई और दृश्य निरीक्षण', isCorrect: true },
        { enText: 'Only colour check', knText: 'ಕೇವಲ ಬಣ್ಣ ತಪಾಸಣೆ', hiText: 'केवल रंग जांच', isCorrect: false },
        { enText: 'Weld integrity test', knText: 'ವೆಲ್ಡ್ ಸಮಗ್ರತೆ ಪರೀಕ್ಷೆ', hiText: 'वेल्ड अखंडता परीक्षण', isCorrect: false },
        { enText: 'Body dimensions check', knText: 'ಬಾಡಿ ಆಯಾಮ ತಪಾಸಣೆ', hiText: 'बॉडी आयाम जांच', isCorrect: false },
      ],
    },
    {
      enText: 'What is the kaizen principle in the context of paint shop operations?',
      knText: 'ಪೇಂಟ್ ಶಾಪ್ ಕಾರ್ಯಾಚರಣೆಯ ಸಂದರ್ಭದಲ್ಲಿ ಕೈಝೆನ್ ತತ್ವ ಏನು?',
      hiText: 'पेंट शॉप संचालन के संदर्भ में कैज़ेन सिद्धांत क्या है?',
      options: [
        { enText: 'Continuous improvement through small incremental changes', knText: 'ಸಣ್ಣ ಹೆಚ್ಚಳ ಬದಲಾವಣೆಗಳ ಮೂಲಕ ನಿರಂತರ ಸುಧಾರಣೆ', hiText: 'छोटे वृद्धिशील परिवर्तनों के माध्यम से निरंतर सुधार', isCorrect: true },
        { enText: 'Complete overhaul of the production line', knText: 'ಉತ್ಪಾದನಾ ಮಾರ್ಗದ ಸಂಪೂರ್ಣ ಪರಿಷ್ಕರಣ', hiText: 'उत्पादन लाइन का पूर्ण ओवरहॉल', isCorrect: false },
        { enText: 'Automated quality inspection', knText: 'ಸ್ವಯಂಚಾಲಿತ ಗುಣಮಟ್ಟ ತಪಾಸಣೆ', hiText: 'स्वचालित गुणवत्ता निरीक्षण', isCorrect: false },
        { enText: 'Outsourcing defect repairs', knText: 'ದೋಷ ರಿಪೇರಿ ಔಟ್‌ಸೋರ್ಸ್ ಮಾಡುವುದು', hiText: 'दोष मरम्मत आउटसोर्सिंग', isCorrect: false },
      ],
    },
    {
      enText: 'What does DOI stand for in paint quality measurement?',
      knText: 'ಪೇಂಟ್ ಗುಣಮಟ್ಟ ಅಳತೆಯಲ್ಲಿ DOI ಎಂದರೆ ಏನು?',
      hiText: 'पेंट गुणवत्ता मापन में DOI का क्या अर्थ है?',
      options: [
        { enText: 'Distinctness of Image', knText: 'ಡಿಸ್ಟಿಂಕ್ಟ್‌ನೆಸ್ ಆಫ್ ಇಮೇಜ್', hiText: 'डिस्टिंक्टनेस ऑफ इमेज', isCorrect: true },
        { enText: 'Depth of Integration', knText: 'ಡೆಪ್ತ್ ಆಫ್ ಇಂಟಿಗ್ರೇಶನ್', hiText: 'डेप्थ ऑफ इंटीग्रेशन', isCorrect: false },
        { enText: 'Degree of Illumination', knText: 'ಡಿಗ್ರಿ ಆಫ್ ಇಲ್ಯುಮಿನೇಶನ್', hiText: 'डिग्री ऑफ इल्युमिनेशन', isCorrect: false },
        { enText: 'Duration of Inspection', knText: 'ಡ್ಯುರೇಶನ್ ಆಫ್ ಇನ್‌ಸ್ಪೆಕ್ಷನ್', hiText: 'ड्यूरेशन ऑफ इंस्पेक्शन', isCorrect: false },
      ],
    },
    {
      enText: 'Which gas is most hazardous in a paint booth environment?',
      knText: 'ಪೇಂಟ್ ಬೂತ್ ಪರಿಸರದಲ್ಲಿ ಯಾವ ಅನಿಲ ಅತ್ಯಂತ ಅಪಾಯಕಾರಿ?',
      hiText: 'पेंट बूथ वातावरण में कौन सी गैस सबसे खतरनाक है?',
      options: [
        { enText: 'Volatile Organic Compound (VOC) vapours', knText: 'ಅಸ್ಥಿರ ಸಾವಯವ ಸಂಯುಕ್ತ (VOC) ಆವಿ', hiText: 'वाष्पशील कार्बनिक यौगिक (VOC) वाष्प', isCorrect: true },
        { enText: 'Carbon dioxide (CO2)', knText: 'ಕಾರ್ಬನ್ ಡೈಆಕ್ಸೈಡ್ (CO2)', hiText: 'कार्बन डाइऑक्साइड (CO2)', isCorrect: false },
        { enText: 'Nitrogen (N2)', knText: 'ನೈಟ್ರೋಜನ್ (N2)', hiText: 'नाइट्रोजन (N2)', isCorrect: false },
        { enText: 'Water vapour', knText: 'ನೀರಿನ ಆವಿ', hiText: 'जल वाष्प', isCorrect: false },
      ],
    },
    {
      enText: 'What is the purpose of sanding between paint coats?',
      knText: 'ಪೇಂಟ್ ಕೋಟ್‌ಗಳ ನಡುವೆ ಸ್ಯಾಂಡಿಂಗ್ ಉದ್ದೇಶ ಏನು?',
      hiText: 'पेंट कोट के बीच सैंडिंग का उद्देश्य क्या है?',
      options: [
        { enText: 'Improve adhesion and remove surface defects', knText: 'ಅಡ್ಹಿಶನ್ ಸುಧಾರಿಸಲು ಮತ್ತು ಮೇಲ್ಮೈ ದೋಷಗಳನ್ನು ತೆಗೆದುಹಾಕಲು', hiText: 'आसंजन सुधारने और सतह दोषों को हटाने के लिए', isCorrect: true },
        { enText: 'Apply more paint to the surface', knText: 'ಮೇಲ್ಮೈಗೆ ಹೆಚ್ಚು ಬಣ್ಣ ಹಚ್ಚಲು', hiText: 'सतह पर अधिक पेंट लगाने के लिए', isCorrect: false },
        { enText: 'Cool down the cured coat faster', knText: 'ಕ್ಯೂರ್ಡ್ ಕೋಟ್ ಅನ್ನು ಬೇಗ ತಣ್ಣಗಾಗಿಸಲು', hiText: 'क्योर्ड कोट को तेजी से ठंडा करने के लिए', isCorrect: false },
        { enText: 'Increase the paint film thickness', knText: 'ಪೇಂಟ್ ಫಿಲ್ಮ್ ದಪ್ಪ ಹೆಚ್ಚಿಸಲು', hiText: 'पेंट फिल्म की मोटाई बढ़ाने के लिए', isCorrect: false },
      ],
    },
  ];

  for (const q of questions) {
    const question = await prisma.question.create({
      data: {
        isActive: true,
        points: 1,
        shuffleOptions: true,
        translations: {
          create: [
            { languageId: en.id, text: q.enText },
            { languageId: kn.id, text: q.knText },
            { languageId: hi.id, text: q.hiText },
          ],
        },
        options: {
          create: q.options.map((o, idx) => ({
            isCorrect: o.isCorrect,
            order: idx + 1,
            translations: {
              create: [
                { languageId: en.id, text: o.enText },
                { languageId: kn.id, text: o.knText },
                { languageId: hi.id, text: o.hiText },
              ],
            },
          })),
        },
      },
    });
    void question;
  }
  console.log(`✅ ${questions.length} Quiz Questions`);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
