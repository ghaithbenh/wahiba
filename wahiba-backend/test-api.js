/**
 * API Test Script for Wahiba Bridal World
 * 
 * This script tests all API endpoints to ensure they're working correctly.
 * Run this after starting the server with: node test-api.js
 */

const BASE_URL = 'http://localhost:5000';

async function testEndpoint(method, endpoint, data = null, description = '') {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const response = await fetch(url, options);
    const result = await response.json();

    console.log(`✓ ${method} ${endpoint} - ${response.status}`);
    if (description) console.log(`  ${description}`);
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.error(`✗ ${method} ${endpoint} - ERROR`);
    console.error(`  ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n=================================');
  console.log('🧪 Starting API Tests');
  console.log('=================================\n');

  // Health check
  console.log('--- Health Check ---');
  await testEndpoint('GET', '/health', null, 'Server health check');

  // Categories
  console.log('\n--- Categories ---');
  await testEndpoint('GET', '/api/categories', null, 'Fetch all categories');
  const categoryResult = await testEndpoint('POST', '/api/categories', { name: 'Test Category' }, 'Create test category');
  if (categoryResult.success && categoryResult.data.data) {
    const catId = categoryResult.data.data.id;
    await testEndpoint('GET', `/api/categories/${catId}`, null, 'Fetch category by ID');
    await testEndpoint('PUT', `/api/categories/${catId}`, { name: 'Updated Category' }, 'Update category');
    await testEndpoint('DELETE', `/api/categories/${catId}`, null, 'Delete category');
  }

  // Dresses
  console.log('\n--- Dresses ---');
  await testEndpoint('GET', '/api/dresses', null, 'Fetch all dresses');
  const dressResult = await testEndpoint('POST', '/api/dresses', {
    name: 'Test Dress',
    description: 'A beautiful test dress',
    pricePerDay: 100,
    buyPrice: 500,
    sizes: ['S', 'M', 'L'],
    newCollection: true,
    isForSale: true
  }, 'Create test dress');
  
  if (dressResult.success && dressResult.data.data) {
    const dressId = dressResult.data.data.id;
    await testEndpoint('GET', `/api/dresses/${dressId}`, null, 'Fetch dress by ID');
    await testEndpoint('POST', `/api/dresses/${dressId}/colors`, { colorName: 'Blanc' }, 'Add color to dress');
    await testEndpoint('PUT', `/api/dresses/${dressId}`, {
      name: 'Updated Test Dress',
      description: 'Updated description',
      pricePerDay: 150,
      buyPrice: 600,
      sizes: ['M', 'L', 'XL']
    }, 'Update dress');
    await testEndpoint('DELETE', `/api/dresses/${dressId}`, null, 'Delete dress');
  }

  // Schedules
  console.log('\n--- Schedules ---');
  await testEndpoint('GET', '/api/schedules', null, 'Fetch all schedules');
  const scheduleResult = await testEndpoint('POST', '/api/schedules', {
    fullName: 'Test Customer',
    phone: '1234567890',
    address: '123 Test St',
    note: 'Test appointment',
    tryOnDate: new Date().toISOString(),
    total: 100,
    items: [
      {
        dressName: 'Test Dress',
        color: 'Blanc',
        size: 'M',
        quantity: 1,
        type: 'rental',
        pricePerDay: 100,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString()
      }
    ]
  }, 'Create test schedule');
  
  if (scheduleResult.success && scheduleResult.data.data) {
    const scheduleId = scheduleResult.data.data.id;
    await testEndpoint('GET', `/api/schedules/${scheduleId}`, null, 'Fetch schedule by ID');
    await testEndpoint('PATCH', `/api/schedules/${scheduleId}/status`, { status: 'confirmed' }, 'Update schedule status');
    await testEndpoint('DELETE', `/api/schedules/${scheduleId}`, null, 'Delete schedule');
  }

  // Contacts
  console.log('\n--- Contacts ---');
  await testEndpoint('GET', '/api/contacts', null, 'Fetch all contacts');
  const contactResult = await testEndpoint('POST', '/api/contacts', {
    name: 'Test Contact',
    email: 'test@example.com',
    phone: '1234567890',
    subject: 'Test Subject',
    message: 'This is a test message'
  }, 'Create test contact');
  
  if (contactResult.success && contactResult.data.data) {
    const contactId = contactResult.data.data.id;
    await testEndpoint('GET', `/api/contacts/${contactId}`, null, 'Fetch contact by ID');
    await testEndpoint('DELETE', `/api/contacts/${contactId}`, null, 'Delete contact');
  }

  // Revenues
  console.log('\n--- Revenues ---');
  await testEndpoint('GET', '/api/revenues', null, 'Fetch all revenues');
  const revenueResult = await testEndpoint('POST', '/api/revenues', {
    month: '2024-01-01',
    totalSales: 10,
    salesRevenue: 5000,
    totalRental: 20,
    rentalRevenue: 3000
  }, 'Create test revenue');
  
  if (revenueResult.success && revenueResult.data.data) {
    const revenueId = revenueResult.data.data.id;
    await testEndpoint('GET', `/api/revenues/${revenueId}`, null, 'Fetch revenue by ID');
    await testEndpoint('DELETE', `/api/revenues/${revenueId}`, null, 'Delete revenue');
  }

  // Banners
  console.log('\n--- Banners ---');
  await testEndpoint('GET', '/api/banners', null, 'Fetch all banners');
  await testEndpoint('GET', '/api/banners?active=true', null, 'Fetch active banners only');

  // About Us Images
  console.log('\n--- About Us Images ---');
  await testEndpoint('GET', '/api/about-us-images', null, 'Fetch all about us images');
  await testEndpoint('GET', '/api/about-us-images?active=true', null, 'Fetch active about us images only');

  console.log('\n=================================');
  console.log('✅ Tests Completed!');
  console.log('=================================\n');
  console.log('Note: Image upload tests require multipart/form-data and should be tested manually or with Postman.');
}

// Run tests
runTests().catch(console.error);



