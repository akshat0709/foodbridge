import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../server/src/models/User.js';
import { Mess } from '../server/src/models/Mess.js';
import { Ngo } from '../server/src/models/Ngo.js';
import { Listing } from '../server/src/models/Listing.js';
import { MealLog } from '../server/src/models/MealLog.js';
import { AuditLog } from '../server/src/models/AuditLog.js';
import { SystemSetting } from '../server/src/models/SystemSetting.js';

dotenv.config({ path: '../server/.env' });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodbridge';

// Seeded PRNG (Mulberry32) for reproducible data generation
function createPRNG(seed = 42) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createPRNG(42);
function randBetween(min, max) {
  return min + rng() * (max - min);
}
function randInt(min, max) {
  return Math.floor(randBetween(min, max + 1));
}
function pickOne(arr) {
  return arr[randInt(0, arr.length - 1)];
}

// 60 Mess Names across campuses
const MESS_NAMES = [
  'Satpura Hostel Mess', 'Aravali Dining Hall', 'Kaveri Mess', 'Nilgiri Mess', 'Vindhyachal Dining',
  'Kailash Girls Hostel Mess', 'Himalaya Mess', 'Shivalik Food Court', 'Girnar Mess', 'Karakoram Central',
  'Zanskar Dining Hall', 'Dhaulagiri Mess', 'Sahyadri Hall', 'Udaigiri Dining', 'Jwalamukhi Mess',
  'Tagore International Mess', 'Sarojini Bhawan Dining', 'Gargi Hall', 'Aryabhatta Mess', 'Ramanujan Food Hall',
  'Bhabha Dining', 'Kalam Mess', 'Visvesvaraya Mess', 'C.V. Raman Dining', 'Radhakrishnan Hall',
  'Ambedkar Dining Block', 'Vivekananda Mess', 'Netaji Subhash Hall', 'Nehru Hall Mess', 'Patel Food Court',
  'Bose Central Dining', 'Sastri Dining Hall', 'Indira Bhawan Mess', 'Mandakini Food Court', 'Alakananda Mess',
  'Bhagirathi Dining', 'Yamuna Hall', 'Ganga Hostel Mess', 'Godavari Dining', 'Krishna Mess',
  'Tapti Dining Hall', 'Narmada Food Court', 'Mahanadi Mess', 'Brahmaputra Hall', 'Saraswati Dining',
  'Sabarmati Mess', 'Chitravathi Food Hall', 'Pennar Dining Block', 'Vaigai Mess', 'Periyar Hall',
  'Cauvery Dining Hall', 'Tungabhadra Mess', 'Hemavathi Food Court', 'Netravathi Dining', 'Sharavathi Hall',
  'Varahi Dining', 'Kaveri North Annex', 'Gomti Central Mess', 'Chambal Dining Hall', 'Betwa Food Court'
];

// 25 NGO Names
const NGO_NAMES = [
  'Robin Hood Army - South Delhi', 'Feeding India - Central Hub', 'Annakshetra Foundation', 'Roti Bank Trust',
  'Goonj Community Kitchen', 'Asha Deep Food Relief', 'Sanjivani Seva Samiti', 'Akshaya Patra Outreach',
  'Umeed Food Brigade', 'Jan Rasoi Initiative', 'Nourish India Network', 'Pratham Food Care',
  'Seva Kitchen Network', 'Samarpan Food Trust', 'Punarutthan Foundation', 'Drishti Welfare Society',
  'Koshish Food Rescue', 'Helping Hands Hunger Relief', 'Prayas Youth Foundation', 'Annamrita Foundation',
  'Navjeevan Community Food', 'Bhojan Daan Samiti', 'Smile Hunger Network', 'Sahyog Food Bank',
  'Vanguard Relief Mission'
];

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
const FOOD_CATEGORIES = ['RICE_GRAINS', 'CURRY_DAL', 'ROTI_BREAD', 'VEGETABLES', 'DESSERT_SNACK'];
const LISTING_CATEGORIES = ['COOKED_MEALS', 'RAW_VEGETABLES', 'GRAINS_STAPLES', 'BAKERY_SNACKS', 'PACKAGED'];

