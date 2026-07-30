import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const execPromise = util.promisify(exec);

export async function runDatabaseBackup() {
  const R2_ENDPOINT = process.env.R2_ENDPOINT;
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ [Backup] Erro: DATABASE_URL não definida.');
    return;
  }

  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.warn('⚠️ [Backup] Credenciais R2/S3 ausentes no .env. Ignorando rotina de backup...');
    return;
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${timestamp}.sql.gz`;
  const filePath = path.join(process.cwd(), fileName);

  try {
    console.log('📦 [Backup] Iniciando dump do banco de dados...');
    
    // Executa pg_dump comprimindo via gzip e redirecionando a saída para o arquivo local
    // Nota: O pacote postgresql-client precisa estar instalado na VPS
    await execPromise(`pg_dump "${DATABASE_URL}" | gzip > ${filePath}`);

    console.log(`✅ [Backup] Dump concluído localmente. Arquivo: ${fileName}`);
    console.log('☁️ [Backup] Fazendo upload para o Storage...');

    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: fileStream,
      ContentType: 'application/gzip',
    };

    await s3.send(new PutObjectCommand(uploadParams));

    console.log('✅ [Backup] Upload concluído com sucesso!');

  } catch (error) {
    console.error('❌ [Backup] Falha durante a geração ou upload do backup:', error);
  } finally {
    // Limpa o arquivo local temporário
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🧹 [Backup] Arquivo temporário local removido.');
    }
  }
}
