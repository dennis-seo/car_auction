#!/usr/bin/env python3
"""
sources 디렉토리의 CSV 파일들을 스캔하여 dates.json을 생성
"""
import os
import json


def generate_dates_json():
    """sources 폴더의 CSV 파일들에서 날짜를 추출하여 JSON 생성"""
    dates = []

    if os.path.exists('sources'):
        files = os.listdir('sources')
        for file in files:
            if file.startswith('auction_data_') and file.endswith('.csv'):
                date = file.replace('auction_data_', '').replace('.csv', '')
                if len(date) == 6 and date.isdigit():
                    dates.append(date)

    # 최신순으로 정렬
    dates.sort(reverse=True)

    # public/sources/dates.json에 저장
    os.makedirs('public/sources', exist_ok=True)
    with open('public/sources/dates.json', 'w') as f:
        json.dump(dates, f)

    print(f"Generated dates.json with {len(dates)} dates: {dates}")


if __name__ == '__main__':
    generate_dates_json()
