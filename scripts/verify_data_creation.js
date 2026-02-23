const API_URL = 'http://localhost:5001/api';
const TEST_USER = {
    email: 'verify_test@example.com',
    password: 'password123'
};

const TEST_FACILITY = {
    name: '[TEST] Verifying Facility Integration',
    category: '유도',
    address: '서울시 강남구 테헤란로 427', // Deliberately using '서울시' to test normalization
    price_daily: 15000,
    price_monthly: 150000,
    price_yearly: 1200000,
    description: 'This is a test facility to verify maptic bs integration.',
    features: ['샤워실', '주차'],
    images: []
};

async function run() {
    try {
        console.log('1. Authenticating...');
        let token;

        // Helper for fetch
        const post = async (url, data, headers = {}) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (!response.ok) {
                const error = new Error(responseData.error || 'Request failed');
                error.response = { status: response.status, data: responseData };
                throw error;
            }
            return { data: responseData };
        };

        try {
            // Try Signup
            const signupRes = await post(`${API_URL}/auth/signup`, TEST_USER);
            token = signupRes.data.token;
            console.log('   - Signed up new test user.');
        } catch (e) {
            if (e.response && e.response.status === 400) {
                // Try Signin if user exists
                console.log('   - User exists, signing in...');
                const signinRes = await post(`${API_URL}/auth/signin`, TEST_USER);
                token = signinRes.data.token;
                console.log('   - Signed in successfully.');
            } else {
                throw e;
            }
        }

        console.log('2. Creating Facility...');
        const facilityRes = await post(`${API_URL}/facilities`, TEST_FACILITY, {
            Authorization: `Bearer ${token}`
        });

        console.log('   - Facility created:', facilityRes.data.id);
        console.log('   - Name:', facilityRes.data.name);
        console.log('   - Address:', facilityRes.data.address);

        console.log('✅ Verification Data Created Successfully!');
    } catch (error) {
        console.error('❌ Error during verification:', error.message);
        if (error.response) {
            console.error('   - Status:', error.response.status);
            console.error('   - Data:', error.response.data);
        }
    }
}

run();