const FESTIVALS_2025_2026 = [
  { name: 'Makar Sankranti', month: 0, day: 14 },
  { name: 'Republic Day', month: 0, day: 26 },
  { name: 'Holi', month: 2, day: 25 },
  { name: 'Eid ul-Fitr', month: 3, day: 10 },
  { name: 'Independence Day', month: 7, day: 15 },
  { name: 'Ganesh Chaturthi', month: 8, day: 7 },
  { name: 'Gandhi Jayanti', month: 9, day: 2 },
  { name: 'Diwali', month: 10, day: 1 },
  { name: 'Guru Nanak Jayanti', month: 10, day: 15 },
  { name: 'Christmas', month: 11, day: 25 },
];

function isExamMonth(month) {
  // Typical exam months: May (4), December (11), midterms in March (2), October (9)
  return month === 4 || month === 11 || month === 2 || month === 9;
}

function getFestival(date) {
  const m = date.getMonth();
  const d = date.getDate();
  const found = FESTIVALS_2025_2026.find(f => f.month === m && Math.abs(f.day - d) <= 1);
  return found ? found.name : null;
}

// Calculate distance between two lat/lng in km (Haversine)
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function generateSyntheticData(scale = '100k', insert = true) {
  console.log(`\n======================================================`);
  console.log(`[Data Generator] Starting generation with scale: ${scale}`);
  console.log(`[Data Generator] MongoDB URI: ${MONGODB_URI}`);
  console.log(`======================================================\n`);

  await mongoose.connect(MONGODB_URI);
  console.log('[Data Generator] Connected to MongoDB.');

  if (insert) {
    console.log('[Data Generator] Dropping existing collections for clean seed...');
    await Promise.all([
      User.deleteMany({}),
      Mess.deleteMany({}),
      Ngo.deleteMany({}),
      Listing.deleteMany({}),
      MealLog.deleteMany({}),
      AuditLog.deleteMany({}),
      SystemSetting.deleteMany({}),
    ]);
    console.log('[Data Generator] Existing collections cleaned.');
  }

  // Ensure default system settings
  await SystemSetting.findOneAndUpdate(
    { key: 'GLOBAL_CONFIG' },
    {
      weights: {
        distanceWeight: 0.35,
        capacityWeight: 0.25,
        deadlineWeight: 0.20,
        reliabilityWeight: 0.20,
      },
      impactFactors: {
        kgPerMeal: 0.4,
        co2eFactorPerKg: 2.5,
        costPerKgRs: 60.0,
      },
      driftThresholdMae: 2.0,
    },
    { upsert: true, new: true }
  );

  // 1. Generate 60 Messes
  console.log('[Data Generator] Generating 60 Messes across campuses...');
  const baseLat = 28.545; // South-Central Delhi educational hub
  const baseLng = 77.192;
  const campuses = ['North Campus', 'South Campus', 'East Technological Hub', 'West Enclave'];

  const messDocs = [];
  for (let i = 0; i < 60; i++) {
    const latOffset = (rng() - 0.5) * 0.18; // ~15-20km radius
    const lngOffset = (rng() - 0.5) * 0.18;
    const capacity = randInt(350, 1200);

    // Over-prepare tendency: ~10 messes are chronic over-preparers (1.20 - 1.35)
    let tendency = 1.0;
    if (i % 6 === 0) tendency = 1.25 + rng() * 0.10; // high waste
    else if (i % 5 === 0) tendency = 0.88 + rng() * 0.08; // efficient

    messDocs.push({
      _id: new mongoose.Types.ObjectId(),
      name: MESS_NAMES[i],
      campus: campuses[i % campuses.length],
      location: {
        type: 'Point',
        coordinates: [baseLng + lngOffset, baseLat + latOffset],
      },
      address: `${MESS_NAMES[i]}, Block ${String.fromCharCode(65 + (i % 6))}, ${campuses[i % campuses.length]}`,
      capacity,
      contactPerson: `Manager ${MESS_NAMES[i].split(' ')[0]}`,
      phone: `+91 98${randInt(10000000, 99999999)}`,
      averageDailyLeftoverKg: Math.round(capacity * 0.07 * tendency),
      overprepareTendency: parseFloat(tendency.toFixed(2)),
      isActive: true,
    });
  }
  const createdMesses = await Mess.insertMany(messDocs);
  console.log(`[Data Generator] Created ${createdMesses.length} Messes.`);

  // 2. Generate 25 NGOs
  console.log('[Data Generator] Generating 25 NGOs with reliability profiles...');
  const ngoDocs = [];
  for (let i = 0; i < 25; i++) {
    const latOffset = (rng() - 0.5) * 0.22;
    const lngOffset = (rng() - 0.5) * 0.22;
    const vehicleCapacityKg = randInt(100, 450);
    const serviceRadiusKm = randInt(10, 28);

    // Reliability distribution: 18 highly reliable (0.88-0.98), 4 moderate (0.75-0.85), 3 low (0.55-0.70)
    let assigned = randInt(80, 400);
    let successRate = 0.92;
    if (i >= 22) successRate = 0.62 + rng() * 0.08; // unreliable NGO
    else if (i >= 18) successRate = 0.78 + rng() * 0.07;
    else successRate = 0.88 + rng() * 0.10;

    let completed = Math.round(assigned * successRate);
    let expiredOrFailed = assigned - completed;
    let avgDelay = Math.round(10 + (1 - successRate) * 45);

    // Bayesian score: prior m = 0.85, C = 10
    const C = 10;
    const prior = 0.85;
    const bayesian = (C * prior + completed) / (C + assigned);

    ngoDocs.push({
      _id: new mongoose.Types.ObjectId(),
      name: NGO_NAMES[i],
      registrationNumber: `NGO/DEL/${2020 + (i % 5)}/${1000 + i}`,
      location: {
        type: 'Point',
        coordinates: [baseLng + lngOffset, baseLat + latOffset],
      },
      address: `Sector ${randInt(1, 45)}, ${NGO_NAMES[i]} Distribution Center`,
      serviceRadiusKm,
      vehicleCapacityKg,
      operatingHours: {
        start: '07:00',
        end: '23:30',
      },
      contactPerson: `Coordinator ${NGO_NAMES[i].split(' ')[0]}`,
      phone: `+91 91${randInt(10000000, 99999999)}`,
      reliabilityStats: {
        totalAssigned: assigned,
        totalCompleted: completed,
        totalExpiredOrFailed: expiredOrFailed,
        averageDelayMinutes: avgDelay,
        bayesianScore: parseFloat(bayesian.toFixed(3)),
        timeOfDayProfile: {
          morningRate: parseFloat((successRate * 0.98).toFixed(2)),
          afternoonRate: parseFloat((successRate * 0.94).toFixed(2)),
          eveningRate: parseFloat((successRate * 1.02 > 1 ? 0.98 : successRate * 1.02).toFixed(2)),
          nightRate: parseFloat((successRate * 0.85).toFixed(2)),
        },
      },
      isActive: true,
    });
  }
  const createdNgos = await Ngo.insertMany(ngoDocs);
  console.log(`[Data Generator] Created ${createdNgos.length} NGOs.`);

  // 3. Create Demo Users
  console.log('[Data Generator] Creating demo user credentials for all 3 roles...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Pass1234!', salt);

  const users = [
    {
      email: 'mess.admin@foodbridge.org',
      passwordHash,
      name: 'Rohan Sharma (Mess Admin)',
      role: 'MESS_ADMIN',
      phone: '+91 9876543210',
      organizationId: createdMesses[0]._id,
    },
    {
      email: 'ngo.rep@foodbridge.org',
      passwordHash,
      name: 'Pooja Verma (NGO Rep)',
      role: 'NGO_REP',
      phone: '+91 9876543211',
      organizationId: createdNgos[0]._id,
    },
    {
      email: 'platform.admin@foodbridge.org',
      passwordHash,
      name: 'Aditi Rao (Platform Admin)',
      role: 'PLATFORM_ADMIN',
      phone: '+91 9876543212',
    },
  ];
  await User.insertMany(users);
  console.log('[Data Generator] Demo accounts created:');
  console.log('   - Mess Admin:     mess.admin@foodbridge.org     / Pass1234!');
  console.log('   - NGO Rep:        ngo.rep@foodbridge.org        / Pass1234!');
  console.log('   - Platform Admin: platform.admin@foodbridge.org / Pass1234!');

  // 4. Generate 24 Months of Meal Logs & Listings
  // Target counts based on scale:
  // scale '10k'  => ~10k meal logs, ~3.5k listings
  // scale '100k' => ~100k meal logs, ~35k listings
  // scale '300k' => ~300k meal logs, ~105k listings
  // scale '1M'   => ~1M meal logs
  let targetMealLogs = 100000;
  if (scale === '10k') targetMealLogs = 10000;
  else if (scale === '100k') targetMealLogs = 100000;
  else if (scale === '300k') targetMealLogs = 300000;
  else if (scale === '1M') targetMealLogs = 1000000;
  else if (scale === '5M') targetMealLogs = 5000000;

  console.log(`[Data Generator] Generating ${targetMealLogs} meal logs across 24 months...`);

  const startDate = new Date('2024-11-01T00:00:00Z');
  const endDate = new Date('2026-10-23T00:00:00Z');
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Determine days / mess distribution
  // 60 messes * 4 meal types * 5 food categories = 1200 records per day
  // Over 24 months (~720 days), total possible records = ~864,000
  // We sample or generate systematically to match targetMealLogs
  const mealBatch = [];
  const listingBatch = [];
  const auditBatch = [];

  let mealCount = 0;
  let listingCount = 0;
  let dirtyRowsInjected = 0;
  const batchSize = 2500;

  // Meal type multiplier & timing
  const mealConfig = {
    BREAKFAST: { baseWastePct: 0.05, prepHour: 7, collectHour: 10, portionsPerKg: 3.5 },
    LUNCH:     { baseWastePct: 0.08, prepHour: 12, collectHour: 15, portionsPerKg: 2.5 },
    SNACKS:    { baseWastePct: 0.04, prepHour: 17, collectHour: 19, portionsPerKg: 4.0 },
    DINNER:    { baseWastePct: 0.09, prepHour: 20, collectHour: 22, portionsPerKg: 2.5 },
  };

  const categoryMultiplier = {
    RICE_GRAINS: 1.3,
    CURRY_DAL: 1.2,
    ROTI_BREAD: 0.8,
    VEGETABLES: 0.9,
    DESSERT_SNACK: 0.6,
  };

  // Simulation day by day
  let dayOffset = 0;
  while (mealCount < targetMealLogs) {
    const curDate = new Date(startDate.getTime() + (dayOffset % totalDays) * 86400000);
    dayOffset++;

    const dayOfWeek = curDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isExam = isExamMonth(curDate.getMonth());
    const festival = getFestival(curDate);
    const isHoliday = !!festival || isWeekend;

    for (const mess of createdMesses) {
      if (mealCount >= targetMealLogs) break;

      // Select meals for this mess on this day
      for (const mealType of MEAL_TYPES) {
        if (mealCount >= targetMealLogs) break;

        const mCfg = mealConfig[mealType];
        // Attendance logic
        let attendanceFactor = 1.0;
        if (isWeekend) attendanceFactor *= randBetween(0.65, 0.85); // students go out
        if (isExam) attendanceFactor *= randBetween(0.95, 1.05);
        if (festival) attendanceFactor *= randBetween(0.50, 0.75); // hostel vacating

        const plannedAttendance = Math.round(mess.capacity * randBetween(0.85, 0.98));
        const actualAttendance = Math.round(plannedAttendance * attendanceFactor);

        for (const category of FOOD_CATEGORIES) {
          if (mealCount >= targetMealLogs) break;

          const catMult = categoryMultiplier[category];
          // Prepared quantity in kg
          const basePortionKg = 0.12 * catMult;
          let preparedKg = Math.round(plannedAttendance * basePortionKg * mess.overprepareTendency);
          let servedKg = Math.round(actualAttendance * basePortionKg);
          if (servedKg > preparedKg) servedKg = preparedKg;

          let leftoverKg = parseFloat((preparedKg - servedKg).toFixed(1));

          // Anomaly injection: ~2% unexpected massive leftover
          let isAnomaly = false;
          let anomalyScore = 0.2 + rng() * 1.2;
          if (rng() < 0.02) {
            isAnomaly = true;
            leftoverKg = parseFloat((leftoverKg * randBetween(2.2, 3.5)).toFixed(1));
            anomalyScore = parseFloat((2.6 + rng() * 1.5).toFixed(2));
          }

          // Cost estimation: ₹60 / kg average
          const costOfLeftoverRs = Math.round(leftoverKg * 60);

          // 1-2% Dirty rows injection to exercise data cleaning & data quality page
          let dirtyRow = false;
          let recordPrepared = preparedKg;
          let recordServed = servedKg;
          let recordLeftover = leftoverKg;
          let recordCategory = category;
          let recordDate = curDate;

          if (rng() < 0.015) {
            dirtyRowsInjected++;
            dirtyRow = true;
            const dirtyType = randInt(1, 4);
            if (dirtyType === 1) {
              // Negative quantity
              recordLeftover = -Math.abs(leftoverKg);
            } else if (dirtyType === 2) {
              // Impossible timestamp (future year 2099)
              recordDate = new Date('2099-01-01T12:00:00Z');
            } else if (dirtyType === 3) {
              // Null / missing category or extreme outlier
              recordPrepared = 99999;
            } else if (dirtyType === 4) {
              // Duplicate timestamp entry
              recordServed = recordPrepared + 500; // served > prepared
            }
          }

          // Donated portion: if leftover >= 8kg and not dirty, donate 70-100% of it
          let donatedKg = 0;
          if (recordLeftover >= 8 && !dirtyRow) {
            donatedKg = parseFloat((recordLeftover * randBetween(0.75, 1.0)).toFixed(1));
          }

          const mealLogDoc = {
            messId: mess._id,
            date: recordDate,
            mealType,
            foodCategory: recordCategory,
            plannedAttendance,
            actualAttendance,
            preparedKg: recordPrepared,
            servedKg: recordServed,
            leftoverKg: recordLeftover,
            donatedKg,
            costOfLeftoverRs,
            isHoliday,
            isExamWeek: isExam,
            festivalName: festival,
            dayOfWeek,
            anomalyScore,
            isAnomaly,
            loggedAt: new Date(curDate.getTime() + mCfg.prepHour * 3600000 + 7200000), // 2 hrs after prep
          };

          mealBatch.push(mealLogDoc);
          mealCount++;

          // If donatedKg >= 10kg, create a redistribution Listing
          if (donatedKg >= 10 && !dirtyRow && (mealCount % 3 === 0)) {
            const prepTime = new Date(curDate.getTime() + mCfg.prepHour * 3600000);
            const collectTime = new Date(curDate.getTime() + mCfg.collectHour * 3600000);

            // Select an NGO candidate and match
            // Rank NGOs by distance
            const rankedNgos = createdNgos
              .map(ngo => {
                const dist = haversineDistanceKm(
                  mess.location.coordinates[1],
                  mess.location.coordinates[0],
                  ngo.location.coordinates[1],
                  ngo.location.coordinates[0]
                );
                return { ngo, dist };
              })
              .filter(item => item.dist <= item.ngo.serviceRadiusKm)
              .sort((a, b) => a.dist - b.dist);

            const chosenMatch = rankedNgos[0] || { ngo: createdNgos[0], dist: 4.5 };
            const ngo = chosenMatch.ngo;

            // Determine listing status based on historical probability
            // COMPLETED (78%), EXPIRED (10%), FAILED (6%), AVAILABLE/RESERVED for very recent dates
            let status = 'COMPLETED';
            const isRecent = (endDate.getTime() - curDate.getTime()) < (7 * 86400000); // last 7 days

            if (isRecent) {
              const r = rng();
              if (r < 0.35) status = 'AVAILABLE';
              else if (r < 0.65) status = 'RESERVED';
              else status = 'COMPLETED';
            } else {
              const r = rng();
              if (r < 0.78) status = 'COMPLETED';
              else if (r < 0.90) status = 'EXPIRED';
              else status = 'FAILED';
            }

            const statusHistory = [
              { status: 'AVAILABLE', timestamp: prepTime, note: 'Listing published by mess operator' },
            ];

            let claimedByNgoId = undefined;
            let claimedAt = undefined;
            let pickupAssignedAt = undefined;
            let collectedAt = undefined;
            let completedAt = undefined;

            if (status !== 'AVAILABLE') {
              claimedByNgoId = ngo._id;
              claimedAt = new Date(prepTime.getTime() + randInt(15, 45) * 60000);
              pickupAssignedAt = new Date(claimedAt.getTime() + 10 * 60000);
              statusHistory.push({
                status: 'RESERVED',
                timestamp: claimedAt,
                note: `Claimed by ${ngo.name}`,
              });

              if (status === 'COMPLETED' || status === 'COLLECTED' || status === 'FAILED') {
                collectedAt = new Date(claimedAt.getTime() + randInt(30, 90) * 60000);
                statusHistory.push({
                  status: 'COLLECTED',
                  timestamp: collectedAt,
                  note: 'Picked up by transport van',
                });

                if (status === 'COMPLETED') {
                  completedAt = new Date(collectedAt.getTime() + randInt(20, 50) * 60000);
                  statusHistory.push({
                    status: 'COMPLETED',
                    timestamp: completedAt,
                    note: 'Redistributed to community shelter',
                  });
                } else if (status === 'FAILED') {
                  statusHistory.push({
                    status: 'FAILED',
                    timestamp: collectTime,
                    note: 'Transit delay resulted in safe consumption window breach',
                  });
                }
              } else if (status === 'EXPIRED') {
                statusHistory.push({
                  status: 'EXPIRED',
                  timestamp: collectTime,
                  note: 'Collect-by deadline passed before pickup',
                });
              }
            }

            // Matching scores breakdown
            const distanceScore = Math.max(0, Math.round(100 - (chosenMatch.dist / ngo.serviceRadiusKm) * 60));
            const capacityScore = Math.min(100, Math.round((ngo.vehicleCapacityKg / (donatedKg * 1.5)) * 80));
            const deadlineScore = 85;
            const reliabilityScore = Math.round(ngo.reliabilityStats.bayesianScore * 100);
            const totalScore = Math.round(
              distanceScore * 0.35 + capacityScore * 0.25 + deadlineScore * 0.20 + reliabilityScore * 0.20
            );

            const matchingScores = [
              {
                ngoId: ngo._id,
                rank: 1,
                totalScore,
                distanceKm: parseFloat(chosenMatch.dist.toFixed(2)),
                breakdown: {
                  distanceScore,
                  capacityScore,
                  deadlineScore,
                  reliabilityScore,
                },
                explanation: `Rank 1: ${chosenMatch.dist.toFixed(1)} km away, ${ngo.vehicleCapacityKg}kg vehicle capacity, ${(ngo.reliabilityStats.bayesianScore * 100).toFixed(0)}% Bayesian reliability.`,
              },
            ];

            const listingDoc = {
              messId: mess._id,
              title: `${mealType.charAt(0) + mealType.slice(1).toLowerCase()} Surplus: ${category.replace('_', ' ')}`,
              foodCategory: pickOne(LISTING_CATEGORIES),
              mealType,
              quantityKg: donatedKg,
              portionsEstimate: Math.round(donatedKg * mCfg.portionsPerKg),
              preparedAt: prepTime,
              collectBy: collectTime,
              dietaryTags: ['VEG', 'HALAL'],
              pickupLocation: mess.location,
              pickupAddress: mess.address,
              status,
              claimedByNgoId,
              claimedAt,
              pickupAssignedAt,
              collectedAt,
              completedAt,
              matchingScores,
              statusHistory,
              notes: `Immediate pickup requested before ${collectTime.toTimeString().slice(0, 5)}`,
              createdAt: prepTime,
            };

            listingBatch.push(listingDoc);
            listingCount++;
          }

          // Batch insert when threshold reached
          if (mealBatch.length >= batchSize) {
            if (insert) {
              await MealLog.insertMany(mealBatch, { ordered: false });
            }
            mealBatch.length = 0;
            process.stdout.write(`\r[Data Generator] Inserted ${mealCount} / ${targetMealLogs} meal logs...`);
          }

          if (listingBatch.length >= batchSize) {
            if (insert) {
              await Listing.insertMany(listingBatch, { ordered: false });
            }
            listingBatch.length = 0;
          }
        }
      }
    }
  }

  // Insert remaining documents
  if (mealBatch.length > 0 && insert) {
    await MealLog.insertMany(mealBatch, { ordered: false });
  }
  if (listingBatch.length > 0 && insert) {
    await Listing.insertMany(listingBatch, { ordered: false });
  }

  console.log(`\n[Data Generator] Meal logs generated: ${mealCount}`);
  console.log(`[Data Generator] Listings generated: ${listingCount}`);
  console.log(`[Data Generator] Dirty rows injected for data cleaning: ${dirtyRowsInjected} (~${((dirtyRowsInjected / mealCount) * 100).toFixed(2)}%)`);

  // Generate Audit logs with TTL
  console.log('[Data Generator] Generating sample Audit Logs with 90-day TTL...');
  const auditLogs = [];
  const auditActions = ['LISTING_CREATED', 'CLAIM_SUBMITTED', 'PICKUP_CONFIRMED', 'DELIVERY_COMPLETED', 'SETTING_UPDATED'];
  for (let i = 0; i < 500; i++) {
    const action = pickOne(auditActions);
    auditLogs.push({
      action,
      entityType: action.includes('LISTING') || action.includes('CLAIM') ? 'Listing' : 'System',
      entityId: new mongoose.Types.ObjectId().toString(),
      ipAddress: `192.168.1.${randInt(10, 250)}`,
      details: { trigger: 'OPERATOR_DISPATCH', latencyMs: randInt(40, 250) },
      createdAt: new Date(Date.now() - randInt(1, 80) * 86400000), // within 90 days TTL
    });
  }
  await AuditLog.insertMany(auditLogs);
  console.log(`[Data Generator] Inserted ${auditLogs.length} AuditLog documents.`);

  // Verify Counts in DB
  const actualMessCount = await Mess.countDocuments();
  const actualNgoCount = await Ngo.countDocuments();
  const actualMealCount = await MealLog.countDocuments();
  const actualListingCount = await Listing.countDocuments();
  const actualAuditCount = await AuditLog.countDocuments();

  console.log('\n================ DATASET GENERATION SUMMARY ================');
  console.log(`- Messes:               ${actualMessCount}`);
  console.log(`- NGOs:                 ${actualNgoCount}`);
  console.log(`- Meal Logs:            ${actualMealCount}`);
  console.log(`- Donations/Listings:   ${actualListingCount}`);
  console.log(`- Audit Logs:           ${actualAuditCount}`);
  console.log(`- Injected Dirty Rows:  ${dirtyRowsInjected}`);
  console.log('============================================================\n');

  await mongoose.disconnect();
  return {
    messes: actualMessCount,
    ngos: actualNgoCount,
    mealLogs: actualMealCount,
    listings: actualListingCount,
    auditLogs: actualAuditCount,
    dirtyRows: dirtyRowsInjected,
  };
}

// CLI runner
if (process.argv[1]?.endsWith('generate_dataset.js')) {
  const scaleArgIdx = process.argv.indexOf('--scale');
  const scale = scaleArgIdx !== -1 ? process.argv[scaleArgIdx + 1] : '100k';
  generateSyntheticData(scale, true)
    .then(() => {
      console.log('[Data Generator] Completed successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('[Data Generator] Error:', err);
      process.exit(1);
    });
}
