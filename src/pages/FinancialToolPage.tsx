import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Tabs, Tab, Paper, Typography } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import './FinancialToolPage.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `financial-tab-${index}`,
    'aria-controls': `financial-tabpanel-${index}`,
  };
}

// HTTP Method Badge Component
function MethodBadge({ method }: { method: string }) {
  const colors: { [key: string]: string } = {
    GET: '#10b981',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    DELETE: '#ef4444',
  };

  return (
    <span
      className="method-badge"
      style={{
        backgroundColor: colors[method] || '#6b7280',
        color: '#ffffff',
        padding: '0.25rem 0.75rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        marginRight: '0.75rem',
      }}
    >
      {method}
    </span>
  );
}

// Code Block Component
function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  return (
    <pre className="code-block">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
}

// Endpoint Section Component
function EndpointSection({
  method,
  path,
  description,
  requestBody,
  response,
  queryParams,
}: {
  method: string;
  path: string;
  description?: string;
  requestBody?: string;
  response?: string;
  queryParams?: Array<{ name: string; type: string; required: boolean; description: string }>;
}) {
  return (
    <Paper elevation={1} className="endpoint-section">
      <Box className="endpoint-header">
        <Box display="flex" alignItems="center" mb={1}>
          <MethodBadge method={method} />
          <Typography variant="h6" component="code" className="endpoint-path">
            {path}
          </Typography>
        </Box>
        {description && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {description}
          </Typography>
        )}
      </Box>

      {queryParams && queryParams.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Query Parameters:
          </Typography>
          <table className="params-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {queryParams.map((param) => (
                <tr key={param.name}>
                  <td data-label="Parameter">
                    <code>{param.name}</code>
                  </td>
                  <td data-label="Type">{param.type}</td>
                  <td data-label="Required">{param.required ? 'Yes' : 'No'}</td>
                  <td data-label="Description">{param.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {requestBody && (
        <Box mb={2}>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Request Body:
          </Typography>
          <CodeBlock code={requestBody} language="json" />
        </Box>
      )}

      {response && (
        <Box>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Response:
          </Typography>
          <CodeBlock code={response} language="json" />
        </Box>
      )}
    </Paper>
  );
}

export default function FinancialToolPage() {
  const { theme } = useTheme();
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="financial-tool-page">
        <Container maxWidth="xl">
          <Box className="financial-tool-header">
            <Typography variant="h3" component="h1" className="page-title">
              Financial Tracking API Documentation
            </Typography>
            <Typography variant="body1" color="text.secondary" className="page-subtitle">
              Complete API documentation for the continuous financial tracking system
            </Typography>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="financial API documentation tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Overview" {...a11yProps(0)} />
              <Tab label="Bill Processing" {...a11yProps(1)} />
              <Tab label="Transactions" {...a11yProps(2)} />
              <Tab label="Merchants & Categories" {...a11yProps(3)} />
              <Tab label="Analytics" {...a11yProps(4)} />
              <Tab label="AI Features" {...a11yProps(5)} />
              <Tab label="Data Models" {...a11yProps(6)} />
              <Tab label="Examples" {...a11yProps(7)} />
            </Tabs>
          </Box>

          {/* Overview Tab */}
          <TabPanel value={value} index={0}>
            <Paper elevation={1} className="info-section">
              <Typography variant="h5" component="h2" gutterBottom>
                Overview
              </Typography>
              <Typography variant="body1" paragraph>
                The Financial Tracking API provides endpoints for processing bills/receipts through an AI pipeline,
                managing transactions, and getting financial insights. All endpoints require Bearer token authentication.
              </Typography>

              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Base URL
                </Typography>
                <CodeBlock code="http://localhost:5000" language="text" />
              </Box>

              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Authentication
                </Typography>
                <Typography variant="body2" paragraph>
                  Include Bearer token in <code>Authorization</code> header:
                </Typography>
                <CodeBlock code='Authorization: Bearer YOUR_ACCESS_TOKEN_HERE' language="text" />
              </Box>

              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Processing Pipeline Flow
                </Typography>
                <Box className="pipeline-flow">
                  <Box className="pipeline-step">
                    <Typography variant="subtitle2" fontWeight={600}>1. Upload Bill</Typography>
                    <Typography variant="body2" color="text.secondary">POST /api/financial/bills</Typography>
                  </Box>
                  <Box className="pipeline-arrow">→</Box>
                  <Box className="pipeline-step">
                    <Typography variant="subtitle2" fontWeight={600}>2. Monitor Progress</Typography>
                    <Typography variant="body2" color="text.secondary">GET /progress/stream/&lt;job_id&gt;</Typography>
                  </Box>
                  <Box className="pipeline-arrow">→</Box>
                  <Box className="pipeline-step">
                    <Typography variant="subtitle2" fontWeight={600}>3. Get Result</Typography>
                    <Typography variant="body2" color="text.secondary">GET /api/financial/bills/&lt;job_id&gt;</Typography>
                  </Box>
                  <Box className="pipeline-arrow">→</Box>
                  <Box className="pipeline-step">
                    <Typography variant="subtitle2" fontWeight={600}>4. Review & Correct</Typography>
                    <Typography variant="body2" color="text.secondary">PUT /api/financial/transactions/&lt;id&gt;</Typography>
                  </Box>
                </Box>
              </Box>

              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Error Response Format
                </Typography>
                <CodeBlock
                  code={`{
  "success": false,
  "error": "Error message here"
}`}
                  language="json"
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Common Status Codes: 200 (Success), 201 (Created), 202 (Accepted), 400 (Bad Request), 401
                  (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error), 503 (Service
                  Unavailable)
                </Typography>
              </Box>
            </Paper>
          </TabPanel>

          {/* Bill Processing Tab */}
          <TabPanel value={value} index={1}>
            <Typography variant="h5" component="h2" gutterBottom mb={3}>
              Bill Processing
            </Typography>

            <EndpointSection
              method="POST"
              path="/api/financial/bills"
              description="Upload a bill image or PDF for AI processing. Returns immediately with a job_id for async processing."
              requestBody={`{
  "file": "Bill image (jpg, png, webp, pdf) or PDF file",
  "category": "optional - Category override",
  "merchant": "optional - Merchant override"
}`}
              response={`{
  "success": true,
  "job_id": "abc123...",
  "stream_url": "/progress/stream/abc123...",
  "message": "Bill processing started"
}`}
            />

            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Example (cURL)
              </Typography>
              <CodeBlock
                code={`curl -X POST http://localhost:5000/api/financial/bills \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@bill.jpg"`}
                language="bash"
              />
            </Box>

            <Box mt={4}>
              <EndpointSection
                method="GET"
                path="/api/financial/bills/&lt;bill_id&gt;"
                description="Get the status and result of bill processing."
                response={`{
  "success": true,
  "job": {
    "job_id": "abc123...",
    "status": "completed",
    "created_at": "2025-01-15T10:00:00Z",
    "finished_at": "2025-01-15T10:00:30Z",
    "result": {
      "success": true,
      "transaction_id": "txn123...",
      "merchant_id": "merchant123...",
      "category_id": "cat123...",
      "amount": 3240.00,
      "confidence_category": 0.93,
      "is_duplicate": false,
      "is_anomaly": false
    }
  },
  "transaction": {
    "_id": "txn123...",
    "merchant_id": "merchant123...",
    "category_id": "cat123...",
    "amount": 3240.00,
    "date": "2025-01-15T10:00:00Z",
    "bill_image_url": "https://...",
    "status": "confirmed"
  }
}`}
              />
            </Box>

            <Box mt={4}>
              <EndpointSection
                method="GET"
                path="/api/financial/bills"
                description="List user's transactions with filtering and pagination."
                queryParams={[
                  { name: 'date_from', type: 'ISO string', required: false, description: 'Start date (ISO format)' },
                  { name: 'date_to', type: 'ISO string', required: false, description: 'End date (ISO format)' },
                  { name: 'category', type: 'string', required: false, description: 'Category ID filter' },
                  { name: 'merchant', type: 'string', required: false, description: 'Merchant ID filter' },
                  { name: 'limit', type: 'number', required: false, description: 'Results limit (default: 50)' },
                  { name: 'offset', type: 'number', required: false, description: 'Results offset (default: 0)' },
                ]}
                response={`{
  "success": true,
  "transactions": [
    {
      "_id": "txn123...",
      "merchant_id": "merchant123...",
      "category_id": "cat123...",
      "amount": 3240.00,
      "date": "2025-01-15T10:00:00Z",
      "bill_image_url": "https://...",
      "confidence_category": 0.93,
      "status": "confirmed"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}`}
              />
            </Box>
          </TabPanel>

          {/* Transactions Tab */}
          <TabPanel value={value} index={2}>
            <Typography variant="h5" component="h2" gutterBottom mb={3}>
              Transaction Management
            </Typography>

            <EndpointSection
              method="PUT"
              path="/api/financial/transactions/&lt;transaction_id&gt;"
              description="Update a transaction (category, merchant, amount, date). Automatically records feedback for learning."
              requestBody={`{
  "category": "category_id",
  "merchant": "merchant_id",
  "amount": 3500.00,
  "date": "2025-01-15T10:00:00Z"
}`}
              response={`{
  "success": true,
  "transaction": {
    "_id": "txn123...",
    "category_id": "cat123...",
    "amount": 3500.00,
    "versions": [
      {
        "field": "category",
        "old_value": "cat456...",
        "new_value": "cat123...",
        "timestamp": "2025-01-15T11:00:00Z",
        "source": "user"
      }
    ]
  }
}`}
            />

            <Box mt={4}>
              <EndpointSection
                method="DELETE"
                path="/api/financial/transactions/&lt;transaction_id&gt;"
                description="Soft delete a transaction (preserves for audit)."
                response={`{
  "success": true,
  "message": "Transaction deleted successfully"
}`}
              />
            </Box>

            <Box mt={4}>
              <EndpointSection
                method="POST"
                path="/api/financial/transactions/&lt;transaction_id&gt;/merge"
                description="Merge a duplicate transaction with another."
                requestBody={`{
  "merge_with": "other_transaction_id"
}`}
                response={`{
  "success": true,
  "merged_transaction": {...},
  "message": "Transactions merged successfully"
}`}
              />
            </Box>
          </TabPanel>

          {/* Merchants & Categories Tab */}
          <TabPanel value={value} index={3}>
            <Typography variant="h5" component="h2" gutterBottom mb={3}>
              Merchants & Categories
            </Typography>

            <EndpointSection
              method="GET"
              path="/api/financial/merchants"
              description="Get all merchants."
              response={`{
  "success": true,
  "merchants": [
    {
      "_id": "merchant123...",
      "merchant_name": "Keells",
      "aliases": ["Keells Super", "Keells Food City"],
      "merchant_category": "Groceries"
    }
  ]
}`}
            />

            <Box mt={4}>
              <EndpointSection
                method="PUT"
                path="/api/financial/merchants/&lt;merchant_id&gt;"
                description="Update merchant aliases or category."
                requestBody={`{
  "aliases": ["Keells Super", "Keells Food City"],
  "merchant_category": "Groceries"
}`}
              />
            </Box>

            <Box mt={4}>
              <EndpointSection
                method="GET"
                path="/api/financial/categories"
                description="Get all expense categories."
                response={`{
  "success": true,
  "categories": [
    {
      "_id": "cat123...",
      "category_name": "Groceries",
      "parent_category": null
    }
  ]
}`}
              />
            </Box>

            <Box mt={4}>
              <EndpointSection
                method="POST"
                path="/api/financial/categories"
                description="Create a new expense category."
                requestBody={`{
  "category_name": "Custom Category",
  "parent_category": "optional_parent_id"
}`}
              />
            </Box>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={value} index={4}>
            <Typography variant="h5" component="h2" gutterBottom mb={3}>
              Analytics
            </Typography>

            <EndpointSection
              method="GET"
              path="/api/financial/analytics/summary"
              description="Get spending summary by category."
              queryParams={[
                { name: 'period', type: 'string', required: false, description: 'daily, weekly, monthly, yearly (default: monthly)' },
                { name: 'date_from', type: 'ISO string', required: false, description: 'Start date (ISO format)' },
                { name: 'date_to', type: 'ISO string', required: false, description: 'End date (ISO format)' },
              ]}
              response={`{
  "success": true,
  "summary": {
    "total": 50000.00,
    "by_category": [
      {
        "category_id": "cat123...",
        "category_name": "Groceries",
        "amount": 20000.00,
        "count": 45,
        "percentage": 40.0
      }
    ],
    "period": "monthly",
    "transaction_count": 120
  }
}`}
            />

            <Box mt={4}>
              <EndpointSection
                method="GET"
                path="/api/financial/analytics/trends"
                description="Get spending trends with month-over-month or year-over-year comparisons."
                queryParams={[
                  { name: 'period', type: 'string', required: false, description: 'monthly or yearly (default: monthly)' },
                  { name: 'months_back', type: 'number', required: false, description: 'Number of periods to compare (default: 3)' },
                ]}
                response={`{
  "success": true,
  "trends": {
    "period": "monthly",
    "comparisons": [
      {
        "period": "2025-01",
        "current_total": 50000.00,
        "previous_total": 45000.00,
        "growth_rate": 11.11,
        "current_count": 120,
        "previous_count": 110
      }
    ],
    "overall_growth_rate": 15.5
  }
}`}
              />
            </Box>

            <Box mt={4}>
              <EndpointSection
                method="GET"
                path="/api/financial/analytics/anomalies"
                description="Get flagged anomalies for review."
                queryParams={[
                  { name: 'limit', type: 'number', required: false, description: 'Results limit (default: 50)' },
                ]}
                response={`{
  "success": true,
  "anomalies": [
    {
      "_id": "txn123...",
      "amount": 15000.00,
      "anomaly_flag": true,
      "anomaly_reason": "Amount is 2.5x higher than category average",
      "merchant_name": "Keells",
      "category_name": "Groceries"
    }
  ],
  "count": 5
}`}
              />
            </Box>
          </TabPanel>

          {/* AI Features Tab */}
          <TabPanel value={value} index={5}>
            <Typography variant="h5" component="h2" gutterBottom mb={3}>
              AI Features
            </Typography>

            <EndpointSection
              method="POST"
              path="/api/financial/chat"
              description="Ask natural language questions about finances using GPT-5."
              requestBody={`{
  "query": "How much did I spend on groceries this month?",
  "context": {}
}`}
              response={`{
  "success": true,
  "response": "Based on your transaction history, you spent Rs. 20,000 on groceries this month across 45 transactions...",
  "data": {
    "total_spending_30_days": 50000.00,
    "transaction_count": 120,
    "top_categories": [...]
  },
  "model": "gpt-5"
}`}
            />

            <Box mt={4}>
              <EndpointSection
                method="POST"
                path="/api/financial/feedback"
                description="Submit explicit feedback for model learning."
                requestBody={`{
  "transaction_id": "txn123...",
  "field": "category",
  "old_value": "Shopping",
  "new_value": "Groceries",
  "model_version": "rule-based-v1",
  "confidence": 0.62
}`}
              />
            </Box>

            <Box mt={4}>
              <EndpointSection
                method="GET"
                path="/api/financial/model/status"
                description="Get current ML model status and information."
                response={`{
  "success": true,
  "model_loaded": true,
  "model_info": {
    "model_version": "ml-v20250115",
    "accuracy": 0.87,
    "training_samples": 120,
    "test_samples": 30,
    "categories": 12,
    "trained_at": "2025-01-15T10:00:00Z"
  },
  "categorization_method": "ml"
}`}
              />
            </Box>

            <Box mt={4}>
              <EndpointSection
                method="POST"
                path="/api/financial/model/reload"
                description="Manually reload the latest trained ML model."
                response={`{
  "success": true,
  "message": "Model reloaded successfully",
  "model_version": "ml-v20250115"
}`}
              />
            </Box>

            <Box mt={4}>
              <EndpointSection
                method="POST"
                path="/api/financial/retrain"
                description="Trigger model retraining using accumulated feedback."
                requestBody={`{
  "days_back": 30,
  "min_samples": 50
}`}
                response={`{
  "success": true,
  "message": "Retraining completed successfully",
  "results": {
    "samples_collected": 150,
    "training_samples": 120,
    "test_samples": 30,
    "accuracy": 0.87,
    "categories": 12,
    "model_version": "ml-v20250115"
  }
}`}
              />
            </Box>
          </TabPanel>

          {/* Data Models Tab */}
          <TabPanel value={value} index={6}>
            <Typography variant="h5" component="h2" gutterBottom mb={3}>
              Data Models
            </Typography>

            <Paper elevation={1} className="info-section">
              <Typography variant="h6" gutterBottom>
                Transaction Model
              </Typography>
              <CodeBlock
                code={`{
  "_id": "ObjectId",
  "user_id": "string",
  "merchant_id": "ObjectId",
  "category_id": "ObjectId",
  "amount": 3240.00,
  "currency": "USD",
  "date": "2025-01-15T10:00:00Z",
  "payment_method": "card",
  "bill_image_url": "https://...",
  "ocr_text": "Raw OCR output...",
  "parsing_output": {
    "merchant": "Keells",
    "date": "2025-01-15",
    "total": 3240.00,
    "items": [...]
  },
  "embedding_vector": [0.123, 0.456, ...],
  "duplicate_of": null,
  "anomaly_flag": false,
  "anomaly_reason": "",
  "confidence_category": 0.93,
  "confidence_ocr": 0.92,
  "confidence_parsing": 0.88,
  "versions": [...],
  "status": "confirmed",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}`}
                language="json"
              />
            </Paper>

            <Box mt={4}>
              <Paper elevation={1} className="info-section">
                <Typography variant="h6" gutterBottom>
                  Confidence Thresholds
                </Typography>
                <Box className="thresholds-list">
                  <Box className="threshold-item">
                    <Typography variant="subtitle2" fontWeight={600}>
                      OCR:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      &lt; 0.7 → User verification recommended
                    </Typography>
                  </Box>
                  <Box className="threshold-item">
                    <Typography variant="subtitle2" fontWeight={600}>
                      Parsing:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      &lt; 0.8 → Manual check recommended
                    </Typography>
                  </Box>
                  <Box className="threshold-item">
                    <Typography variant="subtitle2" fontWeight={600}>
                      Category:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      &gt; 0.9 → Auto-accept
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      0.7-0.9 → Suggest, require confirmation
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      &lt; 0.7 → Ask user
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Box mt={4}>
              <Paper elevation={1} className="info-section">
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2" component="ul" className="notes-list">
                  <li>All dates are in ISO 8601 format with timezone</li>
                  <li>ObjectIds are returned as strings in JSON responses</li>
                  <li>Bill processing is asynchronous - use job_id to track progress</li>
                  <li>Feedback is automatically captured when users update transactions</li>
                  <li>Models improve over time as feedback accumulates</li>
                </Typography>
              </Paper>
            </Box>
          </TabPanel>

          {/* Examples Tab */}
          <TabPanel value={value} index={7}>
            <Typography variant="h5" component="h2" gutterBottom mb={3}>
              Example Workflows
            </Typography>

            <Paper elevation={1} className="info-section">
              <Typography variant="h6" gutterBottom>
                1. Upload Bill
              </Typography>
              <CodeBlock
                code={`curl -X POST http://localhost:5000/api/financial/bills \\
  -H "Authorization: Bearer TOKEN" \\
  -F "file=@receipt.jpg"`}
                language="bash"
              />
            </Paper>

            <Box mt={4}>
              <Paper elevation={1} className="info-section">
                <Typography variant="h6" gutterBottom>
                  2. Check Status
                </Typography>
                <CodeBlock
                  code={`curl -X GET http://localhost:5000/api/financial/bills/JOB_ID \\
  -H "Authorization: Bearer TOKEN"`}
                  language="bash"
                />
              </Paper>
            </Box>

            <Box mt={4}>
              <Paper elevation={1} className="info-section">
                <Typography variant="h6" gutterBottom>
                  3. Update Category if Needed
                </Typography>
                <CodeBlock
                  code={`curl -X PUT http://localhost:5000/api/financial/transactions/TXN_ID \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"category": "correct_category_id"}'`}
                  language="bash"
                />
              </Paper>
            </Box>

            <Box mt={4}>
              <Paper elevation={1} className="info-section">
                <Typography variant="h6" gutterBottom>
                  4. Get Spending Summary
                </Typography>
                <CodeBlock
                  code={`curl -X GET "http://localhost:5000/api/financial/analytics/summary?period=monthly" \\
  -H "Authorization: Bearer TOKEN"`}
                  language="bash"
                />
              </Paper>
            </Box>

            <Box mt={4}>
              <Paper elevation={1} className="info-section">
                <Typography variant="h6" gutterBottom>
                  5. Ask AI
                </Typography>
                <CodeBlock
                  code={`curl -X POST http://localhost:5000/api/financial/chat \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "What are my top spending categories?"}'`}
                  language="bash"
                />
              </Paper>
            </Box>
          </TabPanel>
        </Container>
      </Box>
    </ThemeProvider>
  );
}






