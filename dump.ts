import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { v4 as uuid } from 'uuid';

const DIRECTORIES = [
  "2024/10/1",
  "2024/10/14",
  "2024/10/15",
  "2024/10/16",
  "2024/10/2",
  "2024/10/20",
  "2024/10/25",
  "2024/10/3",
  "2024/10/4",
  "2024/10/5",
  "2024/10/8",
  "2024/10/9",
  "2024/11/10",
  "2024/11/12",
  "2024/11/16",
  "2024/11/18",
  "2024/11/19",
  "2024/11/20",
  "2024/11/23",
  "2024/11/25",
  "2024/11/27",
  "2024/11/28",
  "2024/11/29",
  "2024/11/30",
  "2024/11/8",
  "2024/11/9",
  "2024/12/1",
  "2024/12/10",
  "2024/12/12",
  "2024/12/13",
  "2024/12/14",
  "2024/12/15",
  "2024/12/16",
  "2024/12/17",
  "2024/12/18",
  "2024/12/19",
  "2024/12/2",
  "2024/12/20",
  "2024/12/21",
  "2024/12/22",
  "2024/12/23",
  "2024/12/24",
  "2024/12/25",
  "2024/12/26",
  "2024/12/27",
  "2024/12/28",
  "2024/12/29",
  "2024/12/3",
  "2024/12/30",
  "2024/12/31",
  "2024/12/4",
  "2024/12/5",
  "2024/12/6",
  "2024/12/7",
  "2024/12/8",
  "2024/12/9",
  "2024/9/24",
  "2024/9/26",
  "2024/9/27",
  "2024/9/28",
  "2024/9/29",
  "2024/9/30",
  "2025/1/1",
  "2025/1/10",
  "2025/1/11",
  "2025/1/12",
  "2025/1/13",
  "2025/1/14",
  "2025/1/15",
  "2025/1/16",
  "2025/1/17",
  "2025/1/18",
  "2025/1/19",
  "2025/1/2",
  "2025/1/20",
  "2025/1/21",
  "2025/1/22",
  "2025/1/23",
  "2025/1/24",
  "2025/1/25",
  "2025/1/26",
  "2025/1/27",
  "2025/1/28",
  "2025/1/29",
  "2025/1/3",
  "2025/1/30",
  "2025/1/31",
  "2025/1/4",
  "2025/1/5",
  "2025/1/6",
  "2025/1/7",
  "2025/1/8",
  "2025/1/9",
  "2025/2/1",
  "2025/2/10",
  "2025/2/11",
  "2025/2/12",
  "2025/2/13",
  "2025/2/14",
  "2025/2/15",
  "2025/2/16",
  "2025/2/17",
  "2025/2/18",
  "2025/2/19",
  "2025/2/2",
  "2025/2/20",
  "2025/2/21",
  "2025/2/22",
  "2025/2/23",
  "2025/2/24",
  "2025/2/25",
  "2025/2/26",
  "2025/2/27",
  "2025/2/28",
  "2025/2/3",
  "2025/2/4",
  "2025/2/5",
  "2025/2/6",
  "2025/2/7",
  "2025/2/8",
  "2025/2/9",
  "2025/3/1",
  "2025/3/10",
  "2025/3/11",
  "2025/3/12",
  "2025/3/13",
  "2025/3/14",
  "2025/3/15",
  "2025/3/16",
  "2025/3/17",
  "2025/3/18",
  "2025/3/19",
  "2025/3/2",
  "2025/3/20",
  "2025/3/21",
  "2025/3/22",
  "2025/3/23",
  "2025/3/24",
  "2025/3/25",
  "2025/3/26",
  "2025/3/27",
  "2025/3/28",
  "2025/3/29",
  "2025/3/3",
  "2025/3/30",
  "2025/3/31",
  "2025/3/4",
  "2025/3/5",
  "2025/3/6",
  "2025/3/7",
  "2025/3/8",
  "2025/3/9",
  "2025/4/1",
  "2025/4/10",
  "2025/4/11",
  "2025/4/12",
  "2025/4/13",
  "2025/4/14",
  "2025/4/15",
  "2025/4/16",
  "2025/4/17",
  "2025/4/18",
  "2025/4/19",
  "2025/4/2",
  "2025/4/20",
  "2025/4/21",
  "2025/4/22",
  "2025/4/23",
  "2025/4/3",
  "2025/4/4",
  "2025/4/5",
  "2025/4/6",
  "2025/4/7",
  "2025/4/8",
  "2025/4/9"
];

// 설정
const SOURCE_BUCKET_NAME = 'shortdoridump';
const SOURCE_BASE_DIR = 'generated-images';
const IMAGES_BUCKET_NAME = 'images'
const OPENAI_API_KEY = process.env.OPENAI_KEY || '';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);


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
  'flux-schneell': ImageModel.FLUX_SCHNELL,
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
- "prompt": a detailed, vivid description of the image, which is used to generate this image. Be detailed as possible.
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

