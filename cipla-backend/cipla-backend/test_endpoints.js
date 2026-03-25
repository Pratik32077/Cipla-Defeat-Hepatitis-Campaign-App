require('dotenv').config();
const { totalDoctors, totalVideos } = require('./controller/manager');

const mockRes = {
  status: (code) => ({
    json: (data) => console.log(`Code: ${code}, Data: ${JSON.stringify(data, null, 2)}`)
  })
};

async function testEndpoints() {
  console.log("Testing totalDoctors...");
  await totalDoctors({ user: { id: 1 } }, mockRes);

  console.log("\nTesting totalVideos...");
  await totalVideos({ user: { id: 1 } }, mockRes);

  process.exit();
}

testEndpoints();
