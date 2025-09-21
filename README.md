# Scraper 🚀

A comprehensive web scraping application built with **TypeScript**, **Fastify**, and **Playwright** designed to showcase the incredible power and capabilities of modern AI in software development. This project demonstrates how AI can create complex, production-ready applications - all generated from natural language descriptions.

> **Built entirely with [Cursor](https://cursor.sh/)** - The AI-powered code editor that accelerates development

## 🤖 AI-Powered Development Showcase

This project serves as a **living demonstration** of what modern AI can accomplish in software development:

- **Complete Application Generation**: From concept to production-ready code using only natural language descriptions
- **Complex Architecture Implementation**: AI-generated clean architecture patterns without manual intervention
- **Professional Code Quality**: Production-grade TypeScript with proper error handling and documentation
- **Real-World Functionality**: Fully functional web scraping system with multiple data sources and API endpoints
- **Best Practices Integration**: Automatic implementation of modern development practices and patterns

**The entire codebase was generated through conversational AI interactions**, proving that AI can now handle complex software architecture decisions, implement sophisticated patterns, and create maintainable code at a professional level.

## 🎯 Features

### Financial Data Scraping
- **S&P 500 Data**: Extract real-time data from SlickCharts including company rankings, weights, prices, and changes
- **Top Gainers**: Identify and track the best performing S&P 500 companies
- **Investment Analysis**: Comprehensive financial data for investment research

### News & Content Scraping
- **Xataka News**: Scrape technology and business news articles
- **Article Content**: Extract full article content from specific URLs
- **Content Analysis**: Process and analyze news content for investment insights

### Professional Network Scraping
- **LinkedIn Profiles**: Extract professional profile information
- **LinkedIn Posts**: Scrape recent posts and activity from LinkedIn profiles
- **Professional Insights**: Analyze professional network data

### Job Management System
- **Asynchronous Scraping**: Create and manage scraping jobs with status tracking
- **Job Execution**: Execute scraping tasks with real-time progress monitoring
- **Result Storage**: Store and retrieve scraping results efficiently

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Fastify (high-performance HTTP server)
- **Web Scraping**: Playwright (reliable browser automation)
- **Code Quality**: TypeScript with strict type checking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd scraper

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build the project
npm run build

# Start production server
npm start
```

## 📡 API Endpoints

### Scraping Jobs
- `POST /api/scraping/jobs` - Create a new scraping job
- `POST /api/scraping/jobs/:jobId/execute` - Execute a scraping job
- `GET /api/scraping/jobs/:jobId` - Get job information

### S&P 500 Data
- `POST /api/sp500/scrape` - Scrape complete S&P 500 data
- `GET /api/sp500/top-gainers` - Get top gaining S&P 500 companies

### News Scraping
- `POST /api/news/xataka` - Scrape Xataka news
- `POST /api/news/article` - Extract specific article content

### LinkedIn Scraping
- `POST /api/linkedin/profile` - Scrape LinkedIn profile (requires credentials)
- `POST /api/linkedin/posts` - Scrape LinkedIn posts (requires credentials)

### System
- `GET /health` - Health check endpoint
- `GET /` - API documentation and available endpoints

## 📝 Usage Examples

### S&P 500 Scraping
```bash
curl -X POST http://localhost:3000/api/sp500/scrape
```

### Create Scraping Job
```bash
curl -X POST http://localhost:3000/api/scraping/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://example.com",
    "selectors": {
      "title": "h1",
      "content": ".content"
    }
  }'
```

### LinkedIn Profile Scraping
```bash
curl -X POST http://localhost:3000/api/linkedin/profile \
  -H "Content-Type: application/json" \
  -d '{
    "profileUrl": "https://linkedin.com/in/username",
    "credentials": {
      "email": "your-email@example.com",
      "password": "your-password"
    }
  }'
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)
- `LOG_LEVEL`: Logging level (default: info)

### Playwright Configuration
The project uses Playwright for web scraping with optimized settings:
- Headless mode for production
- Realistic user agents
- Anti-detection measures
- Proper timeouts and error handling

## 📊 Example Data Output

### S&P 500 Company Data
```json
{
  "rank": 1,
  "company": "Apple Inc.",
  "symbol": "AAPL",
  "weight": "7.2%",
  "price": "$175.43",
  "change": "+2.15",
  "percentChange": "+1.24%"
}
```

### LinkedIn Post Data
```json
{
  "postNumber": 1,
  "content": "Excited to share our latest product launch...",
  "timestamp": "2h",
  "fullContent": "Complete post content..."
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This project stands as a testament to the current state of AI in software development:

- **100% AI-Generated**: Built entirely with [Cursor](https://cursor.sh/) - demonstrating AI's capability to create complex, production-ready applications
- **Zero Manual Architecture**: All architectural decisions, patterns, and implementations were generated through AI conversations
- **Professional Quality**: Proves that AI can now match and exceed human-level software development practices

### Technology Stack (AI-Selected)
- [Playwright](https://playwright.dev/) for reliable web scraping
- [Fastify](https://www.fastify.io/) for high-performance web framework  
- [TypeScript](https://www.typescriptlang.org/) for type-safe development

---

**🤖 A Complete AI Development Showcase - Built with ❤️ using Cursor AI**