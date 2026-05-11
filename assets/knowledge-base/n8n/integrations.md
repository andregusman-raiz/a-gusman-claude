# n8n Built-in Integrations

> Complete list of all built-in app integrations (nodes) available in n8n

---

## A

- Action Network
- ActiveCampaign
- Adalo
- Affinity
- Agile CRM
- Airtable
- Airtop
- AMQP Sender
- Anthropic
- APITemplate.io
- Asana
- Autopilot

## AWS Services

- AWS Certificate Manager
- AWS Cognito
- AWS Comprehend
- AWS DynamoDB
- AWS Elastic Load Balancing
- AWS IAM
- AWS Lambda
- AWS Rekognition
- AWS S3
- AWS SES
- AWS SNS
- AWS SQS
- AWS Textract
- AWS Transcribe

## Azure Services

- Azure Cosmos DB
- Azure Storage

## B

- BambooHR
- Bannerbear
- Baserow
- Beeminder
- Bitly
- Bitwarden
- Box
- Brandfetch
- Brevo
- Bubble

## C

- Chargebee
- CircleCI
- Cisco Webex
- Clearbit
- ClickUp
- Clockify
- Cloudflare
- Cockpit
- Coda
- CoinGecko
- Contentful
- ConvertKit
- Copper
- Cortex
- CrateDB
- crowd.dev
- Customer.io

## D

- DeepL
- Demio
- DHL
- Discord
- Discourse
- Disqus
- Drift
- Dropbox
- Dropcontact

## E

- E-goi
- Elasticsearch
- Elastic Security
- Emelia
- ERPNext

## F

- Facebook Graph API
- FileMaker
- Flow
- Freshdesk
- Freshservice
- Freshworks CRM

## G

- GetResponse
- Ghost
- GitHub
- GitLab
- Gmail
- Gong
- Google Ads
- Google Analytics
- Google BigQuery
- Google Books
- Google Business Profile
- Google Calendar
- Google Chat
- Google Cloud (Natural Language, Storage, Vision, etc.)
- Google Contacts
- Google Docs
- Google Drive
- Google Gemini
- Google Perspective
- Google Sheets
- Google Slides
- Google Tasks
- Google Translate
- Google Workspace Admin
- Gotify
- GoToWebinar
- Grafana
- Grist

## H

- Hacker News
- HaloPSA
- Harvest
- Help Scout
- HighLevel
- Home Assistant
- HubSpot
- Humantic AI
- Hunter

## I

- Intercom
- Invoice Ninja
- Iterable

## J

- Jenkins
- Jina AI
- Jira Software

## K

- Kafka
- Keap
- Kitemaker
- KoboToolbox

## L

- Lemlist
- Line
- Linear
- LingvaNex
- LinkedIn
- LoneScale

## M

- Magento 2
- Mailcheck
- Mailchimp
- MailerLite
- Mailgun
- Mailjet
- Mandrill
- marketstack
- Matrix
- Mattermost
- Mautic
- Medium
- MessageBird
- Metabase
- Microsoft Dynamics CRM
- Microsoft Entra ID
- Microsoft Excel 365
- Microsoft Graph Security
- Microsoft OneDrive
- Microsoft Outlook
- Microsoft SharePoint
- Microsoft SQL
- Microsoft Teams
- Microsoft To Do
- Mindee
- MISP
- Mistral AI
- Mocean
- monday.com
- MongoDB
- Monica CRM
- MQTT
- MSG91
- MySQL

## N

- NASA
- Netlify
- Netscaler ADC
- Nextcloud
- NocoDB
- Notion
- npm

## O

- Odoo
- Okta
- One Simple API
- Onfleet
- OpenAI
- OpenThesaurus
- OpenWeatherMap
- Oracle Database
- Oura

## P

- Paddle
- PagerDuty
- PayPal
- Peekalink
- Perplexity
- PhantomBuster
- Philips Hue
- Pipedrive
- Plivo
- PostBin
- Postgres
- PostHog
- ProfitWell
- Pushbullet
- Pushcut
- Pushover

## Q

- QuestDB
- Quick Base
- QuickBooks Online
- QuickChart

## R

- RabbitMQ
- Raindrop
- Reddit
- Redis
- Rocket.Chat
- Rundeck

## S

- S3 (generic)
- Salesforce
- Salesmate
- SeaTable
- SecurityScorecard
- Segment
- SendGrid
- Sendy
- Sentry.io
- ServiceNow
- seven
- Shopify
- SIGNL4
- Slack
- Snowflake
- Splunk
- Spotify
- Stackby
- Storyblok
- Strapi
- Strava
- Stripe
- Supabase
- SyncroMSP

## T

- Taiga
- Tapfiliate
- Telegram
- TheHive
- TheHive 5
- TimescaleDB
- Todoist
- Travis CI
- Trello
- Twake
- Twilio
- Twist

## U

- Unleashed Software
- UpLead
- uProc
- UptimeRobot
- urlscan.io

## V

- Venafi TLS Protect Cloud
- Venafi TLS Protect Datacenter
- Vero
- Vonage

## W

- Webflow
- Wekan
- WhatsApp Business Cloud
- Wise
- WooCommerce
- WordPress

## X

- X (Formerly Twitter)
- Xero

## Y

- Yourls
- YouTube

## Z

- Zammad
- Zendesk
- Zoho CRM
- Zoom
- Zulip

---

## Core Nodes (Built-in)

These are utility/core nodes always available:

- Aggregate
- Code
- Compare Datasets
- Compression
- Crypto
- Date & Time
- Debug
- Edit Fields (Set)
- Edit Image
- Email Send (SMTP)
- Email Trigger (IMAP)
- Error Trigger
- Execute Command
- Execute Workflow
- Execute Workflow Trigger
- Filter
- FTP
- GraphQL
- HTML
- HTTP Request
- IF
- Limit
- Local File Trigger
- Loop Over Items (Split in Batches)
- Manual Trigger
- Markdown
- Merge
- Microsoft SQL
- Move Binary Data
- MySQL
- n8n (self-reference)
- No Operation
- Postgres
- Read/Write Binary File
- Redis
- Remove Duplicates
- Rename Keys
- Respond to Webhook
- RSS Feed Read
- Schedule Trigger
- Sort
- Split Out
- SSH
- Sticky Note
- Stop and Error
- Summarize
- Switch
- Wait
- Webhook
- Workflow Trigger
- XML

---

## AI / LangChain Nodes

- AI Agent
- Basic LLM Chain
- Information Extractor
- Question and Answer Chain
- Sentiment Analysis
- Summarization Chain
- Text Classifier
- Chat Memory (Buffer, Postgres, Redis, Xata, Zep, Motorhead)
- Document Loaders (various)
- Embeddings (OpenAI, Cohere, Google, HuggingFace, Mistral, Ollama, Azure)
- Output Parsers
- Retrievers
- Text Splitters
- Tools (Calculator, Code, HTTP Request, Wikipedia, Wolfram Alpha, Custom)
- Vector Stores (Pinecone, Qdrant, Supabase, Zep, PG Vector, In-Memory)

---

## Community Nodes

In addition to built-in nodes, n8n supports community-created nodes installable via:
- Settings > Community Nodes > Install
- Environment variable: `N8N_COMMUNITY_PACKAGES_ENABLED=true` (default)
- Registry: `N8N_COMMUNITY_PACKAGES_REGISTRY` (default: npmjs.org)

Total built-in integrations: **400+** app nodes + **50+** core nodes + **30+** AI nodes
