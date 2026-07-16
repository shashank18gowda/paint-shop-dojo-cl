import * as dotenv from 'dotenv';
import * as path from 'path';
import { execSync } from 'child_process';

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

  console.log('\n🗄️  Resetting test database schema...');
  execSync(
    'npx prisma db push --schema=prisma/schema --accept-data-loss',
    {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
      env: { ...process.env },
    },
  );
  console.log('✅ Test database ready\n');
}
