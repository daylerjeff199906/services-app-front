import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

// Simple .env parser
function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`.env file not found at ${filePath}`)
        process.exit(1)
    }
    const content = fs.readFileSync(filePath, 'utf-8')
    const config = {}
    content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) return
        const match = trimmed.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            let val = match[2].trim()
            // remove surrounding quotes
            val = val.replace(/^['"]|['"]$/g, '').trim()
            config[key] = val
        }
    })
    return config
}

const env = parseEnv(envPath)

const accountId = env.CLOUDFLARE_R2_ACCOUNT_ID
const accessKeyId = env.CLOUDFLARE_R2_ACCESS_KEY_ID
const secretAccessKey = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('Missing required R2 environment variables in .env')
    process.exit(1)
}

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
})

async function run() {
    console.log(`Configuring CORS for R2 bucket "${bucketName}"...`)
    try {
        const corsRules = [
            {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                AllowedOrigins: ['*'],
                ExposeHeaders: ['ETag', 'Content-Length'],
                MaxAgeSeconds: 3000
            }
        ]

        const command = new PutBucketCorsCommand({
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: corsRules
            }
        })

        await r2Client.send(command)
        console.log('Successfully configured CORS rules on Cloudflare R2 bucket!')
    } catch (error) {
        console.error('Failed to configure CORS rules:', error)
        process.exit(1)
    }
}

run()
