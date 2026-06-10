// Before
class Provider {
  // ...

  // After
  async getRealtimeMetrics() {
    const responseTime = await this.getResponseTime();
    const errorRate = await this.getErrorRate();
    return { responseTime, errorRate };
  }

  async getResponseTime() {
    // implement response time metric
  }

  async getErrorRate() {
    // implement error rate metric
  }
}

const providers = new Map();
// ...