const request = require('supertest');

const API = 'http://localhost:5000/api';

describe('Auth API – rejestracja i logowanie', () => {
  const testUser = {
    username: 'test_user_' + Date.now(),
    email: `test${Date.now()}@test.pl`,
    password: 'Test12345!'
  };

  test('Rejestracja nowego użytkownika', async () => {
  const res = await request(API)
    .post('/auth/register')
    .send(testUser);

  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('id');
  expect(res.body).toHaveProperty('email', testUser.email);
  expect(res.body).toHaveProperty('currency');
});


  test('Logowanie poprawnymi danymi', async () => {
    const res = await request(API)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('Logowanie błędnym hasłem', async () => {
    const res = await request(API)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'ZleHaslo123'
      });

    expect(res.statusCode).toBe(401);
  });
});
