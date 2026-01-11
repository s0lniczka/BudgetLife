const request = require('supertest');
const app = require('../app');

let token;

beforeAll(async () => {
  const user = {
    username: `budget_user_${Date.now()}`,
    email: `budget${Date.now()}@test.pl`,
    password: 'Test1234!'
  };

  // rejestracja
  await request(app)
    .post('/api/auth/register')
    .send(user);

  // logowanie
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: user.password
    });

  token = loginRes.body.token;
});

describe('Budgets API – autoryzacja i dostęp', () => {
  test('Dostęp do budżetów z tokenem JWT', async () => {
    const res = await request(app)
      .get('/api/budgets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
