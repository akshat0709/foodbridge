import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/index.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { autoBootstrapIfEmpty } from '../src/services/bootstrapService.js';
import { Listing } from '../src/models/Listing.js';
import { User } from '../src/models/User.js';

// Requires a reachable MongoDB (MONGODB_URI, default mongodb://127.0.0.1:27017/foodbridge).
// Seeds the demo accounts if missing, and cleans up the listing it creates.

const PASSWORD = 'Pass1234!';
let adminToken: string;
let messToken: string;
let ngoToken: string;
let messOrgId: string;
let ngoOrgId: string;
const createdListingIds: string[] = [];

async function loginAs(email: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return res.body.data as { token: string; user: { organizationId?: string } };
}

describe('Authentication & authorization', () => {
  beforeAll(async () => {
    await connectDB();
    await autoBootstrapIfEmpty();
    const admin = await loginAs('platform.admin@foodbridge.org');
    const mess = await loginAs('mess.admin@foodbridge.org');
    const ngo = await loginAs('ngo.rep@foodbridge.org');
    adminToken = admin.token;
    messToken = mess.token;
    ngoToken = ngo.token;
    messOrgId = String(mess.user.organizationId);
    ngoOrgId = String(ngo.user.organizationId);
  });

  afterAll(async () => {
    if (createdListingIds.length) await Listing.deleteMany({ _id: { $in: createdListingIds } });
    await disconnectDB();
  });

  it('rejects requests without a token', async () => {
    for (const path of ['/api/messes', '/api/auth/me', '/api/listings', '/api/admin/settings']) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('rejects forged and expired tokens', async () => {
    const forged = jwt.sign({ userId: 'x', role: 'PLATFORM_ADMIN' }, 'not-the-server-secret');
    const res = await request(app).get('/api/messes').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');

    const user = await User.findOne({ email: 'platform.admin@foodbridge.org' }).lean();
    const { getJwtSecret } = await import('../src/config.js');
    const expired = jwt.sign({ userId: String(user!._id), role: 'PLATFORM_ADMIN' }, getJwtSecret(), { expiresIn: -10 });
    const res2 = await request(app).get('/api/messes').set('Authorization', `Bearer ${expired}`);
    expect(res2.status).toBe(401);
    expect(res2.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mess.admin@foodbridge.org', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('returns the signed-in user from /auth/me', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${messToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('MESS_ADMIN');
    expect(res.body.data.organization?.name).toBeTruthy();
  });

  it('enforces role checks on admin-only routes', async () => {
    for (const token of [messToken, ngoToken]) {
      const res = await request(app).get('/api/admin/settings').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    }
    const ok = await request(app).get('/api/admin/settings').set('Authorization', `Bearer ${adminToken}`);
    expect(ok.status).toBe(200);
  });

  it('keeps mess admins inside their own mess', async () => {
    const other = await request(app).get('/api/messes').set('Authorization', `Bearer ${messToken}`);
    const otherMess = other.body.data.find((m: any) => m._id !== messOrgId);

    const forbidden = await request(app)
      .get(`/api/messes/${otherMess._id}/meal-logs`)
      .set('Authorization', `Bearer ${messToken}`);
    expect(forbidden.status).toBe(403);

    const all = await request(app).get('/api/messes/all/meal-logs').set('Authorization', `Bearer ${messToken}`);
    expect(all.status).toBe(403);

    const own = await request(app).get(`/api/messes/${messOrgId}/meal-logs`).set('Authorization', `Bearer ${messToken}`);
    expect(own.status).toBe(200);

    const listings = await request(app).get('/api/listings?limit=100').set('Authorization', `Bearer ${messToken}`);
    expect(listings.status).toBe(200);
    for (const l of listings.body.data.items) {
      expect(String(l.messId?._id ?? l.messId)).toBe(messOrgId);
    }
  });

  it('runs the listing lifecycle with ownership checks', async () => {
    const now = Date.now();
    const created = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${messToken}`)
      .send({
        messId: messOrgId,
        title: 'ZZ_TEST auth lifecycle',
        foodCategory: 'COOKED_MEALS',
        mealType: 'LUNCH',
        quantityKg: 8,
        portionsEstimate: 20,
        preparedAt: new Date(now).toISOString(),
        collectBy: new Date(now + 3 * 3600_000).toISOString(),
      });
    expect(created.status).toBe(201);
    const id = created.body.data._id;
    createdListingIds.push(id);

    // NGO rep cannot spoof another NGO: claim is always recorded for their own NGO.
    const claim = await request(app)
      .post(`/api/listings/${id}/claim`)
      .set('Authorization', `Bearer ${ngoToken}`)
      .send({ ngoId: '000000000000000000000001' });
    expect(claim.status).toBe(200);
    expect(String(claim.body.data.claimedByNgoId)).toBe(ngoOrgId);

    // Mess admins cannot claim.
    const messClaim = await request(app).post(`/api/listings/${id}/claim`).set('Authorization', `Bearer ${messToken}`);
    expect(messClaim.status).toBe(403);

    const collected = await request(app)
      .post(`/api/listings/${id}/transition`)
      .set('Authorization', `Bearer ${ngoToken}`)
      .send({ status: 'COLLECTED' });
    expect(collected.status).toBe(200);
  });

  it('prevents creating listings for another mess', async () => {
    const messes = await request(app).get('/api/messes').set('Authorization', `Bearer ${messToken}`);
    const otherMess = messes.body.data.find((m: any) => m._id !== messOrgId);
    const now = Date.now();
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${messToken}`)
      .send({
        messId: otherMess._id,
        title: 'ZZ_TEST should fail',
        foodCategory: 'COOKED_MEALS',
        mealType: 'LUNCH',
        quantityKg: 5,
        portionsEstimate: 10,
        preparedAt: new Date(now).toISOString(),
        collectBy: new Date(now + 3600_000).toISOString(),
      });
    expect(res.status).toBe(403);
  });

  it('prevents NGO reps from editing another NGO', async () => {
    const ngos = await request(app).get('/api/ngos').set('Authorization', `Bearer ${ngoToken}`);
    const otherNgo = ngos.body.data.find((n: any) => n._id !== ngoOrgId);
    const res = await request(app)
      .put(`/api/ngos/${otherNgo._id}/settings`)
      .set('Authorization', `Bearer ${ngoToken}`)
      .send({ serviceRadiusKm: 99 });
    expect(res.status).toBe(403);
  });
});
