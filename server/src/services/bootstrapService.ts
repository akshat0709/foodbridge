import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Mess } from '../models/Mess.js';
import { Ngo } from '../models/Ngo.js';
import { Listing } from '../models/Listing.js';
import { MealLog } from '../models/MealLog.js';
import { SystemSetting } from '../models/SystemSetting.js';

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

const NGO_NAMES = [
  'Robin Hood Army - South Delhi', 'Feeding India - Central Hub', 'Annakshetra Foundation', 'Roti Bank Trust',
  'Goonj Community Kitchen', 'Asha Deep Food Relief', 'Sanjivani Seva Samiti', 'Akshaya Patra Outreach',
  'Umeed Food Brigade', 'Jan Rasoi Initiative', 'Nourish India Network', 'Pratham Food Care',
  'Seva Kitchen Network', 'Samarpan Food Trust', 'Punarutthan Foundation', 'Drishti Welfare Society',
  'Koshish Food Rescue', 'Helping Hands Hunger Relief', 'Prayas Youth Foundation', 'Annamrita Foundation',
  'Navjeevan Community Food', 'Bhojan Daan Samiti', 'Smile Hunger Network', 'Sahyog Food Bank',
  'Vanguard Relief Mission'
];

export async function autoBootstrapIfEmpty() {
  try {
    const messCount = await Mess.countDocuments();
    if (messCount > 0) {
      console.log(`[Bootstrap] Database already initialized (${messCount} messes found).`);
      return;
    }

    console.log('[Bootstrap] Database is empty. Auto-seeding initial data...');

    // 1. System Setting
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

    // 2. 60 Messes
    const baseLat = 28.545;
    const baseLng = 77.192;
    const campuses = ['North Campus', 'South Campus', 'East Technological Hub', 'West Enclave'];

    const messDocs = MESS_NAMES.map((name, i) => {
      const latOffset = ((i % 10) - 5) * 0.02;
      const lngOffset = (Math.floor(i / 10) - 3) * 0.02;
      const capacity = 400 + (i * 15);
      return {
        _id: new mongoose.Types.ObjectId(),
        name,
        campus: campuses[i % campuses.length],
        location: {
          type: 'Point',
          coordinates: [baseLng + lngOffset, baseLat + latOffset],
        },
        address: `${name}, Block ${String.fromCharCode(65 + (i % 6))}, ${campuses[i % campuses.length]}`,
        capacity,
        contactPerson: `Manager ${name.split(' ')[0]}`,
        phone: `+91 98${10000000 + i}`,
        averageDailyLeftoverKg: Math.round(capacity * 0.08),
        overprepareTendency: 1.05,
        isActive: true,
      };
    });
    const createdMesses = await Mess.insertMany(messDocs);

    // 3. 25 NGOs
    const ngoDocs = NGO_NAMES.map((name, i) => {
      const latOffset = ((i % 5) - 2) * 0.035;
      const lngOffset = (Math.floor(i / 5) - 2) * 0.035;
      return {
        _id: new mongoose.Types.ObjectId(),
        name,
        location: {
          type: 'Point',
          coordinates: [baseLng + lngOffset, baseLat + latOffset],
        },
        address: `${name}, Community Hub ${i + 1}`,
        vehicleCapacityKg: 200 + (i * 10),
        serviceRadiusKm: 15 + (i % 10),
        operatingHours: { start: '07:00', end: '23:30' },
        contactPerson: `Coordinator ${name.split(' ')[0]}`,
        phone: `+91 91${10000000 + i}`,
        reliabilityStats: {
          totalAssigned: 40 + i,
          totalCompleted: 38 + i,
          totalExpiredOrFailed: 2,
          averageDelayMinutes: 12,
          bayesianScore: 0.94,
          timeOfDayProfile: {
            morningRate: 0.95,
            afternoonRate: 0.92,
            eveningRate: 0.96,
            nightRate: 0.88,
          },
        },
        isActive: true,
      };
    });
    const createdNgos = await Ngo.insertMany(ngoDocs);

    // 4. Demo Users
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

    // 5. Initial Active Listings
    const listings = [
      {
        messId: createdMesses[0]._id,
        foodItems: [
          { name: 'Steamed Basmati Rice', category: 'RICE_GRAINS', quantityKg: 35 },
          { name: 'Yellow Dal Tadka', category: 'CURRY_DAL', quantityKg: 20 },
        ],
        totalQuantityKg: 55,
        estimatedServings: 135,
        preparedAt: new Date(Date.now() - 3600000),
        expiryDeadline: new Date(Date.now() + 14400000),
        status: 'AVAILABLE',
        pickupLocation: {
          type: 'Point',
          coordinates: [baseLng, baseLat],
          address: `${MESS_NAMES[0]}, Central Kitchen Ramp`,
        },
        contactPhone: '+91 9876543210',
        dietaryType: 'VEG',
        qualityCheck: {
          isFresh: true,
          storageCondition: 'HOT_CONTAINER',
          temperatureCelsius: 65,
          notes: 'Freshly prepared lunch surplus',
        },
      },
      {
        messId: createdMesses[1]._id,
        foodItems: [
          { name: 'Chapati / Whole Wheat Roti', category: 'ROTI_BREAD', quantityKg: 25 },
          { name: 'Mixed Vegetable Curry', category: 'VEGETABLES', quantityKg: 30 },
        ],
        totalQuantityKg: 55,
        estimatedServings: 120,
        preparedAt: new Date(Date.now() - 7200000),
        expiryDeadline: new Date(Date.now() + 10800000),
        status: 'CLAIMED',
        claimedByNgoId: createdNgos[0]._id,
        claimedAt: new Date(Date.now() - 1800000),
        pickupLocation: {
          type: 'Point',
          coordinates: [baseLng + 0.01, baseLat + 0.01],
          address: `${MESS_NAMES[1]}, Gate 2`,
        },
        contactPhone: '+91 9876543211',
        dietaryType: 'VEG',
      },
    ];
    await Listing.insertMany(listings);

    // 6. Recent Meal Logs for dashboards
    const sampleLogs = [];
    const mealTypes: ('BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER')[] = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
    const foodCats: ('RICE_GRAINS' | 'CURRY_DAL' | 'ROTI_BREAD' | 'VEGETABLES' | 'DESSERT_SNACK')[] = [
      'RICE_GRAINS', 'CURRY_DAL', 'ROTI_BREAD', 'VEGETABLES', 'DESSERT_SNACK'
    ];

    for (let day = 0; day < 7; day++) {
      const date = new Date(Date.now() - day * 86400000);
      for (const m of createdMesses.slice(0, 5)) {
        for (const mt of mealTypes) {
          sampleLogs.push({
            messId: m._id,
            date,
            mealType: mt,
            foodCategory: foodCats[Math.floor(Math.random() * foodCats.length)],
            plannedAttendance: 500,
            actualAttendance: 460 + Math.floor(Math.random() * 50),
            preparedKg: 120,
            servedKg: 105,
            leftoverKg: 15,
            donatedKg: 12,
            isHoliday: day % 6 === 0,
            isExamWeek: false,
          });
        }
      }
    }
    await MealLog.insertMany(sampleLogs);

    console.log('[Bootstrap] Initial data created successfully: 60 Messes, 25 NGOs, 3 Demo Users, 2 Listings, 140 MealLogs.');
  } catch (err) {
    console.error('[Bootstrap] Auto-seeding error (non-fatal):', err);
  }
}
