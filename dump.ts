import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { v4 as uuid } from 'uuid';
import { S3Client, ListObjectsV2Command, GetObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// const DIRECTORIES = [
//   "2024/10/1",
//   "2024/10/14",
//   "2024/10/15",
//   "2024/10/16",
//   "2024/10/2",
//   "2024/10/20",
//   "2024/10/25",
//   "2024/10/3",
//   "2024/10/4",
//   "2024/10/5",
//   "2024/10/8",
//   "2024/10/9",
//   "2024/11/10",
//   "2024/11/12",
//   "2024/11/16",
//   "2024/11/18",
//   "2024/11/19",
//   "2024/11/20",
//   "2024/11/23",
//   "2024/11/25",
//   "2024/11/27",
//   "2024/11/28",
//   "2024/11/29",
//   "2024/11/30",
//   "2024/11/8",
//   "2024/11/9",
//   "2024/12/1",
//   "2024/12/10",
//   "2024/12/12",
//   "2024/12/13",
//   "2024/12/14",
//   "2024/12/15",
//   "2024/12/16",
//   "2024/12/17",
//   "2024/12/18",
//   "2024/12/19",
//   "2024/12/2",
//   "2024/12/20",
//   "2024/12/21",
//   "2024/12/22",
//   "2024/12/23",
//   "2024/12/24",
//   "2024/12/25",
//   "2024/12/26",
//   "2024/12/27",
//   "2024/12/28",
//   "2024/12/29",
//   "2024/12/3",
//   "2024/12/30",
//   "2024/12/31",
//   "2024/12/4",
//   "2024/12/5",
//   "2024/12/6",
//   "2024/12/7",
//   "2024/12/8",
//   "2024/12/9",
//   "2024/9/24",
//   "2024/9/26",
//   "2024/9/27",
//   "2024/9/28",
//   "2024/9/29",
//   "2024/9/30",
//   "2025/1/1",
//   "2025/1/10",
//   "2025/1/11",
//   "2025/1/12",
//   "2025/1/13",
//   "2025/1/14",
//   "2025/1/15",
//   "2025/1/16",
//   "2025/1/17",
//   "2025/1/18",
//   "2025/1/19",
//   "2025/1/2",
//   "2025/1/20",
//   "2025/1/21",
//   "2025/1/22",
//   "2025/1/23",
//   "2025/1/24",
//   "2025/1/25",
//   "2025/1/26",
//   "2025/1/27",
//   "2025/1/28",
//   "2025/1/29",
//   "2025/1/3",
//   "2025/1/30",
//   "2025/1/31",
//   "2025/1/4",
//   "2025/1/5",
//   "2025/1/6",
//   "2025/1/7",
//   "2025/1/8",
//   "2025/1/9",
//   "2025/2/1",
//   "2025/2/10",
//   "2025/2/11",
//   "2025/2/12",
//   "2025/2/13",
//   "2025/2/14",
//   "2025/2/15",
//   "2025/2/16",
//   "2025/2/17",
//   "2025/2/18",
//   "2025/2/19",
//   "2025/2/2",
//   "2025/2/20",
//   "2025/2/21",
//   "2025/2/22",
//   "2025/2/23",
//   "2025/2/24",
//   "2025/2/25",
//   "2025/2/26",
//   "2025/2/27",
//   "2025/2/28",
//   "2025/2/3",
//   "2025/2/4",
//   "2025/2/5",
//   "2025/2/6",
//   "2025/2/7",
//   "2025/2/8",
//   "2025/2/9",
//   "2025/3/1",
//   "2025/3/10",
//   "2025/3/11",
//   "2025/3/12",
//   "2025/3/13",
//   "2025/3/14",
//   "2025/3/15",
//   "2025/3/16",
//   "2025/3/17",
//   "2025/3/18",
//   "2025/3/19",
//   "2025/3/2",
//   "2025/3/20",
//   "2025/3/21",
//   "2025/3/22",
//   "2025/3/23",
//   "2025/3/24",
//   "2025/3/25",
//   "2025/3/26",
//   "2025/3/27",
//   "2025/3/28",
//   "2025/3/29",
//   "2025/3/3",
//   "2025/3/30",
//   "2025/3/31",
//   "2025/3/4",
//   "2025/3/5",
//   "2025/3/6",
//   "2025/3/7",
//   "2025/3/8",
//   "2025/3/9",
//   "2025/4/1",
//   "2025/4/10",
//   "2025/4/11",
//   "2025/4/12",
//   "2025/4/13",
//   "2025/4/14",
//   "2025/4/15",
//   "2025/4/16",
//   "2025/4/17",
//   "2025/4/18",
//   "2025/4/19",
//   "2025/4/2",
//   "2025/4/20",
//   "2025/4/21",
//   "2025/4/22",
//   "2025/4/23",
//   "2025/4/3",
//   "2025/4/4",
//   "2025/4/5",
//   "2025/4/6",
//   "2025/4/7",
//   "2025/4/8",
//   "2025/4/9"
// ];

// 설정
const SOURCE_BUCKET_NAME = 'shortdoridump';
const SOURCE_BASE_DIR = 'generated-images';
const IMAGES_BUCKET_NAME = 'images'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Ensure AWS credentials are properly handled
const accessKeyId = process.env.SUPABASE_ACCESS_KEY;
const secretAccessKey = process.env.SUPABASE_SECRET_KEY;
const region = 'ap-northeast-2';

if (!accessKeyId || !secretAccessKey) {
  throw new Error('AWS credentials are not set in environment variables.');
}

// AWS S3 클라이언트
const s3Client = new S3Client({
  region,
  endpoint: 'https://mgipxkgfgfukuqxzihyo.supabase.co/storage/v1/s3',
  forcePathStyle: true, // renamed from s3ForcePathStyle
  credentials: {
    accessKeyId,
    secretAccessKey,
  }
});


enum ImageModel {
  IMAGEN3_FAST = 'Imagen3 Fast',
  STABLEDIFFUSION_IMAGE_CORE = 'Stable Image Core',
  STABLEDIFFUSION_IMAGE_ULTRA = 'Stable Image Ultra',
  SD3_5_LARGE_TURBO = 'Stable Diffusion 3.5 Large Turbo',
  FLUX_SCHNELL = 'Flux Schnell',
  FLUX_DEV = 'Flux Dev',
  FLUX_PRO_1_1 = 'Flux Pro 1.1',
  ETC = 'Etc'
}

const mapImageModel: Record<string, ImageModel> = {
  'imagen3-fast': ImageModel.IMAGEN3_FAST,
  'stable-image-core': ImageModel.STABLEDIFFUSION_IMAGE_CORE,
  'stable-image-ultra': ImageModel.STABLEDIFFUSION_IMAGE_ULTRA,
  'sd3.5-large-turbo': ImageModel.SD3_5_LARGE_TURBO,
  'flux-schnell': ImageModel.FLUX_SCHNELL,
  'flux-pro-1.1': ImageModel.FLUX_PRO_1_1,
  'flux-dev': ImageModel.FLUX_DEV,
}

type ImageAnalysisResult = {
  title: string;
  prompt: string;
}

const emptyImageAnalysisResult: ImageAnalysisResult = {
  title: '',
  prompt: ''
}


// Add a function to validate directories
function validateDirectories(directories: string[]): string[] {
  if (directories.length === 0) {
    console.error('오류: 처리할 디렉토리가 없습니다.');
    process.exit(1);
  }
  return directories;
}


function getImageModel(imagePath: string): ImageModel {
  const parsed = imagePath.split('/').pop()?.split('_').pop()?.split('.')[0] ?? '';
  const result = mapImageModel[parsed];
  if (!result) {
    return ImageModel.ETC;
  }
  return result;
}


const generatePrompt = (imageModel: ImageModel) => `
# Requirements
You are an expert stock image describer. Given an image, respond in JSON with two fields:
- "title": a short title that best describes the image to be used in the stock image service.
- "prompt": a detailed, vivid description of the image, which is used to generate this image.
- image generate model was [${imageModel.toString()}]

Respond ONLY with valid JSON adhering to the JSON schema:
{
  "title": "a short title",
  "prompt": "detailed description of the image"
}

\`\`\`
`

// 이미지 파일인지 확인
function isImageFile(filePath: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const ext = path.extname(filePath).toLowerCase();
  return imageExtensions.includes(ext);
}

// AWS S3에서 특정 디렉토리의 이미지 파일 리스트 가져오기
async function findImagesInDirectory(directory: string): Promise<string[]> {
  const prefix = `${SOURCE_BASE_DIR}/${directory}/`;
  const imageFiles: string[] = [];

  console.log(`AWS S3 디렉토리 검색 중: ${prefix}`);

  let continuationToken: string | undefined;
  let hasMore = true;

  while (hasMore) {
    try {
      // AWS S3 API를 사용하여 객체 리스트 가져오기
      const params = {
        Bucket: SOURCE_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      };
      const data = await s3Client.send(new ListObjectsV2Command(params));

      if (!data.Contents || data.Contents.length === 0) {
        hasMore = false;
        break;
      }

      // 마지막 항목 저장하여 다음 페이지에서 사용
      continuationToken = data.NextContinuationToken;

      // 파일만 필터링하고 이미지 파일만 선택
      for (const item of data.Contents) {
        if (item.Key && !item.Key.endsWith('/') && isImageFile(item.Key)) {
          imageFiles.push(item.Key);
        }
      }

      // 다음 페이지가 없으면 종료
      if (!data.IsTruncated) {
        hasMore = false;
      }
    } catch (error) {
      console.error(`AWS S3 조회 오류:`, error);
      break;
    }
  }
  return imageFiles;
}

// AWS S3에서 이미지 다운로드하여 base64로 변환
async function downloadImageFromStorage(path: string): Promise<{ base64: string, mimeType: string }> {
  try {
    // 경로에서 버킷 이름 제거
    const storagePath = path.startsWith(`${SOURCE_BUCKET_NAME}/`)
      ? path.substring(SOURCE_BUCKET_NAME.length + 1)
      : path;

    // AWS S3에서 파일 다운로드
    const params = {
      Bucket: SOURCE_BUCKET_NAME,
      Key: storagePath,
    };
    const data = await s3Client.send(new GetObjectCommand(params));

    if (!data.Body) {
      throw new Error(`이미지를 다운로드할 수 없습니다: ${path}`);
    }

    // 스트림을 Buffer로 변환
    const streamBody = data.Body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of streamBody) {
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);
    const base64 = buffer.toString('base64');
    const mimeType = getMimeTypeFromPath(path);

    return {
      base64,
      mimeType
    };
  } catch (error) {
    console.error(`AWS S3에서 이미지 다운로드 오류: ${path}`, error);
    throw error;
  }
}

