// Before
class Router {
  // ...

  // After
  async getBestProvider(congestedProviders) {
    const bestProvider = congestedProviders.reduce((min, current) => {
      if (current.responseTime < min.responseTime) {
        return current;
      }
      return min;
    }, congestedProviders[0]);
    return bestProvider;
  }

  async routeRequest(request) {
    const congestedProviders = await providers.getCongestedProviders();
    const bestProvider = await this.getBestProvider(congestedProviders);
    // ...
  }
}

const router = new Router();
// ...