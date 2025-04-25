#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
eda.py
Supabase(PostgreSQL) DB에서 upload 테이블을 덤프하여 키워드 및 임베딩에 대해 EDA를 수행하고
시각화 결과를 outputs/ 폴더에 이미지로 저장하는 스크립트입니다.

사용법:
 1) .env 혹은 환경변수에 DATABASE_URL 설정
 2) pip install pandas numpy sqlalchemy psycopg2-binary python-dotenv matplotlib seaborn umap-learn scikit-learn
 3) python eda.py
"""
import os
import sys
from sqlalchemy import create_engine
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.manifold import TSNE
import umap
import matplotlib.font_manager as fm
from sklearn.metrics.pairwise import cosine_similarity
from wordcloud import WordCloud
from itertools import chain
from sklearn.preprocessing import StandardScaler

# 출력 디렉토리
OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# DB 연결
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: 환경변수 DATABASE_URL이 설정되어 있지 않습니다.")
    sys.exit(1)
engine = create_engine(DATABASE_URL)

DATA_PATH = os.path.join(OUTPUT_DIR, "upload_dump.parquet")

# seaborn 스타일 고급화
sns.set_theme(style="darkgrid", palette="deep")
plt.rcParams['axes.titlesize'] = 16
plt.rcParams['axes.labelsize'] = 13
plt.rcParams['legend.fontsize'] = 11
plt.rcParams['xtick.labelsize'] = 11
plt.rcParams['ytick.labelsize'] = 11
plt.rcParams['figure.dpi'] = 120

def load_data():
    # 데이터 파일이 있으면 우선 읽기
    if os.path.exists(DATA_PATH):
        df = pd.read_parquet(DATA_PATH)
    else:
        query = '''
        SELECT id, llm_keywords, desc_embedding, image_embedding
        FROM upload;
        '''
        df = pd.read_sql_query(query, engine)
        # 키워드 리스트
        df['keywords'] = df['llm_keywords'].apply(lambda arr: arr or [])
        # 임베딩을 numpy array로 변환
        df['desc_emb'] = df['desc_embedding'].apply(lambda arr: np.array(arr or [], dtype=np.float32))
        df['image_emb'] = df['image_embedding'].apply(lambda arr: np.array(arr or [], dtype=np.float32))
        # 저장
        df.to_parquet(DATA_PATH, index=False)
    # parquet에서 읽었을 때도 후처리 필요
    if 'keywords' not in df.columns:
        df['keywords'] = df['llm_keywords'].apply(lambda arr: arr or [])
    if 'desc_emb' not in df.columns:
        df['desc_emb'] = df['desc_embedding'].apply(lambda arr: np.array(arr or [], dtype=np.float32))
    if 'image_emb' not in df.columns:
        df['image_emb'] = df['image_embedding'].apply(lambda arr: np.array(arr or [], dtype=np.float32))
    # 임베딩 numpy 변환 캐싱 (리스트로)
    df = df.copy()
    df['desc_emb'] = df['desc_emb'].apply(lambda x: x if isinstance(x, np.ndarray) else np.array(x, dtype=np.float32))
    df['image_emb'] = df['image_emb'].apply(lambda x: x if isinstance(x, np.ndarray) else np.array(x, dtype=np.float32))
    return df


def plot_keyword_stats(df: pd.DataFrame):
    # 키워드 개수 분포 (히스토그램 + boxplot)
    df['kw_count'] = df['keywords'].apply(len)
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    sns.histplot(df['kw_count'], bins=range(0, max(df['kw_count'])+2), kde=True, ax=axes[0], color='#4C72B0')
    axes[0].set_title('Keywords Count Distribution')
    axes[0].set_xlabel('Number of Keywords')
    axes[0].set_ylabel('Count')
    axes[0].grid(True, alpha=0.3)
    sns.boxplot(x=df['kw_count'], ax=axes[1], color='#55A868')
    axes[1].set_title('Keywords Count Boxplot')
    axes[1].set_xlabel('Number of Keywords')
    axes[1].grid(True, alpha=0.3)
    plt.suptitle('키워드 개수 분포: 전체 분포와 이상치', y=1.03)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'keyword_count_hist_box.png'))
    plt.close()

    # 상위 키워드 빈도 (barplot + pie chart)
    all_keywords = list(chain.from_iterable(df['keywords'].dropna()))
    kw_counts = pd.Series(all_keywords).value_counts().head(10)
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    sns.barplot(x=kw_counts.values, y=kw_counts.index, ax=axes[0], palette='viridis')
    axes[0].set_title('Top 10 Keywords (Bar)')
    axes[0].set_xlabel('Frequency')
    axes[0].set_ylabel('Keyword')
    axes[0].grid(True, alpha=0.3)
    axes[1].pie(kw_counts.values, labels=kw_counts.index, autopct='%1.1f%%', startangle=140, colors=sns.color_palette('viridis', n_colors=10))
    axes[1].set_title('Top 10 Keywords (Pie)')
    plt.suptitle('상위 10개 키워드의 빈도와 비율', y=1.05)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'top_keywords_bar_pie.png'))
    plt.close()


def plot_embedding_norms(df: pd.DataFrame):
    # L2-norm 분포 (히스토그램 + violin plot)
    df['desc_norm'] = df['desc_emb'].apply(lambda v: np.linalg.norm(v))
    df['image_norm'] = df['image_emb'].apply(lambda v: np.linalg.norm(v))
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    sns.histplot(df['desc_norm'], color='#4C72B0', label='desc_norm', kde=True, ax=axes[0], alpha=0.7)
    sns.histplot(df['image_norm'], color='#FF8C42', label='image_norm', kde=True, ax=axes[0], alpha=0.7)
    axes[0].set_title('Embedding L2 Norm Distribution')
    axes[0].set_xlabel('L2 Norm')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    sns.violinplot(data=df[['desc_norm', 'image_norm']], ax=axes[1], palette=['#4C72B0', '#FF8C42'])
    axes[1].set_title('Embedding L2 Norm Violinplot')
    axes[1].set_xticklabels(['desc_norm', 'image_norm'])
    axes[1].grid(True, alpha=0.3)
    plt.suptitle('임베딩 L2-norm의 분포와 형태', y=1.03)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'emb_norms_hist_violin.png'))
    plt.close()


def plot_cosine_similarity(df: pd.DataFrame):
    # desc_emb와 image_emb의 코사인 유사도 분포 (샘플링+벡터화)
    valid = df[(df['desc_emb'].apply(len) > 0) & (df['image_emb'].apply(len) > 0)]
    if len(valid) == 0:
        print("No valid pairs for cosine similarity plot.")
        return
    sample = valid.sample(n=min(1000, len(valid)), random_state=42)
    desc_mat = np.stack(sample['desc_emb'].values)
    image_mat = np.stack(sample['image_emb'].values)
    # 벡터화된 코사인 유사도 계산
    dot = np.sum(desc_mat * image_mat, axis=1)
    desc_norm = np.linalg.norm(desc_mat, axis=1)
    image_norm = np.linalg.norm(image_mat, axis=1)
    cosims = dot / (desc_norm * image_norm + 1e-8)
    plt.figure(figsize=(7,4))
    sns.histplot(cosims, bins=30, kde=True, color='#6A5ACD')
    plt.title('Cosine Similarity between desc_emb and image_emb')
    plt.xlabel('Cosine Similarity')
    plt.ylabel('Count')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.figtext(0.5, -0.08, '텍스트와 이미지 임베딩의 유사도 분포', ha='center', fontsize=11)
    plt.savefig(os.path.join(OUTPUT_DIR, 'desc_image_cosine_similarity.png'))
    plt.close()


def plot_kwcount_vs_norm(df: pd.DataFrame):
    # 키워드 수와 임베딩 norm의 상관관계
    plt.figure(figsize=(6,5))
    plt.scatter(df['kw_count'], df['desc_norm'], alpha=0.5, c=df['desc_norm'], cmap='cool', edgecolor='k')
    plt.title('키워드 수 vs desc 임베딩 norm')
    plt.xlabel('Number of Keywords')
    plt.ylabel('desc_emb L2 Norm')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.figtext(0.5, -0.08, '키워드 수가 임베딩 크기에 미치는 영향', ha='center', fontsize=11)
    plt.savefig(os.path.join(OUTPUT_DIR, 'kwcount_vs_descnorm.png'))
    plt.close()


def plot_umap(df: pd.DataFrame):
    # 샘플링 (속도 문제 회피, 변환 캐싱)
    # filter out rows with empty desc_emb
    sample = df[df['desc_emb'].apply(len) > 0].sample(n=min(1000, len(df)), random_state=42)
    desc_embs = np.stack(sample['desc_emb'].values)
    reducer = umap.UMAP(n_neighbors=15, min_dist=0.1, random_state=42)
    emb2d = reducer.fit_transform(desc_embs)
    plt.figure(figsize=(6,6))
    plt.scatter(emb2d[:,0], emb2d[:,1], s=5, alpha=0.7)
    plt.title('UMAP on Description Embeddings')
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'umap_desc.png'))
    plt.close()

    image_embs = np.stack(sample['image_emb'].values)
    # reducer = umap.UMAP(n_neighbors=15, min_dist=0.1, random_state=42)
    # emb2d = reducer.fit_transform(image_embs)
    emb2d = reducer.transform(image_embs)
    plt.figure(figsize=(6,6))
    plt.scatter(emb2d[:,0], emb2d[:,1], s=5, alpha=0.7)
    plt.title('UMAP on Image Embeddings')
    plt.savefig(os.path.join(OUTPUT_DIR, 'umap_image.png'))
    plt.close()

def plot_top_keywords_bar(df: pd.DataFrame, topn=50):
    all_keywords = list(chain.from_iterable(df['keywords'].dropna()))
    kw_counts = pd.Series(all_keywords).value_counts().head(topn)
    plt.figure(figsize=(10, max(6, int(topn*0.35))))
    sns.barplot(y=kw_counts.index, x=kw_counts.values, palette='mako')
    plt.title(f'Top {topn} Keywords (Barplot)')
    plt.xlabel('Frequency')
    plt.ylabel('Keyword')
    plt.grid(True, axis='x', alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, f'top{topn}_keywords_bar.png'))
    plt.close()


def plot_keyword_wordcloud(df: pd.DataFrame, topn=200):
    all_keywords = list(chain.from_iterable(df['keywords'].dropna()))
    kw_counts = pd.Series(all_keywords).value_counts().head(topn)
    wc = WordCloud(width=900, height=400, background_color='white', colormap='viridis',
                   prefer_horizontal=1.0, font_path=None).generate_from_frequencies(kw_counts.to_dict())
    plt.figure(figsize=(12, 6))
    plt.imshow(wc, interpolation='bilinear')
    plt.axis('off')
    plt.title(f'Top {topn} Keywords WordCloud')
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, f'top{topn}_keywords_wordcloud.png'))
    plt.close()


def plot_umap_by_top_keywords(df: pd.DataFrame, topn: int = 10):
    # 1. top 10 키워드 선정
    all_keywords = list(chain.from_iterable(df['keywords'].dropna()))
    kw_counts = pd.Series(all_keywords).value_counts().head(topn)
    top_keywords = kw_counts.index.tolist()

    # 2. top 10 키워드 중 하나라도 포함된 row만 추출
    def find_top_kw(keywords):
        # 여러 개면 top_keywords 순위대로 반환
        for kw in top_keywords:
            if kw in keywords:
                return kw
        return None
    mask = df['keywords'].apply(lambda kws: any(kw in top_keywords for kw in kws))
    filtered = df[mask & (df['desc_emb'].apply(len) > 0)]
    if len(filtered) == 0:
        print("No samples with top keywords for UMAP plot.")
        return

    # 3. 대표 키워드 컬럼 생성
    filtered = filtered.copy()
    filtered['top_keyword'] = filtered['keywords'].apply(find_top_kw)

    # 4. 샘플링 (최대 1000개)
    sample = filtered.sample(n=min(1000, len(filtered)), random_state=42)
    desc_embs = np.stack(sample['desc_emb'].values)

    # 정규화 추가
    desc_embs = StandardScaler().fit_transform(desc_embs)

    # 5. UMAP 임베딩
    reducer = umap.UMAP(n_neighbors=15, min_dist=0.1, random_state=42)
    emb2d = reducer.fit_transform(desc_embs)

    # 6. 색상 매핑
    palette = sns.color_palette('tab10', n_colors=topn)
    color_dict = {kw: palette[i] for i, kw in enumerate(top_keywords)}
    colors = sample['top_keyword'].map(color_dict)

    # 7. 시각화
    plt.figure(figsize=(7,7))
    for kw in top_keywords:
        idx = sample['top_keyword'] == kw
        plt.scatter(emb2d[idx,0], emb2d[idx,1], s=12, alpha=0.7, label=kw, color=color_dict[kw])
    plt.title(f'UMAP: Top {topn} Keywords')
    plt.legend(title='Keyword', bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.axis('equal')  # 축 비율 고정
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, f'umap_top{topn}_keywords.png'), bbox_inches='tight')
    plt.close()

def main():
    print("Loading data...")
    df = load_data()
    print(f"Loaded {len(df)} records.")

    print("Plotting keyword stats...")
    plot_keyword_stats(df)

    print("Plotting top 50 keywords barplot...")
    plot_top_keywords_bar(df, topn=50)

    print("Plotting keyword wordcloud...")
    plot_keyword_wordcloud(df, topn=200)

    # print("Plotting embedding norms...")
    # plot_embedding_norms(df)

    # print("Plotting cosine similarity...")
    # plot_cosine_similarity(df)

    # print("Plotting kw_count vs desc_norm...")
    # plot_kwcount_vs_norm(df)

    print("Plotting UMAP...")
    plot_umap(df)

    print("Plotting UMAP by top 10 keywords...")
    plot_umap_by_top_keywords(df, topn=10)

    print("EDA 완료. outputs/ 폴더를 확인하세요.")

if __name__ == '__main__':
    main() 