// 파일 경로로부터 MIME 타입 확인
function getMimeTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.png': return 'image/png';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    case '.bmp': return 'image/bmp';
    case '.jpg':
    case '.jpeg':
    default: return 'image/jpeg';
  }
}

// OpenAI로 이미지 분석
async function analyzeImageWithOpenAI(base64Image: string, mimeType: string, imageModel: ImageModel): Promise<ImageAnalysisResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_KEY 환경 변수가 설정되지 않았습니다.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      model: 'gpt-4.1-nano',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: generatePrompt(imageModel)
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)
    if (!parsed.title || !parsed.prompt) {
      throw new Error('Empty title or prompt at OpenAI');
    }
    return {
      title: parsed.title ?? '',
      prompt: parsed.prompt ?? ''
    } as ImageAnalysisResult;
  } catch (error) {
    console.error('OpenAI로 이미지 분석 중 오류 발생:', error);
    return emptyImageAnalysisResult;
  }
}

// Function to copy image to AWS S3 'images' bucket and get public URL
async function copyImageToBucket(sourcePath: string, targetPath: string): Promise<void> {
  try {
    const copyParams = {
      Bucket: IMAGES_BUCKET_NAME,
      CopySource: `${SOURCE_BUCKET_NAME}/${sourcePath}`,
      Key: targetPath,
    };
    await s3Client.send(new CopyObjectCommand(copyParams));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Failed to copy image to 'images' bucket:`, error);
      throw new Error(`Failed to copy image to 'images' bucket: \n ${error.message}`);
    }
    throw error;
  }
}

// Function to save analysis results to the database
async function saveAnalysisToDatabase(id: string, fileUrl: string, analysis: ImageAnalysisResult, imageModel: ImageModel, userId: string, dateDirectory: string): Promise<void> {
  try {
    const [year, month, day] = dateDirectory.split('/').map(Number);
    const createdAt = new Date(year, month - 1, day);

    // Assign random time
    createdAt.setHours(Math.floor(Math.random() * 24));
    createdAt.setMinutes(Math.floor(Math.random() * 60));
    createdAt.setSeconds(Math.floor(Math.random() * 60));
    await prisma.upload.create({
      data: {
        id,
        fileUrl,
        title: analysis.title,
        prompt: analysis.prompt,
        modelName: imageModel.toString(),
        licence: 'CC0', // Assuming a standard licence, adjust as needed
        created_at: createdAt,
        user: { connect: { id: userId } },
      },
    });
  } catch (err) {
    console.error('Error saving analysis to database:', err);
    throw err;
  }
}

async function fallbackDeleteUpload(id: string) {
  try {
    await prisma.upload.delete({
      where: {
        id
      },
    })
  } catch (error: unknown) {
    // do nothing
  }
}

// Add a function to process images in chunks
async function processImagesInChunks(images: string[], chunkSize: number, dateDirectory: string): Promise<void> {
  let processedCount = 0; // Initialize progress tracking
  for (let i = 0; i < images.length; i += chunkSize) {
    const chunk = images.slice(i, i + chunkSize);
    console.time(`Chunk ${i / chunkSize + 1} processing time`); // Start timing for the chunk
    console.log(`\n=== Processing Chunk ${i / chunkSize + 1} ===`);
    await Promise.all(chunk.map(async (imagePath) => {
      const id = uuid().toString();
      try {
        const { base64: base64Image, mimeType } = await downloadImageFromStorage(imagePath);
        const imageModel = getImageModel(imagePath);
        const analysisResult = await analyzeImageWithOpenAI(base64Image, mimeType, imageModel);
        const baseDir = id.slice(0, 2);
        const destinationPath = `${baseDir}/${id}.${path.extname(imagePath).slice(1)}`;
        await saveAnalysisToDatabase(id, destinationPath, analysisResult, imageModel, '05ded0c5-0577-4984-beac-33d3183f88d9', dateDirectory)
        await copyImageToBucket(imagePath, destinationPath)

        // Update progress
        processedCount++;
      } catch (error) {
        await fallbackDeleteUpload(id)
        console.error(`   Error processing ${imagePath}:`, error);
        // Continue processing other images instead of throwing
      }
    }));
    const progress = ((processedCount / images.length) * 100).toFixed(2);
    console.timeEnd(`Chunk ${i / chunkSize + 1} processing time`); // End timing for the chunk
    console.log(`=== Finished Processing Chunk ${i / chunkSize + 1}, Progress: ${progress}% complete ===\n`);
  }
}

// Update main function to use processImagesInChunks
async function main() {
  // AWS credentials 확인
  if (!accessKeyId || !secretAccessKey) {
    console.error('오류: AWS 자격 증명이 설정되지 않았습니다.');
    process.exit(1);
  }

  const directories = validateDirectories(process.argv.slice(2));

  // 각 지정된 디렉토리 처리
  for (const directory of directories) {
    // AWS S3 디렉토리에서 이미지 파일 찾기
    const images = await findImagesInDirectory(directory);

    if (images.length === 0) {
      console.log(`${directory}에서 이미지를 찾을 수 없습니다.`);
      continue;
    }

    console.log(`${images.length}개의 이미지를 찾았습니다.`);

    // Process images in chunks
    await processImagesInChunks(images, 10, directory);
  }
  console.log('\n이미지 분석 프로세스 완료!');
}

// 메인 함수 실행
main().catch(error => {
  console.error('메인 프로세스 오류:', error);
  process.exit(1);
});
