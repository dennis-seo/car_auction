# 필요 모듈이 없을 경우 자동 설치
try:
    import requests
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

import os
from datetime import datetime, timedelta
import sys

# ===== 설정 =====
URL = "https://www.xn--2q1bm5w1qdbqaq6cwvm.com/wp-content/themes/welcomecar-new/auction_data.csv"
META_FILE = "auction_data.meta"  # ETag, Last-Modified 저장
SAVE_DIR = "sources"  # 저장 폴더
os.makedirs(SAVE_DIR, exist_ok=True)

# ===== 실행 조건 필터 =====
def should_run_now() -> bool:
    """
    1) 02:00~08:59는 무조건 실행 안함 (09:00 포함)
    2) 평일(월~금): 20~22시(20:00~22:59)만 10분 단위 실행 (minute % 10 == 0)
    3) 주말(토~일): 4시간마다(0,4,8,12,16,20)에만 실행
    """
    now_kst = datetime.utcnow() + timedelta(hours=9)
    hour = now_kst.hour
    minute = now_kst.minute
    weekday = now_kst.weekday()  # 월=0, ..., 토=5, 일=6

    # 02~08시는 제외 (09시는 포함)
    if 2 <= hour < 9:
        print(f"[INFO] 현재 시간 {hour:02d}시는 실행 안함 (02~09시 제외)")
        return False

    if weekday < 5:
        # 평일: 20~22시(20:00~22:59)에만 10분 단위 실행
        if 20 <= hour <= 22 and minute % 10 == 0:
            return True
        else:
            print(f"[INFO] 평일 {hour:02d}:{minute:02d} 실행 조건 아님 (20~22시 10분단위만 실행)")
            return False
    else:
        # 주말: 4시간마다(0,4,8,12,16,20)
        if hour % 4 == 0:
            return True
        else:
            print(f"[INFO] 주말 {hour:02d}시는 4시간마다만 실행")
            return False

# ===== 날짜 계산 (다음 영업일, KST 기준) =====
def get_next_business_day_kr():
    now_kst = datetime.utcnow() + timedelta(hours=9)
    next_day = now_kst + timedelta(days=1)
    while next_day.weekday() >= 5:  # 토=5, 일=6
        next_day += timedelta(days=1)
    return next_day.strftime("%y%m%d")

# ===== 메타 데이터 처리 =====
def load_meta():
    if os.path.exists(META_FILE):
        with open(META_FILE, "r") as f:
            lines = f.read().splitlines()
            etag = lines[0] if len(lines) > 0 else None
            last_modified = lines[1] if len(lines) > 1 else None
            return etag, last_modified
    return None, None

def save_meta(etag, last_modified):
    with open(META_FILE, "w") as f:
        f.write(f"{etag or ''}\n{last_modified or ''}")

# ===== CSV 유효성 검사 =====
def is_valid_csv(content: bytes) -> bool:
    try:
        text = content.decode("utf-8", errors="ignore")
        first_line = text.splitlines()[0]
        return "," in first_line
    except Exception:
        return False

# ===== 다운로드 처리 =====
def download_if_changed():
    old_etag, old_last_modified = load_meta()
    headers = {}
    if old_etag:
        headers["If-None-Match"] = old_etag
    if old_last_modified:
        headers["If-Modified-Since"] = old_last_modified

    resp = requests.get(URL, headers=headers, timeout=(3, 10))

    if resp.status_code == 304:
        print("[INFO] 변경 없음")
        return False

    if resp.status_code == 200:
        new_etag = resp.headers.get("ETag")
        new_last_modified = resp.headers.get("Last-Modified")

        if not is_valid_csv(resp.content):
            print("[ERROR] 다운로드된 파일이 CSV 형식이 아님 (저장 안 함)")
            return False

        yymmdd = get_next_business_day_kr()
        save_path = os.path.join(SAVE_DIR, f"auction_data_{yymmdd}.csv")

        with open(save_path, "wb") as f:
            f.write(resp.content)

        save_meta(new_etag, new_last_modified)
        print(f"[INFO] 파일 저장 완료: {save_path}")
        return True

    raise Exception(f"Unexpected status: {resp.status_code}")

if __name__ == "__main__":
    if not should_run_now():
        sys.exit(0)  # 실행 조건 미충족 시 종료

    changed = download_if_changed()
    now_kst_str = (datetime.utcnow() + timedelta(hours=9)).strftime("%Y-%m-%d %H:%M:%S")
    if changed:
        print(f"[{now_kst_str} KST] 파일 업데이트 완료")
    else:
        print(f"[{now_kst_str} KST] 업데이트 없음")