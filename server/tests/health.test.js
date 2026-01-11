const request = require('supertest')

const API_URL = 'http://localhost:5000'

describe('Health check', () => {
  it('should return API status', async () => {
    const res = await request(API_URL).get('/health')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