// Supabase Storage에서 특정 디렉토리의 이미지 파일 리스트 가져오기
async function findImagesInDirectory(directory: string): Promise<string[]> {
  const prefix = `${SOURCE_BASE_DIR}/${directory}/`;
  const imageFiles: string[] = [];

  console.log(`Supabase Storage 디렉토리 검색 중: ${prefix}`);

  let startAfter = '';
  let hasMore = true;

  while (hasMore) {
    try {
      // Supabase Storage API를 사용하여 객체 리스트 가져오기
      const { data, error } = await supabase
        .storage
        .from(SOURCE_BUCKET_NAME)
        .list(prefix, {
          limit: 1000,
          offset: startAfter ? 1 : 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error(`Storage 객체 리스트 가져오기 오류:`, error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // 마지막 항목 저장하여 다음 페이지에서 사용
      startAfter = data[data.length - 1].name;

      // 파일만 필터링하고 이미지 파일만 선택
      for (const item of data) {
        if (!item.id.endsWith('/') && isImageFile(item.name)) {
          imageFiles.push(`${prefix}${item.name}`);
        }
      }

      // 다음 페이지가 없으면 종료
      if (data.length < 1000) {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Supabase Storage 조회 오류:`, error);
      break;
    }
  }
  return imageFiles;
}

// Supabase Storage에서 이미지 다운로드하여 base64로 변환
async function downloadImageFromStorage(path: string): Promise<{ base64: string, mimeType: string }> {
  try {
    // 경로에서 버킷 이름 제거
    const storagePath = path.startsWith(`${SOURCE_BUCKET_NAME}/`)
      ? path.substring(SOURCE_BUCKET_NAME.length + 1)
      : path;

    // Supabase에서 파일 다운로드
    const { data, error } = await supabase
      .storage
      .from(SOURCE_BUCKET_NAME)
      .download(storagePath);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`이미지를 다운로드할 수 없습니다: ${path}`);
    }

    // ArrayBuffer를 base64로 변환
    const buffer = await data.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = getMimeTypeFromPath(path);

    console.log('storagePath', storagePath, 'mimeType', mimeType);
    return {
      base64,
      mimeType
    };
  } catch (error) {
    console.error(`Supabase Storage에서 이미지 다운로드 오류: ${path}`, error);
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
    console.log(data.choices?.[0]?.message)
    const content = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)
    return {
      title: parsed.title ?? '',
      prompt: parsed.prompt ?? ''
    } as ImageAnalysisResult;
  } catch (error) {
    console.error('OpenAI로 이미지 분석 중 오류 발생:', error);
    return emptyImageAnalysisResult;
  }
}

// Function to copy image to 'images' bucket and get public URL
async function copyImageToBucket(sourcePath: string, targetPath: string): Promise<void> {
  const { error: copyError } = await supabase.storage.from(SOURCE_BUCKET_NAME).copy(sourcePath, `${IMAGES_BUCKET_NAME}/${targetPath}`);
  if (copyError) {
    throw new Error(`Failed to copy image to 'images' bucket: ${copyError.message}`);
  }
}

// Function to save analysis results to the database
async function saveAnalysisToDatabase(id: string, fileUrl: string, analysis: ImageAnalysisResult, imageModel: ImageModel, userId: string): Promise<void> {
  try {
    await prisma.upload.create({
      data: {
        id,
        fileUrl,
        title: analysis.title,
        prompt: analysis.prompt,
        modelName: imageModel.toString(),
        licence: 'CC0', // Assuming a standard licence, adjust as needed
        user: { connect: { id: userId } },
      },
    });
  } catch (err) {
    console.error('Error saving analysis to database:', err);
    throw err;
  }
}

// Updated processBatch function to include database and storage operations
async function processBatch(images: string[]): Promise<void> {
  for (const imagePath of images) {
    console.log(`처리 중: ${imagePath}`);

    try {
      // Supabase Storage에서 이미지 다운로드 및 base64로 변환
      const { base64: base64Image, mimeType } = await downloadImageFromStorage(imagePath);
      const imageModel = getImageModel(imagePath);

      // OpenAI로 분석
      console.log('OpenAI로 이미지 분석 중...');
      const analysisResult = await analyzeImageWithOpenAI(base64Image, mimeType, imageModel);


      // 결과를 데이터베이스에 저장
      const id = uuid().toString()
      const baseDir = id.slice(0, 2)
      const destinationPath = `${baseDir}/${id}.${path.extname(imagePath).slice(1)}`

      // 이미지 'images' 버킷으로 복사 및 public URL 가져오기
      await saveAnalysisToDatabase(id, destinationPath, analysisResult, imageModel, '05ded0c5-0577-4984-beac-33d3183f88d9');
      await copyImageToBucket(imagePath, destinationPath);

      throw new Error('Done')
      // 속도 제한을 피하기 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`${imagePath} 처리 중 오류:`, error);
      throw error
    }
  }
}

// 메인 함수
async function main() {
  console.log('이미지 분석 프로세스 시작...');

  // Supabase URL과 API 키 확인
  if (!supabaseUrl || !supabaseKey) {
    console.error('오류: Supabase URL 또는 API 키가 설정되지 않았습니다.');
    process.exit(1);
  }

  // 각 지정된 디렉토리 처리
  for (const directory of DIRECTORIES) {
    console.log(`\n디렉토리 처리 중: ${directory}`);

    // Supabase Storage 디렉토리에서 이미지 파일 찾기
    const images = await findImagesInDirectory(directory);

    if (images.length === 0) {
      console.log(`${directory}에서 이미지를 찾을 수 없습니다.`);
      continue;
    }

    console.log(`${images.length}개의 이미지를 찾았습니다.`);

    // 배치 처리
    await processBatch(images);
  }

  console.log('\n이미지 분석 프로세스 완료!');
}

// 메인 함수 실행
if (OPENAI_API_KEY) {
  main().catch(error => {
    console.error('메인 프로세스 오류:', error);
    process.exit(1);
  });
} else {
  console.error('오류: OPENAI_KEY 환경 변수가 설정되지 않았습니다.');
  console.log('OPENAI_KEY 환경 변수를 설정하고 다시 시도하세요.');
  console.log('예시: OPENAI_KEY=your_api_key ts-node dump.ts');
  process.exit(1);
}