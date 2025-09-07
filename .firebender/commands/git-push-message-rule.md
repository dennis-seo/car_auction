입력:
- 브랜치명: `git symbolic-ref --short HEAD` 명령어로 추출된 현재 로컬 브랜치명
- 변경사항 컨텍스트: diff 또는 변경 요약

생성 순서:
설명을 먼저 생성. 이후에 해당 설명을 요약하여 1.에 해당하는 제목을 생성

이슈번호 추출 규칙:
- ISSUE_ID는 `git symbolic-ref --short HEAD`로 얻은 브랜치명에서만 다음 정규식으로 추출: (FANQA-\d+|FANAND-\d+)
- 정규식은 대소문자를 구분하지 않음 (case-insensitive)
- 브랜치명 전체에서 첫 번째 매칭만 사용
- 슬래시(/)나 하이픈(-) 등의 구분자 무시하고 패턴 매칭
- 브랜치명이 비어 있거나 매칭 실패 시에만 ISSUE_ID를 [NO-ISSUE]로 설정
- 커밋 히스토리/머지 커밋/PR/태그에서 추정하지 말고 오직 현재 브랜치명에서만 추출
- Use `--no-pager` with git commands because you won't have access to STDIN while the command is still running. Avoiding interactive editors is best practice here.

브랜치명 추출 및 이슈번호 매칭 예시:
- `git symbolic-ref --short HEAD` → "Bugfix/FANQA-3846" → FANQA-3846
- `git symbolic-ref --short HEAD` → "feature/FANAND-1234-new-feature" → FANAND-1234
- `git symbolic-ref --short HEAD` → "hotfix/FANQA-9999" → FANQA-9999
- `git symbolic-ref --short HEAD` → "main" → NO-ISSUE
- `git symbolic-ref --short HEAD` → "develop" → NO-ISSUE

출력 형식:
1. 첫 줄: [ISSUE_ID] 제목
    - 제목은 상세 설명을 정확히 요약한 한 줄 문장.
2. 두 번째 줄부터: 상세 설명
    - 목적(원인)과 변경된 부분을 간략하게 개조식으로 서술.
    - 불필요한 수사는 배제하고 사실 중심으로 작성.
    - 글머리 기호를 사용하여 원인(목적)+하위목록, 수정내역+하위목록 형태로 작성.
    - **모든 변경사항을 포함**: 주요 변경사항 뿐만 아니라 strings 파일 업데이트, 테스트 파일 추가, 리팩토링 등 모든 변경사항을 기록.
    - **기술적 상세정보 포함**: UI 컴포넌트 변경 시 변경사항 및 성능 영향을 명시.

포맷 상세규칙:
- "목적(원인):" 뒤에 반드시 공백 한 칸 추가
- "수정내역:" 뒤에 반드시 공백 한 칸 추가
- 하위 항목 번호 매김 후 점(.) 다음에 공백 한 칸 추가
- 부차적 변경사항(strings, 테스트 파일 등)도 누락하지 않고 포함

제약:
- 메시지는 반드시 한국어로 작성.
- ISSUE_ID는 현재 브랜치명에서만 파싱.
- 머지된 커밋/최근 히스토리/PR 제목/태그 등으로 추정 금지.
- 이미 머지된 커밋의 변경 사항 포함 금지 (제목과 상세 내용 모두에)
- 포맷 외 메타데이터(작성자, 날짜 등) 추가 금지.

커밋 메시지 예시:
<example>
[FANQA-3846] 커뮤니티 가입된 화면 타이틀 문자열 리소스 수정 및 신규 테스트 모듈 추가

목적(원인):
1. 커뮤니티 가입된 화면의 타이틀이 잘못된 문자열 리소스를 참조하고 있음
2. 신규 스케줄 기능을 위한 테스트 모듈 구조 필요

수정내역:
1. CommunityJoinedScreen에서 타이틀 문자열을 common_setting_app_push_community_specific에서 common_setting_app_push_community로 변경
2. feature:schedule 모듈에 기본 테스트 파일 구조 추가 (ExampleInstrumentedTest, ExampleUnitTest)
3. 프로젝트 의존성 그래프 다이어그램 업데이트
</example>
