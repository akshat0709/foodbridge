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
// Fixed IDs for the demo accounts. PLATFORM_ADMIN matches the fallback identity
// used by middleware/auth.ts, and all three match DEMO_PROFILES in the client,
// so /auth/me and audit references resolve to real user documents.
const DEMO_USER_IDS = {
    PLATFORM_ADMIN: '6adcd57184b8ffbca383bf2e',
    MESS_ADMIN: '6adcd57184b8ffbca383bf30',
    NGO_REP: '6adcd57184b8ffbca383bf31',
};
const BASE_LAT = 28.545;
const BASE_LNG = 77.192;
/**
 * Seeds demo data into an empty database. Each collection is checked on its
 * own and only seeded when empty, so a database left half-seeded by an earlier
 * failed run (e.g. messes inserted but NGOs rejected) is completed on the next
 * start instead of being skipped forever. Existing documents are never
 * modified or removed.
 */
export async function autoBootstrapIfEmpty() {
    try {
        const [messCount, ngoCount, listingCount, mealLogCount] = await Promise.all([
            Mess.countDocuments(),
            Ngo.countDocuments(),
            Listing.countDocuments(),
            MealLog.countDocuments(),
        ]);
        const demoEmails = ['platform.admin@foodbridge.org', 'mess.admin@foodbridge.org', 'ngo.rep@foodbridge.org'];
        const existingDemoUsers = await User.countDocuments({ email: { $in: demoEmails } });
        if (messCount > 0 && ngoCount > 0 && listingCount > 0 && mealLogCount > 0 && existingDemoUsers === demoEmails.length) {
            console.log(`[Bootstrap] Database already initialized (${messCount} messes, ${ngoCount} NGOs).`);
            return;
        }
        console.log('[Bootstrap] Seeding missing demo data...');
        // 1. System Setting (upsert, only sets values on insert)
        await SystemSetting.updateOne({ key: 'GLOBAL_CONFIG' }, {
            $setOnInsert: {
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
        }, { upsert: true });
        // 2. Messes
        const campuses = ['North Campus', 'South Campus', 'East Technological Hub', 'West Enclave'];
        if (messCount === 0) {
            const messDocs = MESS_NAMES.map((name, i) => {
                const latOffset = ((i % 10) - 5) * 0.02;
                const lngOffset = (Math.floor(i / 10) - 3) * 0.02;
                const capacity = 400 + (i * 15);
                return {
                    name,
                    campus: campuses[i % campuses.length],
                    location: {
                        type: 'Point',
                        coordinates: [BASE_LNG + lngOffset, BASE_LAT + latOffset],
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
            await Mess.insertMany(messDocs);
            console.log(`[Bootstrap] Inserted ${messDocs.length} messes.`);
        }
        // 3. NGOs
        if (ngoCount === 0) {
            const ngoDocs = NGO_NAMES.map((name, i) => {
                const latOffset = ((i % 5) - 2) * 0.035;
                const lngOffset = (Math.floor(i / 5) - 2) * 0.035;
                return {
                    name,
                    registrationNumber: `NGO/DEL/${2020 + (i % 5)}/${1000 + i}`,
                    location: {
                        type: 'Point',
                        coordinates: [BASE_LNG + lngOffset, BASE_LAT + latOffset],
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
            await Ngo.insertMany(ngoDocs);
            console.log(`[Bootstrap] Inserted ${ngoDocs.length} NGOs.`);
        }
        const primaryMess = (await Mess.findOne({ name: MESS_NAMES[0] })) || (await Mess.findOne().sort({ name: 1 }));
        const secondaryMess = (await Mess.findOne({ name: MESS_NAMES[1] })) || (await Mess.findOne({ _id: { $ne: primaryMess?._id } }));
        const primaryNgo = (await Ngo.findOne({ name: NGO_NAMES[0] })) || (await Ngo.findOne().sort({ name: 1 }));
        if (!primaryMess || !secondaryMess || !primaryNgo) {
            console.error('[Bootstrap] Cannot seed users/listings: messes or NGOs are missing.');
            return;
        }
        // 4. Demo Users (insert only the ones that do not exist yet)
        const passwordHash = await bcrypt.hash('Pass1234!', 10);
        const users = [
            {
                _id: new mongoose.Types.ObjectId(DEMO_USER_IDS.MESS_ADMIN),
                email: 'mess.admin@foodbridge.org',
                name: 'Rohan Sharma (Mess Admin)',
                role: 'MESS_ADMIN',
                phone: '+91 9876543210',
                organizationId: primaryMess._id,
            },
            {
                _id: new mongoose.Types.ObjectId(DEMO_USER_IDS.NGO_REP),
                email: 'ngo.rep@foodbridge.org',
                name: 'Pooja Verma (NGO Rep)',
                role: 'NGO_REP',
                phone: '+91 9876543211',
                organizationId: primaryNgo._id,
            },
            {
                _id: new mongoose.Types.ObjectId(DEMO_USER_IDS.PLATFORM_ADMIN),
                email: 'platform.admin@foodbridge.org',
                name: 'Aditi Rao (Platform Admin)',
                role: 'PLATFORM_ADMIN',
                phone: '+91 9876543212',
            },
        ];
        for (const u of users) {
            const exists = await User.exists({ $or: [{ email: u.email }, { _id: u._id }] });
            if (!exists) {
                await User.create({ ...u, passwordHash });
                console.log(`[Bootstrap] Created demo user ${u.email}.`);
            }
        }
        // 5. Initial Listings (must satisfy the Listing schema)
        if (listingCount === 0) {
            const now = Date.now();
            const listings = [
                {
                    messId: primaryMess._id,
                    title: 'Lunch Surplus: Rice & Dal',
                    foodCategory: 'COOKED_MEALS',
                    mealType: 'LUNCH',
                    quantityKg: 55,
                    portionsEstimate: 135,
                    preparedAt: new Date(now - 3600000),
                    collectBy: new Date(now + 14400000),
                    dietaryTags: ['VEG'],
                    status: 'AVAILABLE',
                    pickupLocation: primaryMess.location,
                    pickupAddress: `${primaryMess.name}, Central Kitchen Ramp`,
                    notes: 'Freshly prepared lunch surplus in hot containers',
                    statusHistory: [
                        { status: 'AVAILABLE', timestamp: new Date(now - 3600000), note: 'Listing created and available for claims' },
                    ],
                },
                {
                    messId: secondaryMess._id,
                    title: 'Dinner Surplus: Roti & Mixed Veg',
                    foodCategory: 'COOKED_MEALS',
                    mealType: 'DINNER',
                    quantityKg: 55,
                    portionsEstimate: 120,
                    preparedAt: new Date(now - 7200000),
                    collectBy: new Date(now + 10800000),
                    dietaryTags: ['VEG'],
                    status: 'RESERVED',
                    claimedByNgoId: primaryNgo._id,
                    claimedAt: new Date(now - 1800000),
                    pickupAssignedAt: new Date(now - 1800000),
                    pickupLocation: secondaryMess.location,
                    pickupAddress: `${secondaryMess.name}, Gate 2`,
                    statusHistory: [
                        { status: 'AVAILABLE', timestamp: new Date(now - 7200000), note: 'Listing created and available for claims' },
                        { status: 'RESERVED', timestamp: new Date(now - 1800000), note: `Claimed by ${primaryNgo.name}` },
                    ],
                },
            ];
            await Listing.insertMany(listings);
            console.log(`[Bootstrap] Inserted ${listings.length} listings.`);
        }
        // 6. Recent Meal Logs for dashboards
        if (mealLogCount === 0) {
            // Include the demo mess admin's mess so its Meal Log / analytics pages have data.
            const otherMesses = await Mess.find({ _id: { $ne: primaryMess._id } }).sort({ name: 1 }).limit(4).lean();
            const messesForLogs = [primaryMess, ...otherMesses];
            const sampleLogs = [];
            const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
            const foodCats = [
                'RICE_GRAINS', 'CURRY_DAL', 'ROTI_BREAD', 'VEGETABLES', 'DESSERT_SNACK'
            ];
            for (let day = 0; day < 7; day++) {
                const date = new Date(Date.now() - day * 86400000);
                for (const m of messesForLogs) {
                    for (const mt of mealTypes) {
                        const leftoverKg = 15;
                        sampleLogs.push({
                            messId: m._id,
                            date,
                            mealType: mt,
                            foodCategory: foodCats[Math.floor(Math.random() * foodCats.length)],
                            plannedAttendance: 500,
                            actualAttendance: 460 + Math.floor(Math.random() * 50),
                            preparedKg: 120,
                            servedKg: 105,
                            leftoverKg,
                            donatedKg: 12,
                            costOfLeftoverRs: leftoverKg * 60,
                            isHoliday: day % 6 === 0,
                            isExamWeek: false,
                            dayOfWeek: date.getDay(),
                        });
                    }
                }
            }
            await MealLog.insertMany(sampleLogs);
            console.log(`[Bootstrap] Inserted ${sampleLogs.length} meal logs.`);
        }
        console.log('[Bootstrap] Demo data seeding complete.');
    }
    catch (err) {
        console.error('[Bootstrap] Auto-seeding error (non-fatal):', err);
    }
}
