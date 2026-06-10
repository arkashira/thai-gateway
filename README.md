 # thai-gateway
+axentx product · A lightweight API gateway that balances rate limits across multiple AI provider APIs while translating prompts into Thai, tailored for mid-sized Thai e-commerce platforms.
+
+## Table of Contents
+- [Introduction](#introduction)
+- [Setup](#setup)
+- [Usage](#usage)
+- [Technical Details](#technical-details)
+
+## Introduction
+Thai-Gateway is designed to streamline the integration of various AI services into Thai e-commerce platforms. It intelligently manages rate limits and translates prompts into Thai, ensuring smooth and efficient operations.
+
+## Setup
+To get started with Thai-Gateway, follow these steps:
+
+1. Clone the repository:
+   ```bash
+   git clone https://github.com/axentx/thai-gateway.git
+   cd thai-gateway
+   ```
+2. Install dependencies:
+   ```bash
+   pip install -r requirements.txt
+   ```
+3. Configure API keys and settings in `config.py`.
+
+## Usage
+To use Thai-Gateway, simply call the `translate_and_invoke` function with your prompt and desired AI service:
+```python
+from thai_gateway import translate_and_invoke
+
+response = translate_and_invoke("What is the weather today?", "weather_service")
+print(response)
+```
+
+## Technical Details
+Thai-Gateway leverages advanced translation models and rate-limit management algorithms to ensure optimal performance. It supports multiple AI providers out of the box and can be easily extended to include new ones.
+
 ```

## src/main.py